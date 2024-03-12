import {Layer} from "ol/layer";
import {useEffect,useState, useMemo, useContext} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {Collection, Feature} from "ol";
import {Geometry, Polygon, Point} from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Fill, Stroke, Style, Circle} from "ol/style";
import {circular} from 'ol/geom/Polygon';

type TemporalCloakingMapViewProps = {
    /** Handler that is called whenever a layer should be added to the map */
    onAddLayer: (layer: Layer) => void,
    /** Handler that is called whenever a layer should be removed from the map */
    onRemoveLayer: (layer: Layer) => void,
}

type CarData = {
    id: string,
    x: number,
    y: number
}
let cars_position :  CarData[] = [];

const lon_min = 9.07962801;
const lat_min = 48.72741225;
const lat_max = 48.75670065;
const lat_dif = lat_max-lat_min;
const lon_dif = lat_dif/ Math.cos((lat_min * Math.PI) / 180);

export function MapView({onAddLayer, onRemoveLayer}: TemporalCloakingMapViewProps) {
    const {mapAgentsData, temporalCloakingData} = useContext(AlgorithmDataContext);

    /** Layer that visualizes the grid, initially contains the red area grid bounding box  */
    const gridLayer = new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 2
        })

    /** Layer that visualizes agent vicinity shapes (currently only circular) */
    const vicinityShapeLayer = new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 1
        })

    /** Style of grid */
    const style_grid = new Style({
            stroke: new Stroke({
                width: 2,
                color: "#0B75FF"
            })
        })

    /** Style of ego vehicle */
    const car_style_1 = new Style({
        stroke : new Stroke({
            width: 7,
            color: "#FF4500"
        }),
    });
    /** Style of other vehicles */
    const car_style_2 = new Style({
        stroke : new Stroke({
            width: 7,
            color: "#FFFF00"
        }),
    });



    // Make sure layer is present on map while this component lives
    useEffect(() => {
        // Add layers
        onAddLayer(gridLayer);
        onAddLayer(vicinityShapeLayer);

        // On destruction, remove layers
        return () => {
            onRemoveLayer(gridLayer);
            onRemoveLayer(vicinityShapeLayer);
        }
    }, [onAddLayer, onRemoveLayer]);

    // draw grids
    // useEffect(() => {
    //     const rect_feature = new Feature({
    //         geometry: new Polygon([[
    //             [lon_min, lat_min],
    //             [lon_min, lat_min+lat_dif],
    //             [lon_min+lon_dif, lat_min+lat_dif],
    //             [lon_min+lon_dif, lat_min],
    //             [lon_min, lat_min]
    //         ]]).transform('EPSG:4326', 'EPSG:3857')
    //     });
    //     rect_feature.setStyle(rect_style);
    //     const newSource = new VectorSource({
    //         features: [rect_feature]
    //     });
    //     gridLayer.setSource(newSource);
    // }, []);

    // Draw the exact vicinity circle at agent positions to better understand the algorithm
    useEffect(() => {
        var car_cnt = 0; //total 15 cars
        var newSource;
        var polygon;
        var new_feature;

        var quadrant_lat, quadrant_lon;
        var cur_quadrant_lon_min, cur_quadrant_lat_min, cur_quadrant_lon_max, cur_quadrant_lat_max;
        var prev_quadrant_lon_min, prev_quadrant_lat_min, prev_quadrant_lon_max, prev_quadrant_lat_max;
        var vicinity_cnt;

        var polygon_grid;
        var feature_grid;
        var newSource_grid;

        for(let i=0;i<15; i++){
            const tmp: CarData = {
                id: "",
                x: 0,
                y: 0
            };
            cars_position.push(tmp);
        }

        mapAgentsData.agents.forEach((ag) => {

            // let vicinityFeature = vicinityShapeLayer.getSource()?.getFeatureById(ag.id);

            // const vicinityCircle = circular(
            //     [ag.location.y, ag.location.x],
            //     5
            // ).transform('EPSG:4326', 'EPSG:3857')

            // // If agent vicinity circle already drawn on map, just update
            // if (vicinityFeature) {
            //     vicinityFeature.setGeometry(vicinityCircle);
            // // Create new vicinity circle feature otherwise
            // } else {
            //     vicinityFeature = new Feature({
            //         name: ag.id,
            //         geometry: vicinityCircle
            //     });
            //     vicinityFeature.setId(ag.id);
            //     vicinityFeature.setStyle(vicinityCircleStyle);
            //     vicinityShapeLayer.getSource()?.addFeature(vicinityFeature);
            // }

            /** show all vehicles' position, each vehicle shown as a circle */
            if(car_cnt==0){
                newSource = new VectorSource({
                    features: []
                });
                vicinityShapeLayer?.setSource(newSource);
            }
            polygon = circular([ag.location.y, ag.location.x],10).transform('EPSG:4326', 'EPSG:3857')
            new_feature = new Feature({
                geometry: polygon
            });
            if((car_cnt)==temporalCloakingData.ego_vehicle_id-1) new_feature.setStyle(car_style_1); // ego car
            else new_feature.setStyle(car_style_2); // other cars
            vicinityShapeLayer?.getSource()?.addFeature(new_feature);

            /** save all vehicles' position for further calculation */
            cars_position[car_cnt]['x'] = ag.location.x;
            cars_position[car_cnt]['y'] = ag.location.y;

            if(car_cnt<14){
                car_cnt++;
            }else{
                car_cnt = 0;
                /** algorithm calculate which grid is disclosed for the ego vehicle */
                quadrant_lat = lat_dif;
                quadrant_lon = lon_dif;
                cur_quadrant_lon_min = lon_min;
                cur_quadrant_lon_max = lon_min+quadrant_lon;
                cur_quadrant_lat_min = lat_min;
                cur_quadrant_lat_max = lat_min+quadrant_lat;
                prev_quadrant_lon_min = lon_min;
                prev_quadrant_lon_max = lon_min+quadrant_lon;
                prev_quadrant_lat_min = lat_min;
                prev_quadrant_lat_max = lat_min+quadrant_lat;
                /** number of vehicles in vicinity of ego vehicle */
                vicinity_cnt = 0;

                for(var step=0; step<7; step++){ //devide quadrant into smaller quadrants
                    vicinity_cnt = 0;
                    for(var i=0; i<15; i++){ //count vehicles in quadrant
                        if(i!=temporalCloakingData.ego_vehicle_id-1){
                            if(cars_position[i]['y'] >= cur_quadrant_lon_min && cars_position[i]['y'] <= cur_quadrant_lon_max && cars_position[i]['x'] >= cur_quadrant_lat_min && cars_position[i]['x'] <= cur_quadrant_lat_max){
                                vicinity_cnt++;
                            }
                        } 
                    }
    
                    if(vicinity_cnt<temporalCloakingData.constraint_k) break;
    
                    quadrant_lat = quadrant_lat/2.000;
                    quadrant_lon = quadrant_lon/2.000;
                    if(cars_position[temporalCloakingData.ego_vehicle_id-1]['y'] <= cur_quadrant_lon_min+quadrant_lon && cars_position[temporalCloakingData.ego_vehicle_id-1]['x'] <= cur_quadrant_lat_min+quadrant_lat){
                        prev_quadrant_lon_max = cur_quadrant_lon_max;
                        cur_quadrant_lon_max = cur_quadrant_lon_min+quadrant_lon;
    
                        prev_quadrant_lat_max = cur_quadrant_lat_max;
                        cur_quadrant_lat_max = cur_quadrant_lat_min+quadrant_lat;
    
                        prev_quadrant_lon_min = cur_quadrant_lon_min;
                        prev_quadrant_lat_min = cur_quadrant_lat_min;
                    }
                    else if(cars_position[temporalCloakingData.ego_vehicle_id-1]['y'] <= cur_quadrant_lon_min+quadrant_lon && cars_position[temporalCloakingData.ego_vehicle_id-1]['x'] >= cur_quadrant_lat_min+quadrant_lat){
                        prev_quadrant_lon_max = cur_quadrant_lon_max;
                        cur_quadrant_lon_max = cur_quadrant_lon_min+quadrant_lon;
    
                        prev_quadrant_lat_min = cur_quadrant_lat_min;
                        cur_quadrant_lat_min = cur_quadrant_lat_min+quadrant_lat;
    
                        prev_quadrant_lon_min = cur_quadrant_lon_min;
                        prev_quadrant_lat_max = cur_quadrant_lat_max;
                    }
                    else if(cars_position[temporalCloakingData.ego_vehicle_id-1]['y'] >= cur_quadrant_lon_min+quadrant_lon && cars_position[temporalCloakingData.ego_vehicle_id-1]['x'] <= cur_quadrant_lat_min+quadrant_lat){
                        prev_quadrant_lon_min = cur_quadrant_lon_min;
                        cur_quadrant_lon_min = cur_quadrant_lon_min+quadrant_lon;
    
                        prev_quadrant_lat_max = cur_quadrant_lat_max;
                        cur_quadrant_lat_max = cur_quadrant_lat_min+quadrant_lat;
    
                        prev_quadrant_lon_max = cur_quadrant_lon_max;
                        prev_quadrant_lat_min = cur_quadrant_lat_min;
                    }
                    else if(cars_position[temporalCloakingData.ego_vehicle_id-1]['y'] >= cur_quadrant_lon_min+quadrant_lon && cars_position[temporalCloakingData.ego_vehicle_id-1]['x'] >= cur_quadrant_lat_min+quadrant_lat){
                        prev_quadrant_lon_min = cur_quadrant_lon_min;
                        cur_quadrant_lon_min = cur_quadrant_lon_min+quadrant_lon;
    
                        prev_quadrant_lat_min = cur_quadrant_lat_min;
                        cur_quadrant_lat_min = cur_quadrant_lat_min+quadrant_lat;
    
                        prev_quadrant_lon_max = cur_quadrant_lon_max;
                        prev_quadrant_lat_max = cur_quadrant_lat_max;
                    }
                }
    
                polygon_grid = new Polygon([[
                    [prev_quadrant_lon_min, prev_quadrant_lat_min],
                    [prev_quadrant_lon_min, prev_quadrant_lat_max],
                    [prev_quadrant_lon_max, prev_quadrant_lat_max],
                    [prev_quadrant_lon_max, prev_quadrant_lat_min],
                    [prev_quadrant_lon_min, prev_quadrant_lat_min]]]).transform('EPSG:4326', 'EPSG:3857')
                feature_grid = new Feature({
                    geometry: polygon_grid
                });
                feature_grid.setStyle(style_grid);
                newSource_grid = new VectorSource({
                    features: [feature_grid]
                });
                gridLayer?.setSource(newSource_grid);
            }

        })
    }, [mapAgentsData.agents]);

    return <></>
}

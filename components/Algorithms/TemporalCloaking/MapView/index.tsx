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
    id: number,
    x: number,
    y: number
}
let cars_position :  CarData[] = [];

const lon_min = 9.07962801;
const lat_min = 48.72741225;
const lat_max = 48.75670065;
const lat_dif = lat_max-lat_min;
const lon_dif = lat_dif/ Math.cos((lat_min * Math.PI) / 180);

var init_flag=0;

export function MapView({onAddLayer, onRemoveLayer}: TemporalCloakingMapViewProps) {
    const {mapAgentsData, temporalCloakingData, setTemporalCloakingData} = useContext(AlgorithmDataContext);

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

    /** Style of result grid */
    const style_grid_1 = new Style({
        stroke: new Stroke({
            width: 2.5,
            color: "#0B75FF"
        })
    })
    /** Style of grey grid */
    const style_grid_2 = new Style({
        stroke: new Stroke({
            width: 1.5,
            color: "#808080",
            lineDash: [4, 4]
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

    /** iterate over carla vehicle ids to get total number and ids of vehicles */
    useEffect(() => {
        var carID_min=-1, carID_max=-1, carID, car_num=0;
        var arrayTo;
        
        if(init_flag<3){
            mapAgentsData.activeAgents.forEach((ag_id) => {
                arrayTo = ag_id.split("-"); 
                carID = +arrayTo[1];
        
                if(carID_min==-1) carID_min = carID;
                if(carID_max==-1) carID_max = carID;
                if(carID < carID_min) carID_min = carID;
                else if(carID > carID_max) carID_max = carID;
                car_num++;
            })
            if(temporalCloakingData.total_vehicles==car_num) init_flag++;
            const newData = temporalCloakingData
            newData.total_vehicles = car_num
            newData.id_min = carID_min
            newData.id_max = carID_max
            newData.ego_vehicle_id = temporalCloakingData.id_min
            setTemporalCloakingData(newData)
        }
    }, [mapAgentsData, temporalCloakingData]);


    // Draw the exact vicinity circle at agent positions to better understand the algorithm
    useEffect(() => {
        var car_cnt = 0; // iterate over every car
        var newSource;
        var polygon;
        var new_feature;

        var ego_index = 0;
        var quadrant_lat, quadrant_lon;
        var cur_quadrant_lon_min, cur_quadrant_lat_min, cur_quadrant_lon_max, cur_quadrant_lat_max;
        var prev_quadrant_lon_min, prev_quadrant_lat_min, prev_quadrant_lon_max, prev_quadrant_lat_max;
        var vicinity_cnt;

        var polygon_grid;
        var feature_grid;
        var newSource_grid;

        var arrayTo;

        if(init_flag==3){

            for(let i=0;i<temporalCloakingData.total_vehicles; i++){
                const tmp: CarData = {
                    id: 0,
                    x: 0,
                    y: 0
                };
                cars_position.push(tmp);
            }
    
            mapAgentsData.agents.forEach((ag) => {
    
                /** save all vehicles' info for further calculation */
                arrayTo = ag.id;
                arrayTo = arrayTo.split("-");
                cars_position[car_cnt]['id'] = +arrayTo[1];
                cars_position[car_cnt]['x'] = ag.location.x;
                cars_position[car_cnt]['y'] = ag.location.y;
    
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
                if(cars_position[car_cnt]['id']==temporalCloakingData.ego_vehicle_id) new_feature.setStyle(car_style_1); // ego vehicle
                else new_feature.setStyle(car_style_2); // other vehicles
                vicinityShapeLayer?.getSource()?.addFeature(new_feature);
    
    
                if(car_cnt<temporalCloakingData.total_vehicles-1){
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
    
                    newSource_grid = new VectorSource({
                        features: []
                    });
                    gridLayer?.setSource(newSource_grid);
    
                    for(var step=0; step<7; step++){ //devide quadrant into smaller quadrants
                        vicinity_cnt = 0;
                        /** draw current quadrant, show intermediate step */
                        polygon_grid = new Polygon([[
                            [cur_quadrant_lon_min, cur_quadrant_lat_min],
                            [cur_quadrant_lon_min, cur_quadrant_lat_max],
                            [cur_quadrant_lon_max, cur_quadrant_lat_max],
                            [cur_quadrant_lon_max, cur_quadrant_lat_min],
                            [cur_quadrant_lon_min, cur_quadrant_lat_min]]]).transform('EPSG:4326', 'EPSG:3857')
                        feature_grid = new Feature({
                            geometry: polygon_grid
                        });
                        feature_grid.setStyle(style_grid_2);
                        gridLayer?.getSource()?.addFeature(feature_grid);
    
                        for(var i=0; i<temporalCloakingData.total_vehicles; i++){ //count vehicles in quadrant
                            if(i!=temporalCloakingData.ego_vehicle_id-1){
                                if(cars_position[i]['y'] >= cur_quadrant_lon_min && cars_position[i]['y'] <= cur_quadrant_lon_max && cars_position[i]['x'] >= cur_quadrant_lat_min && cars_position[i]['x'] <= cur_quadrant_lat_max){
                                    vicinity_cnt++;
                                }
                            } 
                        }
        
                        /** constraint k is fullfilled, the algorithm ends */
                        if(vicinity_cnt<temporalCloakingData.constraint_k) break;
        
                        /** find the index of ego vehicle */
                        for(let k=0;k<temporalCloakingData.total_vehicles; k++){
                            if(cars_position[k]['id']==temporalCloakingData.ego_vehicle_id) ego_index = k;
                        }
                        /** find out which sub quadrant ego vehicle is in */
                        quadrant_lat = quadrant_lat/2.000;
                        quadrant_lon = quadrant_lon/2.000;
                        if(cars_position[ego_index]['y'] <= cur_quadrant_lon_min+quadrant_lon && cars_position[ego_index]['x'] <= cur_quadrant_lat_min+quadrant_lat){
                            prev_quadrant_lon_max = cur_quadrant_lon_max;
                            cur_quadrant_lon_max = cur_quadrant_lon_min+quadrant_lon;
        
                            prev_quadrant_lat_max = cur_quadrant_lat_max;
                            cur_quadrant_lat_max = cur_quadrant_lat_min+quadrant_lat;
        
                            prev_quadrant_lon_min = cur_quadrant_lon_min;
                            prev_quadrant_lat_min = cur_quadrant_lat_min;
                        }
                        else if(cars_position[ego_index]['y'] <= cur_quadrant_lon_min+quadrant_lon && cars_position[ego_index]['x'] >= cur_quadrant_lat_min+quadrant_lat){
                            prev_quadrant_lon_max = cur_quadrant_lon_max;
                            cur_quadrant_lon_max = cur_quadrant_lon_min+quadrant_lon;
        
                            prev_quadrant_lat_min = cur_quadrant_lat_min;
                            cur_quadrant_lat_min = cur_quadrant_lat_min+quadrant_lat;
        
                            prev_quadrant_lon_min = cur_quadrant_lon_min;
                            prev_quadrant_lat_max = cur_quadrant_lat_max;
                        }
                        else if(cars_position[ego_index]['y'] >= cur_quadrant_lon_min+quadrant_lon && cars_position[ego_index]['x'] <= cur_quadrant_lat_min+quadrant_lat){
                            prev_quadrant_lon_min = cur_quadrant_lon_min;
                            cur_quadrant_lon_min = cur_quadrant_lon_min+quadrant_lon;
        
                            prev_quadrant_lat_max = cur_quadrant_lat_max;
                            cur_quadrant_lat_max = cur_quadrant_lat_min+quadrant_lat;
        
                            prev_quadrant_lon_max = cur_quadrant_lon_max;
                            prev_quadrant_lat_min = cur_quadrant_lat_min;
                        }
                        else if(cars_position[ego_index]['y'] >= cur_quadrant_lon_min+quadrant_lon && cars_position[ego_index]['x'] >= cur_quadrant_lat_min+quadrant_lat){
                            prev_quadrant_lon_min = cur_quadrant_lon_min;
                            cur_quadrant_lon_min = cur_quadrant_lon_min+quadrant_lon;
        
                            prev_quadrant_lat_min = cur_quadrant_lat_min;
                            cur_quadrant_lat_min = cur_quadrant_lat_min+quadrant_lat;
        
                            prev_quadrant_lon_max = cur_quadrant_lon_max;
                            prev_quadrant_lat_max = cur_quadrant_lat_max;
                        }
                    }
        
                    /** show the result of algorithm(the grid disclosed to users) */
                    polygon_grid = new Polygon([[
                        [prev_quadrant_lon_min, prev_quadrant_lat_min],
                        [prev_quadrant_lon_min, prev_quadrant_lat_max],
                        [prev_quadrant_lon_max, prev_quadrant_lat_max],
                        [prev_quadrant_lon_max, prev_quadrant_lat_min],
                        [prev_quadrant_lon_min, prev_quadrant_lat_min]]]).transform('EPSG:4326', 'EPSG:3857')
                    feature_grid = new Feature({
                        geometry: polygon_grid
                    });
                    feature_grid.setStyle(style_grid_1);
                    gridLayer?.getSource()?.addFeature(feature_grid);
                }
    
            })
        }
        
    }, [mapAgentsData]);

    return <></>
}

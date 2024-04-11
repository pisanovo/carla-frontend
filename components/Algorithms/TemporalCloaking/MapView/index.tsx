import {Layer} from "ol/layer";
import {useEffect,useState, useMemo, useContext} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {Collection, Feature} from "ol";
import {Geometry, Polygon, Point} from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Fill, Stroke, Style, Circle} from "ol/style";
import {circular} from 'ol/geom/Polygon';
import {Grid} from "../types"
import { LoadingOverlay } from "@mantine/core";

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

var last_lon_min: number;
var last_lon_max: number;
var last_lat_min: number;
var last_lat_max: number;

export function MapView({onAddLayer, onRemoveLayer}: TemporalCloakingMapViewProps) {
    const {temporalCloakingData, setTemporalCloakingData} = useContext(AlgorithmDataContext);

    /** Layer that visualizes the grid, initially contains the red area grid bounding box  */
    const gridLayer = new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 2
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

        // On destruction, remove layers
        return () => {
            onRemoveLayer(gridLayer);
        }
    }, [onAddLayer, onRemoveLayer]);


    // Show grid from logs
    useEffect(() => {
        var polygon_grid;
        var feature_grid;
        var newSource_grid;

        var lon_min: number;
        var lon_max: number;
        var lat_min: number;
        var lat_max: number;
        var show_times: number=0

        var logItem;

        if(temporalCloakingData.locationServerLogs.length>0 && show_times<10){
                logItem = temporalCloakingData.locationServerLogs[0];
                lon_min = +logItem.grid.lon_min;
                lon_max = +logItem.grid.lon_max;
                lat_min = +logItem.grid.lat_min;
                lat_max = +logItem.grid.lat_max;
                polygon_grid = new Polygon([[
                    [lon_min, lat_min],
                    [lon_min, lat_max],
                    [lon_max, lat_max],
                    [lon_max, lat_min],
                    [lon_min, lat_min]]]).transform('EPSG:4326', 'EPSG:3857')

                feature_grid = new Feature({
                    geometry: polygon_grid
                });
                feature_grid.setStyle(style_grid_1);
                newSource_grid = new VectorSource({
                    features: [feature_grid]
                });
                gridLayer?.setSource(newSource_grid);

                if(last_lon_min==lon_min && last_lon_max==lon_max && last_lat_min==lat_min && last_lat_max==lat_max){
                    show_times++;
                }else{
                    show_times = 0;
                }

                last_lon_min = lon_min;
                last_lon_max = lon_max;
                last_lat_min = lat_min;
                last_lat_max = lat_max;
        }
        // when no new carla data comes in and same data being displayed for long enough, stop showing positions on map
    }, [temporalCloakingData.locationServerLogs, gridLayer])


    return <></>
}

import Map from 'ol/Map.js';
import {RefObject, useEffect} from "react";
import {IMapView} from "@/components/MapView/MapView";
import {Collection, Feature} from "ol";
import {Polygon} from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Stroke, Style} from "ol/style";


export function MapView({ map, parent, carla_settings, algo_data, layers }: IMapView) {
    // TODO: Your implementation
    // If you need to access, e.g., vehicles drawn on the map see the map_obj parent layers and features

    useEffect(() => {
        const rectFeature = new Feature({
            geometry: new Polygon([[[9.0937, 48.7477], [9.1171, 48.7463], [9.121, 48.7363], [9.0888, 48.731], [9.0937, 48.7477]]]).transform('EPSG:4326', 'EPSG:3857')
        });

        const gridLayer = new VectorLayer({
            source: new VectorSource({
                features: [rectFeature]
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true
        })

        var selected_polygon_style = new Style({
            stroke: new Stroke({
                width: 6 / map.getView().getResolution(),
                lineDash: [10],
                color: "#000000"
            })
        });

        rectFeature.setStyle(selected_polygon_style);

        layers.push(gridLayer);
    }, []);

    return (
        <div/>
    );
}

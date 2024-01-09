import React, {useEffect, useState, useMemo} from "react";
import {IMapView} from "@/components/MapView/MapView";
import {Geometry, Polygon, Point} from "ol/geom";
import {Feature} from "ol";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {Fill, Stroke, Style, Circle} from "ol/style";
import {circular} from 'ol/geom/Polygon';
import useSWRSubscription from "swr/subscription";
import Map from "ol/Map";
import {asArray} from "ol/color";
import { Layer } from "ol/layer";


type RedundantDummiesMapViewProps = {
    map: any,
    carla_settings: any,
    algo_data: any,
    /** Handler that is called whenever a layer should be added to the map */
    onAddLayer: (layer: Layer) => void,
    /** Handler that is called whenever a layer should be removed from the map */
    onRemoveLayer: (layer: Layer) => void,
}


type Location = {
    x: number,
    y: number,
}

type LogItem = {
    timestamp: number,
    location: Location,
}

type VisualizationInfoResponse = {
    logs: LogItem[]
}

export default function MapView({ map, carla_settings, algo_data, onAddLayer, onRemoveLayer}: RedundantDummiesMapViewProps) {
    /** Refresh interval for the polling of logs */
    const REFRESH_INTERVAL = 5000; // ms
    /** Data points like the location based service sees them*/
    const [logs, setLogs] = useState<LogItem[]>([])

    // Fetch logs

    // Fetch the logs from the location server, i.e., what 
    // the location based service sees.
    useEffect(() => {
        // Fetch logs continously
        const logsInterval = setInterval(() => {
            fetch("http://localhost:5002/visualization_info")
            .then((res) => res.json())
            .then((res: VisualizationInfoResponse) => setLogs(res.logs))
        }, REFRESH_INTERVAL);

        // Clear interval when component is removed
        return () => {
            clearInterval(logsInterval)
        }
    }, [REFRESH_INTERVAL, setLogs]);

    // Create and add a layer for what the location based service can see
    const baseStyle = useMemo(() => {
        return new Style({
            image: new Circle({
                fill: new Fill({color: [0,121,0,0.8]}),
                stroke: new Stroke({color: [0,0,0,1]}),
                radius: 3
            }),
        })
    }, []);
    const locationBasedServiceLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                    features: []
            }),
            zIndex: 2,
            style() {
                return [baseStyle]
            }
        }), []);

    // Make sure layer is present on map while this component lives
    useEffect(() => {
        // Initially, add the layer
        onAddLayer(locationBasedServiceLayer);

        // Finally, remove it
        return () => onRemoveLayer(locationBasedServiceLayer)
    }, [onAddLayer, onRemoveLayer, locationBasedServiceLayer]);


    /** Creates a point feature from x and y coordinates */
    const createPoint = (x: number, y: number) => {
        const location = [ 
            y,
            x,
        ];
        return new Feature({
            name: 'test-element',
            geometry: new Point(location).transform('EPSG:4326', 'EPSG:3857')
        });
    }

    // Add points from logs
    useEffect(() => {
        const newSource = new VectorSource({
            features: logs.map((logItem) => createPoint(logItem.location.x, logItem.location.y))
        });
                
        locationBasedServiceLayer.setSource(newSource);
    }, [logs, locationBasedServiceLayer])
    return <></>
}

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
import { RedundantDummLocationsAlgorithmData } from "../types";


type RedundantDummiesMapViewProps = {
    map: any,
    carla_settings: any,
    algo_data: RedundantDummLocationsAlgorithmData,
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
    /** Layer that visualizes the logs from the location based service */
    const locationBasedServiceLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                    features: []
            }),
            zIndex: 4,
            style() {
                return [baseStyle]
            }
        }), []);
    
    /** Layer that visualizes a dump of the user movement storage */
    const userMovementStorageDumpLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                    features: []
            }),
            zIndex: 2,
            style() {
                // NOTE: This is the default style. Features might have a custom style, that overwrites the default style
                return [baseStyle]
            }
    }), []);
    /** Layer that visualizes a dump of the dummy storage */
    const dummyStorageDumpLayer = useMemo(() =>
    new VectorLayer({
        source: new VectorSource({
                features: []
        }),
        zIndex: 3,
        style() {
            // NOTE: This is the default style. Features might have a custom style, that overwrites the default style
            return [baseStyle]
        }
    }), []);

    // Make sure layer is present on map while this component lives
    useEffect(() => {
        // Initially, add the layer
        if (algo_data.data.showUserMovementStorageDump) {
            onAddLayer(userMovementStorageDumpLayer);
        }
        if (algo_data.data.showLocationServerLogs) {
            onAddLayer(locationBasedServiceLayer);
        }
        if (algo_data.data.showDummyStorageDump) {
            onAddLayer(dummyStorageDumpLayer);
        }

        // On destruction, remove it
        return () => {
            onRemoveLayer(userMovementStorageDumpLayer)
            onRemoveLayer(locationBasedServiceLayer)
            onRemoveLayer(dummyStorageDumpLayer)
        }
    }, [onAddLayer, onRemoveLayer, userMovementStorageDumpLayer, locationBasedServiceLayer, dummyStorageDumpLayer, algo_data.data]);


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
            features: algo_data.data.locationServerLogs.map((logItem) => createPoint(logItem.location.x, logItem.location.y))
        });
                
        locationBasedServiceLayer.setSource(newSource);
    }, [algo_data.data.locationServerLogs, locationBasedServiceLayer])

    // Add points from user movement dump
    useEffect(() => {
        const newSource = new VectorSource({
            features: algo_data.data.userMovementStorageDump
                // Iterate over each movements node list individually so that we can assign different colors to them
                .map((userMovement) => userMovement.Node_List)
                .map((nodeList) => {
                    // For each nodeList, choose a random color and visualize nodes in that color
                    const randomColor = [
                        Math.floor(Math.random() * 256),
                        Math.floor(Math.random() * 256),
                        Math.floor(Math.random() * 256),
                    0.8]
                    const randomImage = new Circle({
                        fill: new Fill({color: randomColor}),
                        stroke: new Stroke({color: [0,0,0,1]}),
                        radius: 3
                    })
                    return nodeList.map((node) => {
                        // Create a point for each node, with a custom style in the randomColor
                        const newPoint = createPoint(node.x, node.y)
                        const randomColorStyle = baseStyle.clone()
                        randomColorStyle.setImage(randomImage)
                        newPoint.setStyle(randomColorStyle)
                        return newPoint
                    })
                })
                // Flatten array to get one list of nodes
                .reduce((all, current) => all.concat(...current), [])
        });
                
        userMovementStorageDumpLayer.setSource(newSource);
    }, [algo_data.data.userMovementStorageDump, userMovementStorageDumpLayer])

    // Add points from dummy dump
    useEffect(() => {
        const newSource = new VectorSource({
            features: algo_data.data.dummyStorageDump
                // Iterate over each dummies node list individually so that we can assign different colors to them
                .map((dummy) => dummy.Node_List)
                .map((nodeList) => {
                    // For each nodeList, choose a random color and visualize nodes in that color
                    const randomColor = [
                        Math.floor(Math.random() * 256),
                        Math.floor(Math.random() * 256),
                        Math.floor(Math.random() * 256),
                    0.8]
                    const randomImage = new Circle({
                        fill: new Fill({color: randomColor}),
                        stroke: new Stroke({color: [0,0,0,1]}),
                        radius: 3
                    })
                    return nodeList.map((node) => {
                        // Create a point for each node, with a custom style in the randomColor
                        const newPoint = createPoint(node.x, node.y)
                        const randomColorStyle = baseStyle.clone()
                        randomColorStyle.setImage(randomImage)
                        newPoint.setStyle(randomColorStyle)
                        return newPoint
                    })
                })
                // Flatten array to get one list of nodes
                .reduce((all, current) => all.concat(...current), [])
        });
                
        dummyStorageDumpLayer.setSource(newSource);
    }, [algo_data.data.dummyStorageDump, dummyStorageDumpLayer])
    return <></>
}

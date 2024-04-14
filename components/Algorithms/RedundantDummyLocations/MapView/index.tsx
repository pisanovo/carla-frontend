import React, {useContext, useEffect, useMemo} from "react";
import {Feature} from "ol";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {Fill, Stroke, Style, Circle} from "ol/style";
import { Layer } from "ol/layer";
import { AlgorithmDataContext } from "@/contexts/AlgorithmDataContext";
import { Point } from "ol/geom";


type RedundantDummiesMapViewProps = {
    /** Handler that is called whenever a layer should be added to the map */
    onAddLayer: (layer: Layer) => void,
    /** Handler that is called whenever a layer should be removed from the map */
    onRemoveLayer: (layer: Layer) => void,
}

export default function MapView({ onAddLayer, onRemoveLayer}: RedundantDummiesMapViewProps) {
    const { redundantDummyLocationsData } = useContext(AlgorithmDataContext)

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
        if (redundantDummyLocationsData.showUserMovementStorageDump) {
            onAddLayer(userMovementStorageDumpLayer);
        }
        if (redundantDummyLocationsData.showLocationServerLogs) {
            onAddLayer(locationBasedServiceLayer);
        }
        if (redundantDummyLocationsData.showDummyStorageDump) {
            onAddLayer(dummyStorageDumpLayer);
        }

        // On destruction, remove it
        return () => {
            onRemoveLayer(userMovementStorageDumpLayer)
            onRemoveLayer(locationBasedServiceLayer)
            onRemoveLayer(dummyStorageDumpLayer)
        }
    }, [onAddLayer, onRemoveLayer, userMovementStorageDumpLayer, locationBasedServiceLayer, dummyStorageDumpLayer, redundantDummyLocationsData]);


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
            features: redundantDummyLocationsData.locationServerLogs.map((logItem) => createPoint(logItem.location.x, logItem.location.y))
        });

        locationBasedServiceLayer.setSource(newSource);
    }, [redundantDummyLocationsData.locationServerLogs, locationBasedServiceLayer])

    // Add points from user movement dump
    useEffect(() => {
        const newSource = new VectorSource({
            features: redundantDummyLocationsData.userMovementStorageDump
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
    }, [redundantDummyLocationsData.userMovementStorageDump, userMovementStorageDumpLayer])

    // Add points from dummy dump
    useEffect(() => {
        const newSource = new VectorSource({
            features: redundantDummyLocationsData.dummyStorageDump
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
    }, [redundantDummyLocationsData.dummyStorageDump, dummyStorageDumpLayer])
    return <></>
}

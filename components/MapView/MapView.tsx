"use client";

import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {transform} from 'ol/proj.js';
import 'ol/ol.css';
import {useEffect, useRef, useState} from "react";
import {Vector as VectorSource} from 'ol/source.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import useSWRSubscription from 'swr/subscription'
import {Feature} from "ol";
import {Circle, Point} from "ol/geom";

// https://github.com/carla-simulator/carla/issues/2737#issuecomment-645009877
export function MapView() {

    const [map, setMap] = useState<Map>();
    const [vehicleLayer, setVehicleLayer] = useState<VectorLayer<VectorSource>>();
    const [vehicleFeatures, setVehicleFeatures] = useState<Feature[]>([]);
    const mapRef = useRef();
    mapRef.current = map;

    useEffect(() => {
        var vectorSource = new VectorSource({
            features: vehicleFeatures
        })
        const initialVehicleLayer = new VectorLayer({
            source: vectorSource
        })
        const init_map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                initialVehicleLayer
            ],
            view: new View({
                center: transform([9.10758, 48.74480], 'EPSG:4326', 'EPSG:3857'),
                zoom: 15,
            }),
        });

        setMap(init_map);
        setVehicleLayer(initialVehicleLayer);
    }, []);

    const carlaAgentData= useSWRSubscription('ws://127.0.0.1:8200/carla', (key, { next }) => {
        const socket = new WebSocket(key)
        socket.addEventListener('message', (event) => next(
            null,
            prev => {
                // console.log("prev", JSON.stringify(prev))
                var event_json = JSON.parse(event.data);

                var result = [...event_json["data"]]

                if (prev !== undefined) {
                    for (let i = 0; i < prev.length; i++) {
                        var found = false;
                        for (let j = 0; j < result.length; j++) {
                            if (prev[i]["id"] == result[j]["id"]) {
                                found = true;
                            }
                        }
                        if (!found) {
                            result.push(prev[i]);
                        }
                    }
                }

                // console.log("new", JSON.stringify(result))

                return result
            })
        )
        return () => socket.close()
    })

    useEffect(() => {

        if (carlaAgentData.data !== undefined) {
            let features = [];
            for (let i = 0; i < carlaAgentData.data.length; i++) {
                const entry = carlaAgentData.data[i];
                const location = entry["location"];
                var point = new Point([location["y"], location["x"]]).transform('EPSG:4326', 'EPSG:3857');

                let found = false;

                // for (let j = 0; j < features.length; j++) {
                //     let feature = features[j];
                //     if (feature.getGeometryName() === entry["id"]) {
                //         console.log("HOP")
                //         feature.setGeometry(point);
                //     }
                //     found = true;
                // }
                // if (!found) {
                    var feature = new Feature({
                        name: entry["id"],
                        geometry: point
                    });
                    features.push(feature);
                // }
            }

            // console.log("features", features);

            vehicleLayer.setSource(
                new VectorSource({
                    features: features
                })
            )

            // setVehicleFeatures(features);
        }
    }, [carlaAgentData]);

    // var vectorAgentPoint = new VectorSource({});
    // var vehicleFeatureList: Feature[] = [];

    // useEffect(() => {
    //     vectorAgentPoint.clear();
    //
    //     if (carlaAgentData.data !== undefined) {
    //         for (let i = 0; i < carlaAgentData.data.length; i++) {
    //             const entry = carlaAgentData.data[i];
    //             const location = entry["location"];
    //             // var point = new Point([location["y"], location["x"]]).transform('EPSG:4326', 'EPSG:3857');
    //             var circle2 = new Circle(
    //                 olProj.transform([location["y"], location["x"]], 'EPSG:4326', 'EPSG:3857'),
    //                 900000 / olProj.getPointResolution('EPSG:4326', 1, [9.108243543959933, 48.74478388922745], 'm')
    //             )
    //             let features = vectorAgentPoint.getFeatures();
    //             let found = false;
    //
    //             for (let j = 0; j < features.length; j++) {
    //                 let feature = features[j];
    //                 if (feature.getGeometryName() === entry["id"]) {
    //                     feature.setGeometry(circle2);
    //                 }
    //             }
    //             if (!found) {
    //                 var feature = new Feature({
    //                     name: entry["id"],
    //                     geometry: circle2
    //                 });
    //                 vectorAgentPoint.addFeature(feature);
    //             }
    //
    //         }
    //     }
    //     // console.log("vap", vectorAgentPoint.getFeatures())
    // }, [carlaAgentData]);
    //
    //
    // useEffect(() => {
    //
    //     var point = new Point([9.108243543959933, 48.74478388922745]).transform('EPSG:4326', 'EPSG:3857');
    //     var circle = new Circle(
    //         olProj.transform([9.108243543959933, 48.74478388922745], 'EPSG:4326', 'EPSG:3857'),
    //         1000).transform('EPSG:3857', 'EPSG:4326')
    //     var circle2 = new Circle(
    //         olProj.transform([9.108243543959933, 48.74478388922745], 'EPSG:4326', 'EPSG:3857'),
    //         900000 / olProj.getPointResolution('EPSG:4326', 1, [9.108243543959933, 48.74478388922745], 'm')
    //     )
    //     var feature = new Feature({geometry: circle2});
    //     vectorAgentPoint.addFeature(feature);
    //
    //     console.log("f", vectorAgentPoint.getFeatures());
    //     const InitializeMap = new Map({
    //         target: 'map',
    //         layers: [
    //             new TileLayer({
    //                 source: new OSM()
    //             }),
    //             new VectorLayer({
    //                 source: vectorAgentPoint,
    //             }),
    //         ],
    //         view: new View({
    //             center: transform([9.10758, 48.74480], 'EPSG:4326', 'EPSG:3857'),
    //             zoom: 17,
    //         }),
    //     });
    //
    //     InitializeMap.setTarget(mapTargetElement.current || "")
    //     setMap(InitializeMap)
    //
    //     return () => InitializeMap.setTarget("")
    //
    //
    // }, []);
    //



    return (
        <>
            <div ref={mapRef} className="map" style={{ height: "inherit", width: "inherit"}}></div>
        </>
    );
}

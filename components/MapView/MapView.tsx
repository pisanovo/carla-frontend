"use client";

import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {transform} from 'ol/proj.js';
import 'ol/ol.css';
import {useEffect} from "react";
import {Vector as VectorSource} from 'ol/source.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import useSWRSubscription from 'swr/subscription'
import {Stack} from "@mantine/core";

// https://github.com/carla-simulator/carla/issues/2737#issuecomment-645009877
export function MapView() {

    const carlaAgentData= useSWRSubscription('ws://127.0.0.1:8200/carla', (key, { next }) => {
        const socket = new WebSocket(key);
        socket.addEventListener('message', (event) => next(
            null,
            prev => {
                console.log("prev", JSON.stringify(prev))
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

                console.log("new", JSON.stringify(result))

                return result
            })
        )
        return () => socket.close()
    })

    var vectorAgentPoint = new VectorSource({});

    useEffect(() => {
        new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                new VectorLayer({
                    source: vectorAgentPoint
                }),
            ],
            view: new View({
                center: transform([9.10758, 48.74480], 'EPSG:4326', 'EPSG:3857'),
                zoom: 17,
            }),
        });
    }, []);


    return (
        <>
            <div id="map" style={{ height: "inherit", width: "inherit"}}></div>
        </>
    );
}

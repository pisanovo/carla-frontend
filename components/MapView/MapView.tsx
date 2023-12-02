"use client";

import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {transform} from 'ol/proj.js';
import 'ol/ol.css';
import {Dispatch, MutableRefObject, RefObject, SetStateAction, useEffect, useRef, useState} from "react";
import {Vector as VectorSource} from 'ol/source.js';
import {Group, Vector as VectorLayer} from 'ol/layer.js';
import useSWRSubscription from 'swr/subscription'
import {Collection, Feature} from "ol";
import {Circle, Point, Polygon} from "ol/geom";
import {MapView as LocationCloakingMapView} from "../Algorithms/LocationCloaking/MapView/MapView"
import {MapView as TemporalCloakingMapView} from "../Algorithms/TemporalCloaking/MapView/MapView"
import LayerGroup from "ol/layer/Group";
import BaseLayer from "ol/layer/Base";
import {Fill, Stroke, Style} from "ol/style";
import Text from 'ol/style/Text.js';


export interface IMapView {
    map: any,
    parent: {
        parent_layers: {vehicle_layer: VectorLayer<VectorSource>},
        parent_features: {vehicle_features: Feature[]}
    },
    layers: Collection<BaseLayer>,
    carla_settings: any,
    algo_data: any
}

export function MapView(props: any) {

    const [map, setMap] = useState<Map>();
    const [locationCloakingLayerGroup, setLocationCloakingLayerGroup] = useState<LayerGroup>();
    const [temporalCloakingLayerGroup, setTemporalCloakingLayerGroup] = useState<LayerGroup>();
    const [vehicleLayer, setVehicleLayer] = useState<VectorLayer<VectorSource>>();
    const [vehicleFeatures, setVehicleFeatures] = useState<Feature[]>([]);
    const [activeVehicles, setActiveVehicles] = useState({});
    const mapRef = useRef<Map>();

    useEffect(() => {
        var vectorSource = new VectorSource({
            features: vehicleFeatures
        });

        var text_style = new Style({
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({ color: '#000' }),
                backgroundFill: new Fill({ color: '#25262B26' }),
                padding: [0, -1, -2, 2],
                offsetY: -12,
            }),
        });

        const initialVehicleLayer = new VectorLayer({
            source: vectorSource,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 99,
            style: function(feature) {
                text_style.getText().setText(feature.get('label'));
                return [text_style];
            }
        });

        const initialLocationCloakingLayerGroup = new LayerGroup({layers: []});
        const initialTemporalCloakingLayerGroup = new LayerGroup({layers: []});

        const init_map = new Map({
            target: mapRef.current as unknown as HTMLElement,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                initialVehicleLayer,
                initialLocationCloakingLayerGroup,
                initialTemporalCloakingLayerGroup
            ],
            view: new View({
                center: transform([9.10758, 48.74480], 'EPSG:4326', 'EPSG:3857'),
                zoom: 15,
            }),
        });

        setMap(init_map);
        setVehicleLayer(initialVehicleLayer);
        setLocationCloakingLayerGroup(initialLocationCloakingLayerGroup);
        setTemporalCloakingLayerGroup(initialTemporalCloakingLayerGroup);
    }, []);

    const carlaAgentData= useSWRSubscription(
        'ws://'+props.carlaSettings.ip+':'+props.carlaSettings.port+'/carla/position-stream',
        (key, { next }) => {
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

                return result
            })
        )
        return () => socket.close()
    })

    useEffect(() => {
        if (carlaAgentData.data !== undefined && activeVehicles["agent_ids"]) {
            for (let i = 0; i < carlaAgentData.data.length; i++) {
                const entry = carlaAgentData.data[i];
                const id = "CARLA-id-"+entry["id"];
                if (!(activeVehicles["agent_ids"].includes(id))) {
                    return;
                }
                const location = entry["location"];

                var point = new Point([location["y"], location["x"]]).transform('EPSG:4326', 'EPSG:3857');

                const feature = vehicleLayer?.getSource()?.getFeatureById(entry["id"]);

                if (feature) {
                    feature.setGeometry(point);
                } else {

                    var new_feature = new Feature({
                        name: entry["id"],
                        geometry: point,
                        label: entry["id"].toString()
                    });
                    new_feature.setId(entry["id"]);
                    vehicleLayer?.getSource()?.addFeature(new_feature);
                }
            }
        }
    }, [carlaAgentData]);

    useEffect(() => {
        if (activeVehicles["agent_ids"] === undefined) {
            return;
        }
        const features = vehicleLayer?.getSource()?.getFeatures();
        let keys = Object.keys(activeVehicles);
        if (features) {
            for (let i = 0; i < features.length; i++) {
                const feature = features[i];
                const id = feature.getId();

                if (!(activeVehicles["agent_ids"].includes("CARLA-id-"+id))) {
                    vehicleLayer?.getSource()?.removeFeature(feature);
                }
            }
        }
    }, [activeVehicles]);

    useEffect(() => {
        if (props.algorithm !== "Spatial-location cloaking") {
            locationCloakingLayerGroup?.getLayers().clear();
        }
        if (props.algorithm !== "Temporal cloaking []") {
            temporalCloakingLayerGroup?.getLayers().clear();
        }
    }, [props.algorithm]);

    useSWRSubscription(
        'ws://'+props.carlaSettings.ip+':'+props.carlaSettings.port+'/carla/agents',
        (key, { next }) => {
            const socket = new WebSocket(key)
            socket.addEventListener('message', (event) => next(
                null,
                prev => {
                    var event_json = JSON.parse(event.data);
                    setActiveVehicles(s => ({...s, agent_ids: event_json["data"]}));
                    props.algo.locationCloakingSettings.setData(s => ({...s, agent_ids: event_json["data"]}));
                    props.algo.temporalCloakingSettings.setData(s => ({...s, agent_ids: event_json["data"]}));
                })
            )
            return () => socket.close()
    })

    const parent = {
        parent_layers: {
            vehicle_layer: vehicleLayer as VectorLayer<VectorSource>
        },
        parent_features: {
            vehicle_features: vehicleFeatures
        }
    }


    return (
            <div
                ref={mapRef as unknown as RefObject<HTMLDivElement>}
                style={{ height: "inherit", width: "inherit"}}
            >
                {props.algorithm === "Spatial-location cloaking" &&
                    <LocationCloakingMapView
                        map={map}
                        parent={parent}
                        carla_settings={props.carlaSettings}
                        algo_data={props.algo.locationCloakingSettings}
                        layers={locationCloakingLayerGroup.getLayers()}
                    />
                }
                {props.algorithm === "Temporal cloaking []" &&
                    <TemporalCloakingMapView
                        map={map}
                        parent={parent}
                        carla_settings={props.carlaSettings}
                        algo_data={props.algo.temporalCloakingSettings}
                        layers={temporalCloakingLayerGroup.getLayers()}
                    />
                }
            </div>
    );


}



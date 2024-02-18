"use client";

import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {transform} from 'ol/proj.js';
import 'ol/ol.css';
import {
    Dispatch,
    MutableRefObject,
    RefObject,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {Vector as VectorSource} from 'ol/source.js';
import {Group, Layer, Vector as VectorLayer} from 'ol/layer.js';
import useSWRSubscription from 'swr/subscription'
import {Collection, Feature} from "ol";
import {Point, Polygon} from "ol/geom";
import {MapView as LocationCloakingMapView} from "../Algorithms/LocationCloaking/MapView/index"
import {MapView as TemporalCloakingMapView} from "../Algorithms/TemporalCloaking/MapView/MapView"
import LayerGroup from "ol/layer/Group";
import BaseLayer from "ol/layer/Base";
import {Fill, Stroke, Style, Circle} from "ol/style";
import Text from 'ol/style/Text.js';
import { REDUNDANT_DUMMY_LOCATIONS_ID } from '../Algorithms/RedundantDummyLocations/config';
import RedundantDummyLocationsMapView from '@/components/Algorithms/RedundantDummyLocations/MapView'
import {LOCATION_CLOAKING_ID} from "@/components/Algorithms/LocationCloaking/config";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";


// export interface IMapView {
//     map: any,
//     parent: {
//         parent_layers: {vehicle_layer: VectorLayer<VectorSource>},
//         parent_features: {vehicle_features: Feature[]},
//     },
//     layers: Collection<BaseLayer>,
//     position_data: any
//     carla_settings: any,
//     algo_data: any
// }

/** A single element for a carla agent with position information */
type Agent = {
    /** The agent carla ID */
    id: string,
    /** Agent location (x, y) are (latitude, longitude) */
    location: {
        x: number,
        y: number
    },
    /** Can be used to draw a circle of x meters around an agent
     * and account for the curvature of the earth */
    greatCircleDistanceFactor: number
}

export type AgentsData = {
    /** Contains the carla IDs of all active agents */
    activeAgents: string[],
    /** List with the positions of active agents */
    agents: Agent[]
}

export function MapView(props: any) {
    const { settings } = useContext(AlgorithmDataContext);

    /** A place to store the active carla agents and their positions */
    const [agentsData, setAgentsData] = useState<AgentsData>({activeAgents: [], agents: []});
    /** Holds a reference to the map */
    const mapRef = useRef<Map>();

    // const [map, setMap] = useState<Map>();
    // const [locationCloakingLayerGroup, setLocationCloakingLayerGroup] = useState<LayerGroup>();
    // const [temporalCloakingLayerGroup, setTemporalCloakingLayerGroup] = useState<LayerGroup>();
    // const [redundantDummiesLayerGroup, setRedundantDummiesLayerGroup] = useState<LayerGroup>();
    // const [vehicleLayer, setVehicleLayer] = useState<VectorLayer<VectorSource>>();
    // const [vehicleFeatures, setVehicleFeatures] = useState<Feature[]>([]);
    // const [activeVehicles, setActiveVehicles] = useState({});
    // const [positionData, setPositionData] = useState([]);




    // Done
    // useEffect(() => {
    //     const features = vehicleLayer?.getSource()?.getFeatures();
    //
    //     if (features !== undefined) {
    //         for (let i = 0; i < features.length; i++) {
    //             const feature = features[i];
    //             if (props.showLabels) {
    //                 feature.set("label", feature.get("name").toString());
    //             } else {
    //                 feature.set("label", "");
    //             }
    //         }
    //     }
    //
    // }, [props.showLabels]);

    // Base circle style
    const baseCircleStyle = useMemo(() =>
        new Circle({
            fill: new Fill({color: [245,121,0,0.8]}),
            stroke: new Stroke({color: [0,0,0,1]}),
            radius: 3.5
        }), [])

    // Base text style, currently only used unmodified to show agent IDs on the map
    const baseTextStyle = useMemo(() =>
        new Text({
            font: '12px Calibri,sans-serif',
            placement: 'point',
            fill: new Fill({ color: '#000' }),
            backgroundFill: new Fill({ color: '#25262B26' }),
            padding: [0, -1, -2, 2],
            offsetY: -12,
        }), [])

    // Base style for algorithms
    const baseStyle = useMemo(() =>
        new Style({
           image: baseCircleStyle,
           text: baseTextStyle
        }), []);

    const agentLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 99,
            style: function (feature) {
                baseStyle.getText().setText(feature.get('label'));
                return [baseStyle];
            }
        }), []);

    const locationCloakingLayerGroup = useMemo(() =>
        new LayerGroup({
            layers: []
        }), []);

    const redundantDummiesLayerGroup = useMemo(() =>
        new LayerGroup({
            layers: []
        }), []);

    const temporalCloakingLayerGroup = useMemo(() =>
        new LayerGroup({
            layers: []
        }), []);

    useMemo(() =>
        new Map({
            target: mapRef.current as unknown as HTMLElement,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                agentLayer,
                locationCloakingLayerGroup,
                temporalCloakingLayerGroup,
                redundantDummiesLayerGroup,
            ],
            view: new View({
                center: transform([9.10758, 48.74480], 'EPSG:4326', 'EPSG:3857'),
                zoom: 15,
            }),
        }), []);


    // useEffect(() => {
    //     var vectorSource = new VectorSource({
    //         features: vehicleFeatures
    //     });
    //
    //
    //     var text_style = new Style({
    //         image: new Circle({
    //             fill: new Fill({color: [245,121,0,0.8]}),
    //             stroke: new Stroke({color: [0,0,0,1]}),
    //             radius: 3.5
    //         }),
    //         text: new Text({
    //             font: '12px Calibri,sans-serif',
    //             placement: 'point',
    //             fill: new Fill({ color: '#000' }),
    //             backgroundFill: new Fill({ color: '#25262B26' }),
    //             padding: [0, -1, -2, 2],
    //             offsetY: -12,
    //         }),
    //     });
    //
    //     // var style = [iconStyle, text_style];
    //
    //     const initialVehicleLayer = new VectorLayer({
    //         source: vectorSource,
    //         updateWhileAnimating: true,
    //         updateWhileInteracting: true,
    //         zIndex: 99,
    //         style: function(feature) {
    //             text_style.getText().setText(feature.get('label'));
    //             return [text_style];
    //         }
    //     });
    //
    //     const initialLocationCloakingLayerGroup = new LayerGroup({layers: []});
    //     const initialTemporalCloakingLayerGroup = new LayerGroup({layers: []});
    //     const initialRedundantDummiesLayerGroup = new LayerGroup({layers: []});
    //
    //     const init_map = new Map({
    //         target: mapRef.current as unknown as HTMLElement,
    //         layers: [
    //             new TileLayer({
    //                 source: new OSM()
    //             }),
    //             initialVehicleLayer,
    //             initialLocationCloakingLayerGroup,
    //             initialTemporalCloakingLayerGroup,
    //             initialRedundantDummiesLayerGroup,
    //         ],
    //         view: new View({
    //             center: transform([9.10758, 48.74480], 'EPSG:4326', 'EPSG:3857'),
    //             zoom: 15,
    //         }),
    //     });
    //
    //     setMap(init_map);
    //     setVehicleLayer(initialVehicleLayer);
    //     setLocationCloakingLayerGroup(initialLocationCloakingLayerGroup);
    //     setTemporalCloakingLayerGroup(initialTemporalCloakingLayerGroup);
    //     setRedundantDummiesLayerGroup(initialRedundantDummiesLayerGroup);
    // }, []);



    // Listens to updates for carla agents, i.e., the available agents and the respective positions
    useSWRSubscription(
        'ws://'+props.carlaSettings.ip+':'+props.carlaSettings.port+'/carla/agents-stream',
        (key, { next }) => {
            const socket = new WebSocket(key)
            socket.addEventListener('message', (event) => next(
                null,
                () => {
                    const eventJson = JSON.parse(event.data);

                    const agents: Agent[] = eventJson["data"];
                    const agent_ids = agents.reduce((acc, ag) => [...acc, ag.id], [] as string[]);
                    setAgentsData({activeAgents: agent_ids, agents: agents});
                })
            )
            return () => socket.close()
        }
    );

    // Manages agents drawn on map, i.e., position update and cleanup of inactive agents
    useEffect(() => {
        const agentFeatures = agentLayer?.getSource()?.getFeatures();

        if (agentFeatures === undefined) return;

        // Add or update agent features based on current active agents
        agentsData.agents.forEach((ag) => {
            let agentFeature = agentFeatures.find((el) => el.getId() === ag.id);

            const point = new Point([ag.location.y, ag.location.x]).transform('EPSG:4326', 'EPSG:3857');

            // Add new map feature if a new agent is drawn
            if (agentFeature === undefined) {
                agentFeature = new Feature({
                    name: ag.id,
                    geometry: point,
                    label: ""
                })
                agentFeature.setId(ag.id);
                agentLayer?.getSource()?.addFeature(agentFeature);
            // Update existing agent feature with new location
            } else {
                agentFeature.setGeometry(point);
            }
        })

        // Remove any agents that are not needed anymore
        agentFeatures.forEach((feature) => {
            const agentId = feature.getId();

            // Remove feature if agent is inactive
            if (typeof agentId === "string" && !agentsData.activeAgents.includes(agentId)) {
                agentLayer?.getSource()?.removeFeature(feature);
            }
        })
    }, [agentsData.agents]);

    // Draw the text for agent IDs above agent features
    useEffect(() => {
        const agentFeatures = agentLayer?.getSource()?.getFeatures();

        if (agentFeatures === undefined) return;

        agentFeatures.forEach((feature) => {
            feature.set("label", settings.showAgentIDLabels ? feature.get("name").toString() : "");
        });
    }, [settings.showAgentIDLabels]);

    // Clear layer groups when switching algorithms
    // TODO: Do we even need to clear this? If every algorithm has cleanup of layers defined this is not needed
    // TODO: Make it so the page.tsx algorithm selector uses setSelectedAlgorithm from the context
    useEffect(() => {
        if (settings.selectedAlgorithm !== LOCATION_CLOAKING_ID) {
            locationCloakingLayerGroup?.getLayers().clear();
        }
        if (settings.selectedAlgorithm !== "Temporal cloaking []") {
            temporalCloakingLayerGroup?.getLayers().clear();
        }
        if (settings.selectedAlgorithm !== REDUNDANT_DUMMY_LOCATIONS_ID) {
            redundantDummiesLayerGroup?.getLayers().clear();
        }
    }, [settings.selectedAlgorithm]);



//     // Done
//     const carlaAgentData= useSWRSubscription(
//         'ws://'+props.carlaSettings.ip+':'+props.carlaSettings.port+'/carla/position-stream',
//         (key, { next }) => {
//         const socket = new WebSocket(key)
//         socket.addEventListener('message', (event) => next(
//             null,
//             prev => {
//                 var event_json = JSON.parse(event.data);
//                 var result = [...event_json["data"]]
//                 if (prev !== undefined) {
//                     for (let i = 0; i < prev.length; i++) {
//                         var found = false;
//                         for (let j = 0; j < result.length; j++) {
//                             if (prev[i]["id"] == result[j]["id"]) {
//                                 found = true;
//                             }
//                         }
//                         if (!found) {
//                             result.push(prev[i]);
//                         }
//                     }
//                 }
//
//                 return result
//             })
//         )
//         return () => socket.close()
//     })
//
// // Done
//     useEffect(() => {
//         if (carlaAgentData.data !== undefined && activeVehicles["agent_ids"]) {
//             setPositionData(d => (carlaAgentData.data));
//             for (let i = 0; i < carlaAgentData.data.length; i++) {
//                 const entry = carlaAgentData.data[i];
//                 const id = "CARLA-id-"+entry["id"];
//                 if (!(activeVehicles["agent_ids"].includes(id))) {
//                     return;
//                 }
//                 const location = entry["location"];
//
//                 var point = new Point([location["y"], location["x"]]).transform('EPSG:4326', 'EPSG:3857');
//
//                 const feature = vehicleLayer?.getSource()?.getFeatureById(entry["id"]);
//
//                 if (feature) {
//                     feature.setGeometry(point);
//                 } else {
//
//                     var new_feature = new Feature({
//                         name: entry["id"],
//                         geometry: point,
//                         label: ""
//                     });
//                     new_feature.setId(entry["id"]);
//                     vehicleLayer?.getSource()?.addFeature(new_feature);
//                 }
//             }
//         }
//     }, [carlaAgentData]);
//
//     // useEffect(() => {
//     //     console.log("HSJHKJ", positionData)
//     // }, [positionData]);
//
//
//     // Done
//     useEffect(() => {
//         if (activeVehicles["agent_ids"] === undefined) {
//             return;
//         }
//         const features = vehicleLayer?.getSource()?.getFeatures();
//         let keys = Object.keys(activeVehicles);
//         if (features) {
//             for (let i = 0; i < features.length; i++) {
//                 const feature = features[i];
//                 const id = feature.getId();
//
//                 if (!(activeVehicles["agent_ids"].includes("CARLA-id-"+id))) {
//                     vehicleLayer?.getSource()?.removeFeature(feature);
//                 }
//             }
//         }
//     }, [activeVehicles]);
//
//
//
//     // Done
//     useSWRSubscription(
//         'ws://'+props.carlaSettings.ip+':'+props.carlaSettings.port+'/carla/agents',
//         (key, { next }) => {
//             const socket = new WebSocket(key)
//             socket.addEventListener('message', (event) => next(
//                 null,
//                 prev => {
//                     var event_json = JSON.parse(event.data);
//                     setActiveVehicles(s => ({...s, agent_ids: event_json["data"]}));
//                     props.algo.locationCloakingSettings.setData(s => ({...s, agent_ids: event_json["data"]}));
//                     props.algo.temporalCloakingSettings.setData(s => ({...s, agent_ids: event_json["data"]}));
//                 })
//             )
//             return () => socket.close()
//     })

    // const parent = {
    //     parent_layers: {
    //         vehicle_layer: vehicleLayer as VectorLayer<VectorSource>
    //     },
    //     parent_features: {
    //         vehicle_features: vehicleFeatures
    //     }
    // }


    return (
            <div
                ref={mapRef as unknown as RefObject<HTMLDivElement>}
                style={{ height: "inherit", width: "inherit"}}
            >
                {props.algorithm === LOCATION_CLOAKING_ID &&
                    <LocationCloakingMapView
                        agentsData={agentsData}
                        onAddLayer={(layer: Layer) => locationCloakingLayerGroup?.getLayers()?.push(layer)}
                        onRemoveLayer={(layer: Layer) => locationCloakingLayerGroup?.getLayers()?.remove(layer)}
                    />
                }
                {
                    props.algorithm === REDUNDANT_DUMMY_LOCATIONS_ID &&
                    <RedundantDummyLocationsMapView
                        onAddLayer={(layer: Layer) => redundantDummiesLayerGroup?.getLayers()?.push(layer)}
                        onRemoveLayer={(layer: Layer) => redundantDummiesLayerGroup?.getLayers()?.remove(layer)}
                    />
                }
                {props.algorithm === "Temporal cloaking []" && true
                    // <TemporalCloakingMapView
                        // map={map}
                        // parent={parent}
                        // carla_settings={props.carlaSettings}
                        // algo_data={props.algo.temporalCloakingSettings}
                        // layers={temporalCloakingLayerGroup.getLayers()}
                    // />
                }
            </div>
    );


}



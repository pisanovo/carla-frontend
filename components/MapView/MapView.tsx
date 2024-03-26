"use client";

import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {transform} from 'ol/proj.js';
import 'ol/ol.css';
import {
    RefObject,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {Vector as VectorSource} from 'ol/source.js';
import {Layer, Vector as VectorLayer} from 'ol/layer.js';
import useSWRSubscription from 'swr/subscription'
import {Feature} from "ol";
import {Point} from "ol/geom";
import {MapView as LocationCloakingMapView} from "../Algorithms/LocationCloaking/MapView/index"
import LayerGroup from "ol/layer/Group";
import {Fill, Stroke, Style, Circle} from "ol/style";
import Text from 'ol/style/Text.js';
import { REDUNDANT_DUMMY_LOCATIONS_ID } from '../Algorithms/RedundantDummyLocations/config';
import RedundantDummyLocationsMapView from '@/components/Algorithms/RedundantDummyLocations/MapView'
import PathConfusionMapView from '@/components/Algorithms/PathConfusion/MapView'
import {LOCATION_CLOAKING_ID} from "@/components/Algorithms/LocationCloaking/config";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {Agent} from "@/contexts/types";
import {PATH_CONFUSION_ID} from "@/components/Algorithms/PathConfusion/config";

export function MapView() {
    const { mapAgentsData, setMapAgentsData, settings } = useContext(AlgorithmDataContext);

    /** Holds a reference to the map */
    const mapRef = useRef<Map>();
    /** Reconnect timeout to location server in ms */
    const BACKEND_SERVER_CONN_TIMEOUT = 4000;
    const [map, setMap] = useState<Map>();
    /** Save the current websocket connection and create a new one on timeout */
    const [websocket, setWebsocket] = useState<WebSocket>();

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

    const pathConfusionLayerGroup = useMemo(() =>
        new LayerGroup({
            layers: []
        }), []);

    useEffect(() => {
        const nmap = new Map({
            target: mapRef.current as unknown as HTMLElement,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                agentLayer,
                locationCloakingLayerGroup,
                temporalCloakingLayerGroup,
                redundantDummiesLayerGroup,
                pathConfusionLayerGroup
            ],
            view: new View({
                center: transform([9.10758, 48.74480], 'EPSG:4326', 'EPSG:3857'),
                zoom: 15,
            }),
        })
        setMap(nmap);
    }, []);

    // Wrapper for the backend server websocket connection adding reconnect
    const sub_reconnect = function (url: string, next: any) {
        let socket = new WebSocket(url);
        setWebsocket(socket);
        socket.onclose = () => {
            setMapAgentsData({...mapAgentsData, isBackendConnected: false});
            setTimeout(() => {
                sub_reconnect(url, next)
            }, BACKEND_SERVER_CONN_TIMEOUT);
        }

        // Receive messages from the location server
        socket.addEventListener('message', (event) => next(null, () => {
            const eventJson = JSON.parse(event.data);
            const agents: Agent[] = eventJson["data"];
            const agent_ids = agents.reduce((acc, ag) => [...acc, ag.id], [] as string[]);
            setMapAgentsData({isBackendConnected: true, activeAgents: agent_ids, agents: agents});
        }))
    }

    // Listens to updates for carla agents, i.e., the available agents and the respective positions
    useSWRSubscription(
        'ws://'+settings.carlaServer.ip+':'+settings.carlaServer.port+'/carla/agents-stream',
        (key, { next }) => {
            sub_reconnect(key, next);
            return () => websocket?.close()
        }
    );

    // Manages agents drawn on map, i.e., position update and cleanup of inactive agents
    useEffect(() => {
        const agentFeatures = agentLayer?.getSource()?.getFeatures();

        if (agentFeatures === undefined) return;

        // Add or update agent features based on current active agents
        mapAgentsData.agents.forEach((ag) => {
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
            if (typeof agentId === "string" && !mapAgentsData.activeAgents.includes(agentId)) {
                agentLayer?.getSource()?.removeFeature(feature);
            }
        })
    }, [mapAgentsData.agents]);

    // Draw the text for agent IDs above agent features
    useEffect(() => {
        const agentFeatures = agentLayer?.getSource()?.getFeatures();

        if (agentFeatures === undefined) return;

        agentFeatures.forEach((feature) => {
            const agentId = feature.get("name").replace(/^\D+/g, '');
            feature.set("label", settings.showAgentIDLabels ? agentId : "");
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
        if(settings.selectedAlgorithm !== PATH_CONFUSION_ID) {
            redundantDummiesLayerGroup?.getLayers().clear();
        }
    }, [settings.selectedAlgorithm]);

    return (
            <div
                ref={mapRef as unknown as RefObject<HTMLDivElement>}
                style={{ height: "inherit", width: "inherit"}}
            >
                {
                    settings.selectedAlgorithm === LOCATION_CLOAKING_ID &&
                    <LocationCloakingMapView
                        onAddLayer={(layer: Layer) => locationCloakingLayerGroup?.getLayers()?.push(layer)}
                        onRemoveLayer={(layer: Layer) => locationCloakingLayerGroup?.getLayers()?.remove(layer)}
                    />
                }
                {
                    settings.selectedAlgorithm === REDUNDANT_DUMMY_LOCATIONS_ID &&
                    <RedundantDummyLocationsMapView
                        onAddLayer={(layer: Layer) => redundantDummiesLayerGroup?.getLayers()?.push(layer)}
                        onRemoveLayer={(layer: Layer) => redundantDummiesLayerGroup?.getLayers()?.remove(layer)}
                    />
                }
                {settings.selectedAlgorithm === "Temporal cloaking []" && true
                    // <TemporalCloakingMapView
                        // map={map}
                        // parent={parent}
                        // carla_settings={props.carlaSettings}
                        // algo_data={props.algo.temporalCloakingSettings}
                        // layers={temporalCloakingLayerGroup.getLayers()}
                    // />
                }
                {
                    settings.selectedAlgorithm === PATH_CONFUSION_ID &&
                    <PathConfusionMapView
                        onAddLayer={(layer: Layer) => pathConfusionLayerGroup?.getLayers()?.push(layer)}
                        onRemoveLayer={(layer: Layer) => pathConfusionLayerGroup?.getLayers()?.remove(layer)}
                        map={map}
                    />
                }
            </div>
    );
}



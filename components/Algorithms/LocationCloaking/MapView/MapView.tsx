import {useEffect, useState} from "react";
import {IMapView} from "@/components/MapView/MapView";
import {Geometry, Polygon, Circle} from "ol/geom";
import {Feature} from "ol";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {Fill, Stroke, Style, Circle as CircleStyle} from "ol/style";
import {circular} from 'ol/geom/Polygon';
import useSWRSubscription from "swr/subscription";
import Map from "ol/Map";
import {asArray} from "ol/color";


export function MapView({ map, parent, carla_settings, position_data, algo_data, layers }: IMapView) {
        // TODO: Your implementation
        // If you need to access, e.g., vehicles drawn on the map see the map_obj parent layers and features
        const [planeData, setPlaneData] = useState<any>({});
        const [gridLayer, setGridLayer] = useState<VectorLayer<VectorSource>>();
        const [positionGranulesLayer, setPositionGranulesLayer] = useState<VectorLayer<VectorSource>>();
        const [vicinityGranulesLayer, setVicinityGranulesLayer] = useState<VectorLayer<VectorSource>>();
        const [vicinityShapeLayer, setVicinityShapeLayer] = useState<VectorLayer<VectorSource>>();
        const [maxGridLevel, setMaxGridLevel] = useState(0);

        useEffect(() => {

                const rectFeature = new Feature({
                        geometry: new Polygon([[
                                [planeData.lon_min, planeData.lat_min],
                                [planeData.lon_min, planeData.lat_max],
                                [planeData.lon_max, planeData.lat_max],
                                [planeData.lon_max, planeData.lat_min],
                                [planeData.lon_min, planeData.lat_min]
                        ]]).transform('EPSG:4326', 'EPSG:3857')
                });

                const initialGridLayer = new VectorLayer({
                        source: new VectorSource({
                                features: [rectFeature]
                        }),
                        updateWhileAnimating: true,
                        updateWhileInteracting: true,
                        zIndex: 2
                })

                const initialPositionGranulesLayer = new VectorLayer({
                    source: new VectorSource({
                        features: []
                    }),
                    updateWhileAnimating: true,
                    updateWhileInteracting: true,
                    zIndex: 1
                })

                const initialVicinityGranulesLayer = new VectorLayer({
                    source: new VectorSource({
                        features: []
                    }),
                    updateWhileAnimating: true,
                    updateWhileInteracting: true,
                    zIndex: 1
                })

                const initialVicinityShapeLayer = new VectorLayer({
                    source: new VectorSource({
                        features: []
                    }),
                    updateWhileAnimating: true,
                    updateWhileInteracting: true,
                    zIndex: 3
                })


                var selected_polygon_style = new Style({
                        stroke: new Stroke({
                                width: 8 / map.getView().getResolution(),
                                color: "#ff0000"
                        })
                });

                rectFeature.setStyle(selected_polygon_style);
                layers.push(initialGridLayer);
                layers.push(initialPositionGranulesLayer);
                layers.push(initialVicinityGranulesLayer);
                layers.push(initialVicinityShapeLayer);

                setGridLayer(initialGridLayer);
                setPositionGranulesLayer(initialPositionGranulesLayer);
                setVicinityGranulesLayer(initialVicinityGranulesLayer);
                setVicinityShapeLayer(initialVicinityShapeLayer);

                return () => {layers.clear()}
        }, [planeData]);

    const granuleData = useSWRSubscription(
            'ws://'+algo_data.settings.location_server_ip+":"+algo_data.settings.location_server_port+"/observe",
            (key, { next }) => {
                const socket = new WebSocket(key)
                socket.addEventListener('message', (event) => next(
                    null,
                    prev => {
                            var event_json = JSON.parse(event.data);
                            let result = structuredClone(prev);
                            if (event_json["planeData"] !== undefined) {
                                    setPlaneData({
                                            "lon_min": event_json["planeData"]["lonMin"],
                                            "lon_max": event_json["planeData"]["lonMax"],
                                            "lat_min": event_json["planeData"]["latMin"],
                                            "lat_max": event_json["planeData"]["latMax"]
                                    })
                                    return result;
                            }

                            if (result === undefined){
                                result = {};
                            }

                            if (event_json["type"] == "MsgLSObserverIncUpd") {
                                const alias = event_json["alias"][0]

                                let remaining_vicinity_granules = [];

                                if (result[alias] !== undefined) {
                                    remaining_vicinity_granules = result[alias].now.vicinity_granules.slice(0, event_json["level"]+1);
                                }

                                if (event_json["level"] == remaining_vicinity_granules.length) {
                                    remaining_vicinity_granules.push(event_json["vicinityInsert"]["granules"]);
                                } else {
                                    const level_vicinity_granules = remaining_vicinity_granules[event_json["level"]];
                                    const remaining_granules = level_vicinity_granules.filter((el) => !(event_json["vicinityDelete"]["granules"].includes(el)));
                                    remaining_vicinity_granules[event_json["level"]] = [...remaining_granules, ...event_json["vicinityInsert"]["granules"]];
                                }

                                if (result[alias] === undefined) {
                                    result[alias] = {
                                        now: {
                                            level: event_json["level"],
                                            position_granule: event_json["newLocation"]["granule"],
                                            vicinity_granules: remaining_vicinity_granules,
                                            vicinity_radius: event_json["vicinityShape"]["radius"]
                                        },
                                        prev: {}
                                    }

                                } else {
                                    result[alias] = {
                                        now: {
                                            level: event_json["level"],
                                            position_granule: event_json["newLocation"]["granule"],
                                            vicinity_granules: remaining_vicinity_granules,
                                            vicinity_radius: event_json["vicinityShape"]["radius"]
                                        },
                                        prev: result[alias].now
                                    }
                                }
                                return result;
                            }

                            return result;
                    })
                )
                return () => socket.close()
        })

    useEffect(() => {
        if (granuleData.data !== undefined) {
            const keys = Object.keys(granuleData.data);
            const currentMaxLevel = maxGridLevel;
            let maxLevel = 0;

            for (let i = 0; i < keys.length; i++) {
                const alias = keys[i];
                if (granuleData.data[alias].now.level > maxLevel) {
                    maxLevel = granuleData.data[alias].now.level;
                }
            }

            if (maxLevel > currentMaxLevel) {
                setMaxGridLevel(maxLevel+1);

                for (let i = currentMaxLevel + 1; i <= maxLevel+1; i++) {
                    var polygon_style = new Style({
                        stroke: new Stroke({
                            width: (Math.max(2, 8 / i)) / map.getView().getResolution(),
                            lineDash: [Math.max(8, 32 / i)],
                            color: "#000000"
                        })
                    });
                    for( let j = 0; j < 2 ** i - 1; j = j+2) {
                        const north_south_lon = planeData.lon_min + (j+1) * ((planeData.lon_max - planeData.lon_min) / (2 ** i));
                        const east_west_lat = planeData.lat_min + (j+1) * ((planeData.lat_max - planeData.lat_min) / (2 ** i));

                        const north_south = new Feature({
                            geometry: new Polygon([[
                                [north_south_lon, planeData.lat_max],
                                [north_south_lon, planeData.lat_min]
                            ]]).transform('EPSG:4326', 'EPSG:3857')
                        });

                        const east_west = new Feature({
                            geometry: new Polygon([[
                                [planeData.lon_min, east_west_lat],
                                [planeData.lon_max, east_west_lat]
                            ]]).transform('EPSG:4326', 'EPSG:3857')
                        });

                        north_south.setStyle(polygon_style);
                        east_west.setStyle(polygon_style);

                        gridLayer?.getSource()?.addFeatures([north_south, east_west]);
                    }

                }
            }

        }
    }, [granuleData.data]);

    useEffect(() => {
        // console.log(vicinityShapeLayer?.getSource()?.getFeatures())
        for (let i = 0; i < position_data.length; i++) {
            const data = position_data[i];
            const id = "CARLA-id-" + data.id;

            if (granuleData.data !== undefined && granuleData.data[id] !== undefined) {
                const feature = vicinityShapeLayer?.getSource()?.getFeatureById(id);

                // console.log(Number(granuleData.data[id].vicinity_radius) * Number(data["greatCircleDistanceFactor"]));
                // console.log(Number(granuleData.data[id].now.vicinity_radius) * data["greatCircleDistanceFactor"])

                const polygon_style = new Style({
                    stroke : new Stroke({
                        color: "#000000"
                    })
                });


                const polygon = circular([data["location"]["y"], data["location"]["x"]], Number(granuleData.data[id].now.vicinity_radius) * data["greatCircleDistanceFactor"]).transform('EPSG:4326', 'EPSG:3857')
                const circle = new Circle([data["location"]["y"], data["location"]["x"]], Number(granuleData.data[id].now.vicinity_radius) * data["greatCircleDistanceFactor"]).transform('EPSG:4326', 'EPSG:3857')

                if (feature) {
                    // console.log(circle)
                    feature.setGeometry(polygon);
                } else {
                    var new_feature = new Feature({
                        name: id,
                        geometry: polygon
                    });
                    new_feature.setId(id);
                    new_feature.setStyle(polygon_style);
                    vicinityShapeLayer?.getSource()?.addFeature(new_feature);
                }
            }
        }
    }, [position_data]);

    useEffect(() => {

        if (algo_data.data.position_granules === undefined || granuleData.data === undefined) {
            return;
        }
        const alpha = "33";

        const agents = Object.keys(algo_data.data.position_granules);
        // console.log("GRANULE_DATA", granuleData.data);

        for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];

            if (granuleData.data[agent] === undefined) {
                continue;
            }

            if (algo_data.data.position_granules[agent] === undefined) {
                const existing_features = positionGranulesLayer?.getSource()?.getFeatures();

                if (existing_features !== undefined) {
                    for (let j = 0; j < existing_features.length; j++) {
                        const position_feature = existing_features[j];
                        const agent_id = position_feature.getId().toString().split(':')[0];
                        if(agent_id == agent) {
                            positionGranulesLayer?.getSource()?.removeFeature(position_feature);
                        }
                    }
                }
            }

            if (algo_data.data.position_granules[agent] !== undefined) {
                var polygon_style = new Style({
                    fill: new Fill({
                        color: asArray(algo_data.data.position_granules[agent].color + alpha)
                    })
                });

                const granule_id = granuleData.data[agent].now.position_granule;
                const level = granuleData.data[agent].now.level;

                const existing_features = positionGranulesLayer?.getSource()?.getFeatures();
                let is_granule_drawn = false;

                if (existing_features !== undefined) {
                    for (let j = 0; j < existing_features.length; j++) {
                        const position_feature = existing_features[j];
                        const agent_id = position_feature.getId().toString().split(':')[0];
                        const feature_granule_id = Number(position_feature.getId().toString().split(':')[1]);

                        if(agent_id == agent && feature_granule_id != granule_id) {
                            positionGranulesLayer?.getSource()?.removeFeature(position_feature);
                        } else if (agent_id == agent) {
                            is_granule_drawn = true;
                        }
                    }
                }

                if (!is_granule_drawn) {
                    const features = get_granule_features(planeData, [granule_id], level, agent, polygon_style);
                    positionGranulesLayer?.getSource()?.addFeatures(features);
                }
            }
        }
    }, [granuleData.data, algo_data.data.position_granules]);

    useEffect(() => {
        if (algo_data.data.vicinity_granules === undefined || granuleData.data === undefined) {
            return;
        }
        const alpha = "33";

        const agents = Object.keys(algo_data.data.vicinity_granules);

        for (let i = 0; i < agents.length; i++) {

            const agent = agents[i];

            if (granuleData.data[agent] === undefined) {
                continue;
            }

            if(algo_data.data.vicinity_granules[agent] === undefined) {
                const existing_features = vicinityGranulesLayer?.getSource()?.getFeatures();

                if (existing_features !== undefined) {
                    for (let j = 0; j < existing_features.length; j++) {
                        const vicinity_feature = existing_features[j];
                        const agent_id = vicinity_feature.getId().toString().split(':')[0];
                        if(agent_id == agent) {
                            vicinityGranulesLayer?.getSource()?.removeFeature(vicinity_feature);
                        }
                    }
                }
            }

            if(algo_data.data.vicinity_granules[agent] !== undefined) {

                var polygon_style = new Style({
                    stroke: new Stroke({
                        color: [255, 255, 0, 0.0],
                        width: 50
                    }),
                    fill: new Fill({
                        color: asArray(algo_data.data.vicinity_granules[agent].color + alpha)
                    })
                });

                const vicinity_data = granuleData.data[agent].now.vicinity_granules;
                const level_vicinity_granules = vicinity_data[vicinity_data.length - 1];

                const existing_features = vicinityGranulesLayer?.getSource()?.getFeatures();
                const remaining_rendered_granules = [];

                if (existing_features !== undefined) {
                    for (let j = 0; j < existing_features.length; j++) {
                        const vicinity_feature = existing_features[j];
                        const agent_id = vicinity_feature.getId().toString().split(':')[0];
                        const granule_id = Number(vicinity_feature.getId().toString().split(':')[1]);
                        if(agent_id == agent && !(level_vicinity_granules.includes(granule_id))) {
                            vicinityGranulesLayer?.getSource()?.removeFeature(vicinity_feature);
                        } else if (agent_id == agent) {
                            remaining_rendered_granules.push(granule_id);
                        }
                    }
                }

                let new_rendered_granules: any = [];

                for (let j = 0; j < level_vicinity_granules.length; j++) {
                    const vicinity_granule = level_vicinity_granules[j];

                    if (!(remaining_rendered_granules.includes(vicinity_granule))) {
                        new_rendered_granules.push(vicinity_granule)
                    }
                }

                if (new_rendered_granules.length > 0) {
                    const features = get_granule_features(planeData, new_rendered_granules, vicinity_data.length - 1, agent, polygon_style, 0.9);
                    vicinityGranulesLayer?.getSource()?.addFeatures(features);
                }
            }
        }
    }, [granuleData.data, algo_data.data.vicinity_granules]);
        return (
          <div/>
        );
}

function get_granule_features(plane_data, granule_ids, level, id, style, scale=1.0) {
    let features = [];
    for (let i = 0; i < granule_ids.length; i++) {
        const granule_id = granule_ids[i];

        const num_granules_lower_levels = (4 / 3) * ((4 ** level) - 1);
        const map_width = plane_data.lon_max - plane_data.lon_min;
        const map_height = plane_data.lat_max - plane_data.lat_min;
        const level_granule_width = map_width / (2 ** (level + 1));
        const level_granule_height = map_height / (2 ** (level + 1));
        const granule_column_index = (granule_id - num_granules_lower_levels) % (2 ** (level + 1));
        const granule_row_index = Math.floor((granule_id - num_granules_lower_levels) / (2 ** (level + 1)));
        const granule_lon_min = plane_data.lon_min + (level_granule_width * granule_column_index);
        const granule_lat_min = plane_data.lat_max - (level_granule_height * (granule_row_index + 1));

        const polygon = new Polygon([[
            [granule_lon_min, granule_lat_min],
            [granule_lon_min + level_granule_width, granule_lat_min],
            [granule_lon_min + level_granule_width, granule_lat_min + level_granule_height],
            [granule_lon_min, granule_lat_min + level_granule_height],
            [granule_lon_min, granule_lat_min]
        ]]).transform('EPSG:4326', 'EPSG:3857')

        polygon.scale(scale, scale)

        const granuleFeature = new Feature({
            geometry: polygon
        });
        granuleFeature.setId(id + ":" + granule_id);
        granuleFeature.setStyle(style);
        features.push(granuleFeature);
    }
    return features;
}

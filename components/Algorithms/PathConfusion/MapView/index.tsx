import {Layer} from "ol/layer";
import Map from 'ol/Map.js';
import {useContext, useEffect, useMemo} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Circle, Fill, Icon, RegularShape, Stroke, Style} from "ol/style";
import {Feature} from "ol";
import {LineString, Point} from "ol/geom";
import _ from "lodash";
import {
    PathConfusionAlgorithmData,
    ReleaseEntry
} from "@/components/Algorithms/PathConfusion/types";

type PathConfusionMapViewProps = {
    /** Handler that is called whenever a layer should be added to the map */
    onAddLayer: (layer: Layer) => void,
    /** Handler that is called whenever a layer should be removed from the map */
    onRemoveLayer: (layer: Layer) => void,
    /** Map object used to attach event listeners */
    map: Map | undefined
}

export default function ({onAddLayer, onRemoveLayer, map}: PathConfusionMapViewProps) {
    const { pathConfusionData, setPathConfusionData } = useContext(AlgorithmDataContext);

    /** Set of differentiated colors used to draw release entries and agent paths */
    const distinctColors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4',
        '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000',
        '#ffd8b1', '#1e90ff', '#a9a9a9']

    /** Style describing the path of an agent */
    const segmentStyle = useMemo(() => function (feature: Feature, color: string) {
        let geometry = feature.getGeometry()!;

        let styles = [
            new Style({
                stroke: new Stroke({
                    color: color + "CC",
                    width: 2,
                }),
            }),
        ];

        // Return the style used to draw arrows at the midpoint for each segment
        geometry.forEachSegment(function(start, end) {
            const midpoint = [start[0] + (end[0] - start[0]) / 2,
                              start[1] + (end[1] - start[1]) / 2]
            const dx = end[0] - start[0];
            const dy = end[1] - start[1];
            const rotation = Math.atan2(dy, dx);
            // Draw arrow in the direction the agent drove
            styles.push(new Style({
                geometry: new Point(midpoint),
                image: new Icon({
                    src: 'arrow_black.png',
                    anchor: [0.5, 0.5],
                    scale: 0.45,
                    opacity: 0.7,
                    rotateWithView: true,
                    rotation: -rotation
                })
            }));
        });

        return styles;
    }, [])

    /** Style describing a release entry */
    const releaseEntryStyle = useMemo(() => function (
        color: string,
        isReleaseEntrySignificant: boolean,
        isReleaseEntrySelected: boolean,
        isReleaseEntryPublished: boolean,
    ): Style {
        const fillColor = color + "FF"
        const strokeColor = "#000000FF";
        const width = isReleaseEntrySignificant ? 1 : 0.5;
        const size = isReleaseEntrySelected ? (isReleaseEntrySignificant ? 4 : 2.5) : 3;
        const triangleSizeFactor = 1.3;

        if(isReleaseEntryPublished) {
            return new Style({
                image: new Circle({
                    fill: new Fill({color: fillColor}),
                    stroke: new Stroke({color: strokeColor, width: width}),
                    radius: size
                }),
            })
        } else {
            return new Style({
                image: new RegularShape({
                    fill: new Fill({color: fillColor}),
                    stroke: new Stroke({color: strokeColor, width: width}),
                    points: 3,
                    radius: size * triangleSizeFactor,
                    rotation: 0,
                    angle: 0,
                })
            })
        }
    }, []);

    /** Style used when showing the predicted position */
    const predictionStyle = useMemo(() => {
        return new Style({
            image: new Circle({
                fill: new Fill({color: [0,57,211,0.8]}),
                stroke: new Stroke({color: [255,0,0,1], width: 2}),
                radius: 4
            }),
        })
    }, []);

    /** Style used to show the k nearest points (red circle around release entries) */
    const kNearestStyle = useMemo(() => {
        return new Style({
            image: new Circle({
                fill: new Fill({color: [0,0,180,0]}),
                stroke: new Stroke({color: [255,0,0,0.7], width: 2}),
                radius: 7
            }),
        })
    }, []);

    /** Layer that visualizes release entries on the map */
    const releaseEntriesLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 20
        }), []);

    /** Layer that visualizes line segments */
    const lineSegmentsLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 10
        }), []);

    /** Layer that visualizes detailed information of a release entry */
    const predictionLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 50,
            style() {
                return [predictionStyle]
            }
        }), []);

    /** Layer that visualizes detailed information of a release entry */
    const kNearestLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 40,
            style() {
                return [kNearestStyle]
            }
        }), []);

    // Make sure layer is present on map while this component lives
    useEffect(() => {
        // Add layers
        onAddLayer(releaseEntriesLayer);
        onAddLayer(predictionLayer);
        onAddLayer(kNearestLayer);
        onAddLayer(lineSegmentsLayer);

        // On destruction, remove layers
        return () => {
            onRemoveLayer(releaseEntriesLayer);
            onRemoveLayer(predictionLayer);
            onRemoveLayer(kNearestLayer);
            onRemoveLayer(lineSegmentsLayer);
        }
    }, [onAddLayer, onRemoveLayer]);

    /** Returns the release entry layer source */
    const getReleaseEntriesSource = useMemo(() => function (
        releaseEntries: ReleaseEntry[]
    ) {
        return new VectorSource({
            features: releaseEntries
                .map((entry => {
                    const entry_loc = entry.vehicleEntry.currentGpsSample.location;
                    const pointFeature = new Feature({
                        name: 'releaseEntryPoint',
                        geometry: new Point([entry_loc.latitude, entry_loc.longitude])
                            .transform('EPSG:4326', 'EPSG:3857')
                    });
                    // Save the release entry as a property such that we can use it to display the predicted position
                    // and k nearest points when needed
                    pointFeature.set("releaseEntry", entry, true)
                    const v_id = Number(entry.vehicleEntry.id.split("-")[1])
                    // Determine whether the entry was released at the same interval as the currently selected entry
                    let isReleaseEntrySignificant = true;
                    // Determines whether a release entry on the map is currently selected
                    const isReleaseEntrySelected = !!pathConfusionData.selected_entry;

                    if (pathConfusionData.selected_entry && entry.createdAtTime !== pathConfusionData.selected_entry.createdAtTime) {
                        isReleaseEntrySignificant = false;
                    }
                    pointFeature.setStyle(releaseEntryStyle(
                        distinctColors[v_id % distinctColors.length],
                        isReleaseEntrySignificant,
                        isReleaseEntrySelected,
                        entry.isInReleaseSet)
                    )
                    return pointFeature
                }))
        });
    }, [pathConfusionData.selected_entry]);

    /** Returns the k nearest layer source */
    const getDependenciesNeighborsSource = useMemo(() => function (
        releaseEntry: ReleaseEntry,
        pathConfusionData: PathConfusionAlgorithmData["data"]
    ) {

        const vehicleIds = pathConfusionData.isDisplayDependenciesSelected
            ? releaseEntry.vehicleEntry.dependencies : releaseEntry.vehicleEntry.neighbors;

        // For a given agent ID find its corresponding release that matches the interval of the provided release entry
        const getReleaseEntry = (id: string): ReleaseEntry | undefined =>
            pathConfusionData.releaseEntries.find((e) => e.vehicleEntry.id === id && e.createdAtTime === releaseEntry.createdAtTime);

        // Source containing the k nearest dependencies/neighbors
        return new VectorSource({
            features: vehicleIds
                .filter((id: string) => getReleaseEntry(id))
                .map((id: string) => {
                    const entry = getReleaseEntry(id)!.vehicleEntry;
                    return new Feature({
                        name: 'detailedEntryPoint',
                        geometry: new Point([
                            entry.currentGpsSample.location.latitude,
                            entry.currentGpsSample.location.longitude
                        ]).transform('EPSG:4326', 'EPSG:3857')
                    })
            })
        });
    }, [pathConfusionData.isDisplayDependenciesSelected]);

    /** Returns source containing the predicted position displayed when selecting a release entry on the map */
    const getPredictedLocationSource = useMemo(() => function (
        releaseEntry: ReleaseEntry
    ) {
         return new VectorSource({
            features: [new Feature({
                name: 'predictedPoint',
                geometry: new Point([
                    releaseEntry.vehicleEntry.predictedLoc.latitude,
                    releaseEntry.vehicleEntry.predictedLoc.longitude
                ]).transform('EPSG:4326', 'EPSG:3857'),
            })]
        });
    }, [pathConfusionData.isDisplayDependenciesSelected]);

    /** Source used to display vehicle trajectories */
    const getSegmentsSource = useMemo(() => function (
        releaseEntries: ReleaseEntry[]
    ) {
        // Get a list of agent ids available in the release entries list
        const agentIds = _.uniq(releaseEntries.map((entry) => entry.vehicleEntry.id));
        const segmentFeatures = agentIds.map((id) => {
            // Get all release entries from a particular agent
            const relevantEntries = releaseEntries.filter((entry) => entry.vehicleEntry.id === id);
            // Get the integer ID part (CARLA-xx)
            const v_id = Number(id.split("-")[1]);
            const routePoints = relevantEntries.map((entry) =>
                [entry.vehicleEntry.currentGpsSample.location.latitude,
                entry.vehicleEntry.currentGpsSample.location.longitude])

            const route = new LineString(routePoints).transform('EPSG:4326', 'EPSG:3857');
            // Feature containing the route
            const f = new Feature({name: 'lineSegment', geometry: route});
            f.setStyle(segmentStyle(f, distinctColors[v_id % distinctColors.length]));
            return f;
        })

        return new VectorSource({features: segmentFeatures});
    }, [])

    /** Draw k nearest dependencies/neighbours whenever an entry on the map is selected */
    useEffect(() => {
        if (pathConfusionData.selected_entry) {
            kNearestLayer.setSource(getDependenciesNeighborsSource(pathConfusionData.selected_entry, pathConfusionData))
        }
    }, [pathConfusionData.isDisplayDependenciesSelected, pathConfusionData.selected_entry]);

    /** Draw the release entries on the map, triggered whenever new release data comes in or a release entry is selected */
    useEffect(() => {
        releaseEntriesLayer.setSource(getReleaseEntriesSource(pathConfusionData?.releaseEntries || []));
    }, [pathConfusionData?.releaseEntries, pathConfusionData?.selected_entry]);

    /** Draw the vehicle routes for better visualization */
    useEffect(() => {
        lineSegmentsLayer.setSource(getSegmentsSource(pathConfusionData?.releaseEntries || []));
    }, [pathConfusionData?.releaseEntries]);

    /** Draw the predicted position if a release entry is selected */
    useEffect(() => {
        if (pathConfusionData.selected_entry && pathConfusionData.selected_entry.vehicleEntry.predictedLoc) {
            predictionLayer.setSource(getPredictedLocationSource(pathConfusionData.selected_entry));
        }
    }, [pathConfusionData.selected_entry?.vehicleEntry]);

    /** Map listener for selecting release entries */
    useEffect(() => {
        if (map) {
            map.on('singleclick', function (e) {
                const featureClick = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                    return feature
                });

                if(featureClick && featureClick.get('name') === 'releaseEntryPoint') {
                    const release_entry: ReleaseEntry = featureClick.getProperties()["releaseEntry"];
                    setPathConfusionData({...pathConfusionData, selected_entry: release_entry});
                } else {
                    setPathConfusionData({...pathConfusionData, selected_entry: null})

                    predictionLayer.setSource(null);
                    kNearestLayer.setSource(null);
                    releaseEntriesLayer.setSource(getReleaseEntriesSource(pathConfusionData?.releaseEntries || []));
                }
            })
        }
    }, [map, pathConfusionData]);

    return (
        <></>
    )
}

import {Layer} from "ol/layer";
import Map from 'ol/Map.js';
import {useContext, useEffect, useMemo} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Circle, Fill, RegularShape, Stroke, Style} from "ol/style";
import {Feature} from "ol";
import {Point} from "ol/geom";
import {
    IntervalVehicleEntry,
    PathConfusionAlgorithmData,
    ReleaseEntry
} from "@/components/Algorithms/PathConfusion/types";

type PathConfusionMapViewProps = {
    /** Handler that is called whenever a layer should be added to the map */
    onAddLayer: (layer: Layer) => void,
    /** Handler that is called whenever a layer should be removed from the map */
    onRemoveLayer: (layer: Layer) => void,
    map: Map | undefined
}

export default function ({onAddLayer, onRemoveLayer, map}: PathConfusionMapViewProps) {
    const { mapAgentsData, pathConfusionData , setPathConfusionData} = useContext(AlgorithmDataContext);

    const distinctColors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4',
        '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000',
        '#ffd8b1', '#1e90ff', '#a9a9a9']

    // Base point style
    const releaseEntryStyle = useMemo(() => function (
        color: string,
        isReleaseEntrySignificant: boolean,
        isReleaseEntrySelected: boolean,
        isReleaseEntryPublished: boolean,
    ): Style {
        const fillColor = isReleaseEntrySignificant ? color + "FF" : "#000000FF";
        const strokeColor = isReleaseEntrySignificant ? "#000000FF" : color + "CC";
        const width = isReleaseEntrySignificant ? 1 : 3;
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

    const someStyle = useMemo(() => {
        return new Style({
            image: new Circle({
                fill: new Fill({color: [0,57,211,0.8]}),
                stroke: new Stroke({color: [255,0,0,1], width: 2}),
                radius: 4
            }),
        })
    }, []);

    const someStyle2 = useMemo(() => {
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
            zIndex: 1
        }), []);

    /** Layer that visualizes detailed information of a release entry */
    const predictionLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 4,
            style() {
                return [someStyle]
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
            zIndex: 3,
            style() {
                return [someStyle2]
            }
        }), []);

    // Make sure layer is present on map while this component lives
    useEffect(() => {
        // Add layers
        onAddLayer(releaseEntriesLayer);
        onAddLayer(predictionLayer);
        onAddLayer(kNearestLayer);

        // On destruction, remove layers
        return () => {
            onRemoveLayer(releaseEntriesLayer);
            onRemoveLayer(predictionLayer);
            onRemoveLayer(kNearestLayer);
        }
    }, [onAddLayer, onRemoveLayer]);

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
                    pointFeature.set("releaseEntry", entry, true)
                    const v_id = Number(entry.vehicleEntry.id.split("-")[1])
                    let isReleaseEntrySignificant = true;
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

    const getDependenciesNeighborsSource = useMemo(() => function (
        releaseEntry: ReleaseEntry,
        pathConfusionData: PathConfusionAlgorithmData["data"]
    ) {

        const vehicleIds = pathConfusionData.isDisplayDependenciesSelected
            ? releaseEntry.vehicleEntry.dependencies : releaseEntry.vehicleEntry.neighbors;

        const getReleaseEntry = (id: string): ReleaseEntry | undefined =>
            pathConfusionData.releaseEntries.find((e) => e.vehicleEntry.id === id && e.createdAtTime === releaseEntry.createdAtTime);

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

    useEffect(() => {
        if (pathConfusionData.selected_entry) {
            kNearestLayer.setSource(getDependenciesNeighborsSource(pathConfusionData.selected_entry, pathConfusionData))
        }
    }, [pathConfusionData.isDisplayDependenciesSelected, pathConfusionData.selected_entry]);

    useEffect(() => {
        releaseEntriesLayer.setSource(getReleaseEntriesSource(pathConfusionData?.releaseEntries || []));
    }, [pathConfusionData?.releaseEntries, pathConfusionData?.selected_entry]);

    useEffect(() => {
        if (pathConfusionData.selected_entry && pathConfusionData.selected_entry.vehicleEntry.predictedLoc) {
            predictionLayer.setSource(getPredictedLocationSource(pathConfusionData.selected_entry));
        }
    }, [pathConfusionData.selected_entry?.vehicleEntry]);

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
        <>

        </>
    )
}

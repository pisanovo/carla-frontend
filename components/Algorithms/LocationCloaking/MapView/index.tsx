import {Layer} from "ol/layer";
import {useContext, useEffect, useMemo, useState} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Feature} from "ol";
import {Circle, Polygon} from "ol/geom";
import {Fill, Stroke, Style} from "ol/style";
import {AgentsData} from "@/components/MapView/MapView";
import {asArray} from "ol/color";

type LocationCloakingMapViewProps = {
    /** Agents position data needed to draw the exact vicinity circle
     * Note: The exact vicinity circle is not part of the algorithm output,
     * instead it is used to better understand how the algorithm works */
    agentsData: AgentsData
    /** Handler that is called whenever a layer should be added to the map */
    onAddLayer: (layer: Layer) => void,
    /** Handler that is called whenever a layer should be removed from the map */
    onRemoveLayer: (layer: Layer) => void,
}

/** TODO: Remove map prop dependencies */
export function MapView({agentsData, onAddLayer, onRemoveLayer}: LocationCloakingMapViewProps) {
    const { locationCloakingData } = useContext(AlgorithmDataContext);

    /** The factor changing widths of grid lines | Formerly: ol.map.getView().getResolution()*/
    const GRID_RESOLUTION_FACTOR = 2;
    /** Determines the transparency of a granule tile as HEX */
    const GRANULE_ALPHA = "33";

    /** Style describing the bounding box of the granules grid */
    const gridBoundingBoxStyle = useMemo(() =>
        new Style({
            stroke: new Stroke({
                width: 8 / GRID_RESOLUTION_FACTOR,
                color: "#ff0000"
            })
        }), []);

    /** Style function describing the grid line at a grid level */
    const lineStyle = useMemo(() => function (level: number) {
        // Use thinner lines at higher levels for better visual clarity
        return new Style({
            stroke: new Stroke({
                width: (Math.max(2, 8 / level)) / GRID_RESOLUTION_FACTOR,
                lineDash: [Math.max(8, 32 / level)],
                color: "#000000"
            })
        });
    }, []);

    /** Style describing the vicinity circle */
    const vicinityCircleStyle = useMemo(() =>
        new Style({
            stroke: new Stroke({
                color: "#000000"
            })
        }), []);

    const granuleStyle = useMemo(() => function (agentId: string, mode: "position" | "vicinity") {
        const color = mode === "position"
            ? locationCloakingData.tileColors[agentId].positionGranule.color
            : locationCloakingData.tileColors[agentId].vicinityGranules.color;
        return new Style({
            fill: new Fill({
                color: asArray(color + GRANULE_ALPHA)
            })
        });
    }, [locationCloakingData.tileColors]);

    /** Feature describing the bounding box of the granules grid */
    const gridBoundingBoxFeature = useMemo(() =>
        new Feature({
            geometry: new Polygon([[
                [locationCloakingData.gridPlane.longitude.min, locationCloakingData.gridPlane.latitude.min],
                [locationCloakingData.gridPlane.longitude.min, locationCloakingData.gridPlane.latitude.max],
                [locationCloakingData.gridPlane.longitude.max, locationCloakingData.gridPlane.latitude.max],
                [locationCloakingData.gridPlane.longitude.max, locationCloakingData.gridPlane.latitude.min],
                [locationCloakingData.gridPlane.longitude.min, locationCloakingData.gridPlane.latitude.min]
            ]]).transform('EPSG:4326', 'EPSG:3857')
        }), [locationCloakingData.gridPlane]);

    /** Layer that visualizes the grid, initially contains the red area grid bounding box  */
    const gridLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: [gridBoundingBoxFeature]
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 2
        }), [gridBoundingBoxFeature]);

    /** Layer that visualizes agent position granules */
    const positionGranulesLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 1
        }), []);

    /** Layer that visualizes agent vicinity granules */
    const vicinityGranulesLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 1
        }), []);

    /** Layer that visualizes agent vicinity shapes (currently only circular) */
    const vicinityShapeLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 3
        }), []);

    const getFeatureAgentId = useMemo(() => function (f: Feature): string {
        return f.getId()!.toString().split(':')[0];
    }, []);

    const getFeatureGranuleId = useMemo(() => function (f: Feature): number {
        return Number(f.getId()!.toString().split(':')[1]);
    }, []);

    const granuleIdToGrid = useMemo(() => function (id: number) {
        const level = Math.log(((3 * id) / 4) + 1) / Math.log(4);
        const numGranulesLowerLevel = (4 / 3) * ((4 ** level) - 1);
        const granuleRowIndex = Math.floor((id - numGranulesLowerLevel) / (2 ** (level + 1)));
        const granuleColumnIndex = (id - numGranulesLowerLevel) % (2 ** (level + 1));
        return [level, granuleRowIndex, granuleColumnIndex];
    }, []);

    const granuleIdsToFeatures = useMemo(() => function (
        gaId: string,
        gIds: number[],
        style: Style,
        scale: number = 1.0): Feature[] {

        const gridPlane = locationCloakingData.gridPlane;
        const mapWidth = gridPlane.longitude.max - gridPlane.longitude.min;
        const mapHeight = gridPlane.latitude.max - gridPlane.latitude.min;

        return gIds.reduce((acc, granuleId) => {
            const [level, row, col] = granuleIdToGrid(granuleId);
            const levelGranuleWidth = mapWidth / (2 ** (level + 1));
            const levelGranuleHeight = mapHeight / (2 ** (level + 1));
            const granuleLonMin = gridPlane.longitude.min + (levelGranuleWidth * col);
            const granuleLatMin = gridPlane.latitude.max - (levelGranuleHeight * (row + 1));

            const granulePolygon = new Polygon([[
                [granuleLonMin, granuleLatMin],
                [granuleLonMin + levelGranuleWidth, granuleLatMin],
                [granuleLonMin + levelGranuleWidth, granuleLatMin + levelGranuleHeight],
                [granuleLonMin, granuleLatMin + levelGranuleHeight],
                [granuleLonMin, granuleLatMin]
            ]]).transform('EPSG:4326', 'EPSG:3857');

            granulePolygon.scale(scale, scale);

            const granuleFeature = new Feature({
                geometry: granulePolygon
            });
            granuleFeature.setId(gaId + ":" + granuleId);
            granuleFeature.setStyle(style);

            return [...acc, granuleFeature];
        }, [] as Feature[]);

    }, [locationCloakingData.gridPlane]);

    // Make sure layer is present on map while this component lives
    useEffect(() => {
        // Set the style of the grid bounding box
        gridBoundingBoxFeature.setStyle(gridBoundingBoxStyle);

        // Add layers
        onAddLayer(gridLayer);
        onAddLayer(positionGranulesLayer);
        onAddLayer(vicinityGranulesLayer);
        onAddLayer(vicinityShapeLayer);

        // On destruction, remove layers
        return () => {
            onRemoveLayer(gridLayer);
            onRemoveLayer(positionGranulesLayer);
            onRemoveLayer(vicinityGranulesLayer);
            onRemoveLayer(vicinityShapeLayer);
        }
    }, [onAddLayer, onRemoveLayer]);

    // Draw new grid lines when the maximum level received from an agent increases
    useEffect(() => {
        const gp = locationCloakingData.gridPlane;
        // Get the current max level received from the location server
        const actualMaxLevel = Object.values(locationCloakingData.gridAgentData)
            .reduce((max_lvl, ga) => {
                return ga.level > max_lvl ? ga.level : max_lvl;
            }, 0);

        const numDrawnLines = gridLayer.getSource()?.getFeatures().length;

        if (numDrawnLines === undefined) return;

        // Levels 0...drawnMaxLevel are displayed on the map
        const drawnMaxLevel = Math.log2(numDrawnLines + 1) - 2;

        // TODO: Check if Number.isInteger can be removed
        // Check if we need to draw any new grid levels
        if (actualMaxLevel > drawnMaxLevel && Number.isInteger(drawnMaxLevel)) {
            // Draw grid lines north-to-south and west-to-east at levels drawn_max_level...actual_max_level
            for (let level = drawnMaxLevel + 1; level <= actualMaxLevel; level++) {
                // Draw grid lines at level
                for (let j = 0; j < 2 ** level; j = j+2) {
                    const northSouthLon = gp.longitude.min + (j+1) * ((gp.longitude.max - gp.longitude.min) / (2 ** (level+1)));
                    const eastWestLat = gp.latitude.min + (j+1) * ((gp.latitude.max - gp.latitude.min) / (2 ** (level + 1)));

                    const northSouth = new Feature({
                        geometry: new Polygon([[
                            [northSouthLon, gp.latitude.max],
                            [northSouthLon, gp.latitude.min]
                        ]]).transform('EPSG:4326', 'EPSG:3857')
                    });

                    const eastWest = new Feature({
                        geometry: new Polygon([[
                            [gp.longitude.min, eastWestLat],
                            [gp.longitude.max, eastWestLat]
                        ]]).transform('EPSG:4326', 'EPSG:3857')
                    });

                    // Set the line style
                    northSouth.setStyle(lineStyle(level));
                    eastWest.setStyle(lineStyle(level));

                    // Add new grid lines to the grid layer for display
                    gridLayer.getSource()?.addFeatures([northSouth, eastWest]);
                }
            }
        }
    }, [locationCloakingData.gridAgentData]);

    // Draw the exact vicinity circle at agent positions to better understand the algorithm
    useEffect(() => {
        agentsData.agents.forEach((ag) => {
            let vicinityFeature = vicinityShapeLayer.getSource()?.getFeatureById(ag.id);

            const vicinityCircle = new Circle(
                [ag.location.y, ag.location.x],
                locationCloakingData.gridAgentData[ag.id].vicinity_radius * ag.greatCircleDistanceFactor
            ).transform('EPSG:4326', 'EPSG:3857')

            // If agent vicinity circle already drawn on map, just update
            if (vicinityFeature) {
                vicinityFeature.setGeometry(vicinityCircle);
            // Create new vicinity circle feature otherwise
            } else {
                vicinityFeature = new Feature({
                    name: ag.id,
                    geometry: vicinityCircle
                });
                vicinityFeature.setId(ag.id);
                vicinityFeature.setStyle(vicinityCircleStyle);
                vicinityShapeLayer.getSource()?.addFeature(vicinityFeature);
            }
        })
    }, [agentsData.agents]);

    // Remove position granules from the map that are not needed anymore
    useEffect(() => {
        const positionGranulesFeatures = positionGranulesLayer.getSource()?.getFeatures();

        if (!positionGranulesFeatures) return;

        // Remove position features based on the user not wanting to draw the features
        positionGranulesFeatures
            .filter((f) => f.getId())
            .filter((f) =>
                !locationCloakingData.tileColors[getFeatureAgentId(f)].positionGranule.color)
            .forEach((f) => positionGranulesLayer.getSource()?.removeFeature(f));

        // Remove position features when they become invalid due to the agent moving
        positionGranulesFeatures
            .filter((f) => f.getId())
            .filter((f) =>
                locationCloakingData.gridAgentData[getFeatureAgentId(f)].position_granule !== getFeatureGranuleId(f))
            .forEach((f) => positionGranulesLayer.getSource()?.removeFeature(f));

    }, [locationCloakingData.tileColors, locationCloakingData.gridAgentData]);

    // Remove vicinity granules from the map that are not needed anymore
    useEffect(() => {
        const vicinityGranulesFeatures = vicinityGranulesLayer.getSource()?.getFeatures();

        if (!vicinityGranulesFeatures) return;

        // Remove vicinity features based on the user not wanting to draw the features
        vicinityGranulesFeatures
            .filter((f) => f.getId())
            .filter((f) =>
                !locationCloakingData.tileColors[getFeatureAgentId(f)].vicinityGranules.color)
            .forEach((f) => vicinityGranulesLayer.getSource()?.removeFeature(f));

        // Remove vicinity features when they become invalid due to the agent moving
        vicinityGranulesFeatures
            .filter((f) => f.getId())
            .filter((f) => {
                const vicinity_stack = locationCloakingData.gridAgentData[getFeatureAgentId(f)].vicinity_granules;
                return !vicinity_stack[vicinity_stack.length - 1].includes(getFeatureGranuleId(f));
            })
            .forEach((f) => vicinityGranulesLayer.getSource()?.removeFeature(f));

    }, [locationCloakingData.tileColors, locationCloakingData.gridAgentData]);

    // Draw new position granules to the map
    useEffect(() => {
        const positionGranulesFeatures = positionGranulesLayer.getSource()?.getFeatures();

        if (!positionGranulesFeatures) return;

        Object.entries(locationCloakingData.gridAgentData).forEach(([id, ga]) => {
            const positionFeature = positionGranulesFeatures.find((f) => getFeatureAgentId(f) === id);

            const style = granuleStyle(id, "position");

            if (!positionFeature || getFeatureGranuleId(positionFeature) != ga.position_granule) {
                const features = granuleIdsToFeatures(id, [ga.position_granule], style);
                positionGranulesLayer.getSource()?.addFeatures(features);
            }
        });
    }, []);

    // Draw new vicinity granules to the map
    useEffect(() => {
        const vicinityGranulesFeatures = vicinityGranulesLayer.getSource()?.getFeatures();

        if (!vicinityGranulesFeatures) return;

        Object.entries(locationCloakingData.gridAgentData).forEach(([id, ga]) => {
            const vicinityStack = locationCloakingData.gridAgentData[id].vicinity_granules;
            const vicinityStackTop = vicinityStack[vicinityStack.length - 1];
            const drawnLevelGranuleIds = vicinityGranulesFeatures
                .filter((f) => f.getId())
                .filter((f) => getFeatureAgentId(f) === id)
                .filter((f) => vicinityStackTop.includes(getFeatureGranuleId(f)))
                .map((f) => getFeatureGranuleId(f))

            const notDrawnLevelGranuleIds = vicinityStackTop
                .filter((granuleId) => !drawnLevelGranuleIds.includes(granuleId))

            const style = granuleStyle(id, "vicinity");

            const features = granuleIdsToFeatures(id, notDrawnLevelGranuleIds, style, 0.9);
            vicinityGranulesLayer.getSource()?.addFeatures(features);
        })
    }, []);

    return(
      <></>
    );
}

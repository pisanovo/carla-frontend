import {Layer} from "ol/layer";
import {useContext, useEffect, useMemo} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Feature} from "ol";
import {Polygon} from "ol/geom";
import {Fill, Stroke, Style} from "ol/style";
import {asArray} from "ol/color";
import {circular} from "ol/geom/Polygon";

type LocationCloakingMapViewProps = {
    /** Handler that is called whenever a layer should be added to the map */
    onAddLayer: (layer: Layer) => void,
    /** Handler that is called whenever a layer should be removed from the map */
    onRemoveLayer: (layer: Layer) => void,
}

/** TODO: Remove map prop dependencies */
export function MapView({onAddLayer, onRemoveLayer}: LocationCloakingMapViewProps) {
    const { mapAgentsData, locationCloakingData } = useContext(AlgorithmDataContext);

    /** The factor changing widths of grid lines | Formerly: ol.map.getView().getResolution()*/
    const GRID_RESOLUTION_FACTOR = 4.5;
    /** Determines the transparency of a granule tile as HEX */
    const GRANULE_ALPHA = "4D";

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

    /** Returns the tile style depending on the user set color and tile granule type */
    const granuleStyle = useMemo(() => function (agentId: string, mode: "position" | "vicinity") {
        // Choose the color depending on granule type
        const color = mode === "position"
            ? locationCloakingData.tileColors[agentId].positionGranule.color
            : locationCloakingData.tileColors[agentId].vicinityGranules.color;
        if(!color) return;
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
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 3
        }), [locationCloakingData.gridPlane]);

    /** Layer that visualizes agent position granules */
    const positionGranulesLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 2
        }), []);

    /** Layer that visualizes agent vicinity granules */
    const vicinityGranulesLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 2
        }), []);

    /** Layer that visualizes agent vicinity shapes (currently only circular) */
    const vicinityShapeLayer = useMemo(() =>
        new VectorLayer({
            source: new VectorSource({
                features: []
            }),
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            zIndex: 4
        }), []);

    /** Helper function to extract the agent ID from the feature name composed as agentId:granuleId */
    const getFeatureAgentId = useMemo(() => function (f: Feature): string {
        return f.getId()!.toString().split(':')[0];
    }, []);

    /** Helper function to extract the granule ID from the feature name composed as agentId:granuleId */
    const getFeatureGranuleId = useMemo(() => function (f: Feature): number {
        return Number(f.getId()!.toString().split(':')[1]);
    }, []);

    /** Helper function to convert a granuleId to its level, row index and column index on the grid */
    const granuleIdToGrid = useMemo(() => function (id: number) {
        const level = Math.floor(Math.log(((3 * id) / 4) + 1) / Math.log(4));
        // Total number of granules on levels 0...level-1
        const numGranulesLowerLevel = (4 / 3) * ((4 ** level) - 1);
        const granuleRowIndex = Math.floor((id - numGranulesLowerLevel) / (2 ** (level + 1)));
        const granuleColumnIndex = (id - numGranulesLowerLevel) % (2 ** (level + 1));
        return [level, granuleRowIndex, granuleColumnIndex];
    }, []);

    /** Helper function which turns granule IDs into corresponding map features */
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

            // Tile granule polygon
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
            // Set the feature ID such that it can be searched for when removing invalid features
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

        const numDrawnLines = gridLayer.getSource()?.getFeatures().length || 0;

        if (numDrawnLines === undefined) return;

        // Levels 0...drawnMaxLevel are displayed on the map
        const drawnMaxLevel = Math.log2(numDrawnLines + 1) - 2;

        // TODO: Check if Number.isInteger can be removed
        // Check if we need to draw any new grid levels
        if (actualMaxLevel > drawnMaxLevel && Number.isInteger(drawnMaxLevel)) {
            // Draw grid lines north-to-south and west-to-east at levels drawn_max_level...actual_max_level
            for (let level = drawnMaxLevel + 1; level <= actualMaxLevel; level++) {
                // Draw grid lines at level
                for (let j = 0; j < 2 ** (level+1); j = j+2) {
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
    }, [locationCloakingData.gridAgentData, locationCloakingData.gridPlane]);

    // Draw the exact vicinity circle at agent positions to better understand the algorithm
    useEffect(() => {
        mapAgentsData.agents.forEach((ag) => {
            if(!locationCloakingData.gridAgentData[ag.id]) return;

            let vicinityFeature = vicinityShapeLayer.getSource()?.getFeatureById(ag.id);

            const vicinityCircle = circular(
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
    }, [mapAgentsData.agents]);

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

    // Draw new position granules on the map
    useEffect(() => {
        const positionGranulesFeatures = positionGranulesLayer.getSource()?.getFeatures();

        if (!positionGranulesFeatures) return;

        Object.entries(locationCloakingData.gridAgentData).forEach(([id, ga]) => {
            if (!locationCloakingData.tileColors[id]) return;
            const positionFeature = positionGranulesFeatures.find((f) => getFeatureAgentId(f) === id);

            const style = granuleStyle(id, "position");
            // Only draw if the user selected color is not transparent
            const hasColor = locationCloakingData.tileColors[id].positionGranule.color;

            // If there is no position granule for a valid agent or the current granule is invalid
            if (style && hasColor && (!positionFeature || getFeatureGranuleId(positionFeature) != ga.position_granule)) {
                const features = granuleIdsToFeatures(id, [ga.position_granule], style);
                positionGranulesLayer.getSource()?.addFeatures(features);
            }
        });
    }, [locationCloakingData.tileColors, locationCloakingData.gridAgentData]);

    // Draw new vicinity granules on the map
    useEffect(() => {
        const vicinityGranulesFeatures = vicinityGranulesLayer.getSource()?.getFeatures();

        if (!vicinityGranulesFeatures) return;

        Object.entries(locationCloakingData.gridAgentData).forEach(([id, ga]) => {
            if (!locationCloakingData.tileColors[id]) return;
            const vicinityStack = locationCloakingData.gridAgentData[id].vicinity_granules;
            const vicinityStackTop = vicinityStack[vicinityStack.length - 1];
            // Get the granules which are already drawn the highest level
            const drawnLevelGranuleIds = vicinityGranulesFeatures
                .filter((f) => f.getId())
                .filter((f) => getFeatureAgentId(f) === id)
                .filter((f) => vicinityStackTop.includes(getFeatureGranuleId(f)))
                .map((f) => getFeatureGranuleId(f))

            // Get the granules at the highest level which are not on the map yet
            const notDrawnLevelGranuleIds = vicinityStackTop
                .filter((granuleId) => !drawnLevelGranuleIds.includes(granuleId))

            const style = granuleStyle(id, "vicinity");
            const hasColor = locationCloakingData.tileColors[id].vicinityGranules.color;

            // Only draw if the user selected color is not transparent
            if (style && hasColor) {
                const features = granuleIdsToFeatures(id, notDrawnLevelGranuleIds, style, 0.9);
                vicinityGranulesLayer.getSource()?.addFeatures(features);
            }
        })
    }, [locationCloakingData.tileColors, locationCloakingData.gridAgentData]);

    useEffect(() => {
        gridLayer.getSource()?.clear();
        gridLayer.getSource()?.addFeature(gridBoundingBoxFeature);
        positionGranulesLayer.getSource()?.clear();
        vicinityGranulesLayer.getSource()?.clear();
        vicinityShapeLayer.getSource()?.clear();
    }, [locationCloakingData.gridPlane]);

    return(
      <></>
    );
}

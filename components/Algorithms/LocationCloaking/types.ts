export type LocationServer = {
    ip: string,
    port: number
}

/** A single element specifying the color of a grid granule */
export type GranuleColor = {
    color: string | undefined
}

/** A single element of agent colors for position and vicinity granules */
export type PositionVicinityColors = {
    positionGranule: GranuleColor,
    vicinityGranules: GranuleColor
}

/** Describes the boundaries of a grid plane */
export type GridPlane = {
    longitude: { min: number, max: number },
    latitude: { min: number, max: number }
}

/** A single element of the agent */
export type GridAgent = {
    level: number,
    position_granule: number,
    vicinity_granules: number[][],
    vicinity_radius: number
}

export type StatusTypes = {
    locationServer: boolean,
}

export type LocationCloakingAlgorithmData = {
    data: {
        /** Contains settings for the location server */
        locationServer: LocationServer,
        connectionStatus: StatusTypes,
        /** A list of per agent colors to be used when drawing grid granules */
        tileColors: Record<string, PositionVicinityColors>,
        /** Contains geo information about the entire grid */
        gridPlane: GridPlane
        /** A list of agents containing grid relevant data */
        gridAgentData: Record<string, GridAgent>,
    },
    setData: (newData: LocationCloakingAlgorithmData["data"]) => void
}

/** Message Types */

export type MsgPartLSClientInitComplete = {
    planeData: {
        lonMin: number,
        lonMax: number,
        latMin: number,
        latMax: number
    }
}

export type MsgPartLSObserverIncUpd = {
    alias: string[],
    level: number,
    newLocation: {
        granule: number
    }
    vicinityInsert: {
        granules: number[]
    },
    vicinityDelete: {
        granules: number[]
    },
    vicinityShape: {
        radius: number
    }
}

export type MsgPartLSObserverSync = {
    users: {
        alias: string[],
        level: number,
        granularities: {
            encryptedVicinity: {
              granules: number[]
            },
            encryptedLocation: {
              granule: number
            }
        }[],
        vicinityShape: {
            radius: number
        }
    }[]
}

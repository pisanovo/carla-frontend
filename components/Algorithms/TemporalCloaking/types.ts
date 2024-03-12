export type LocationServer = {
    ip: string,
    port: number
}

export type StatusTypes = {
    locationServer: boolean,
}

export type GranuleColor = {
    color: string | undefined
}

export type PositionVicinityColors = {
    positionGranule: GranuleColor,
    vicinityGranules: GranuleColor
}

export type GridPlane = {
    longitude: { min: number, max: number },
    latitude: { min: number, max: number }
}

export type TemporalCloakingAlgorithmData = {
    data: {
        /** Contains settings for the location server */
        locationServer: LocationServer,
        connectionStatus: StatusTypes,

        // parameter constraint k for algorithm
        constraint_k: number,
        // id of ego vehicle for algorithm
        ego_vehicle_id: number,
        /** Contains geo information about the entire grid */
        gridPlane: GridPlane,
    },
    setData: (newData: TemporalCloakingAlgorithmData["data"]) => void
}
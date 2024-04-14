export type Location = {
    id: number,
    x: number,
    y: number,
}

export type Grid = {
    lon_min: number,
    lon_max: number,
    lat_min: number,
    lat_max: number,
}

/** A single log item of the location based service (shows you, what the service can see) */
export type LogItem = {
    timestamp: number,
    grid: Grid,
}

export type VisualizationInfoResponse = {
    logs: LogItem[]
}

export type TemporalCloakingAlgorithmData = {
    data: {
        /** Logs from the location server (visualization_items route) */
        locationServerLogs: LogItem[],
        /** Is true if the logs should be shown on the map */
        showLocationServerLogs: boolean,

    },
    setData: (newData: TemporalCloakingAlgorithmData["data"]) => void
}
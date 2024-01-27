export type Location = {
    x: number,
    y: number,
}

/** A single log item of the location based service (shows you, what the service can see) */
export type LogItem = {
    timestamp: number,
    location: Location,
}

export type LocationNode = Location & {
    x: number,
    y: number,
    parent_id: string,
}

/** A single element of the user movement storage */
export type UserMovement = {
   R_No: string,
   Birth_Date: number, // Seconds since 1970
   No_of_Nodes: number,
   Used_Freq: number,
   Node_List: LocationNode[]
}

/** A single element of the dummy storage */
export type Dummy = {
    D_No: string,
    Birth_Date: number, // Seconds since 1970
    No_of_Nodes: number,
    Used_Freq: number,
    Node_List: LocationNode[]
    Curr_Node: number,
}

export type VisualizationInfoResponse = {
    logs: LogItem[]
}

export type RedundantDummLocationsAlgorithmData = {
    data: {
        /** Logs from the location server (visualization_items route) */
        locationServerLogs: LogItem[],
        /** Is true if the logs should be shown on the map */
        showLocationServerLogs: boolean,
        /** Dump of the user movement storage */
        userMovementStorageDump: UserMovement[],
        /** Is true if user movement storage dump should be visualized on the map */
        showUserMovementStorageDump: boolean,
        /** Dump of the dummy storage */
        dummyStorageDump: Dummy[],
        /** Is true if dummy storage dump should be visualized on the map */
        showDummyStorageDump: boolean,
    },
    setData: (newData: RedundantDummLocationsAlgorithmData['data']) => void
}
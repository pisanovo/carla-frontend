export type Server = {
    ip: string,
    port: number
}

export type Location = {
    longitude: number,
    latitude: number
}

export type Speed = {
    velocityX: number
    velocityY: number
}

export type CarlaVehicleData =  {
    id: string,
    time: number,
    speed: Speed,
    location: Location
}

export type IntervalVehicleEntry = {
    id: string,
    // Last time the uncertainty was larger than the provided threshold
    lastConfusionTime: number,
    currentGpsSample: CarlaVehicleData,
    predictedLoc: Location,
    // Last entry the location server decided to publish
    lastVisible: CarlaVehicleData,
    // k nearest from all entries in the respective interval
    dependencies: string[],
    // k nearest from all entries in the respective interval that the location server deiced to publish
    neighbors: string[]
}

export type ReleaseEntry = {
    createdAtTime: number,
    vehicleEntry: IntervalVehicleEntry,
    uncertaintyInterval: number | null,
    uncertaintyReleaseSet: number | null,
    isInReleaseSet: boolean
}

export type AlgorithmSettings = {
    updateRate: number,
    timeInterval: number,
    uncertaintyThreshold: number,
    confusionTimeout: number,
    tGuard: number,
    tripTimeout: number,
    mue: number,
    kAnonymity: number,
    applySensitiveLocationCloakingExtension: boolean,
    applyWindowingExtension: boolean
}

export type VehiclesData = {
    available_vehicles: string[],
    relevant_vehicles: string[]
}

export type StatusTypes = {
    server: boolean,
}


export type PathConfusionAlgorithmData = {
    data: {
        /** Contains settings for the location server */
        server: Server,
        connectionStatus: StatusTypes,
        /** Settings received from the location server */
        algorithmSettings: AlgorithmSettings | null,
        /** Contains all received release entries */
        releaseEntries: ReleaseEntry[]
        /** A list of agents containing grid relevant data */
        vehiclesData: VehiclesData,
        available_recordings: string[],
        /** Determines if a recording is currently played */
        is_live: boolean,
        /** The frontend user can select a release entry on the map to show k nearest entries and predicted position */
        selected_entry: ReleaseEntry | null,
        /** Decide if the k nearest dependencies or k nearest neighbors are shown */
        isDisplayDependenciesSelected: boolean
    },
    setData: (newData: PathConfusionAlgorithmData["data"]) => void
}

/** Message Types */

export type MsgServerObserverAvailableRecordings = {
    fileNames: string[]
}

export type MsgServerObserverSettingsUpdate = {
    settings: AlgorithmSettings,
    isLive: boolean
}

export type MsgServerClientReleaseUpdate = {
    releaseStore: ReleaseEntry[]
}

export type MsgServerObserverVehicles = {
    availableVehicles: string[],
    relevantVehicles: string[]
}

export type MsgObserverServerAddRecording = {
    name: string,
    type: string
}

export type MsgObserverServerReset = {
    type: string
}

export type MsgObserverServerGoLive = {
    type: string
}

export type MsgObserverServerLoadRecording = {
    recording_file_name: string,
    type: string
}

export type MsgObserverServerDeleteRecording = {
    recording_file_name: string,
    type: string
}

export type MsgServerActionComplete = {}

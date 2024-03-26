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
    lastConfusionTime: number,
    currentGpsSample: CarlaVehicleData,
    predictedLoc: Location,
    lastVisible: CarlaVehicleData,
    dependencies: string[],
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
        /** A list of per agent colors to be used when drawing grid granules */
        algorithmSettings: AlgorithmSettings | null,
        /** Contains geo information about the entire grid */
        releaseEntries: ReleaseEntry[]
        /** A list of agents containing grid relevant data */
        vehiclesData: VehiclesData,
        available_recordings: string[],
        is_live: boolean,
        selected_entry: ReleaseEntry | null,
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

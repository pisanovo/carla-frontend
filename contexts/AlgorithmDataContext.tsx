import { RedundantDummLocationsAlgorithmData } from '@/components/Algorithms/RedundantDummyLocations/types';
import React, {useState, createContext} from 'react';
import {LocationCloakingAlgorithmData} from "@/components/Algorithms/LocationCloaking/types";
import {TemporalCloakingAlgorithmData} from "@/components/Algorithms/TemporalCloaking/types";
import {LOCATION_CLOAKING_ID} from "@/components/Algorithms/LocationCloaking/config";
import {AgentsData, CarlaServer} from "@/contexts/types";


export type AlgorithmDataContextType = {
    settings: {
        carlaServer: CarlaServer
        setCarlaServer: (server: CarlaServer) => void,

        selectedAlgorithm: string,
        setSelectedAlgorithm: (algorithm: string) => void,

        showAgentIDLabels: boolean,
        setShowAgentIDLabels: (state: boolean) => void,
    }

    mapAgentsData: AgentsData,
    setMapAgentsData: (data: AgentsData) => void,

    redundantDummyLocationsData: RedundantDummLocationsAlgorithmData["data"],
    setRedundantDummyLocationsData: RedundantDummLocationsAlgorithmData["setData"],

    locationCloakingData: LocationCloakingAlgorithmData["data"],
    setLocationCloakingData: LocationCloakingAlgorithmData["setData"],

    temporalCloakingData: TemporalCloakingAlgorithmData["data"],
    setTemporalCloakingData: TemporalCloakingAlgorithmData["setData"],
    // TODO: Add more algorithms
}

/**
 * This context contains all info, bundled by algorithm,
 * that we want to share between the datatabs, map and whatever
 * else might need them.
 */
export const AlgorithmDataContext = createContext<AlgorithmDataContextType>(
    // Create empty default values. Note the setter does nothing until the provider
    // binds it to the stateF
    {
        settings: {
            carlaServer: {ip: "127.0.0.1", port: 8200},
            setCarlaServer: () => {},

            selectedAlgorithm: LOCATION_CLOAKING_ID,
            setSelectedAlgorithm: () => {},

            showAgentIDLabels: false,
            setShowAgentIDLabels: () => {},
        },

        mapAgentsData: {
            isBackendConnected: false,
            activeAgents: [],
            agents: [],
        },
        setMapAgentsData: () => {},

        redundantDummyLocationsData: {
            dummyStorageDump: [],
            locationServerLogs: [],
            userMovementStorageDump: [],
            showDummyStorageDump: false,
            showLocationServerLogs: false,
            showUserMovementStorageDump: false,
        },
        setRedundantDummyLocationsData: () => {},

        locationCloakingData: {
            locationServer: {ip: "127.0.0.1", port: 8456},
            connectionStatus: {locationServer: false},
            tileColors: {},
            gridAgentData: {},
            gridPlane: {longitude: {min:0, max:0}, latitude: {min:0, max:0}}
        },
        setLocationCloakingData: () => {},

        temporalCloakingData: {
            locationServer: {ip: "127.0.0.1", port: 8456},
            connectionStatus: {locationServer: false},
            constraint_k: 5,
            ego_vehicle_id: 0,
            total_vehicles: 0,
            id_min: 0,
            id_max: 0
        },
        setTemporalCloakingData: () => {}
    }
    // TODO: Add more algorithms
)

type AlgorithmDataContextProviderPropsType = { children: React.ReactNode };

export function AlgorithmDataContextProvider({ children } : AlgorithmDataContextProviderPropsType) {
    /** A place to store the currently selected algorithm */
    const [selectedAlgorithm, setSelectedAlgorithm] =
        useState<string>(LOCATION_CLOAKING_ID);

    /** A place to store whether agent IDs should be shown on the map */
    const [showAgentIDLabels, setShowAgentIDLabels] =
        useState<boolean>(false);

    const [carlaServer, setCarlaServer] =
        useState<CarlaServer>({ip: "127.0.0.1", port: 8200});

    const [mapAgentsData, setMapAgentsData] =
        useState<AgentsData>({isBackendConnected: false, activeAgents: [], agents: []});

    /** A place for the dummy locations algorithm to store its data */
    const [redundantDummyLocationsData, setRedundantDummyLocationsData] =
        useState<RedundantDummLocationsAlgorithmData["data"]>({
            locationServerLogs: [],
            showLocationServerLogs: false,
            userMovementStorageDump: [],
            showUserMovementStorageDump: false,
            dummyStorageDump: [],
            showDummyStorageDump: false,
        });

    const [locationCloakingData, setLocationCloakingData] =
        useState<LocationCloakingAlgorithmData["data"]>({
            locationServer: {ip: "127.0.0.1", port: 8456},
            connectionStatus: {locationServer: false},
            tileColors: {},
            gridAgentData: {},
            gridPlane: {longitude: {min:0, max:0}, latitude: {min:0, max:0}}
        });

    const [temporalCloakingData, setTemporalCloakingData] =
        useState<TemporalCloakingAlgorithmData["data"]>({
            locationServer: {ip: "127.0.0.1", port: 8456},
            connectionStatus: {locationServer: false},
            constraint_k: 5,
            ego_vehicle_id: 0,
            total_vehicles: 0,
            id_min: 0,
            id_max: 0
        });

    // TODO: Add more algorithms

    return <AlgorithmDataContext.Provider
        value={{
            settings: {
                carlaServer,
                setCarlaServer,
                selectedAlgorithm,
                setSelectedAlgorithm,
                showAgentIDLabels,
                setShowAgentIDLabels,
            },
            mapAgentsData,
            setMapAgentsData,
            redundantDummyLocationsData,
            setRedundantDummyLocationsData,
            locationCloakingData: locationCloakingData,
            setLocationCloakingData: setLocationCloakingData,
            temporalCloakingData,
            setTemporalCloakingData,
        }}
    >
        {children}
    </AlgorithmDataContext.Provider>
}

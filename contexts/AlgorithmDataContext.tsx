import { RedundantDummLocationsAlgorithmData } from '@/components/Algorithms/RedundantDummyLocations/types';
import React, {useState, createContext} from 'react';
import {LocationCloakingAlgorithmData} from "@/components/Algorithms/LocationCloaking/types";
import {LOCATION_CLOAKING_ID} from "@/components/Algorithms/LocationCloaking/config";

export type AlgorithmDataContextType = {
    settings: {
        selectedAlgorithm: string,
        setSelectedAlgorithm: (newAlgorithm: string) => void,

        showAgentIDLabels: boolean,
        setShowAgentIDLabels: (state: boolean) => void,
    }

    redundantDummyLocationsData: RedundantDummLocationsAlgorithmData["data"],
    setRedundantDummyLocationsData: RedundantDummLocationsAlgorithmData["setData"],

    locationCloakingData: LocationCloakingAlgorithmData["data"],
    setLocationCloakingData: LocationCloakingAlgorithmData["setData"],
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
            selectedAlgorithm: LOCATION_CLOAKING_ID,
            setSelectedAlgorithm: () => {},

            showAgentIDLabels: false,
            setShowAgentIDLabels: () => {},
        },

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
            tileColors: {},
            gridAgentData: {},
            gridPlane: {longitude: {min:0, max:0}, latitude: {min:0, max:0}}
        },
        setLocationCloakingData: () => {},
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
            tileColors: {},
            gridAgentData: {},
            gridPlane: {longitude: {min:0, max:0}, latitude: {min:0, max:0}}
        });
    // TODO: Add more algorithms

    return <AlgorithmDataContext.Provider
        value={{
            settings: {
                selectedAlgorithm,
                setSelectedAlgorithm,
                showAgentIDLabels,
                setShowAgentIDLabels,
            },
            redundantDummyLocationsData,
            setRedundantDummyLocationsData,
            locationCloakingData,
            setLocationCloakingData
        }}
    >
        {children}
    </AlgorithmDataContext.Provider>
}

import { RedundantDummLocationsAlgorithmData } from '@/components/Algorithms/RedundantDummyLocations/types';
import React, {useState, createContext} from 'react';

export type AlgorithmDataContextType = {
    redundantDummyLocationsData: RedundantDummLocationsAlgorithmData["data"],
    setRedundantDummyLocationsData: RedundantDummLocationsAlgorithmData["setData"],
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
        redundantDummyLocationsData: {
            dummyStorageDump: [],
            locationServerLogs: [],
            userMovementStorageDump: [],
            showDummyStorageDump: false,
            showLocationServerLogs: false,
            showUserMovementStorageDump: false,
        },
        setRedundantDummyLocationsData: () => {},
    }
    // TODO: Add more algorithms
)

type AlgorithmDataContextProviderPropsType = { children: React.ReactNode};

export function AlgorithmDataContextProvider({ children } : AlgorithmDataContextProviderPropsType) {
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

    // TODO: Add more algorithms


    return <AlgorithmDataContext.Provider
        value={{
            redundantDummyLocationsData,
            setRedundantDummyLocationsData
        }}
    >
        {children}
    </AlgorithmDataContext.Provider>
}

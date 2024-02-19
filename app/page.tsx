"use client";

import {ActionIcon, Overlay} from '@mantine/core';
import { MapView } from '@/components/MapView/MapView'
import {
    AppShell,
    Card,
    Chip,
    Grid,
    Group,
    NativeSelect,
    rem,
    Space,
    Stack,
    Tabs
} from "@mantine/core";
import {HeaderIndex} from "@/components/Header/HeaderIndex";
import {
    Icon123,
    IconNavigationCode,
    IconSettings,
    IconX
} from "@tabler/icons-react";
import {SettingsTab} from "@/components/SettingsTab/SettingsTab";
import {useState} from "react";
import {DataTab as LocationCloakingDataTab} from "@/components/Algorithms/LocationCloaking/DataTab/DataTab";
import {MapBar as LocationCloakingMapBar} from "@/components/Algorithms/LocationCloaking/MapBar/MapBar";
import RedundantDummyLocationsDataTab from "@/components/Algorithms/RedundantDummyLocations/DataTab";
import {REDUNDANT_DUMMY_LOCATIONS_ID} from '@/components/Algorithms/RedundantDummyLocations/config';
import { AlgorithmDataContextProvider } from '@/contexts/AlgorithmDataContext';
import {Root} from "@/components/Root/Root";

type CarlaSettings = {
    ip: string;
    port: number;
}


export default function HomePage() {
    // const iconStyle = { width: rem(12), height: rem(12) };
    // const [algorithm, setAlgorithm] = useState('');
    //
    // const [carlaSettings, setCarlaSettings] = useState<CarlaSettings>({ip: "127.0.0.1", port: 8200});
    // const [locationCloakingSettings, setLocationCloakingSettings] = useState({});
    // const [locationCloakingData, setLocationCloakingData] = useState({});
    // const [temporalCloakingSettings, setTemporalCloakingSettings] = useState({});
    // const [temporalCloakingData, setTemporalCloakingData] = useState({});
    // const [showVehicleLabels, setShowVehicleLabels] = useState(false);

    // const algorithmData  = {
    //     locationCloakingSettings: {
    //         settings: locationCloakingSettings,
    //         setSettings: setLocationCloakingSettings,
    //         data: locationCloakingData,
    //         setData: setLocationCloakingData
    //     },
    //     temporalCloakingSettings: {
    //         settings: temporalCloakingSettings,
    //         setSettings: setTemporalCloakingSettings,
    //         data: temporalCloakingData,
    //         setData: setTemporalCloakingData
    //     }
    // };

  return (
    <>
        <AlgorithmDataContextProvider>
            <Root />
        </AlgorithmDataContextProvider>
    </>
  );
}

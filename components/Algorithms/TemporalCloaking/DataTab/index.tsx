import React, {useCallback, useContext, useEffect, useState} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import useSWRSubscription from "swr/subscription";
import {Anchor, Center, ColorInput, Group, Loader, rem, ScrollArea, Stack, Table, Text, Tooltip, Button, Switch, Input, SimpleGrid} from "@mantine/core";


export default function () {
    const {
        mapAgentsData,
        temporalCloakingData,
        setTemporalCloakingData
    } = useContext(AlgorithmDataContext);

    const [constraintK, setConstraintK] = useState<number>(4)
    /** Reconnect timeout to location server in ms */
    const LOCATION_SERVER_CONN_TIMEOUT = 4000;

    const handleChooseK = (e: React.FormEvent<HTMLInputElement>): void => {
        var toNum: number = +e.currentTarget.value;

        const newData = temporalCloakingData
        newData.constraint_k = toNum
        setTemporalCloakingData(newData)
    };

    const handleChooseEgo = (e: React.FormEvent<HTMLInputElement>): void => {
        var toNum: number = +e.currentTarget.value;

        const newData = temporalCloakingData
        newData.ego_vehicle_id = toNum
        setTemporalCloakingData(newData)
    };


        return (
        <div style={{overflowY: 'auto', maxHeight: "50vh"}}>
            <SimpleGrid cols={2}>
                <label>Constraint k [1-10]:</label>
                <Input style={{display: "inline-block", marginLeft: 4}} type="number" value={temporalCloakingData.constraint_k} min={1} max={10} onChange={handleChooseK} />
                <label>Select ego vehicle by ID [1-15]:</label>
                <Input style={{display: "inline-block", marginLeft: 4}} type="number" value={temporalCloakingData.ego_vehicle_id} min={1} max={15} onChange={handleChooseEgo} />
            </SimpleGrid>
        </div>
        )
}
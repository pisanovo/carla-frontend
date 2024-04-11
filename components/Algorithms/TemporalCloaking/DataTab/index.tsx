import React, {useCallback, useContext, useEffect, useState, SyntheticEvent} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {VisualizationInfoResponse, TemporalCloakingAlgorithmData} from "../types"
import {Anchor, Center, ColorInput, Group, Loader, rem, ScrollArea, Stack, Table, Text, Tooltip, Button, Switch, Input, SimpleGrid} from "@mantine/core";


var string_label="Select ego vehicle by ID [?-?]:";
var carID_min=-1, pre_carID_min=-1, carID_max=-1, pre_carID_max=-1, carID, init_flag=0; 
var choose_ego_msg=""
var set_k_msg=""
var constraintK=5, Ego_value=0;


export default function () {
    /** Refresh interval for the polling of logs */
    const REFRESH_INTERVAL = 1000; // ms
    const {temporalCloakingData, setTemporalCloakingData} = useContext(AlgorithmDataContext);
    /** Request response text, as a simple user feedback for performing requests via the buttons */
    const [responseMessage, setResponseMessage] = useState<string>("")

    // Fetch the logs from the location server, i.e., what 
    // the location based service sees.
    useEffect(() => {
        // Fetch logs continously
        const logsInterval = setInterval(() => {
            fetch("http://localhost:5002/visualization_info")
            .then((res) => res.json())
            .then((res: VisualizationInfoResponse) => {
                const newData = temporalCloakingData
                newData.locationServerLogs = res.logs
                setTemporalCloakingData(newData)
            })
        }, REFRESH_INTERVAL);

        // Clear interval when component is removed
        return () => {
            clearInterval(logsInterval)
        }
    }, [REFRESH_INTERVAL, temporalCloakingData]);

    const handleChooseK = (e: React.FormEvent<HTMLInputElement>): void => {
        constraintK = e.currentTarget.valueAsNumber
    };

    const handleSetK = useCallback(() => {
        fetch(
            "http://localhost:5001/getk?" +
            new URLSearchParams({
                constraint_k: `${constraintK}`,
            }), {method: "POST"})
                .then((res) => res.json())
                .then((res: string) => {
                    set_k_msg = res
                })
    }, [])

    const handleChangeCar = useCallback(() => {
        // Call client to change ego car
        fetch("http://localhost:5000/start")
            .then((res) => res.json())
            .then((res: string) => {
                choose_ego_msg = res
            })
    }, [])

    const handleReset = useCallback(() => {
        // Call client to cancel all attachments
        fetch("http://localhost:5000/stop")
            .then((res) => res.json())
            .then(({msg}) => setResponseMessage(msg))
        // Flush logs (don't log response text here, because result is obvious when logs disappear)
        fetch("http://localhost:5002/visualization_info", {method: "DELETE"})
    }, [])

    const handleToggleLocationServerLogsVisibility = useCallback((event: any) => {
        const newVisibility = event.currentTarget.checked
        const newData: TemporalCloakingAlgorithmData["data"] = {
            ...temporalCloakingData,
            showLocationServerLogs: newVisibility
        }
        setTemporalCloakingData(newData)
    }, [temporalCloakingData, setTemporalCloakingData])

        return (
        <div style={{overflowY: 'auto', maxHeight: "70vh"}}>
            <h3>Simulation Controls</h3>
            <fieldset>
                <Button onClick={handleChangeCar} style={{marginRight: 4}}>Change Ego Vehicle</Button><br />
                {/* <Button onClick={handleReset}>Reset</Button> */}
                <label>{choose_ego_msg}</label><br />
            </fieldset>
            <fieldset>
                <label>Constraint k [2-10]</label>
                <Input style={{display: "inline-block", marginLeft: 4}} type="range" value={constraintK} min={2} max={10} onChange={handleChooseK} />
                <label>{constraintK}</label><br />
                <Button onClick={handleSetK}>Set k</Button><label>{set_k_msg}</label><br />
            </fieldset>

            <h3>
            What the location server sees:
            <Switch
                style={{display: "inline-block"}}
                checked={temporalCloakingData.showLocationServerLogs}
                onChange={handleToggleLocationServerLogsVisibility} />
        </h3>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            [
                {'\n'}
                {temporalCloakingData.locationServerLogs.map((log) => `\t${JSON.stringify(log, null,'\0')},\n`)}
            ]
        </pre>
        </div>
        )
}
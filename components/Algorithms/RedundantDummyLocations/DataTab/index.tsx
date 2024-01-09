import React, {useCallback, useEffect, useState} from 'react'
import { Button, Switch } from "@mantine/core";
import { VisualizationInfoResponse, RedundantDummLocationsAlgorithmData } from "../types"




export default function ({algo_data}: {algo_data: RedundantDummLocationsAlgorithmData}) {
    /** Refresh interval for the polling of logs */
    const REFRESH_INTERVAL = 1000; // ms
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
                const newData = algo_data.data
                newData.locationServerLogs = res.logs
                algo_data.setData(newData)
            })
        }, REFRESH_INTERVAL);

        // Clear interval when component is removed
        return () => {
            clearInterval(logsInterval)
        }
    }, [REFRESH_INTERVAL, algo_data.data]);

    const handleDumpUserMovementStorage = useCallback(() => {
        fetch("http://localhost:5001/user_movement_storage")
            .then((res) => res.json())
            .then((dump) => {
                // Pretty print dump
                const newData = algo_data.data
                newData.userMovementStorageDump = dump
                algo_data.setData(newData)                
            })
    }, [algo_data.data])

    const handleAttachClient = useCallback(() => {
        // Call client to attach one car
        fetch("http://localhost:5000/start")
            .then((res) => res.json())
            .then(({msg}) => setResponseMessage(msg))
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
        const newData: RedundantDummLocationsAlgorithmData["data"] = {
            ...algo_data.data,
            showLocationServerLogs: newVisibility
        }
        algo_data.setData(newData)
    }, [algo_data.data, algo_data.setData])
    const handleToggleUserMovementStorageDumpVisibility = useCallback((event: any) => {
        const newVisibility = event.currentTarget.checked
        const newData: RedundantDummLocationsAlgorithmData["data"] = {
            ...algo_data.data,
            showUserMovementStorageDump: newVisibility
        }
        algo_data.setData(newData)
    }, [algo_data.data, algo_data.setData])

    return (
    <>
        <h3>Simulation Controls</h3>
        <pre>
            {responseMessage}
        </pre>
        <Button onClick={handleAttachClient} style={{marginRight: 4}}>Attach Client</Button>
        <Button onClick={handleReset}>Reset</Button>
        <h3>
            What the location server sees:
            <Switch
                style={{display: "inline-block"}}
                checked={algo_data.data.showLocationServerLogs}
                onChange={handleToggleLocationServerLogsVisibility} />
        </h3>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            [
                {'\n'}
                {algo_data.data.locationServerLogs.map((log) => `\t${JSON.stringify(log)},\n`)}
            ]
        </pre>
        <h3>
            User Movement Storage
            <Switch
                style={{display: "inline-block"}}
                checked={algo_data.data.showUserMovementStorageDump}
                onChange={handleToggleUserMovementStorageDumpVisibility} />
        </h3>
        <Button onClick={handleDumpUserMovementStorage}>Fetch Dump</Button>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            {
                // Pritty print
                JSON.stringify(algo_data.data.userMovementStorageDump, null, 2)
            }
        </pre>
    </>
    )
}
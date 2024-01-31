import React, {useCallback, useContext, useEffect, useState} from 'react'
import { Button, Switch, Input, SimpleGrid } from "@mantine/core";
import { VisualizationInfoResponse, RedundantDummLocationsAlgorithmData } from "../types"
import { AlgorithmDataContext } from '@/contexts/AlgorithmDataContext';


export default function () {
    const {
        redundantDummyLocationsData,
        setRedundantDummyLocationsData,
    } = useContext(AlgorithmDataContext);

    /** Refresh interval for the polling of logs */
    const REFRESH_INTERVAL = 1000; // ms
    /** Request response text, as a simple user feedback for performing requests via the buttons */
    const [responseMessage, setResponseMessage] = useState<string>("")
    /** Min Length of generated dummies */
    const [dummyMinNodeCount, setDummyMinNodeCount] = useState<number>(5)
    /** Max Length of generated dummies */
    const [dummyMaxNodeCount, setDummyMaxNodeCount] = useState<number>(10)
    /** Neighbouring range, i.e. threshold for how far away nodes are still considered neighbours */
    const [dummyNBRange, setDummyNBRange] = useState<number>(0.000008) // Found through trial and error. TODO: As soon as we have a spacial index, use a unit instead of a magic number

    // Fetch the logs from the location server, i.e., what 
    // the location based service sees.
    useEffect(() => {
        // Fetch logs continously
        const logsInterval = setInterval(() => {
            fetch("http://localhost:5002/visualization_info")
            .then((res) => res.json())
            .then((res: VisualizationInfoResponse) => {
                const newData = redundantDummyLocationsData
                newData.locationServerLogs = res.logs
                setRedundantDummyLocationsData(newData)
            })
        }, REFRESH_INTERVAL);

        // Clear interval when component is removed
        return () => {
            clearInterval(logsInterval)
        }
    }, [REFRESH_INTERVAL, redundantDummyLocationsData]);

    const handleDumpUserMovementStorage = useCallback(() => {
        fetch("http://localhost:5001/user_movement_storage")
            .then((res) => res.json())
            .then((dump) => {
                // Pretty print dump
                const newData = redundantDummyLocationsData
                newData.userMovementStorageDump = dump
                setRedundantDummyLocationsData(newData)                
            })
    }, [redundantDummyLocationsData])

    const handleDumpDummyStorage = useCallback(() => {
        fetch("http://localhost:5001/dummy_storage")
            .then((res) => res.json())
            .then((dump) => {
                // Pretty print dump
                const newData = redundantDummyLocationsData
                newData.dummyStorageDump = dump
                setRedundantDummyLocationsData(newData)                
            })
    }, [redundantDummyLocationsData])

    const handleAttachClient = useCallback(() => {
        // Call client to attach one car
        fetch("http://localhost:5000/start")
            .then((res) => res.json())
            .then(({msg}) => setResponseMessage(msg))
    }, [])

    const handleGenerateDummy = useCallback(() => {
        // Call client to attach one car
        fetch(
            "http://localhost:5001/dummy?" +
            new URLSearchParams({
                min_node_count: `${dummyMinNodeCount}`,
                max_node_count: `${dummyMaxNodeCount}`,
                nb_range: `${dummyNBRange}`
            }),
            {method: "POST"}
            )
                .then((res) => res.json())
                .then(({msg}) => setResponseMessage(msg))
    }, [dummyMaxNodeCount])

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
            ...redundantDummyLocationsData,
            showLocationServerLogs: newVisibility
        }
        setRedundantDummyLocationsData(newData)
    }, [redundantDummyLocationsData, setRedundantDummyLocationsData])
    const handleToggleUserMovementStorageDumpVisibility = useCallback((event: any) => {
        const newVisibility = event.currentTarget.checked
        const newData: RedundantDummLocationsAlgorithmData["data"] = {
            ...redundantDummyLocationsData,
            showUserMovementStorageDump: newVisibility
        }
        setRedundantDummyLocationsData(newData)
    }, [redundantDummyLocationsData, setRedundantDummyLocationsData])
    const handleToggleDummyStorageDumpVisibility = useCallback((event: any) => {
        const newVisibility = event.currentTarget.checked
        const newData: RedundantDummLocationsAlgorithmData["data"] = {
            ...redundantDummyLocationsData,
            showDummyStorageDump: newVisibility
        }
        setRedundantDummyLocationsData(newData)
    }, [redundantDummyLocationsData, setRedundantDummyLocationsData])

    return (
    <div style={{overflowY: 'auto', maxHeight: "70vh"}}>
        <h3>Simulation Controls</h3>
        <pre>
            {responseMessage}
        </pre>
        <SimpleGrid cols={2}>
            <Button onClick={handleAttachClient} style={{marginRight: 4}}>Attach Client</Button>
            <Button onClick={handleReset}>Reset</Button>
            <label>Min number of nodes per dummy:</label>
            <Input style={{display: "inline-block", marginLeft: 4}} type="number" value={dummyMinNodeCount} min={1} max={dummyMaxNodeCount} onChange={(event) => setDummyMinNodeCount(event.currentTarget.valueAsNumber) } />
            <label>Max number of nodes per dummy:</label>
            <Input style={{display: "inline-block", marginLeft: 4}} type="number" value={dummyMaxNodeCount} min={dummyMinNodeCount} onChange={(event) => setDummyMaxNodeCount(event.currentTarget.valueAsNumber) } />
            <label>NB Range, i.e., maximum distance between neighbouring nodes:</label>
            <Input style={{display: "inline-block", marginLeft: 4}} type="number" value={dummyNBRange} min={0} onChange={(event) => setDummyNBRange(event.currentTarget.valueAsNumber) } />
            <label>Trigger generation of 1 dummy on echo agent:</label>
            <Button onClick={handleGenerateDummy} style={{marginRight: 4}}>Generate Dummy</Button>
        </SimpleGrid>

        <h3>
            What the location server sees:
            <Switch
                style={{display: "inline-block"}}
                checked={redundantDummyLocationsData.showLocationServerLogs}
                onChange={handleToggleLocationServerLogsVisibility} />
        </h3>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            [
                {'\n'}
                {redundantDummyLocationsData.locationServerLogs.map((log) => `\t${JSON.stringify(log)},\n`)}
            ]
        </pre>
        <h3>
            User Movement Storage
            <Switch
                style={{display: "inline-block"}}
                checked={redundantDummyLocationsData.showUserMovementStorageDump}
                onChange={handleToggleUserMovementStorageDumpVisibility} />
        </h3>
        <Button onClick={handleDumpUserMovementStorage}>Fetch Dump</Button>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            {
                // Pritty print
                JSON.stringify(redundantDummyLocationsData.userMovementStorageDump, null, 2)
            }
        </pre>
        <h3>
            Dummy Storage
            <Switch
                style={{display: "inline-block"}}
                checked={redundantDummyLocationsData.showDummyStorageDump}
                onChange={handleToggleDummyStorageDumpVisibility} />
        </h3>
        <Button onClick={handleDumpDummyStorage}>Fetch Dump</Button>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            {
                // Pritty print
                JSON.stringify(redundantDummyLocationsData.dummyStorageDump, null, 2)
            }
        </pre>
    </div>
    )
}
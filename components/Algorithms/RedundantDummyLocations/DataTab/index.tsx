import React, {useCallback, useEffect, useState} from 'react'
import { Button } from "@mantine/core";

type Location = {
    x: number,
    y: number,
}

type LogItem = {
    timestamp: number,
    location: Location,
}

type VisualizationInfoResponse = {
    logs: LogItem[]
}

export default function () {
    /** Refresh interval for the polling of logs */
    const REFRESH_INTERVAL = 1000; // ms
    /** Data points like the location based service sees them*/
    const [logs, setLogs] = useState<LogItem[]>([])
    /** User Movement Storage dump */
    const [userMovementStorageDump, setUserMovementStorageDump] = useState<string>("")
    /** Request response text, as a simple user feedback for performing requests via the buttons */
    const [responseMessage, setResponseMessage] = useState<string>("")
    // Fetch the logs from the location server, i.e., what 
    // the location based service sees.
    useEffect(() => {
        // Fetch logs continously
        const logsInterval = setInterval(() => {
            fetch("http://localhost:5002/visualization_info")
            .then((res) => res.json())
            .then((res: VisualizationInfoResponse) => setLogs(res.logs))
        }, REFRESH_INTERVAL);

        // Clear interval when component is removed
        return () => {
            clearInterval(logsInterval)
        }
    }, [REFRESH_INTERVAL, setLogs]);

    const handleDumpUserMovementStorage = useCallback(() => {
        fetch("http://localhost:5001/user_movement_storage")
            .then((res) => res.json())
            .then((dump) => {
                // Pretty print dump
                const prettyDump = JSON.stringify(dump, null, 2)
                setUserMovementStorageDump(prettyDump)
            })
    }, [setUserMovementStorageDump])

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

    return (
    <>
        <h3>Simulation Controls</h3>
        <pre>
            {responseMessage}
        </pre>
        <Button onClick={handleAttachClient} style={{marginRight: 4}}>Attach Client</Button>
        <Button onClick={handleReset}>Reset</Button>
        <h3>What the location server sees:</h3>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            [
                {'\n'}
                {logs.map((log) => `\t${JSON.stringify(log)},\n`)}
            ]
        </pre>
        <h3>User Movement Storage</h3>
        <Button onClick={handleDumpUserMovementStorage}>Fetch Dump</Button>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            {userMovementStorageDump}
        </pre>
    </>
    )
}
import React, {useEffect, useState} from 'react'

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
    // Fetch the logs from the location server, i.e., what 
    // the location based service sees.
    useEffect(() => {
        // Fetch logs continously
        const logsInterval = setInterval(() => {
            fetch("http://localhost:5001/visualization_info")
            .then((res) => res.json())
            .then((res: VisualizationInfoResponse) => setLogs(res.logs))
        }, REFRESH_INTERVAL);

        // Clear interval when component is removed
        return () => {
            clearInterval(logsInterval)
        }
    }, [REFRESH_INTERVAL, setLogs]);

    return (
    <>
        <h3>What the location server sees:</h3>
        <pre style={{maxWidth: '80%', maxHeight: '200px', overflowX: 'auto', overflowY: 'auto' }}>
            [
                {'\n'}
                {logs.map((log) => `\t${JSON.stringify(log)},\n`)}
            ]
        </pre>
    </>
    )
}
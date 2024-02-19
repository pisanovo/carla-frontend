export type CarlaServer = {
    ip: string,
    port: number
}

/** A single element for a carla agent with position information */
export type Agent = {
    /** The agent carla ID */
    id: string,
    /** Agent location (x, y) are (latitude, longitude) */
    location: {
        x: number,
        y: number
    },
    /** Can be used to draw a circle of x meters around an agent
     * and account for the curvature of the earth */
    greatCircleDistanceFactor: number
}

export type AgentsData = {
    /** Contains the carla IDs of all active agents */
    activeAgents: string[],
    /** List with the positions of active agents */
    agents: Agent[]
}

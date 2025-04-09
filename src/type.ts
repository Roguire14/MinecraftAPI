interface DockerEvent {
    Type: string;
    Action: string;
    id: string;
}
  
interface RunningServers {
    [key: string]: Server;
}

interface Server{
    name: string,
    port: number,
}

interface ServerConfig {
    image: string;
}

interface Category {
    [serverType:string]: ServerConfig;
}

interface Config {
    [category: string]: Category;
}

export {DockerEvent, RunningServers, Server, Config};
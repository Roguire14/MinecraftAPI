import Docker from "dockerode";
const docker = new Docker();
import fs from "fs";
import { DockerEvent, RunningServers, Config} from './type';
import { randomUUID } from "crypto";
  
const PORT_RANGE = {start:25566, end:25575};
const runningServers: RunningServers = {};
const config:Config = JSON.parse(fs.readFileSync("config.json","utf-8"));

(()=>{
    getRunningContainers()
    .then(containers => containers.filter(container => container.Names[0].startsWith("/minecraft")))
    .then(containers => {
        containers.forEach(container => {
            if (container.Ports && container.Ports[0]) {
                runningServers[container.Id] = { name: container.Names[0].slice(1), port: container.Ports[0].PublicPort };
            }
        });
    })
    .catch(console.error);
})();


docker.getEvents({}, (err, stream) => {
    if (err) {
      console.error('Erreur lors de l\'écoute des événements :', err);
      return;
    }
  
    if(!stream){
        console.error("Aucun flux disponible");
        return;
    }

    stream.on('data', (chunk: Buffer) => {
      const event: DockerEvent = JSON.parse(chunk.toString());
      
      if (event.Type === 'container' && event.Action === 'die') {
        console.log(`Le conteneur ${event.id} s'est arrêté.`);
        delete runningServers[event.id];
      }
    });
  });

export const getRunningServer = () => {
    return Object.values(runningServers);
}

async function getRunningContainers(){
    return await docker.listContainers({
        filters: {
            status: ["running"],
        }
    });
}

async function getAsyncUsedPorts() {
    const containers = await getRunningContainers();
    return containers
        .filter(container => container.Names[0].startsWith("/minecraft"))
        .flatMap(container => container.Ports.map(port => port.PublicPort));
}

export function getUsedPorts(){
    return Object.values(runningServers).map(server => server.port);
}

export async function startMinecraftServer(category: string, type: string, host: string){
    // const usedPorts = await getAsyncUsedPorts();
    const usedPorts = getUsedPorts();
    let port = PORT_RANGE.start;
    while(usedPorts.includes(port) && port < PORT_RANGE.end) port++;
    if (port > PORT_RANGE.end) {
        throw "❌ Tous les ports sont utilisés !";
    }
    if (!(category in config)) throw("Le type de serveur demandé n'existe pas");
    if (!(type in config[category])) throw ("La sous-catégorie demandée n'existe pas");
    if(!host) throw "Un host est nécessaire pour lancer un serveur";

    const dockerType = config[category][type];
    const containerName = `minecraft-${category}-${type}-${port}-${host}`;
    const serverData = {name:containerName, port: port};
    const uuid = randomUUID();
    runningServers[uuid] = serverData;

    return docker.createContainer({
        Image: dockerType.image,
        name: containerName,
        HostConfig: {
            CpuCount: 3,
            Memory: 4*1024*1024*1024, 
            MemoryReservation: 1*1024*1024*1024,
            MemorySwap: 5*1024*1024*1024, 
            MemorySwappiness: 10,
            AutoRemove: true,
            PortBindings: {
                "25565/tcp": [{HostPort: `${port}`}]
            }
        }
    }).then(async container => {
        try {
            await container.start();
            delete runningServers[uuid]
            runningServers[container.id] = serverData;
            return JSON.stringify(serverData);
        } catch (error) {
            if (error instanceof Error) {
                throw error; // Relance l'erreur telle quelle
            } else {
                throw new Error(String(error)); // Convertit en chaîne si ce n'est pas une erreur standard
            }
        }
    });
}
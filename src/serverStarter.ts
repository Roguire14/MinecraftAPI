import Docker from "dockerode";
const docker = new Docker();
import { DockerEvent, RunningServers, Config} from './type';
import { randomUUID } from "crypto";
import { db, dbConnect } from "./db/mongo";
  
const PORT_RANGE = {start:25566, end:25575};
const runningServers: RunningServers = {};

let config:Config;

const getConfig = async () => {
    const doc = await db.collection("config").findOne();
    if(doc){
        config = {pvp: doc.pvp, minigame: doc.minigame}
    }
}

(async ()=>{
    await dbConnect();
    await getConfig();
})();

setInterval(getConfig, 1000);

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
        throw "Tous les ports sont utilisés !";
    }
    if (!(category in config)) throw("Le type de serveur demandé n'existe pas");
    if (!(type in config[category])) throw ("La sous-catégorie demandée n'existe pas");
    if(!host) throw "Un host est nécessaire pour lancer un serveur";

    const dockerType = config[category][type];
    if(!dockerType.image) throw "Le mode n'est pas correctement configué: il manque l'image Docker";

    const containerName = `minecraft_${category}_${type}_${port}_${host}`;
    const fullServerData = {name:containerName, port:port, host:host}
    const uuid = randomUUID();
    runningServers[uuid] = fullServerData;

    return docker.createContainer({
        Image: dockerType.image,
        name: containerName,
        Hostname: containerName,
        Env: [
            `SERVER_NAME=${containerName}`
        ],
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
            delete runningServers[uuid];
            runningServers[container.id] = fullServerData;
            return JSON.stringify(fullServerData);
        } catch (error) {
            delete runningServers[uuid];
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error(String(error));
            }
        }
    });
}
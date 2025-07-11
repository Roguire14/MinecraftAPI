import {Request, Response, Router} from 'express'
import {getRunningServer, startMinecraftServer} from './serverStarter';
import {authMiddleWare} from './middleware/auth';
import {db} from "./db/mongo";

const router = Router();

router.post("/start-server", authMiddleWare, (req: Request, res: Response) => {
    const {category, type, host} = req.body;
    startMinecraftServer(category, type, host)
        .then(server => res.status(200).json({message: server, status: 200}))
        .catch(err => res.status(400).json({message: err, status: 400}))
});

router.get("/get-servers", (req: Request, res: Response) => {
    const runningServers = getRunningServer();
    res.json({code: 200, message: JSON.stringify(runningServers)})
});

router.post("/create-server", authMiddleWare, async (req: Request, res: Response) => {
    const {name} = req.body;
    const host = name.split("_").at(-1);
    await db.collection("servers").insertOne({
        name,
        host,
        created: false
    })
    res.json({code: 200, success: true})
});

router.get("/get-server/:serverName", async (req: Request, res: Response) => {
    const serverName = req.params.serverName;
    const server = await db.collection("servers").findOne({name: serverName})
    if (server) {
        res.json({code: 200, server})
        return
    }
    res.json({code: 404, message: "Le serveur n'existe pas"});
});

router.post("/update-server", async (req: Request, res: Response) => {
    const {serverName} = req.body;
    try {
        await db.collection("servers").updateOne(
            {name: serverName},
            {$set: {created: true}}
        );
        res.json({code: 200, success: true});
    } catch (e) {
        console.log(e);
        res.json({code: 404, message: "Le serveur n'existe pas"});
    }

});

router.delete("/delete-server/:serverName", async (req: Request, res: Response) => {
    const {serverName} = req.params;
    await db.collection("servers").deleteOne({name: serverName});
    res.json({success: true});
});

export default router;
import {Router, Request, Response} from 'express'
import { getRunningServer, startMinecraftServer} from './serverStarter';

const router = Router();
    
router.post("/start-server", (req: Request, res: Response)=>{
    const {category, type, host} = req.body;
    startMinecraftServer(category, type, host)
        .then(server => res.json({message: server, status: 200}))
        .catch(err => res.json({message: err, status: 400}))
});

router.get("/get-servers", (req: Request, res: Response)=>{
    const runningServers = getRunningServer();
    // console.log(runningServers)
    res.json({code: 200, message: JSON.stringify(runningServers)})
});

// loBoBot_API
// oNcREHRAEU6w4LzL

export default router;
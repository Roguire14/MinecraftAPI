import { Router, Request, Response } from "express";
import { authMiddleWare } from "./middleware/auth";
import { db } from "./db/mongo";

const router = Router();

router.get("/get-config/:category?/:type?", authMiddleWare, async (req: Request, res:Response)=>{
    const {category, type} = req.params;
    const doc = await db.collection("config").findOne();
    if(!doc){
        res.status(404).json({message: "Config not found"});
        return;
    }
    const config: { [key: string]: any } = { pvp: doc.pvp, minigame: doc.minigame };

    if(!category && !type){
        res.status(200).json({message: config, status: 200})
        return;
    }
    if(!type){
        if(!config[category]){
            res.status(404).json({message: "Category not found"});
            return;
        }
        res.status(200).json({message: config[category], status: 200});
        return;
    }
    if(!config[category] || !config[category][type]){
        res.status(404).json({message: "Type not found"})
        return;
    }
    res.status(200).json({message:config[category][type], status: 200})
});

export default router;
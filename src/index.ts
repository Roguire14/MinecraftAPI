import dotenv from "dotenv";
dotenv.config();

import express, {Request, Response} from 'express'
import minecraftRouter from "./minecraftHandler";
import { dbConnect, getInstance } from './db/mongo';
import User from './models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authMiddleWare } from './middleware/auth';

const app = express();
const port = 25550;

app.use(express.json());

app.use("/", minecraftRouter);

app.post("/login", async(req: Request, res: Response)=>{
    const {username, password} = req.body;
    if(!username || !password){
        res.status(400).json({message:"Identifiants invalides"})
        return;
    }
    const user = await User.findOne({username:username});
    if(!user || !(await user.comparePassword(password))){
        res.status(401).json({message: "Identifiants invalides"});
        return;
    }
    const token = jwt.sign({username: user.username}, process.env.SECRET_KEY!, {expiresIn: "1h"})
    res.status(200).json({token})
});

app.post("/register", async(req:Request, res:Response)=>{
    if(req.ip!=="127.0.0.1"){
        res.status(401).json({message: "Not authorized"})
        return;
    }
    const { username, password } = req.body;
    if(!username || !password) {
        res.status(401).json({message: "Identifiants invalides"});
        return;
    }
    if(await User.findOne({username})) {
        res.status(401).json({mesage: "Pseudo déjà utilisé"});
        return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, passwordHash });
    await newUser.save();
    res.json({ message: 'Utilisateur créé' });
});

app.get("/protected", authMiddleWare, (req: Request, res: Response)=>{
    res.status(200).json({message: `Bienvenue ${req.body.user}`})
})

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        status: 404
    });
});

app.listen(port, "0.0.0.0", async () => {
    console.log(`Now listening on ${port}`)
    await dbConnect();
});
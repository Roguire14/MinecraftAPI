import dotenv from "dotenv";
import express, {Request, Response} from 'express'
import minecraftRouter from "./minecraftHandler";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {db} from "./db/mongo";
import configRouter from "./configRouter";

dotenv.config();

const app = express();
const port = 25550;

app.use(express.json());

app.use("/", minecraftRouter);

app.use("/config", configRouter);

app.post("/login", async (req: Request, res: Response) => {
    const {username, password} = req.body;
    if (!username || !password) {
        res.status(401).json({message: "Identifiants invalides"})
        return;
    }
    const user = await db.collection("users").findOne({username});
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401).json({message: "Identifiants invalides"});
        return;
    }
    console.log(`Logged in: ${username} from ${req.ip}`);
    const token = jwt.sign({username: user.username}, process.env.SECRET_KEY!, {expiresIn: "20min"})
    res.status(200).json({token})
});

app.post("/register", async (req: Request, res: Response) => {
    if (req.ip !== "127.0.0.1") {
        res.status(401).json({message: "Not authorized"})
        return;
    }
    const {username, password} = req.body;
    if (!username || !password) {
        res.status(401).json({message: "Identifiants invalides"});
        return;
    }
    if (await db.collection("users").findOne({username})) {
        res.status(401).json({message: "Pseudo déjà utilisé"});
        return;
    }
    const passwordHash = await bcrypt.hash(password, 15);
    await db.collection('users').insertOne({username, password: passwordHash});
    res.status(201).json({message: 'Utilisateur créé'});
});

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        status: 404
    });
});

app.listen(port, "0.0.0.0", async () => {
    console.log(`Now listening on ${port}`)
});
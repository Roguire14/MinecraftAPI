import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY!;

interface IUserPayload{
    username: string;
};

export const authMiddleWare = (req: Request, res: Response, next: NextFunction):void => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        res.status(401).json({message: "Token missing"});
        return;
    }
    const token = authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token, SECRET_KEY) as IUserPayload;
        req.body.user = decoded.username;
        next();
    }catch{
        res.status(401).json({message: "Invalid token"});
    }
};
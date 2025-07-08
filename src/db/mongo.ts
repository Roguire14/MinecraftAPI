import { MongoClient, Db } from "mongodb";

let mongoClient: MongoClient;
let db: Db;

const dbConnect = async () => {
    if(!process.env.MONGO_URL){
        throw new Error("Mongo URL is not definied");
    }
    try{
        mongoClient = new MongoClient(process.env.MONGO_URL);
        await mongoClient.connect();
        db = mongoClient.db("db")
        console.log(`MongoDB Connected`)
    }catch(err){
        console.error(err);
        process.exit(1);
    }
}

export {
    dbConnect,
    db,
    mongoClient
};
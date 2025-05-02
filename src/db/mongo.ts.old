import mongoose, { ConnectOptions } from "mongoose";

const clientOptions: ConnectOptions = {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  },
};

let dbInstance: mongoose.Connection["db"] | null = null;

export const dbConnect = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("Mongo URL not defined");
    }

    const conn = await mongoose.connect(process.env.MONGO_URL, clientOptions);
    
    if (mongoose.connection.db) {
      dbInstance = mongoose.connection.db;
      console.log(`MongoDb connected: ${conn.connection.host}`);
    }

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export const getInstance = () => {
  if (!dbInstance) {
    throw new Error("Database not connected. Call dbConnect() first.");
  }
  return dbInstance;
};
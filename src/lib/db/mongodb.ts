// src/lib/mongodb.ts

// src/lib/mongoose.ts

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const connectionOptions: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

async function createConnection(): Promise<typeof mongoose> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const connection = await mongoose.connect(
        MONGODB_URI!,
        connectionOptions,
      );
      console.log(`MongoDB connected (attempt ${attempt})`);
      return connection;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt} failed:`, error);

      if (attempt < 5) {
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
}

export default async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = createConnection();
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

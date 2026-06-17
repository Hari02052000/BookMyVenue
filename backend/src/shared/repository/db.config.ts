import mongoose from "mongoose";
import { InternalServerError } from "../errors";

const DEFAULT_MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/bookmyvenue";

export async function connectDatabase(uri: string = DEFAULT_MONGODB_URI) {
  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(uri);

    return mongoose.connection;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new InternalServerError(`Database connection failed: ${message}`);
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

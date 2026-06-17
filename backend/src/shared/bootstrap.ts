import { InternalServerError } from "./errors";
import { connectDatabase } from "./repository/db.config";

export async function bootstrap() {
  try {
    const connection = await connectDatabase();
    console.log("connected to db");
    return connection;
  } catch (error) {
    console.error(
      "Failed to connect to database:",
      error instanceof Error ? error.message : String(error)
    );
    throw new InternalServerError("Failed to connect to database");
  }
}

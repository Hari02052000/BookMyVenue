import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { bootstrap } from "./shared/bootstrap";
import { disconnectDatabase } from "./shared/repository/db.config";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
let server: ReturnType<typeof app.listen> | null = null;

async function startServer() {
	try {
		await bootstrap();

		server = app.listen(PORT, () => {
			console.log(`Server listening on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server due to bootstrap error:", error);
		process.exit(1);
	}
}

startServer();

async function gracefulShutdown(signal?: string) {
	try {
		console.log(`Received ${signal ?? "shutdown"}, closing server...`);

		if (server) {
			await new Promise<void>((resolve, reject) => {
				server!.close((err) => {
					if (err) return reject(err);
					resolve();
				});
			});
		}

		await disconnectDatabase();
		console.log("Shutdown complete");
		process.exit(0);
	} catch (err) {
		console.error("Error during shutdown:", err);
		process.exit(1);
	}
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

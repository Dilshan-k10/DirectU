import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(
    {
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    }
);

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Connected to the database successfully.");
    } catch (error) {
        console.error(`Error connecting to the database: ${error.message}`);
    }
};

const disconnectDB = async () => { };

export default prisma;
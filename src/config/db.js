import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(
    {
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    }
);

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Connected to the database successfully via Prisma.");
    } catch (error) {
        console.error(`Error connecting to the database: ${error.message}`);
        process.exit(1);
    }
};

const disconnectDB = async () => { 
    try {
        await prisma.$disconnect();
        console.log("Disconnected from the database successfully.");
    } catch (error) {
        console.error(`Error disconnecting from the database: ${error.message}`);
    }
};

export { prisma, connectDB, disconnectDB };
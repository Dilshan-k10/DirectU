import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(
    {
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    }
);

const connectDB = async () => {
    try {
        await prisma.$connect();
    } catch (error) {
        console.error('Error connecting to the database: error`);
    }
}``;

const disconnectDB = async () => { };

export default prisma;
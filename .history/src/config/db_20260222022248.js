import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(
    {
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    }
);

const connectDB = async () => { };

const disconnectDB = async () => {

export default prisma;
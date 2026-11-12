
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Instância única compartilhada por toda a aplicação
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!
});

export const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
});

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    const client = new PrismaClient();

    // Middleware to log slow queries (>300ms)
    client.$use(async (params, next) => {
        const start = Date.now();
        const result = await next(params);
        const duration = Date.now() - start;

        if (duration > 300) {
            console.warn("[SLOW QUERY]", {
                model: params.model,
                action: params.action,
                duration: `${duration}ms`,
                // Do NOT log params.args to avoid leaking sensitive user data
                timestamp: new Date().toISOString()
            });
        }

        return result;
    });

    return client;
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

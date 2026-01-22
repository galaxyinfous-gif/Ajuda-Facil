import { PrismaClient } from '@prisma/client';
import { config } from './env.js';
import { logger } from './logger.js';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
    });

if (!config.isProd) {
    globalForPrisma.prisma = prisma;
}

// Conectar ao banco de dados
export const connectDatabase = async () => {
    try {
        await prisma.$connect();
        logger.info('✅ Conectado ao banco de dados PostgreSQL');
    } catch (error) {
        logger.error('❌ Erro ao conectar ao banco de dados:', error);
        process.exit(1);
    }
};

// Desconectar do banco de dados
export const disconnectDatabase = async () => {
    await prisma.$disconnect();
    logger.info('🔌 Desconectado do banco de dados');
};

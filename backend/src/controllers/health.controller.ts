import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

/**
 * Health check endpoint
 */
export async function healthCheck(_req: Request, res: Response) {
    try {
        // Verificar conexão com banco de dados
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected',
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
        });
    }
}

/**
 * Informações básicas da API
 */
export function apiInfo(_req: Request, res: Response) {
    res.json({
        name: 'Ajuda Fácil API',
        version: '1.0.0',
        description: 'Backend do assistente WhatsApp para adultos 40+',
        endpoints: {
            health: '/health',
            webhook: '/webhook/whatsapp',
            status: '/webhook/twilio/status',
        },
    });
}

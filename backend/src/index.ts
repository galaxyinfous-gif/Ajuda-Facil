import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import routes from './routes/index.js';

// ============================================
// CRIAR APP EXPRESS
// ============================================
const app = express();

// ============================================
// MIDDLEWARES DE SEGURANÇA
// ============================================
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use(limiter);

// ============================================
// PARSING E LOGGING
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logging
if (config.isDev) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ============================================
// ROTAS
// ============================================
app.use('/', routes);

// ============================================
// ERROR HANDLER
// ============================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Erro não tratado:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: config.isDev ? err.message : undefined,
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ============================================
// INICIALIZAÇÃO
// ============================================
const startServer = async () => {
    try {
        // Conectar ao banco de dados
        await connectDatabase();

        // Iniciar servidor
        app.listen(config.server.port, () => {
            logger.info(`🚀 Ajuda Fácil rodando na porta ${config.server.port}`);
            logger.info(`📱 Webhook: ${config.server.apiUrl}/webhook/whatsapp`);
            logger.info(`🔧 Ambiente: ${config.isDev ? 'desenvolvimento' : 'produção'}`);
        });
    } catch (error) {
        logger.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Encerrando servidor...');
    await disconnectDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Encerrando servidor...');
    await disconnectDatabase();
    process.exit(0);
});

// Iniciar
startServer();

export default app;

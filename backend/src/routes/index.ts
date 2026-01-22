import { Router } from 'express';
import { healthCheck, apiInfo } from '../controllers/health.controller.js';
import webhookRoutes from './webhook.routes.js';

const router = Router();

// Health check
router.get('/health', healthCheck);

// API info
router.get('/', apiInfo);

// Webhook routes
router.use('/webhook', webhookRoutes);

export default router;

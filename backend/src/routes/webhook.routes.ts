import { Router } from 'express';
import {
    handleWhatsAppWebhook,
    handleStatusWebhook,
} from '../controllers/webhook.controller.js';

const router = Router();

// POST /webhook/whatsapp - Recebe mensagens do Twilio
router.post('/whatsapp', handleWhatsAppWebhook);

// POST /webhook/twilio/status - Recebe status de mensagens
router.post('/twilio/status', handleStatusWebhook);

export default router;

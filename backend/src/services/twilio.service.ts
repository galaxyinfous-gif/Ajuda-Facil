import twilio from 'twilio';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

// ============================================
// INTERFACES
// ============================================
export interface IncomingMessage {
    messageSid: string;
    from: string;
    to: string;
    body: string;
    numMedia: number;
    mediaUrl?: string;
    mediaContentType?: string;
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Envia uma mensagem de texto via WhatsApp
 */
export async function sendMessage(to: string, body: string): Promise<string> {
    try {
        logger.debug(`Enviando mensagem para ${to}: "${body.substring(0, 50)}..."`);

        const message = await client.messages.create({
            body,
            from: config.twilio.whatsappNumber,
            to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
        });

        logger.info(`✅ Mensagem enviada: ${message.sid}`);
        return message.sid;
    } catch (error) {
        logger.error('❌ Erro ao enviar mensagem:', error);
        throw error;
    }
}

/**
 * Envia uma mensagem com mídia (imagem, etc)
 */
export async function sendMediaMessage(
    to: string,
    body: string,
    mediaUrl: string
): Promise<string> {
    try {
        const message = await client.messages.create({
            body,
            from: config.twilio.whatsappNumber,
            to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
            mediaUrl: [mediaUrl],
        });

        logger.info(`✅ Mensagem com mídia enviada: ${message.sid}`);
        return message.sid;
    } catch (error) {
        logger.error('❌ Erro ao enviar mensagem com mídia:', error);
        throw error;
    }
}

/**
 * Parseia os dados do webhook do Twilio
 */
export function parseWebhookData(body: Record<string, string>): IncomingMessage {
    return {
        messageSid: body.MessageSid || '',
        from: body.From || '',
        to: body.To || '',
        body: body.Body || '',
        numMedia: parseInt(body.NumMedia || '0', 10),
        mediaUrl: body.MediaUrl0,
        mediaContentType: body.MediaContentType0,
    };
}

/**
 * Valida a assinatura do webhook do Twilio
 */
export function validateWebhook(
    signature: string,
    url: string,
    params: Record<string, string>
): boolean {
    if (!config.security.webhookSecret) {
        logger.warn('⚠️ WEBHOOK_SECRET não configurado, pulando validação');
        return true;
    }

    return twilio.validateRequest(
        config.twilio.authToken,
        signature,
        url,
        params
    );
}

/**
 * Verifica se a mensagem contém áudio
 */
export function isAudioMessage(message: IncomingMessage): boolean {
    return (
        message.numMedia > 0 &&
        !!message.mediaContentType &&
        message.mediaContentType.startsWith('audio/')
    );
}

/**
 * Extrai o número de telefone (sem prefixo whatsapp:)
 */
export function extractPhoneNumber(whatsappId: string): string {
    return whatsappId.replace('whatsapp:', '');
}

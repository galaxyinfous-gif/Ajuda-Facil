import { Request, Response } from 'express';
import { logger } from '../config/logger.js';
import { MessageRole, ConversationStatus } from '@prisma/client';
import {
    parseWebhookData,
    isAudioMessage,
    sendMessage,
    extractPhoneNumber,
} from '../services/twilio.service.js';
import {
    processMessage,
    transcribeAudio,
} from '../services/openai.service.js';
import {
    findOrCreateUser,
    getActiveConversation,
    saveMessage,
    getConversationHistory,
    updateConversation,
} from '../services/user.service.js';

/**
 * Controller principal do webhook do WhatsApp
 * Recebe mensagens do Twilio e processa com GPT-4
 */
export async function handleWhatsAppWebhook(req: Request, res: Response) {
    try {
        // 1. Parsear dados do webhook
        const incomingMessage = parseWebhookData(req.body);
        const phoneNumber = extractPhoneNumber(incomingMessage.from);

        logger.info(`📩 Mensagem de ${phoneNumber}: "${incomingMessage.body || '[MÍDIA]'}"`);

        // 2. Buscar ou criar usuário
        const user = await findOrCreateUser(phoneNumber);

        // 3. Buscar ou criar conversa ativa
        const conversation = await getActiveConversation(user.id);

        // 4. Processar mensagem
        let messageContent = incomingMessage.body;
        let transcription: string | undefined;

        // Se for áudio, transcrever primeiro
        if (isAudioMessage(incomingMessage) && incomingMessage.mediaUrl) {
            try {
                transcription = await transcribeAudio(incomingMessage.mediaUrl);
                messageContent = transcription;
                logger.info(`🎤 Transcrição: "${transcription}"`);
            } catch (error) {
                logger.error('Erro na transcrição:', error);
                await sendMessage(
                    incomingMessage.from,
                    'Opa, não consegui entender o áudio. 🎤 Pode mandar por escrito?'
                );
                return res.status(200).send('OK');
            }
        }

        // 5. Salvar mensagem do usuário
        await saveMessage(
            conversation.id,
            MessageRole.USER,
            incomingMessage.body || '[ÁUDIO]',
            {
                mediaUrl: incomingMessage.mediaUrl,
                mediaType: incomingMessage.mediaContentType,
                transcription,
            }
        );

        // 6. Buscar histórico da conversa para contexto
        const history = await getConversationHistory(conversation.id);

        // 7. Processar com GPT-4
        const aiResponse = await processMessage(messageContent, history);

        logger.debug(`🤖 Intenção: ${aiResponse.intent}, Precisa mais info: ${aiResponse.needs_more_info}`);

        // 8. Atualizar conversa com intenção detectada
        await updateConversation(conversation.id, {
            intent: aiResponse.intent,
            status: aiResponse.needs_more_info
                ? ConversationStatus.COLLECTING
                : ConversationStatus.ACTIVE,
            context: {
                ...((conversation.context as Record<string, unknown>) || {}),
                lastIntent: aiResponse.intent,
                entities: aiResponse.entities,
            },
        });

        // 9. Salvar resposta do assistente
        await saveMessage(conversation.id, MessageRole.ASSISTANT, aiResponse.response);

        // 10. Enviar resposta via WhatsApp
        await sendMessage(incomingMessage.from, aiResponse.response);

        // Responder ao Twilio
        res.status(200).send('OK');
    } catch (error) {
        logger.error('❌ Erro no webhook:', error);
        res.status(500).send('Erro interno');
    }
}

/**
 * Webhook para status de entrega de mensagens
 */
export async function handleStatusWebhook(req: Request, res: Response) {
    try {
        const { MessageSid, MessageStatus, To } = req.body;
        logger.debug(`📊 Status ${MessageStatus} para ${To} (${MessageSid})`);
        res.status(200).send('OK');
    } catch (error) {
        logger.error('Erro no status webhook:', error);
        res.status(500).send('Erro');
    }
}

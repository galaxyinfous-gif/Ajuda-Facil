import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { ConversationStatus, MessageRole } from '@prisma/client';

// ============================================
// USUÁRIOS
// ============================================

/**
 * Busca ou cria um usuário pelo número de telefone
 */
export async function findOrCreateUser(phoneNumber: string) {
    let user = await prisma.user.findUnique({
        where: { phoneNumber },
    });

    if (!user) {
        logger.info(`Criando novo usuário: ${phoneNumber}`);
        user = await prisma.user.create({
            data: { phoneNumber },
        });
    }

    return user;
}

/**
 * Atualiza o nome do usuário
 */
export async function updateUserName(userId: string, name: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { name },
    });
}

// ============================================
// CONVERSAS
// ============================================

/**
 * Busca ou cria uma conversa ativa para o usuário
 */
export async function getActiveConversation(userId: string) {
    // Procura conversa ativa (criada nas últimas 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let conversation = await prisma.conversation.findFirst({
        where: {
            userId,
            status: { not: ConversationStatus.COMPLETED },
            createdAt: { gte: oneDayAgo },
        },
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 10, // Últimas 10 mensagens para contexto
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
        logger.info(`Criando nova conversa para usuário: ${userId}`);
        conversation = await prisma.conversation.create({
            data: {
                userId,
                status: ConversationStatus.ACTIVE,
            },
            include: {
                messages: true,
            },
        });
    }

    return conversation;
}

/**
 * Atualiza o status e contexto da conversa
 */
export async function updateConversation(
    conversationId: string,
    data: {
        status?: ConversationStatus;
        intent?: string;
        context?: Record<string, unknown>;
    }
) {
    return prisma.conversation.update({
        where: { id: conversationId },
        data: {
            status: data.status,
            intent: data.intent,
            context: data.context,
        },
    });
}

// ============================================
// MENSAGENS
// ============================================

/**
 * Salva uma mensagem na conversa
 */
export async function saveMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
    metadata?: {
        mediaUrl?: string;
        mediaType?: string;
        transcription?: string;
    }
) {
    return prisma.message.create({
        data: {
            conversationId,
            role,
            content,
            mediaUrl: metadata?.mediaUrl,
            mediaType: metadata?.mediaType,
            transcription: metadata?.transcription,
        },
    });
}

/**
 * Busca o histórico de mensagens de uma conversa
 */
export async function getConversationHistory(conversationId: string, limit = 10) {
    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: limit,
    });

    return messages.map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.transcription || msg.content,
    }));
}

// ============================================
// PEDIDOS
// ============================================

/**
 * Cria um novo pedido
 */
export async function createOrder(
    userId: string,
    type: 'RIDE' | 'FOOD' | 'PHARMACY' | 'OTHER',
    provider: string,
    details: Record<string, unknown>
) {
    return prisma.order.create({
        data: {
            userId,
            type,
            provider,
            details,
        },
    });
}

/**
 * Atualiza o status de um pedido
 */
export async function updateOrderStatus(
    orderId: string,
    status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED',
    externalId?: string
) {
    return prisma.order.update({
        where: { id: orderId },
        data: {
            status,
            externalId,
        },
    });
}

/**
 * Busca pedidos recentes do usuário
 */
export async function getRecentOrders(userId: string, limit = 5) {
    return prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

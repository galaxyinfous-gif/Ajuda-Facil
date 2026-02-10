import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger.js';
import { prisma } from '../config/database.js';
import { sendMessage } from '../services/twilio.service.js';

const registerSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    whatsapp: z.string().min(10, 'WhatsApp inválido'),
    email: z.string().email('Email inválido'),
    plano: z.enum(['basico', 'completo']).default('basico'),
});

/**
 * Registra um novo lead/usuário vindo do formulário do site
 */
export async function handleRegister(req: Request, res: Response) {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: parsed.error.flatten().fieldErrors,
            });
        }

        const { nome, whatsapp, email, plano } = parsed.data;

        // Limpar número de telefone (só dígitos)
        const cleanPhone = whatsapp.replace(/\D/g, '');
        const phoneNumber = cleanPhone.startsWith('55') ? `+${cleanPhone}` : `+55${cleanPhone}`;

        logger.info(`📝 Novo cadastro: ${nome} - ${phoneNumber} - ${email} - Plano: ${plano}`);

        // Verificar se já existe
        let user = await prisma.user.findUnique({
            where: { phoneNumber },
        });

        if (user) {
            // Atualizar dados
            user = await prisma.user.update({
                where: { phoneNumber },
                data: { name: nome, email, plan: plano },
            });
            logger.info(`Usuário atualizado: ${user.id}`);
        } else {
            // Criar novo usuário
            user = await prisma.user.create({
                data: {
                    phoneNumber,
                    name: nome,
                    email,
                    plan: plano,
                },
            });
            logger.info(`Novo usuário criado: ${user.id}`);
        }

        // Tentar enviar mensagem de boas-vindas via WhatsApp
        try {
            const welcomeMessage = `Olá, ${nome}! 👋\n\nBem-vindo(a) ao *Ajuda Fácil*! 🎉\n\nVocê escolheu o plano *${plano === 'completo' ? 'Completo' : 'Básico'}*.\n\nAgora é só me dizer o que precisa:\n🚗 Pedir um Uber\n🍕 Pedir comida\n💊 Comprar remédio\n⏰ Criar um lembrete\n\nÉ só mandar uma mensagem ou áudio! 😊`;

            await sendMessage(phoneNumber, welcomeMessage);
            logger.info(`✅ Mensagem de boas-vindas enviada para ${phoneNumber}`);
        } catch (msgError) {
            logger.warn(`⚠️ Não foi possível enviar mensagem de boas-vindas: ${msgError}`);
            // Não falhar o cadastro por causa disso
        }

        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso!',
            user: {
                id: user.id,
                name: user.name,
                plan: user.plan,
            },
        });
    } catch (error) {
        logger.error('❌ Erro no cadastro:', error);
        res.status(500).json({
            error: 'Erro ao processar cadastro. Tente novamente.',
        });
    }
}

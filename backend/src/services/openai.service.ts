import OpenAI from 'openai';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const openai = new OpenAI({
    apiKey: config.openai.apiKey,
});

// ============================================
// SYSTEM PROMPT - Contexto do Ajuda Fácil
// ============================================
const SYSTEM_PROMPT = `Você é o Ajuda Fácil, um assistente virtual brasileiro que ajuda pessoas 40+ a usarem serviços pelo WhatsApp.

PERSONALIDADE:
- Muito simpático, acolhedor e paciente
- Usa linguagem simples, sem termos técnicos
- Usa emojis com moderação (1-2 por mensagem)
- Fala como um amigo prestativo

SERVIÇOS DISPONÍVEIS:
- 🚗 Transporte: Uber, 99
- 🍕 Delivery: iFood, restaurantes
- 💊 Farmácia: compra de remédios
- ⏰ Lembretes: medicação, compromissos

REGRAS:
1. SEMPRE confirme antes de executar ações
2. Se não entender, peça para repetir gentilmente
3. Responda em português brasileiro coloquial
4. Mantenha respostas curtas (máx 3 parágrafos)
5. Quando apresentar opções, use no máximo 3

FORMATO DE RESPOSTA:
Responda em JSON com a seguinte estrutura:
{
  "intent": "ride|food|pharmacy|reminder|greeting|help|unknown",
  "entities": {
    "destination": "string ou null",
    "origin": "string ou null", 
    "item": "string ou null",
    "time": "string ou null"
  },
  "needs_more_info": boolean,
  "missing_info": ["lista de informações que faltam"],
  "response": "mensagem para enviar ao usuário"
}`;

// ============================================
// INTERFACES
// ============================================
export interface AIResponse {
    intent: 'ride' | 'food' | 'pharmacy' | 'reminder' | 'greeting' | 'help' | 'unknown';
    entities: {
        destination?: string;
        origin?: string;
        item?: string;
        time?: string;
    };
    needs_more_info: boolean;
    missing_info: string[];
    response: string;
}

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Processa uma mensagem de texto com GPT-4
 */
export async function processMessage(
    userMessage: string,
    conversationHistory: ConversationMessage[] = []
): Promise<AIResponse> {
    try {
        logger.debug(`Processando mensagem: "${userMessage}"`);

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory.map((msg) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            { role: 'user', content: userMessage },
        ];

        const completion = await openai.chat.completions.create({
            model: config.openai.model,
            messages,
            max_tokens: 500,
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content || '';
        logger.debug(`Resposta GPT: ${responseText}`);

        const parsed = JSON.parse(responseText) as AIResponse;
        return parsed;
    } catch (error) {
        logger.error('Erro ao processar mensagem com GPT:', error);

        // Retorna resposta de fallback
        return {
            intent: 'unknown',
            entities: {},
            needs_more_info: false,
            missing_info: [],
            response: 'Desculpa, tive um probleminha. 😅 Pode repetir o que você precisa?',
        };
    }
}

/**
 * Transcreve um arquivo de áudio com Whisper
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
    try {
        logger.debug(`Transcrevendo áudio: ${audioUrl}`);

        // Baixar o áudio do Twilio
        const response = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            auth: {
                username: config.twilio.accountSid,
                password: config.twilio.authToken,
            },
        });

        // Salvar temporariamente
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempPath = path.join(tempDir, `audio_${Date.now()}.ogg`);
        fs.writeFileSync(tempPath, response.data);

        // Transcrever com Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: config.openai.whisperModel,
            language: 'pt',
        });

        // Limpar arquivo temporário
        fs.unlinkSync(tempPath);

        logger.info(`Transcrição: "${transcription.text}"`);
        return transcription.text;
    } catch (error) {
        logger.error('Erro ao transcrever áudio:', error);
        throw new Error('Não consegui entender o áudio. Pode repetir por texto?');
    }
}

/**
 * Gera uma resposta simples (sem análise de intenção)
 */
export async function generateSimpleResponse(
    prompt: string,
    context?: string
): Promise<string> {
    try {
        const systemMessage = context
            ? `${SYSTEM_PROMPT}\n\nCONTEXTO ADICIONAL: ${context}`
            : SYSTEM_PROMPT;

        const completion = await openai.chat.completions.create({
            model: config.openai.model,
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt },
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        return completion.choices[0]?.message?.content || 'Desculpa, não entendi.';
    } catch (error) {
        logger.error('Erro ao gerar resposta:', error);
        return 'Desculpa, tive um probleminha. 😅';
    }
}

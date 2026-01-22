import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    API_URL: z.string().default('http://localhost:3000'),

    // Database
    DATABASE_URL: z.string(),

    // Twilio
    TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
    TWILIO_AUTH_TOKEN: z.string().min(32),
    TWILIO_WHATSAPP_NUMBER: z.string().startsWith('whatsapp:'),

    // OpenAI
    OPENAI_API_KEY: z.string().startsWith('sk-'),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    OPENAI_WHISPER_MODEL: z.string().default('whisper-1'),

    // Security
    WEBHOOK_SECRET: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

    // Redis
    REDIS_URL: z.string().optional(),
});

const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        console.error(parsed.error.flatten().fieldErrors);
        throw new Error('Invalid environment variables');
    }

    return parsed.data;
};

export const env = parseEnv();

export const config = {
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',

    server: {
        port: parseInt(env.PORT, 10),
        apiUrl: env.API_URL,
    },

    database: {
        url: env.DATABASE_URL,
    },

    twilio: {
        accountSid: env.TWILIO_ACCOUNT_SID,
        authToken: env.TWILIO_AUTH_TOKEN,
        whatsappNumber: env.TWILIO_WHATSAPP_NUMBER,
    },

    openai: {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        whisperModel: env.OPENAI_WHISPER_MODEL,
    },

    security: {
        webhookSecret: env.WEBHOOK_SECRET,
        rateLimitWindowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
        rateLimitMaxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
    },

    logging: {
        level: env.LOG_LEVEL,
    },

    redis: {
        url: env.REDIS_URL,
    },
};

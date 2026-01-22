# Guia de Setup Técnico - Ajuda Fácil
## Twilio WhatsApp + OpenAI GPT-4/Whisper

---

## 📋 VISÃO GERAL

| Serviço | Função | Custo Estimado (10k msg/mês) |
|---------|--------|------------------------------|
| Twilio WhatsApp | Enviar/receber mensagens | ~$50-100/mês |
| OpenAI GPT-4 | Processar texto | ~$20-50/mês |
| OpenAI Whisper | Transcrever áudio | ~$5-15/mês |
| **Total** | | **~$75-165/mês** |

---

# PARTE 1: TWILIO

## 1.1 Criar Conta Twilio

### Passo 1: Acessar o site
1. Acesse: **https://www.twilio.com/try-twilio**
2. Clique em **"Sign up"**

### Passo 2: Preencher cadastro
- **Email** — Seu email profissional
- **First Name / Last Name** — Seu nome
- **Password** — Mínimo 14 caracteres
- **Phone Number** — Seu celular (verificação)

### Passo 3: Verificar conta
1. Você receberá um SMS com código
2. Digite o código na tela
3. Responda o questionário inicial:
   - "Which Twilio product are you here to use?" → **WhatsApp**
   - "What do you plan to build?" → **Customer Messaging**
   - "How do you prefer to build?" → **With code**
   - "What is your goal today?" → **Build something new**

### Passo 4: Anotar credenciais
Após criar a conta, vá em **Account → Account Info**:
- **Account SID** — Começa com "AC..."
- **Auth Token** — Clique em "Show" para ver

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 1.2 Configurar WhatsApp Business API

### Opção A: Sandbox (Desenvolvimento/Teste)

> ⚠️ **Sandbox é gratuito mas limitado:** só funciona com números que você ativar manualmente.

1. No console Twilio, vá em **Messaging → Try it out → Send a WhatsApp message**
2. Você verá um número sandbox: `+1 415 523 8886`
3. O usuário precisa enviar uma mensagem de ativação:
   ```
   join <código-sandbox>
   ```
4. Configure o webhook (próxima seção)

### Opção B: Número Próprio (Produção)

> 💡 **Para produção real, você precisa de um número próprio.**

1. Vá em **Messaging → Senders → WhatsApp senders**
2. Clique em **"Request to enable your numbers"**
3. Preencha o formulário:
   - Business name
   - Business website
   - Use case description
4. Aguarde aprovação (1-3 dias úteis)
5. Após aprovado, compre um número Twilio ou use seu número existente

### Configurar Webhook

1. Vá em **Messaging → Settings → WhatsApp sandbox settings**
2. Em **"When a message comes in"**, configure:
   ```
   https://seu-servidor.com/webhook/whatsapp
   ```
3. Method: **POST**
4. Clique em **Save**

---

## 1.3 Estimativa de Custos Twilio

| Item | Preço | 10k msgs/mês |
|------|-------|--------------|
| Mensagem enviada (Template) | $0.005/msg | $50 |
| Mensagem enviada (Session) | $0.005/msg | $50 |
| Mensagem recebida | Gratuito | $0 |
| Número WhatsApp | $1/mês | $1 |
| **Total WhatsApp** | | **~$50-100** |

> 📝 **Nota:** Preços podem variar por país. Sessão = resposta dentro de 24h.

---

# PARTE 2: OPENAI

## 2.1 Criar Conta OpenAI

### Passo 1: Acessar o site
1. Acesse: **https://platform.openai.com/signup**
2. Clique em **"Sign up"**

### Passo 2: Criar conta
- Use **Google**, **Microsoft**, ou **Email**
- Verifique seu email
- Complete o cadastro com número de telefone

### Passo 3: Adicionar créditos
1. Vá em **Settings → Billing**
2. Clique em **"Add payment method"**
3. Adicione cartão de crédito
4. Compre créditos iniciais ($10-50 para começar)

---

## 2.2 Obter API Keys

### Passo 1: Criar API Key
1. Vá em **API Keys**: https://platform.openai.com/api-keys
2. Clique em **"Create new secret key"**
3. Dê um nome: `ajuda-facil-production`
4. Clique em **"Create secret key"**
5. **COPIE IMEDIATAMENTE** — ela só aparece uma vez!

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Modelos disponíveis

| Modelo | Uso | Preço (por 1M tokens) |
|--------|-----|----------------------|
| **gpt-4o** | Texto (recomendado) | $2.50 input / $10 output |
| **gpt-4o-mini** | Texto (mais barato) | $0.15 input / $0.60 output |
| **whisper-1** | Transcrição de áudio | $0.006/minuto |

---

## 2.3 Estimativa de Custos OpenAI

Para 10.000 mensagens/mês:

| Item | Cálculo | Custo |
|------|---------|-------|
| GPT-4o-mini (texto) | 10k msgs × 200 tokens × 2 | ~$6/mês |
| Whisper (30% áudio) | 3k áudios × 10s média | ~$3/mês |
| **Total OpenAI** | | **~$9-20/mês** |

> 💡 Usando gpt-4o-mini você economiza muito. Para interações simples, é suficiente.

---

# PARTE 3: CÓDIGO NODE.JS

## 3.1 Setup do Projeto

```bash
# Criar pasta do projeto
mkdir ajuda-facil-bot
cd ajuda-facil-bot

# Inicializar Node.js
npm init -y

# Instalar dependências
npm install express twilio openai dotenv axios
```

## 3.2 Arquivo de Configuração

Crie o arquivo `.env`:

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server
PORT=3000
```

## 3.3 Código Principal

Crie o arquivo `index.js`:

```javascript
require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Inicializar clientes
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Contexto do sistema para o GPT
const SYSTEM_PROMPT = `Você é o Ajuda Fácil, um assistente virtual brasileiro que ajuda pessoas 40+ a usarem serviços pelo WhatsApp.

Você pode ajudar com:
- 🚗 Pedir Uber ou 99
- 🍕 Pedir comida por delivery
- 💊 Comprar remédios na farmácia
- ⏰ Criar lembretes

Regras:
1. Seja MUITO simpático e acolhedor
2. Use linguagem simples, sem termos técnicos
3. Use emojis com moderação
4. Confirme sempre antes de fazer algo
5. Se não entender, peça para repetir de forma gentil
6. Responda em português brasileiro coloquial`;

// Armazenar histórico de conversas (em produção, use Redis ou banco de dados)
const conversationHistory = new Map();

// Webhook para receber mensagens do WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
    try {
        const { Body, From, MediaUrl0, MediaContentType0 } = req.body;
        
        console.log(`📩 Mensagem de ${From}: ${Body || '[MÍDIA]'}`);
        
        let userMessage = Body;
        
        // Se for áudio, transcrever com Whisper
        if (MediaContentType0 && MediaContentType0.startsWith('audio/')) {
            userMessage = await transcribeAudio(MediaUrl0);
            console.log(`🎤 Transcrição: ${userMessage}`);
        }
        
        // Processar com GPT
        const response = await processWithGPT(From, userMessage);
        
        // Enviar resposta via WhatsApp
        await sendWhatsAppMessage(From, response);
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).send('Erro');
    }
});

// Transcrever áudio com Whisper
async function transcribeAudio(audioUrl) {
    try {
        // Baixar o áudio
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            auth: {
                username: process.env.TWILIO_ACCOUNT_SID,
                password: process.env.TWILIO_AUTH_TOKEN
            }
        });
        
        // Criar arquivo temporário
        const fs = require('fs');
        const tempPath = `/tmp/audio_${Date.now()}.ogg`;
        fs.writeFileSync(tempPath, audioResponse.data);
        
        // Transcrever com Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: 'whisper-1',
            language: 'pt'
        });
        
        // Limpar arquivo temporário
        fs.unlinkSync(tempPath);
        
        return transcription.text;
    } catch (error) {
        console.error('Erro na transcrição:', error);
        return '[Não consegui entender o áudio. Pode repetir por texto?]';
    }
}

// Processar mensagem com GPT
async function processWithGPT(userId, message) {
    // Recuperar histórico da conversa
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
    }
    
    const history = conversationHistory.get(userId);
    
    // Adicionar mensagem do usuário
    history.push({ role: 'user', content: message });
    
    // Limitar histórico a últimas 10 mensagens
    if (history.length > 20) {
        history.splice(0, history.length - 20);
    }
    
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...history
            ],
            max_tokens: 500,
            temperature: 0.7
        });
        
        const response = completion.choices[0].message.content;
        
        // Adicionar resposta ao histórico
        history.push({ role: 'assistant', content: response });
        
        return response;
    } catch (error) {
        console.error('Erro no GPT:', error);
        return 'Desculpa, tive um probleminha aqui. 😅 Pode tentar de novo?';
    }
}

// Enviar mensagem via WhatsApp
async function sendWhatsAppMessage(to, message) {
    try {
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: to
        });
        console.log(`✅ Resposta enviada para ${to}`);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Ajuda Fácil rodando na porta ${PORT}`);
    console.log(`📱 Webhook: http://localhost:${PORT}/webhook/whatsapp`);
});
```

## 3.4 Executar o Bot

```bash
# Desenvolvimento
node index.js

# Ou com nodemon (auto-reload)
npm install -g nodemon
nodemon index.js
```

## 3.5 Expor para Internet (Desenvolvimento)

Para testes locais, use ngrok:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000
```

Copie a URL gerada (ex: `https://abc123.ngrok.io`) e configure no Twilio:
```
https://abc123.ngrok.io/webhook/whatsapp
```

---

# PARTE 4: DEPLOY EM PRODUÇÃO

## Opções de Hosting

| Plataforma | Custo | Recomendação |
|------------|-------|--------------|
| **Railway** | $5/mês | ⭐ Mais fácil para Node.js |
| **Render** | Grátis-$7/mês | Bom custo-benefício |
| **Heroku** | $7/mês | Popular, fácil |
| **DigitalOcean** | $5/mês | Mais controle |

## Deploy no Railway (Recomendado)

1. Acesse: https://railway.app
2. Conecte com GitHub
3. Importe seu repositório
4. Configure as variáveis de ambiente (`.env`)
5. Deploy automático!

---

# CHECKLIST DE LANÇAMENTO

- [ ] Conta Twilio criada e verificada
- [ ] Número WhatsApp configurado
- [ ] Webhook funcionando
- [ ] Conta OpenAI com créditos
- [ ] API keys configuradas
- [ ] Código testado localmente
- [ ] Deploy em produção
- [ ] Testes com usuários reais

---

## 🔗 Links Úteis

- **Twilio Console:** https://console.twilio.com
- **Twilio WhatsApp Docs:** https://www.twilio.com/docs/whatsapp
- **OpenAI Platform:** https://platform.openai.com
- **OpenAI API Docs:** https://platform.openai.com/docs

---

*Guia criado para o projeto Ajuda Fácil - Setup Técnico*

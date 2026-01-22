# 🤖 Ajuda Fácil - Backend

Backend do assistente WhatsApp para adultos 40+ no Brasil.

## 📋 Funcionalidades

- ✅ Receber mensagens WhatsApp via Twilio
- ✅ Transcrever áudio com OpenAI Whisper
- ✅ Processar intenções com GPT-4
- ✅ Responder automaticamente no WhatsApp
- ✅ Persistência com PostgreSQL + Prisma

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Linguagem | TypeScript |
| Banco de Dados | PostgreSQL 15 |
| ORM | Prisma |
| Cache | Redis |
| WhatsApp | Twilio API |
| IA | OpenAI GPT-4 + Whisper |

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Conta Twilio com WhatsApp sandbox
- Conta OpenAI com API key

### 1. Clonar e Instalar

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Iniciar com Docker Compose

```bash
# Subir PostgreSQL e Redis
docker-compose up -d db redis

# Aguardar banco estar pronto
sleep 5

# Rodar migrations
npm run db:push

# Iniciar aplicação
npm run dev
```

Ou tudo de uma vez:

```bash
docker-compose up
```

### 4. Configurar Webhook no Twilio

1. Use ngrok para expor sua porta local:
   ```bash
   npx ngrok http 3000
   ```

2. No console Twilio, configure o webhook:
   - URL: `https://SEU-NGROK.ngrok.io/webhook/whatsapp`
   - Method: POST

### 5. Testar

Envie uma mensagem para o número sandbox do Twilio e veja a mágica acontecer! ✨

## 📂 Estrutura de Pastas

```
backend/
├── src/
│   ├── config/           # Configurações
│   │   ├── env.ts        # Variáveis de ambiente
│   │   ├── logger.ts     # Winston logger
│   │   └── database.ts   # Prisma client
│   │
│   ├── controllers/      # Controllers
│   │   ├── webhook.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── services/         # Lógica de negócio
│   │   ├── openai.service.ts   # GPT-4 + Whisper
│   │   ├── twilio.service.ts   # WhatsApp
│   │   └── user.service.ts     # Usuários/Conversas
│   │
│   ├── routes/           # Rotas
│   │   ├── webhook.routes.ts
│   │   └── index.ts
│   │
│   └── index.ts          # Entry point
│
├── prisma/
│   └── schema.prisma     # Schema do banco
│
├── docker-compose.yml    # Containers
├── Dockerfile            # Build production
├── package.json
└── tsconfig.json
```

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia em modo desenvolvimento (hot reload) |
| `npm run build` | Compila TypeScript |
| `npm start` | Inicia versão compilada |
| `npm run db:push` | Sincroniza schema com banco |
| `npm run db:migrate` | Cria migration |
| `npm run db:studio` | Abre Prisma Studio (admin) |
| `npm test` | Roda testes |

## 📊 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Info da API |
| GET | `/health` | Health check |
| POST | `/webhook/whatsapp` | Recebe mensagens Twilio |
| POST | `/webhook/twilio/status` | Status de entrega |

## 🐳 Docker

### Desenvolvimento

```bash
# Subir todos os serviços
docker-compose up

# Subir apenas banco e redis
docker-compose up -d db redis

# Ver logs
docker-compose logs -f app

# Parar tudo
docker-compose down
```

### Prisma Studio (Admin do Banco)

```bash
docker-compose --profile tools up prisma-studio
# Acesse: http://localhost:5555
```

## 🧪 Testando Localmente

1. **Sem Twilio (mock):**
   ```bash
   curl -X POST http://localhost:3000/webhook/whatsapp \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "From=whatsapp:+5511999999999&Body=Quero pedir um uber"
   ```

2. **Com ngrok:**
   ```bash
   npx ngrok http 3000
   # Configure a URL no Twilio Sandbox
   ```

## 📝 Fluxo de Mensagem

```
1. Usuário envia mensagem → Twilio
2. Twilio chama webhook → /webhook/whatsapp
3. Se áudio → Whisper transcreve
4. Texto → GPT-4 analisa intenção
5. Resposta → Twilio → Usuário
```

## 🔐 Segurança

- ✅ Helmet (headers seguros)
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validação de webhook Twilio
- ✅ Variáveis de ambiente validadas (Zod)

## 📈 Próximos Passos

- [ ] Integração 99 (transporte)
- [ ] Integração iFood (delivery)
- [ ] Sistema de lembretes
- [ ] Dashboard admin
- [ ] Testes automatizados
- [ ] Deploy AWS/Railway

## 📄 Licença

Privado - Ajuda Fácil © 2026

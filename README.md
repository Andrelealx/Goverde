# Goverde — Gestão ambiental para municípios

SaaS multi-tenant para Secretarias de Meio Ambiente de municípios brasileiros.

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm 10+

## Setup local

```bash
# 1. Clone e instale dependências
git clone https://github.com/seu-usuario/goverde.git
cd goverde
npm install

# 2. Suba o banco de dados
docker-compose up -d db

# 3. Configure variáveis de ambiente da API
cp apps/api/.env.example apps/api/.env
# Edite apps/api/.env com suas configurações

# 4. Execute migrations e seed
npm run db:migrate
npm run db:seed

# 5. Inicie todos os serviços em desenvolvimento
npm run dev
```

## URLs locais

| Serviço | URL |
|---------|-----|
| API | http://localhost:3000 |
| Painel interno | http://localhost:5173 |
| Portal público | http://localhost:5174 |
| API Health | http://localhost:3000/health |

## Credenciais de teste (seed)

| Usuário | E-mail | Senha |
|---------|--------|-------|
| Secretário | admin@guapimirim.goverde.com.br | admin123 |
| Fiscal | fiscal@guapimirim.goverde.com.br | fiscal123 |

## Estrutura de pastas

```
goverde/
├── apps/
│   ├── api/          # Node.js + Express + Prisma (porta 3000)
│   ├── web/          # Painel interno — React + Vite (porta 5173)
│   └── portal/       # Portal do cidadão — React + Vite (porta 5174)
├── packages/
│   └── shared/       # Tipos TypeScript e schemas Zod compartilhados
├── docker-compose.yml
├── railway.toml
└── package.json      # Workspaces root
```

## Como criar novo tenant

Adicione ao arquivo `apps/api/prisma/seed.ts` um novo bloco `prisma.tenant.upsert` com os dados do município e execute `npm run db:seed`.

Ou via Prisma Studio:

```bash
npm run db:studio
```

## Deploy no Railway

### Passo a passo

1. Crie uma conta em [railway.app](https://railway.app)

2. Instale a CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. Crie novo projeto:
   ```bash
   railway new
   ```

4. Adicione um banco PostgreSQL:
   - No dashboard Railway, clique em **New > Database > PostgreSQL**
   - Anote a `DATABASE_URL` gerada

5. Deploy dos serviços:
   ```bash
   railway up
   ```

6. Configure as variáveis de ambiente para cada service no dashboard Railway:

   **goverde-api:**
   ```
   DATABASE_URL=<valor do PostgreSQL plugin>
   JWT_SECRET=<secret forte — mínimo 32 chars>
   JWT_REFRESH_SECRET=<outro secret forte>
   NODE_ENV=production
   UPLOAD_STORAGE=local
   CORS_ORIGINS=https://seu-dominio-web.railway.app,https://seu-dominio-portal.railway.app
   ```

   **goverde-web:**
   ```
   VITE_API_URL=https://goverde-api.railway.app
   VITE_PORTAL_URL=https://goverde-portal.railway.app
   ```

   **goverde-portal:**
   ```
   VITE_API_URL=https://goverde-api.railway.app
   VITE_TENANT_SLUG=guapimirim
   ```

7. Execute migrations em produção:
   ```bash
   railway run --service goverde-api npx prisma migrate deploy
   railway run --service goverde-api npm run db:seed
   ```

### Domínio customizado

No dashboard de cada service: **Settings > Domains > Custom Domain**, configure o CNAME para o subdomínio desejado (ex: `app.goverde.com.br`, `portal.goverde.com.br`).

## Funcionalidades do MVP

- **Multi-tenant** — cada município tem seus próprios dados isolados
- **Ocorrências** — registro, triagem, atribuição a fiscais e histórico de status
- **Licenças ambientais** — workflow completo com controle de vencimento
- **Vistorias** — agendamento e controle por fiscal
- **Dashboard** — KPIs e gráficos por mês e categoria
- **Relatórios** — exportação por período e status
- **Portal público** — denúncia por cidadão em 4 etapas + consulta por protocolo
- **JWT + Refresh Token** — autenticação segura com rotação automática

## Tecnologias

| Camada | Tech |
|--------|------|
| Backend | Node.js 20 + Express + TypeScript |
| ORM | Prisma + PostgreSQL |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Auth | JWT (access 8h) + Refresh Token httpOnly (30d) |
| Upload | Multer local / Cloudflare R2 |
| Validação | Zod (shared entre frontend e backend) |
| Estado | Zustand |
| Gráficos | Recharts |
| Deploy | Railway |

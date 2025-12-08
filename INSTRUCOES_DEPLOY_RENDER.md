# 🚀 INSTRUÇÕES - Deploy Backend TROIA no Render.com
## Guia Completo para Deploy em Produção

**Data:** Janeiro 2025  
**Status:** ✅ **PRONTO PARA DEPLOY**

---

## 📋 PRÉ-REQUISITOS

1. Conta no Render.com (gratuita)
2. Repositório Git (GitHub, GitLab, etc.)
3. Backend do TROIA no repositório

---

## 🔧 PASSO 1: PREPARAR O REPOSITÓRIO

### 1.1. Verificar Arquivos Necessários

Certifique-se de que os seguintes arquivos estão no repositório:

- ✅ `backend/render.yaml`
- ✅ `backend/package.json` (com `pg` nas dependências)
- ✅ `backend/src/index.js` (atualizado)
- ✅ `backend/src/database/postgres.js`
- ✅ `backend/src/migrations-postgres.js`
- ✅ `backend/.env.example`

### 1.2. Commitar e Fazer Push

```bash
cd backend
git add .
git commit -m "Preparar backend para deploy no Render.com"
git push origin main
```

---

## 🗄️ PASSO 2: CRIAR BANCO POSTGRESQL NO RENDER

### 2.1. Acessar Render Dashboard

1. Acesse: https://dashboard.render.com
2. Faça login na sua conta

### 2.2. Criar Novo Banco de Dados PostgreSQL

1. Clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `troia-db`
   - **Database:** `troia`
   - **User:** `troia_user`
   - **Region:** `Oregon` (ou mais próximo)
   - **Plan:** `Free` (para começar)
3. Clique em **"Create Database"**

### 2.3. Obter Connection String

1. Após criar o banco, acesse o dashboard do banco
2. Na seção **"Connections"**, copie a **"Internal Database URL"**
   - Formato: `postgresql://user:password@host:port/database`
3. **Guarde esta URL** - será usada no próximo passo

---

## 🌐 PASSO 3: CRIAR SERVIÇO WEB NO RENDER

### 3.1. Criar Novo Web Service

1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório Git:
   - Selecione o repositório do TROIA
   - Branch: `main` (ou `master`)

### 3.2. Configurar o Serviço

**Basic Settings:**
- **Name:** `troia-backend`
- **Region:** `Oregon` (ou mesmo do banco)
- **Branch:** `main`
- **Root Directory:** `backend` (importante!)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node src/index.js`

**Environment Variables:**
Clique em **"Add Environment Variable"** e adicione:

| Key | Value | Descrição |
|-----|-------|-----------|
| `NODE_ENV` | `production` | Ambiente de produção |
| `PORT` | *(deixar vazio - Render fornece)* | Porta do servidor |
| `DATABASE_URL` | *(cole a Internal Database URL do passo 2.3)* | URL do PostgreSQL |
| `JWT_SECRET` | *(gere uma string aleatória longa)* | Secret para JWT |
| `CORS_ORIGIN` | `*` | Origens permitidas (ou lista específica) |
| `OPENAI_API_KEY` | *(sua chave OpenAI, se tiver)* | Chave da API OpenAI |

**Gerar JWT_SECRET:**
```bash
# No terminal, gere uma string aleatória:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.3. Criar o Serviço

1. Clique em **"Create Web Service"**
2. O Render começará a fazer o build automaticamente

---

## ⚙️ PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 4.1. Acessar Environment Variables

1. No dashboard do serviço web, vá em **"Environment"**
2. Verifique se todas as variáveis estão configuradas:

### 4.2. Variáveis Obrigatórias

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=sua-chave-secreta-aqui
CORS_ORIGIN=*
```

### 4.3. Variáveis Opcionais

```env
OPENAI_API_KEY=sk-your-key-here  # Apenas se usar OCR
```

### 4.4. Atualizar DATABASE_URL

**IMPORTANTE:** Se você criou o banco antes do serviço web:

1. No dashboard do banco PostgreSQL, copie a **"Internal Database URL"**
2. No dashboard do serviço web, vá em **"Environment"**
3. Atualize a variável `DATABASE_URL` com a URL copiada
4. Clique em **"Save Changes"**
5. O serviço será reiniciado automaticamente

---

## 🧪 PASSO 5: TESTAR API EM PRODUÇÃO

### 5.1. Obter URL do Serviço

1. No dashboard do serviço web, copie a URL
   - Formato: `https://troia-backend.onrender.com`

### 5.2. Testar Endpoints

**Teste de Health:**
```bash
curl https://troia-backend.onrender.com/
```

**Teste de Registro:**
```bash
curl -X POST https://troia-backend.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "email": "teste@exemplo.com",
    "senha": "senha123"
  }'
```

**Teste de Login:**
```bash
curl -X POST https://troia-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "senha": "senha123"
  }'
```

### 5.3. Verificar Logs

1. No dashboard do serviço, vá em **"Logs"**
2. Verifique se há erros
3. Procure por:
   - ✅ "Conectado ao PostgreSQL"
   - ✅ "Migrações concluídas com sucesso"
   - ✅ "Servidor rodando na porta XXXX"

---

## 📱 PASSO 6: CONFIGURAR FRONTEND PARA PRODUÇÃO

### 6.1. Atualizar api.js

Abra `app-frontend/services/api.js` e atualize:

```javascript
// URL de produção do backend no Render.com
const PRODUCTION_URL = 'https://troia-backend.onrender.com'; // ATUALIZE AQUI
```

### 6.2. Atualizar app.json (Opcional)

Se quiser definir a URL no `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://troia-backend.onrender.com"
    }
  }
}
```

### 6.3. Testar Frontend

1. Execute o app:
   ```bash
   cd app-frontend
   npm start
   ```

2. Teste:
   - Login
   - Registro
   - Upload de imagens
   - Todas as funcionalidades

---

## 🔍 TROUBLESHOOTING

### Erro: "DATABASE_URL não configurada"

**Solução:**
1. Verifique se a variável `DATABASE_URL` está configurada no Render
2. Use a **"Internal Database URL"** (não a externa)
3. Reinicie o serviço após atualizar

### Erro: "Cannot connect to PostgreSQL"

**Solução:**
1. Verifique se o banco está rodando
2. Verifique se a URL está correta
3. Certifique-se de usar a **"Internal Database URL"**

### Erro: "CORS policy"

**Solução:**
1. Verifique a variável `CORS_ORIGIN`
2. Para desenvolvimento, use `*`
3. Para produção, liste origens específicas:
   ```
   CORS_ORIGIN=https://seu-app.expo.dev,exp://*,http://localhost:8081
   ```

### Erro: "Build failed"

**Solução:**
1. Verifique os logs do build
2. Certifique-se de que `pg` está no `package.json`
3. Verifique se o `Root Directory` está como `backend`

### Imagens não carregam

**Solução:**
1. Verifique se a pasta `uploads` existe
2. Verifique se o caminho está correto
3. Em produção, as imagens são servidas via:
   `https://troia-backend.onrender.com/uploads/nome-arquivo.jpg`

---

## 📊 CHECKLIST FINAL

### Backend
- [x] `render.yaml` criado
- [x] `package.json` atualizado (com `pg`)
- [x] `postgres.js` criado
- [x] `migrations-postgres.js` criado
- [x] `index.js` atualizado (CORS, PostgreSQL)
- [x] `.env.example` criado

### Render.com
- [x] Banco PostgreSQL criado
- [x] Serviço Web criado
- [x] Variáveis de ambiente configuradas
- [x] Build bem-sucedido
- [x] Servidor rodando

### Frontend
- [x] `api.js` atualizado com URL de produção
- [x] App testado com backend em produção

---

## 🎯 PRÓXIMOS PASSOS

1. **Monitorar Logs:**
   - Acompanhe os logs no dashboard do Render
   - Configure alertas se necessário

2. **Backup do Banco:**
   - Configure backups automáticos no Render
   - Ou exporte manualmente periodicamente

3. **Otimizações:**
   - Considere upgrade para plano pago (melhor performance)
   - Configure CDN para imagens (futuro)

4. **Segurança:**
   - Use `CORS_ORIGIN` específico em produção
   - Rotacione `JWT_SECRET` periodicamente
   - Configure rate limiting

---

## 📞 SUPORTE

**Documentação Render:**
- https://render.com/docs
- https://render.com/docs/postgres-databases

**Comandos Úteis:**
```bash
# Ver logs localmente (se tiver CLI)
render logs

# Testar conexão com banco
psql $DATABASE_URL
```

---

**Deploy concluído!** 🚀

Seu backend está rodando em produção no Render.com!


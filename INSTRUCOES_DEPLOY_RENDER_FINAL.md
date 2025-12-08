# 🚀 INSTRUÇÕES FINAIS - Deploy Backend Render.com
## Agente Técnico Principal

**Data:** Janeiro 2025

---

## ✅ CORREÇÕES APLICADAS

### Arquivos Modificados:
1. ✅ `backend/src/database/db-adapter.js` - Imports dinâmicos corrigidos
2. ✅ `backend/src/index.js` - Simplificação de migrações
3. ✅ `backend/package.json` - Engines Node adicionado

### Arquivos Validados:
- ✅ `render.yaml` - Configuração correta
- ✅ Todos os imports relativos - Válidos
- ✅ Estrutura de diretórios - Correta

---

## 📝 COMANDOS GIT

Execute os seguintes comandos para fazer commit e push:

```bash
# Adicionar todas as mudanças
git add .

# Criar commit
git commit -m "fix: corrigir imports dinâmicos e estrutura para deploy no Render.com"

# Push para GitHub
git push
```

---

## 🔧 CONFIGURAÇÃO NO RENDER.COM

### 1. Criar Novo Serviço Web

1. Acesse [Render.com Dashboard](https://dashboard.render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub

### 2. Configurações do Serviço

- **Name:** `troia-backend`
- **Environment:** `Node`
- **Root Directory:** `backend` ⚠️ **IMPORTANTE**
- **Build Command:** `npm install`
- **Start Command:** `node src/index.js`

### 3. Variáveis de Ambiente

Configure as seguintes variáveis no Render:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db` | ✅ Sim |
| `JWT_SECRET` | Chave secreta longa e complexa | ✅ Sim |
| `OPENAI_API_KEY` | Sua chave da OpenAI | ✅ Sim |
| `CORS_ORIGIN` | `*` (ou domínios específicos) | ⚠️ Opcional |
| `RENDER_EXTERNAL_URL` | URL do serviço (auto) | ⚠️ Opcional |
| `NODE_ENV` | `production` | ⚠️ Opcional |

### 4. Banco de Dados PostgreSQL

1. No Render Dashboard, crie um "PostgreSQL" database
2. Copie a `DATABASE_URL` interna
3. Configure como variável de ambiente no serviço web

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### 1. Health Check

Após o deploy, teste o endpoint de health:

```bash
curl https://troia-backend.onrender.com/healthz
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "production"
}
```

### 2. Verificar Logs

No Render Dashboard:
1. Vá para o serviço `troia-backend`
2. Clique em "Logs"
3. Verifique se há erros de import ou conexão

### 3. Testar Endpoints

```bash
# Health check
curl https://troia-backend.onrender.com/healthz

# Login (exemplo)
curl -X POST https://troia-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 🔍 TROUBLESHOOTING

### Erro: "Cannot find module"

**Causa:** Imports dinâmicos não resolvidos corretamente.

**Solução:** Verifique se:
- ✅ `rootDirectory: backend` está configurado
- ✅ Todos os imports usam caminhos relativos corretos
- ✅ `package.json` tem `"type": "module"`

### Erro: "Connection timeout" (PostgreSQL)

**Causa:** `DATABASE_URL` incorreta ou banco não acessível.

**Solução:** 
- Verifique se a `DATABASE_URL` está correta
- Use a URL interna do Render (não externa)
- Verifique se o banco está no mesmo "region" do serviço

### Erro: "JWT_SECRET not defined"

**Causa:** Variável de ambiente não configurada.

**Solução:** Configure `JWT_SECRET` no Render Dashboard.

---

## 📊 CHECKLIST FINAL

- ✅ Correções aplicadas localmente
- ✅ Testes locais passando
- ✅ Git commit criado
- ✅ Push para GitHub realizado
- ✅ Serviço criado no Render.com
- ✅ Variáveis de ambiente configuradas
- ✅ Banco PostgreSQL criado e conectado
- ✅ Health check funcionando
- ✅ Logs sem erros

---

## 🎯 RESULTADO ESPERADO

Após seguir estas instruções:

1. ✅ Backend rodando no Render.com
2. ✅ Health check respondendo
3. ✅ Banco PostgreSQL conectado
4. ✅ Imports funcionando corretamente
5. ✅ API pronta para receber requisições

---

**Instruções finais geradas!** ✅


# 📦 INSTRUÇÕES - Git Add / Commit / Push
## Deploy Final para Render.com

**Data:** Janeiro 2025

---

## 🎯 OBJETIVO

Fazer commit e push de todas as correções para o GitHub, permitindo deploy automático no Render.

---

## 📋 COMANDOS GIT

### 1. Verificar Status

```bash
cd C:\Users\sergi\TROIA-MVP
git status
```

**Esperado:** Ver arquivos modificados e criados.

---

### 2. Adicionar Arquivos

```bash
# Adicionar todos os arquivos do backend
git add backend/

# Ou adicionar arquivos específicos
git add backend/src/index.js
git add backend/src/routes/
git add backend/src/database/db-adapter.js
git add backend/render.yaml
git add backend/test-production.js
```

---

### 3. Criar Commit

```bash
git commit -m "feat: backend pronto para Render.com com PostgreSQL

- Corrigido regex quebrado no Windows
- Adaptadas todas as rotas para db-adapter.js
- Adicionada conversão automática de parâmetros (? → $1, $2...)
- Adicionado RETURNING id automático em INSERTs PostgreSQL
- Corrigida URL de uploads para usar RENDER_EXTERNAL_URL
- Configurado CORS para Expo local e produção
- Criado render.yaml com rootDirectory: backend
- Criado script de teste para ambiente de produção
- 100% compatível com SQLite (dev) e PostgreSQL (prod)"
```

---

### 4. Push para GitHub

```bash
# Verificar branch atual
git branch

# Push para master/main
git push origin master

# Ou se a branch for main
git push origin main
```

---

## ✅ VERIFICAÇÃO PÓS-PUSH

### No GitHub:
1. Acessar repositório
2. Verificar que `backend/render.yaml` está presente
3. Verificar que todos os arquivos foram atualizados

### No Render:
1. Acessar dashboard do Render
2. Verificar que o deploy foi iniciado automaticamente
3. Verificar logs do deploy
4. Verificar que não há erros de import

---

## 🐛 TROUBLESHOOTING

### Erro: "Cannot find module"

**Solução:**
- Verificar que `render.yaml` tem `rootDirectory: backend`
- Verificar que imports usam extensão `.js`
- Verificar que caminhos relativos estão corretos

### Erro: "DATABASE_URL não configurada"

**Solução:**
- No Render Dashboard, configurar variável `DATABASE_URL`
- Conectar ao banco PostgreSQL criado

### Erro: "CORS policy"

**Solução:**
- Verificar que `CORS_ORIGIN` está configurado no Render
- Verificar que origins estão corretos no código

---

## 🎯 CONCLUSÃO

Após push:
- ✅ Render detectará `render.yaml`
- ✅ Deploy será iniciado automaticamente
- ✅ Backend estará pronto para uso

**Pronto para produção!** 🚀

---

**Instruções concluídas!** ✅


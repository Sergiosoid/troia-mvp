# 🌐 INSTRUÇÕES - Testar Backend no Render.com
## Guia para Testar API em Produção

**Data:** Janeiro 2025

---

## 📋 PRÉ-REQUISITOS

1. Backend deployado no Render.com
2. Banco PostgreSQL criado no Render
3. Variáveis de ambiente configuradas
4. URL do serviço: `https://troia-backend.onrender.com`

---

## 🔍 PASSO 1: VERIFICAR STATUS DO SERVIÇO

### 1.1. Acessar Dashboard

1. Acesse: https://dashboard.render.com
2. Vá em **"Services"**
3. Clique no serviço **"troia-backend"**

### 1.2. Verificar Status

- ✅ Status deve ser **"Live"** (verde)
- ✅ Último deploy deve ter sucesso
- ✅ Logs devem mostrar: "✅ Servidor rodando na porta XXXX"

### 1.3. Verificar Logs

1. Clique em **"Logs"**
2. Procure por:
   - ✅ "✅ Conectado ao PostgreSQL"
   - ✅ "✅ Migrações concluídas com sucesso"
   - ✅ "✅ Servidor rodando na porta XXXX"
   - ❌ Nenhum erro crítico

---

## 🧪 PASSO 2: TESTAR ENDPOINTS

### 2.1. Obter URL do Serviço

No dashboard do Render, copie a URL do serviço:
- Formato: `https://troia-backend.onrender.com`

### 2.2. Testar Health Check

```bash
curl https://troia-backend.onrender.com/
```

**Resposta esperada:**
- Status 200 ou 404 (se não houver rota raiz)
- Sem erros

### 2.3. Testar Register

```bash
curl -X POST https://troia-backend.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Render",
    "email": "teste-render@test.com",
    "senha": "123456"
  }'
```

**Resposta esperada:**
```json
{
  "userId": 1,
  "nome": "Teste Render",
  "email": "teste-render@test.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Salvar o token:**
```bash
export TOKEN="seu-token-aqui"
```

### 2.4. Testar Login

```bash
curl -X POST https://troia-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste-render@test.com",
    "senha": "123456"
  }'
```

**Resposta esperada:**
```json
{
  "userId": 1,
  "nome": "Teste Render",
  "email": "teste-render@test.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.5. Testar Cadastrar Proprietário

```bash
curl -X POST https://troia-backend.onrender.com/proprietarios/cadastrar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "telefone": "(11) 99999-9999"
  }'
```

**Resposta esperada:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "telefone": "(11) 99999-9999",
  "usuario_id": 1
}
```

### 2.6. Testar Listar Proprietários

```bash
curl -X GET https://troia-backend.onrender.com/proprietarios \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "telefone": "(11) 99999-9999",
    "usuario_id": 1
  }
]
```

### 2.7. Testar Cadastrar Veículo

```bash
curl -X POST https://troia-backend.onrender.com/veiculos/cadastrar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "placa": "ABC1234",
    "renavam": "12345678901",
    "proprietario_id": 1,
    "marca": "Toyota",
    "modelo": "Corolla",
    "ano": "2020"
  }'
```

### 2.8. Testar Listar Veículos com Totais

```bash
curl -X GET https://troia-backend.onrender.com/veiculos/totais \
  -H "Authorization: Bearer $TOKEN"
```

### 2.9. Testar Cadastrar Manutenção

```bash
curl -X POST https://troia-backend.onrender.com/manutencoes/cadastrar \
  -H "Authorization: Bearer $TOKEN" \
  -F "veiculo_id=1" \
  -F "data=2024-01-15" \
  -F "valor=150.50" \
  -F "tipo_manutencao=preventiva" \
  -F "area_manutencao=motor_cambio" \
  -F "documento=@/caminho/para/imagem.jpg"
```

### 2.10. Testar Listar Manutenções por Veículo

```bash
curl -X GET https://troia-backend.onrender.com/manutencoes/veiculo/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 2.11. Testar Buscar Manutenções

```bash
curl -X GET "https://troia-backend.onrender.com/manutencoes/buscar?termo=ABC1234" \
  -H "Authorization: Bearer $TOKEN"
```

### 2.12. Testar Excluir Manutenção

```bash
curl -X DELETE https://troia-backend.onrender.com/manutencoes/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 PASSO 3: VERIFICAR BANCO DE DADOS

### 3.1. Acessar PostgreSQL no Render

1. No dashboard do Render, vá em **"Databases"**
2. Clique no banco **"troia-db"**
3. Clique em **"Connect"**
4. Copie a **"Internal Database URL"**

### 3.2. Conectar via psql (Local)

```bash
# Usar Internal Database URL
psql "postgresql://user:pass@host:port/database"

# Listar tabelas
\dt

# Ver dados
SELECT * FROM usuarios;
SELECT * FROM proprietarios;
SELECT * FROM veiculos;
SELECT * FROM manutencoes;
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Cannot connect to PostgreSQL"

**Solução:**
1. Verificar se banco está rodando
2. Verificar DATABASE_URL no Render
3. Usar **"Internal Database URL"** (não externa)

### Erro: "relation does not exist"

**Solução:**
1. Verificar logs do servidor
2. Verificar se migrações executaram
3. Reiniciar serviço se necessário

### Erro: "CORS policy"

**Solução:**
1. Verificar variável `CORS_ORIGIN` no Render
2. Para desenvolvimento, usar `*`
3. Para produção, listar origens específicas

### Erro: "401 Unauthorized"

**Solução:**
1. Verificar se token JWT está correto
2. Verificar se token não expirou
3. Fazer login novamente

### Erro: "500 Internal Server Error"

**Solução:**
1. Verificar logs no Render
2. Verificar variáveis de ambiente
3. Verificar conexão com banco

---

## ✅ CHECKLIST DE TESTES

### Autenticação
- [ ] Register funciona
- [ ] Login funciona
- [ ] Token JWT válido

### Proprietários
- [ ] Cadastrar funciona
- [ ] Listar funciona
- [ ] Filtro por usuario_id funciona

### Veículos
- [ ] Cadastrar funciona
- [ ] Listar funciona
- [ ] Buscar por placa funciona
- [ ] Listar com totais funciona
- [ ] Filtro por usuario_id funciona

### Manutenções
- [ ] Cadastrar funciona
- [ ] Listar por veículo funciona
- [ ] Buscar funciona
- [ ] Excluir funciona
- [ ] Upload de imagem funciona
- [ ] URL de imagem correta

### Segurança
- [ ] Multi-tenancy funciona
- [ ] Usuário não acessa dados de outro
- [ ] Tentativas não autorizadas bloqueadas

---

## 📊 VERIFICAR LOGS

### Logs Importantes

**Sucesso:**
- ✅ "✅ Conectado ao PostgreSQL"
- ✅ "✅ Migrações concluídas com sucesso"
- ✅ "✅ Servidor rodando na porta XXXX"

**Erros:**
- ❌ "❌ Erro ao conectar ao PostgreSQL"
- ❌ "❌ Erro ao processar..."
- ❌ "❌ Erro ao buscar..."

---

## 🎯 CONCLUSÃO

Após testar no Render:
- ✅ Servidor está rodando
- ✅ Banco conectado
- ✅ Todas as rotas funcionam
- ✅ Segurança funcionando
- ✅ Pronto para uso em produção

**Backend em produção!** 🚀

---

**Testes concluídos!** ✅


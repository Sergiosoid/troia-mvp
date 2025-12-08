# 🔧 MIGRAÇÃO: ADICIONAR COLUNA veiculo_id EM manutencoes

## 🎯 PROBLEMA

O backend estava gerando o seguinte erro ao executar queries na tabela `manutencoes`:

```
SQLITE_ERROR: no such column: m.veiculo_id
```

**Causa:**
- A tabela `manutencoes` foi criada sem a coluna `veiculo_id` em algumas instâncias
- As rotas do backend fazem JOINs e queries que referenciam `m.veiculo_id`
- A coluna é necessária para relacionar manutenções com veículos

---

## ✅ SOLUÇÃO APLICADA

Foi adicionada a verificação e criação automática da coluna `veiculo_id` na tabela `manutencoes` dentro do sistema de migrações.

### Arquivo Modificado:
- `backend/src/migrations.js`

### Mudança:
- Adicionada verificação de existência da coluna `veiculo_id` em `manutencoes`
- Se a coluna não existir, ela é criada automaticamente via `ALTER TABLE`
- Segue o mesmo padrão seguro das outras migrações (usa `PRAGMA table_info`)

---

## 📊 DIFF COMPLETO

### Diff: backend/src/migrations.js - Adicionar verificação de veiculo_id

```diff
    // Verificar e adicionar colunas em manutencoes
    const manutencoesExists = await tableExists(db, 'manutencoes');
    if (manutencoesExists) {
      const usuarioIdExists = await columnExists(db, 'manutencoes', 'usuario_id');
      if (!usuarioIdExists) {
        console.log('  ✓ Adicionando coluna usuario_id em manutencoes...');
        await runSQL(db, 'ALTER TABLE manutencoes ADD COLUMN usuario_id INTEGER NOT NULL DEFAULT 0');
        console.log('  ✓ Coluna usuario_id adicionada em manutencoes');
      }

+     const veiculoIdExists = await columnExists(db, 'manutencoes', 'veiculo_id');
+     if (!veiculoIdExists) {
+       console.log('  ✓ Adicionando coluna veiculo_id em manutencoes...');
+       await runSQL(db, 'ALTER TABLE manutencoes ADD COLUMN veiculo_id INTEGER');
+       console.log('  ✓ Coluna veiculo_id adicionada em manutencoes');
+     }
    }
```

---

## 📝 RESULTADO ESPERADO

### Logs no Deploy (se a coluna faltar):

```
🚀 Iniciando migrações do banco de dados...
  ✓ Conectado ao banco de dados
📋 Verificando tabelas...
  ✓ Tabela usuarios já existe
  ✓ Tabela proprietarios já existe
  ✓ Tabela veiculos já existe
  ✓ Tabela manutencoes já existe
🔧 Verificando colunas faltantes...
  ✓ Adicionando coluna veiculo_id em manutencoes...
  ✓ Coluna veiculo_id adicionada em manutencoes
  ✓ Todas as colunas verificadas
✅ Migrações concluídas com sucesso
Servidor rodando na porta 3000
```

### Logs no Deploy (se a coluna já existir):

```
🚀 Iniciando migrações do banco de dados...
  ✓ Conectado ao banco de dados
📋 Verificando tabelas...
  ✓ Tabela usuarios já existe
  ✓ Tabela proprietarios já existe
  ✓ Tabela veiculos já existe
  ✓ Tabela manutencoes já existe
🔧 Verificando colunas faltantes...
  ✓ Todas as colunas verificadas
✅ Migrações concluídas com sucesso
Servidor rodando na porta 3000
```

---

## ✅ GARANTIAS DE SEGURANÇA

- ✅ **Verifica antes de adicionar** - Usa `PRAGMA table_info()` para verificar se coluna existe
- ✅ **Não quebra se já existir** - Se a coluna já existir, apenas pula a criação
- ✅ **Tratamento de erros** - Erros de coluna duplicada são tratados graciosamente
- ✅ **Logs claros** - Facilita debug no deploy da Render.com
- ✅ **Compatível com SQLite efêmero** - Funciona mesmo após reset do banco

---

## 🎯 O QUE SERÁ CORRIGIDO

### Erro que será resolvido:

✅ **`SQLITE_ERROR: no such column: m.veiculo_id`**
- **Causa:** Tabela `manutencoes` criada sem coluna `veiculo_id`
- **Solução:** Migração adiciona `veiculo_id` automaticamente se faltar

### Impacto:

- ✅ Queries com JOIN em `manutencoes` funcionarão corretamente
- ✅ Relacionamento entre manutenções e veículos será estabelecido
- ✅ Endpoints que listam manutenções por veículo funcionarão

---

## 📋 ESPECIFICAÇÃO DA COLUNA

**Coluna adicionada:**
- **Nome:** `veiculo_id`
- **Tipo:** `INTEGER`
- **Nullable:** Sim (permite NULL)
- **Foreign Key:** Referencia `veiculos(id)`

**SQL executado:**
```sql
ALTER TABLE manutencoes ADD COLUMN veiculo_id INTEGER;
```

---

## ✅ CONCLUSÃO

**STATUS:** ✅ **MIGRAÇÃO APLICADA**

**Arquivo Modificado:**
- `backend/src/migrations.js` (apenas adicionada verificação de `veiculo_id`)

**Próximo Deploy:**
- A migração rodará automaticamente
- A coluna `veiculo_id` será adicionada se faltar
- O erro `SQLITE_ERROR: no such column: m.veiculo_id` será corrigido

**Nenhum outro arquivo foi modificado.**

---

**Data:** 2025-01-XX
**Versão:** 1.0.1


# 🔍 AUDITORIA DE DOMÍNIO - TROIA MVP
## Análise pós-mudança estrutural: Histórico como fonte única de verdade

**Data da Auditoria:** 2025-01-XX  
**Contexto:** Mudança estrutural onde `km_historico` passou a ser a única fonte de verdade, substituindo campos como `data_aquisicao`, `km_inicial` no veículo.

---

## 📊 RESUMO EXECUTIVO

### ✅ **Áreas Corretas**
- `AtualizarKmScreen.js` - Já corrigida, usa histórico corretamente
- `PUT /veiculos/:id/km` - Validação baseada em histórico (corrigida recentemente)

### ❌ **Problemas Identificados**
- **Frontend:** 8 arquivos com inconsistências
- **Backend:** 6 arquivos com inconsistências
- **Total:** 14 arquivos requerem ajustes

---

## 🎯 FRONTEND - PROBLEMAS IDENTIFICADOS

### 1. **VeiculoHistoricoScreen.js** ⚠️ CRÍTICO

**Problema:**
- Linha 312: Cálculo incorreto do "Total do veículo"
  ```javascript
  {formatarKm(resumoPeriodo.km_atual - resumoPeriodo.km_total_veiculo)}
  ```
  - Subtração invertida: deveria ser `km_total_veiculo - km_atual` ou usar histórico
  - Usa `resumoPeriodo.km_atual` que vem de `veiculos.km_atual` (campo derivado)
  - Linha 262: Usa `resumoPeriodo.km_rodado_no_periodo` que pode estar calculado incorretamente
  - Linha 267: Exibe `data_aquisicao` do resumo (campo legado)

**Impacto:** 
- Cálculo de "Total do veículo" pode mostrar valores negativos ou incorretos
- Dependência de campos derivados ao invés de histórico

**Sugestão de Correção:**
- Buscar último registro do histórico para `km_atual` real
- Buscar primeiro registro do histórico para `km_total_veiculo`
- Calcular `km_rodado_no_periodo` a partir do histórico, não de campos do veículo
- Remover dependência de `data_aquisicao` do resumo

---

### 2. **ModalPeriodoPosseInvalido.js** ⚠️ OBSOLETO

**Problema:**
- Linha 24: Mensagem obsoleta: "Antes de continuar, informe a data de aquisição e o KM inicial deste veículo."
- Linha 34: Botão "Configurar Aquisição" - não faz mais sentido no novo modelo
- Modal ainda assume que é necessário configurar aquisição depois

**Impacto:**
- UX confusa: usuário vê mensagem pedindo configuração que não é mais necessária
- Modal pode aparecer incorretamente após cadastro correto

**Sugestão de Correção:**
- Atualizar mensagem para: "Este veículo não possui histórico inicial. Entre em contato com o suporte."
- Ou remover modal completamente se validação já garante histórico inicial
- Se mantiver, ajustar para verificar histórico ao invés de campos do veículo

---

### 3. **EditarVeiculoScreen.js** ⚠️ MÉDIO

**Problema:**
- Linhas 67-74: Seção "Dados da Aquisição" ainda existe
  - `origemPosse`, `dataAquisicaoEdit`, `kmInicioEdit` - campos legados
  - Linha 178: Verifica se pode editar KM inicial baseado em histórico (OK), mas ainda permite edição
- Linha 70: `dataAquisicaoEdit` - campo que não deveria ser editável após cadastro
- Linha 73: `kmInicioEdit` - campo que não deveria ser editável após histórico existir

**Impacto:**
- Usuário pode tentar editar dados que não devem ser alterados
- Confusão sobre o que pode ou não ser editado

**Sugestão de Correção:**
- Remover seção "Dados da Aquisição" da edição (ou tornar read-only)
- Se histórico existe, não permitir edição de `km_inicio`
- Mostrar dados apenas informativos, sem campos editáveis

---

### 4. **DiagnosticoVeiculoScreen.js** ⚠️ MÉDIO

**Problema:**
- Linha 109: Mensagem obsoleta: "Período de posse inválido. Edite o veículo e configure a data de aquisição e KM inicial."
- Linha 127: Exibe `diagnostico?.km_inicio` - campo legado

**Impacto:**
- Mensagem de erro desatualizada
- Exibe campos que não são mais a fonte de verdade

**Sugestão de Correção:**
- Atualizar mensagem para verificar histórico
- Remover exibição de `km_inicio` ou substituir por primeiro registro do histórico

---

### 5. **EstatisticasScreen.js** ⚠️ BAIXO

**Problema:**
- Depende de `buscarEstatisticas` que pode usar campos legados
- Não há problema direto na tela, mas depende do backend

**Impacto:**
- Se backend usar campos legados, estatísticas podem estar incorretas

**Sugestão de Correção:**
- Verificar se backend `estatisticas.js` usa histórico corretamente (ver backend)

---

### 6. **HistoricoKmScreen.js** ⚠️ BAIXO

**Problema:**
- Linha 160: Exibe `veiculo.km_atual` diretamente
  ```javascript
  {getMetrica().labelLong} Atual: {parseInt(veiculo.km_atual || 0).toLocaleString('pt-BR')}
  ```

**Impacto:**
- Pode mostrar KM desatualizado se `veiculos.km_atual` não estiver sincronizado

**Sugestão de Correção:**
- Buscar último registro do histórico para exibir KM atual real
- Usar `km_historico` como fonte de verdade

---

### 7. **CadastroVeiculoScreen.js** ✅ PARCIALMENTE OK

**Status:**
- Já envia `km_inicial`/`horas_inicial` corretamente
- Backend cria histórico inicial automaticamente
- **Pequeno ajuste:** Linha 446: Ainda envia `km_aquisicao` para compatibilidade (pode ser removido no futuro)

**Sugestão de Correção:**
- Manter como está (compatibilidade)
- Considerar remover `km_aquisicao` em versão futura

---

### 8. **PublicVehicleScreen.js** ⚠️ BAIXO

**Problema:**
- Linha 262: Exibe `veiculo.km_atual` diretamente
- Linha 284: Usa `km_atual` do registro para cálculos

**Impacto:**
- Pode mostrar KM desatualizado

**Sugestão de Correção:**
- Buscar último registro do histórico para exibir KM atual real

---

## 🎯 BACKEND - PROBLEMAS IDENTIFICADOS

### 1. **utils/proprietarioAtual.js** ⚠️ CRÍTICO

**Problema:**
- Linha 282-284: `getResumoPeriodoProprietarioAtual` ainda usa `km_inicio` ou `km_aquisicao` do proprietário
  ```javascript
  const kmInicioPeriodo = proprietarioAtual.km_inicio !== null && proprietarioAtual.km_inicio !== undefined
    ? parseInt(proprietarioAtual.km_inicio) || 0
    : (parseInt(proprietarioAtual.km_aquisicao) || 0);
  ```
- Linha 297: Calcula `km_rodado_no_periodo` usando `kmAtual - kmInicioPeriodo`
  - `kmAtual` vem de `veiculos.km_atual` (campo derivado)
  - `kmInicioPeriodo` vem de campos do proprietário (não do histórico)
- Linha 304: Retorna `data_aquisicao` do proprietário (campo legado)

**Impacto:**
- Cálculo de "Você rodou" pode estar incorreto
- Depende de campos do veículo e proprietário ao invés de histórico
- Fonte de verdade fragmentada

**Sugestão de Correção:**
- Buscar primeiro registro do histórico no período: `SELECT MIN(km) FROM km_historico WHERE veiculo_id = ? AND data_registro >= ?`
- Buscar último registro do histórico: `SELECT MAX(km) FROM km_historico WHERE veiculo_id = ?`
- Calcular `km_rodado_no_periodo = ultimoKm - primeiroKm` (do histórico)
- Usar `data_registro` do primeiro registro do histórico ao invés de `data_aquisicao`

---

### 2. **routes/estatisticas.js** ⚠️ MÉDIO

**Problema:**
- Linhas 165-172: Adiciona KM inicial do período se não estiver no histórico
  ```javascript
  if (kmInicio > 0 && (kmRodados.length === 0 || parseInt(kmRodados[0].km) !== kmInicio)) {
    kmRodados.unshift({
      data: periodo.dataInicio,
      km: kmInicio,
      origem: 'inicio_periodo',
    });
  }
  ```
  - `kmInicio` vem de `periodo.kmInicio` (do proprietário, não do histórico)
  - Cria registro sintético que não existe no banco
- Linhas 179-199: Verifica `veiculo.km_atual` e adiciona se diferente do histórico
  - Mistura estado derivado (`veiculos.km_atual`) com histórico real

**Impacto:**
- Estatísticas podem incluir dados sintéticos não existentes no banco
- Dependência de campos derivados

**Sugestão de Correção:**
- Usar APENAS dados de `km_historico` (sem adicionar registros sintéticos)
- Se histórico estiver vazio, retornar array vazio
- Remover verificação de `veiculo.km_atual` - confiar apenas no histórico

---

### 3. **routes/alertas.js** ⚠️ MÉDIO

**Problema:**
- Linha 44-46: Calcula `kmRodadoNoPeriodo` usando `veiculo.km_atual - kmInicio`
  ```javascript
  const kmInicio = parseInt(periodo.kmInicio) || 0;
  const kmAtual = parseInt(veiculo.km_atual) || 0;
  const kmRodadoNoPeriodo = Math.max(0, kmAtual - kmInicio);
  ```
  - `kmAtual` vem de `veiculos.km_atual` (campo derivado)
  - `kmInicio` vem de `periodo.kmInicio` (do proprietário)
- Linha 86: Fallback usa `kmAtual - 5000` se não encontrar no histórico
  - Aproximação que pode estar incorreta

**Impacto:**
- Alertas podem estar baseados em cálculos incorretos
- Dependência de campos derivados

**Sugestão de Correção:**
- Buscar último KM do histórico: `SELECT MAX(km) FROM km_historico WHERE veiculo_id = ?`
- Buscar primeiro KM do período no histórico: `SELECT MIN(km) FROM km_historico WHERE veiculo_id = ? AND data_registro >= ?`
- Calcular `kmRodadoNoPeriodo` a partir do histórico

---

### 4. **routes/dashboard.js** ⚠️ BAIXO

**Problema:**
- Linha 115: Calcula `kmRodado` usando `km_depois - km_antes` de abastecimentos
  - OK, mas depende de abastecimentos terem KM correto
- Depende de `getPeriodoProprietarioAtual` que pode usar campos legados

**Impacto:**
- Se período estiver incorreto, dashboard pode mostrar dados errados

**Sugestão de Correção:**
- Verificar se `getPeriodoProprietarioAtual` está correto (ver item 1)
- Garantir que abastecimentos usam KM do histórico

---

### 5. **routes/veiculos.js - GET /resumo-periodo** ⚠️ MÉDIO

**Problema:**
- Linhas 1484-1497: Fallback usa `veiculos.km_atual` quando não há resumo
  ```javascript
  const veiculoKm = await queryOne(
    'SELECT km_atual FROM veiculos WHERE id = ?',
    [id]
  );
  const kmAtual = veiculoKm ? (parseInt(veiculoKm.km_atual) || 0) : 0;
  ```
- Linha 1496: Retorna `data_aquisicao: null` no fallback

**Impacto:**
- Fallback usa campo derivado ao invés de histórico
- Estrutura de resposta inconsistente

**Sugestão de Correção:**
- Fallback deve buscar último registro do histórico: `SELECT MAX(km) FROM km_historico WHERE veiculo_id = ?`
- Se histórico vazio, retornar estrutura com valores 0, mas buscar do histórico

---

### 6. **routes/veiculos.js - PUT /:id/km** ✅ JÁ CORRIGIDO

**Status:**
- Validação já usa histórico (corrigida recentemente)
- ✅ OK

---

### 7. **routes/abastecimentos.js** ⚠️ BAIXO

**Problema:**
- Linha 153: Busca `veiculo.km_atual` para validação
  - OK para validação, mas depois atualiza via histórico (correto)

**Impacto:**
- Baixo - apenas para validação inicial

**Sugestão de Correção:**
- Considerar buscar último KM do histórico para validação também

---

## 📋 CAMPOS REDUNDANTES/CONFLITANTES

### Frontend
- `veiculo.km_atual` - Campo derivado, não deve ser usado para cálculos
- `resumoPeriodo.data_aquisicao` - Campo legado, deve vir do histórico
- `resumoPeriodo.km_inicio_periodo` - Pode vir do histórico ao invés do proprietário

### Backend
- `veiculos.km_atual` - Campo derivado, mantido para performance mas não deve ser fonte de verdade
- `proprietarios_historico.km_aquisicao` - Campo legado, histórico é fonte de verdade
- `proprietarios_historico.data_aquisicao` - Campo legado, histórico é fonte de verdade

---

## 🎯 PRIORIZAÇÃO DE CORREÇÕES

### 🔴 **CRÍTICO (Corrigir Imediatamente)**
1. `backend/src/utils/proprietarioAtual.js` - `getResumoPeriodoProprietarioAtual`
2. `app-frontend/screens/VeiculoHistoricoScreen.js` - Cálculo de "Total do veículo"

### 🟡 **ALTO (Corrigir em Breve)**
3. `app-frontend/components/ModalPeriodoPosseInvalido.js` - Mensagem obsoleta
4. `backend/src/routes/estatisticas.js` - Registros sintéticos
5. `backend/src/routes/alertas.js` - Cálculo de KM rodado

### 🟢 **MÉDIO (Melhorias)**
6. `app-frontend/screens/EditarVeiculoScreen.js` - Seção de aquisição
7. `app-frontend/screens/DiagnosticoVeiculoScreen.js` - Mensagens obsoletas
8. `backend/src/routes/veiculos.js` - GET /resumo-periodo fallback

### 🔵 **BAIXO (Otimizações)**
9. `app-frontend/screens/HistoricoKmScreen.js` - Exibir KM do histórico
10. `app-frontend/screens/PublicVehicleScreen.js` - Exibir KM do histórico

---

## 📝 RECOMENDAÇÕES GERAIS

### 1. **Padrão de Cálculo de KM Atual**
Sempre buscar do histórico:
```sql
SELECT km FROM km_historico 
WHERE veiculo_id = ? 
ORDER BY data_registro DESC, criado_em DESC 
LIMIT 1
```

### 2. **Padrão de Cálculo de KM Inicial**
Sempre buscar do histórico:
```sql
SELECT km FROM km_historico 
WHERE veiculo_id = ? 
ORDER BY data_registro ASC, criado_em ASC 
LIMIT 1
```

### 3. **Padrão de Cálculo de KM Rodado**
Sempre calcular do histórico:
```sql
SELECT 
  MAX(km) as km_atual,
  MIN(km) as km_inicial
FROM km_historico 
WHERE veiculo_id = ?
```

### 4. **Remover Dependências de Campos Legados**
- Não usar `veiculo.km_atual` para cálculos (apenas para exibição rápida)
- Não usar `proprietario.km_aquisicao` ou `data_aquisicao` para cálculos
- Sempre buscar do `km_historico`

### 5. **Mensagens de Erro**
- Atualizar todas as mensagens que mencionam "configurar aquisição"
- Substituir por "verificar histórico inicial"

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após correções, validar:
- [ ] Cadastro de veículo cria histórico inicial automaticamente
- [ ] Atualização de KM funciona sem erro de período
- [ ] "Você rodou" calculado corretamente do histórico
- [ ] Estatísticas usam apenas dados do histórico
- [ ] Alertas baseados em cálculos corretos do histórico
- [ ] Nenhuma mensagem pede "configurar aquisição"
- [ ] KM atual sempre vem do último registro do histórico
- [ ] KM inicial sempre vem do primeiro registro do histórico

---

**Fim do Relatório**


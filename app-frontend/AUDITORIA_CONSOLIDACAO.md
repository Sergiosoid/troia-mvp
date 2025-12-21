# AUDITORIA DE CONSOLIDAÇÃO E COERÊNCIA - TROIA MVP

**Data:** 2025-01-XX
**Objetivo:** Identificar e corrigir inconsistências, código morto, fluxos incompletos

---

## METODOLOGIA

1. Análise de flags e campos legados
2. Verificação de serviços parcialmente usados
3. Identificação de endpoints não utilizados
4. Verificação de estados do frontend não consumidos
5. Validações inconsistentes
6. Código duplicado

---

## ITENS IDENTIFICADOS E CORRIGIDOS

### [A] CÓDIGO MORTO ✅

#### 1. Estados não usados em `CadastroVeiculoScreen.js`
- **Status:** ✅ CORRIGIDO
- **Ação:** Removidos estados `processandoOcr`, `dadosOcrExtraidos`, `mostrarPreviewOcr`
- **Justificativa:** Estados criados para OCR local que não está implementado

---

### [B] CÓDIGO AMBÍGUO ✅

#### 2. `origem_dados` campo
- **Status:** ✅ CORRIGIDO
- **Ação:** Adicionados comentários explicando propósito futuro (rastreabilidade quando OCR for implementado)
- **Arquivos:** `backend/src/routes/veiculos.js`, `app-frontend/screens/CadastroVeiculoScreen.js`

#### 3. `documento_pendente_ocr` flag
- **Status:** ✅ CORRIGIDO
- **Ação:** Adicionados comentários explicando propósito futuro (quando OCR local for implementado)
- **Arquivos:** `backend/src/routes/veiculos.js`

---

### [C] CÓDIGO DUPLICADO

#### 4. Funções de formatação
- **Status:** Em análise
- **Ação:** [ ] Verificar se há duplicação de `formatarData`, `formatarMoeda`, `formatarKm`

---

### [D] FLUXO INCOMPLETO

#### 5. Verificar fluxos sem fim definido
- **Status:** Em análise
- **Ação:** [ ] Analisar fluxos de cadastro/edição

---

### [E] CAMPO LEGADO ✅

#### 6. `veiculos.km_atual`
- **Status:** ✅ CORRIGIDO
- **Ação:** Documentado como cache/legado - fonte única de verdade é `km_historico`
- **Arquivos:** `backend/src/routes/veiculos.js`, `backend/src/routes/abastecimentos.js`

---

### [F] PONTO DE EXTENSÃO FUTURA ✅

#### 7. OCR local (`app-frontend/services/ocrLocal.js`)
- **Status:** ✅ CORRIGIDO
- **Ação:** Documentado claramente como ponto de extensão futura
- **Arquivos:** `app-frontend/services/ocrLocal.js`

#### 8. Endpoints OCR futuros (`backend/src/routes/veiculos.js`)
- **Status:** ✅ CORRIGIDO
- **Ação:** Documentado como ponto de extensão futura
- **Arquivos:** `backend/src/routes/veiculos.js`

---

## PRÓXIMOS PASSOS

1. Analisar cada item em detalhe
2. Classificar e corrigir
3. Criar commits pequenos e descritivos
4. Documentar decisões


# Spec: [Nome do Serviço / Feature]

**ID:** SPEC-[SVC]-[NNN]
**Serviço:** [nome-do-servico]
**Status:** Draft | Review | Approved
**Revisores:** [ ] PM [ ] Arquiteto [ ] QA [ ] Security

---

## 1. Visão Geral

Descrição em 2-3 frases do que este serviço/feature faz e por quê existe.

---

## 2. Endpoints / Assinaturas

```
MÉTODO /api/v1/caminho
```

**Service:** `NomeService.metodo(Input input): Output`

---

## 3. Tipos de Dados

### Input

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| | | | |

### Output — Sucesso

| Campo | Tipo | Descrição |
|-------|------|-----------|
| | | |

### Output — Falha

| Campo | Tipo | Descrição |
|-------|------|-----------|
| errorCode | String | Ver tabela de códigos |
| message | String | Mensagem amigável |
| retryable | Boolean | Se pode tentar novamente |

### Códigos de Erro

| Código | HTTP | Retryable | Descrição |
|--------|------|-----------|-----------|
| | | | |

---

## 4. Pré-condições

- O que deve ser verdade antes de executar

---

## 5. Pós-condições — Sucesso

- O que deve ser verdade após execução com sucesso

---

## 6. Pós-condições — Falha

- O que deve ser verdade após uma falha

---

## 7. Invariantes

1. O que é sempre verdade durante e após a execução

---

## 8. Casos Extremos

### CE-001: [Descrição]
- **Input:** ...
- **Comportamento:** ...
- **Output:** ...

---

## 9. Exemplos Concretos

### Exemplo 1 — Sucesso

**Request:**
```json
{}
```

**Response HTTP XXX:**
```json
{}
```

**Efeitos colaterais:**
- ...

---

## 10. Efeitos Colaterais

| Efeito | Síncrono/Assíncrono | Obrigatório |
|--------|---------------------|-------------|
| | | |

---

## 11. Performance

| Operação | P50 | P99 |
|----------|-----|-----|
| | | |

---

## 12. Segurança

- Validações, autorização, dados sensíveis

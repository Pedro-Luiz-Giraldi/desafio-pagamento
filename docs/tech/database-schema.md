# Schema do Banco de Dados — PostgreSQL

**Versão:** 1.0
**Data:** 2026-05-26
**Status:** Draft — a ser implementado via Flyway migrations

---

## Visão Geral das Tabelas

```
users ──────────────────────┐
merchants ──────────────────┤
                            ├── transactions ──── refunds
platform_integrations ──────┤         │
                            │         └─── fraud_alerts
products ───────────────────┤
orders ─────────────────────┘
recovery_codes (users)
audit_logs
```

---

## Tabela: users

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ID único |
| email | VARCHAR(255) | UNIQUE, NOT NULL | E-mail de login |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hash |
| full_name | VARCHAR(255) | NOT NULL | Nome completo |
| phone | VARCHAR(20) | | Telefone (criptografado) |
| role | VARCHAR(50) | NOT NULL | CUSTOMER, MERCHANT, ADMIN |
| two_factor_enabled | BOOLEAN | DEFAULT false | 2FA ativo |
| two_factor_secret | TEXT | | Secret TOTP (AES-256) |
| failed_login_attempts | INTEGER | DEFAULT 0 | Tentativas falhas |
| locked_until | TIMESTAMPTZ | | Bloqueio temporário |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | ACTIVE, DISABLED, SUSPENDED |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Criação |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Última atualização |

**Índices:**
- `idx_users_email` ON email (login)
- `idx_users_status` ON status (admin queries)

---

## Tabela: merchants

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | ID do merchant |
| user_id | UUID | FK users(id), NOT NULL | Usuário dono |
| business_name | VARCHAR(255) | NOT NULL | Nome do negócio |
| document | VARCHAR(20) | UNIQUE | CPF/CNPJ (criptografado) |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | ACTIVE, SUSPENDED, PENDING |
| stripe_account_id | VARCHAR(100) | | Conta Stripe Connect |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Tabela: transactions

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | VARCHAR(50) | PK | Formato: txn_XXXXX |
| idempotency_key | UUID | UNIQUE, NOT NULL | Previne duplicatas |
| customer_id | UUID | FK users(id), NOT NULL | Cliente |
| merchant_id | UUID | FK merchants(id), NOT NULL | Merchant |
| amount_in_cents | BIGINT | NOT NULL | Valor em centavos |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'BRL' | BRL ou USD |
| status | VARCHAR(50) | NOT NULL | APPROVED, DECLINED, SUSPECTED_FRAUD, FULLY_REFUNDED, PARTIALLY_REFUNDED |
| refunded_amount_in_cents | BIGINT | DEFAULT 0 | Valor já estornado |
| card_token | VARCHAR(100) | NOT NULL | tok_XXXXX (Stripe) |
| card_brand | VARCHAR(50) | | VISA, MASTERCARD, etc. |
| card_last_four | VARCHAR(4) | | Últimos 4 dígitos |
| stripe_charge_id | VARCHAR(100) | | ID da cobrança no Stripe |
| platform | VARCHAR(50) | | TIKTOK, INSTAGRAM, DIRECT, etc. |
| live_session_id | VARCHAR(100) | | ID da live de origem |
| order_id | VARCHAR(50) | | Formato: ord_XXXXX |
| fraud_score | INTEGER | | Score 0-100 |
| processing_time_ms | BIGINT | | Tempo de processamento |
| error_code | VARCHAR(100) | | Código de erro (se DECLINED) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Índices:**
- `idx_transactions_customer_id_created_at` ON (customer_id, created_at DESC)
- `idx_transactions_merchant_id_created_at` ON (merchant_id, created_at DESC)
- `idx_transactions_idempotency_key` ON idempotency_key (UNIQUE)
- `idx_transactions_status` ON status
- `idx_transactions_stripe_charge_id` ON stripe_charge_id
- `idx_transactions_live_session_id` ON live_session_id

---

## Tabela: refunds

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | VARCHAR(50) | PK | Formato: ref_XXXXX |
| transaction_id | VARCHAR(50) | FK transactions(id), NOT NULL | Transação original |
| idempotency_key | UUID | UNIQUE, NOT NULL | Previne duplicatas |
| amount_in_cents | BIGINT | NOT NULL | Valor estornado |
| reason | VARCHAR(100) | NOT NULL | CUSTOMER_REQUEST, FRAUD, etc. |
| requested_by | UUID | FK users(id), NOT NULL | Quem solicitou |
| stripe_refund_id | VARCHAR(100) | | ID do estorno no Stripe |
| status | VARCHAR(50) | DEFAULT 'COMPLETED' | COMPLETED, FAILED |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Tabela: fraud_alerts

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| transaction_id | VARCHAR(50) | FK transactions(id) | Transação analisada |
| customer_id | UUID | FK users(id) | Cliente analisado |
| score | INTEGER | NOT NULL | Score 0-100 |
| decision | VARCHAR(20) | NOT NULL | APPROVE, REVIEW, BLOCK |
| reasons | JSONB | | Fatores de risco |
| claude_adjustment | INTEGER | | Ajuste feito pelo Claude |
| claude_reasoning | TEXT | | Explicação do Claude |
| reviewed_by | UUID | FK users(id) | Admin que revisou |
| reviewed_at | TIMESTAMPTZ | | Data da revisão |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Índices:**
- `idx_fraud_alerts_customer_id` ON customer_id
- `idx_fraud_alerts_decision` ON decision
- `idx_fraud_alerts_score` ON score
- Retidos por 2 anos (PCI DSS)

---

## Tabela: platform_integrations

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| merchant_id | UUID | FK merchants(id), NOT NULL | Merchant dono |
| platform | VARCHAR(50) | NOT NULL | TIKTOK, INSTAGRAM, WHATSAPP, etc. |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | ACTIVE, EXPIRED, REVOKED |
| access_token | TEXT | NOT NULL | OAuth token (AES-256 criptografado) |
| refresh_token | TEXT | | OAuth refresh token (AES-256) |
| token_expires_at | TIMESTAMPTZ | | Expiração do token |
| platform_account_id | VARCHAR(255) | | ID da conta na plataforma |
| last_sync_at | TIMESTAMPTZ | | Último sync de catálogo |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraints:**
- UNIQUE (merchant_id, platform)

---

## Tabela: products

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| merchant_id | UUID | FK merchants(id), NOT NULL | |
| platform | VARCHAR(50) | NOT NULL | Plataforma de origem |
| platform_product_id | VARCHAR(255) | NOT NULL | ID na plataforma |
| name | VARCHAR(500) | NOT NULL | Nome do produto |
| description | TEXT | | Descrição |
| price_in_cents | BIGINT | NOT NULL | Preço em centavos |
| stock_quantity | INTEGER | DEFAULT 0 | Estoque |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | ACTIVE, INACTIVE |
| image_urls | JSONB | | URLs das imagens |
| platform_data | JSONB | | Dados extras da plataforma |
| last_synced_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraints:**
- UNIQUE (merchant_id, platform, platform_product_id)

---

## Tabela: recovery_codes

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK users(id), NOT NULL | |
| code_hash | VARCHAR(255) | NOT NULL | BCrypt do código |
| used | BOOLEAN | DEFAULT false | Já utilizado |
| used_at | TIMESTAMPTZ | | Quando foi usado |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Tabela: audit_logs

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | | Usuário que executou |
| action | VARCHAR(100) | NOT NULL | LOGIN, TRANSACTION, REFUND, etc. |
| resource_type | VARCHAR(100) | | Transaction, User, Product... |
| resource_id | VARCHAR(100) | | ID do recurso |
| ip_address | INET | | IP da requisição |
| user_agent | TEXT | | User-Agent |
| result | VARCHAR(50) | | SUCCESS, FAILURE |
| metadata | JSONB | | Detalhes adicionais (sem dados sensíveis) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Nota:** Logs imutáveis — sem UPDATE ou DELETE nesta tabela (append-only).
**Retenção:** 5 anos (compliance PCI DSS).

---

## Convenções de Schema

- **IDs de negócio:** `VARCHAR(50)` com prefixo (`txn_`, `ord_`, `ref_`)
- **IDs de sistema:** `UUID` com `gen_random_uuid()`
- **Dinheiro:** `BIGINT` em centavos, nunca `DECIMAL/FLOAT`
- **Timestamps:** sempre `TIMESTAMPTZ` (UTC)
- **Dados sensíveis:** criptografados com AES-256 antes de gravar
- **Dados de cartão:** nunca armazenados — apenas `card_last_four` e `card_brand`
- **Soft delete:** preferir `status = 'INACTIVE'` em vez de `DELETE`

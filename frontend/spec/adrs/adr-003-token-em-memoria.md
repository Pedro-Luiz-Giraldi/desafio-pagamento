---
id: adr-003
status: accepted
links:
  - spec/adrs/index.md
  - spec/specs/spec-001-auth-context.md
---
# ADR-003: Access token apenas em memória

## Contexto
O accessToken JWT (válido por 15 minutos) precisa ser armazenado no frontend após o login. Existem três opções: localStorage, cookie JavaScript (não-HttpOnly) ou memória (variável de estado React).

## Decisão
**Access token exclusivamente em memória** (variável de estado do AuthContext).
O refreshToken é cookie HttpOnly gerenciado pelo backend — inacessível ao JavaScript.

## Consequências

### Positivas
- Imune a ataques XSS: script malicioso não consegue ler o accessToken porque ele não existe no DOM nem em APIs acessíveis pelo JavaScript
- Imune a CSRF no refreshToken: cookie HttpOnly + `SameSite=Strict` no backend protege o refresh
- Conformidade com OWASP e melhores práticas de segurança para SPA

### Negativas
- **Perda de sessão no F5:** ao recarregar a página, o accessToken some da memória — mitigado pelo refresh silencioso na inicialização (POST /auth/refresh com cookie HttpOnly)
- Múltiplas abas: cada aba faz seu próprio refresh silencioso (aceitável — o backend é idempotente)
- Sem persistência além do tempo de vida do cookie de refresh (7 dias — aceitável)

## Alternativas Consideradas
- **localStorage:** descartado — vulnerável a XSS; qualquer script de terceiro injetado pode roubar o token
- **Cookie JavaScript (não-HttpOnly):** descartado — também vulnerável a XSS; sem vantagem sobre localStorage
- **sessionStorage:** descartado — mesmo problema de XSS que localStorage, só com escopo de aba

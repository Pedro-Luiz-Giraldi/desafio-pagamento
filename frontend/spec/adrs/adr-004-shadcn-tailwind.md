---
id: adr-004
status: accepted
links:
  - spec/adrs/index.md
  - spec/tech-plans/plan-004-design-system.md
---
# ADR-004: shadcn/ui + Tailwind CSS

## Contexto
O app precisa de um design system com componentes acessíveis (Dialog, Table, Badge, Select, etc.) e a liberdade de customizar estilos sem sobrescrever CSS de biblioteca. A referência visual é Kiwify — clean, minimal, profissional.

## Decisão
Usar **shadcn/ui** como fonte de componentes e **Tailwind CSS** para estilização.

## Consequências

### Positivas
- Componentes acessíveis por padrão (Radix UI por baixo) — Dialog, Select, etc. seguem ARIA
- Código dos componentes copiado para o projeto — sem caixa-preta de biblioteca
- Tailwind elimina CSS global e conflitos de especificidade
- Customização total: componentes são arquivos `.tsx` editáveis no projeto
- `class-variance-authority` (CVA) para variantes de componentes de forma tipada

### Negativas
- Curva de aprendizado do Tailwind para devs acostumados com CSS puro
- Componentes shadcn/ui precisam ser atualizados manualmente (não é uma lib com versão)
- Tailwind no HTML pode parecer verboso (aceitável com `cn()` para classes condicionais)

## Alternativas Consideradas
- **MUI (Material UI):** descartado — visual corporativo não alinhado com referência Kiwify; sobrescrever o tema é trabalhoso
- **Chakra UI:** descartado — tamanho do bundle maior; menos controle que shadcn/ui
- **CSS Modules puro:** descartado — sem sistema de design consistente; mais esforço para componentes acessíveis

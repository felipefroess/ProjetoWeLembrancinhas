# Wê Lembrancinhas — E-Commerce & Papelaria Afetiva
(welembrancinhas.com.br)

> Sistema web desenvolvido para modernizar o funil de atendimento e vendas da **Wê Lembrancinhas** (Instagram [@welembrancinhas](https://instagram.com/welembrancinhas)), negócio artesanal de lembrancinhas personalizadas liderado por **Wenilze Fróes** em **Pouso Alegre - MG** e **Paraisópolis - MG**.
---

## 1. O Problema de Negócio & Engenharia de Requisitos

No modelo anterior, as vendas eram realizadas 100% pelo Instagram Direct e WhatsApp de forma não estruturada:
- ❌ **Sobrecarga de Atendimento:** Clientes perguntavam preços, prazos e fotos repetidamente.
- ❌ **Falta de Dados Críticos:** O cliente esquecia de informar a data da festa, o tema ou a grafia do nome da criança.
- ❌ **Atrito no Fechamento:** Fazer o orçamento manual demorava.

### A Solução Implementada
- ✅ **Catálogo Digital com Filtros:** Baseado nos destaques do Instagram (Topos de Bolo, Caixas Milk, Batizado/Maternidade, Agendas e Datas Especiais).
- ✅ **Personalização:** Cada item permite informar *Tema*, *Nome da Criança*, *Idade/Data Comemorativa*, *Cor dos Laços* e *Observações*.
- ✅ **Checkout Estruturado para WhatsApp:** Monta o pedido detalhado e é enviado a conversa oficial com um único clique.

---
### Tecnologias Utilizadas

| Tecnologia | Finalidade | Decisão de Arquitetura (Trade-off) |
| :--- | :--- | :--- |
| **Next.js 16 (App Router + Turbopack)** | Framework Fullstack / SSR | Renderização estática ultrarrápida, excelente indexação de SEO no Google para cidades da região. |
| **React 19** | Biblioteca de UI | Componentização modular e ciclo de vida otimizado. |
| **TypeScript 5** | Tipagem Estrita de Domínio | Elimina erros em tempo de compilação e documenta as entidades do negócio. |
| **Tailwind CSS 4** | Estilização Utilitária | Design responsivo mobile-first com paleta artesanal suave e sem CSS extra não utilizado. |

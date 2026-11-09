# 🌸 Wê Lembrancinhas — E-Commerce & Papelaria Afetiva

> Sistema web desenvolvido para modernizar o funil de atendimento e vendas da **Wê Lembrancinhas** (Instagram [@welembrancinhas](https://instagram.com/welembrancinhas)), negócio artesanal de lembrancinhas personalizadas liderado por **Wenilze Fróes** em **Pouso Alegre - MG** e **Paraisópolis - MG**.
---

## 🎯 1. O Problema de Negócio & Engenharia de Requisitos

No modelo anterior, as vendas eram realizadas 100% pelo Instagram Direct e WhatsApp de forma não estruturada:
- ❌ **Sobrecarga de Atendimento:** Clientes perguntavam preços, prazos e fotos repetidamente.
- ❌ **Falta de Dados Críticos:** O cliente esquecia de informar a data da festa, o tema ou a grafia do nome da criança.
- ❌ **Atrito no Fechamento:** Fazer o orçamento manual de múltiplos itens demorava e gerava desistência.

### A Solução Implementada
- ✅ **Catálogo Digital com Filtros:** Baseado nos destaques do Instagram (Topos de Bolo, Caixas Milk Luxo, Batizado/Maternidade, Agendas e Datas Especiais).
- ✅ **Motor de Personalização Reativo:** Cada item permite informar *Tema*, *Nome da Criança*, *Idade/Data Comemorativa*, *Cor dos Laços* e *Observações*.
- ✅ **Carrinho Persistente com Validação de Quantidade Mínima:** Regras de negócio de lote mínimo de produção (ex: mínimo de 10 caixas milk).
- ✅ **Checkout Conversacional Estruturado para WhatsApp:** Monta o pedido detalhado em Markdown nativo e abre a conversa oficial com um único clique.

---
### Tecnologias Utilizadas

| Tecnologia | Finalidade | Decisão de Arquitetura (Trade-off) |
| :--- | :--- | :--- |
| **Next.js 16 (App Router + Turbopack)** | Framework Fullstack / SSR | Renderização estática ultrarrápida, excelente indexação de SEO no Google para cidades da região. |
| **React 19** | Biblioteca de UI | Componentização modular e ciclo de vida otimizado. |
| **TypeScript 5** | Tipagem Estrita de Domínio | Elimina erros em tempo de compilação e documenta as entidades do negócio. |
| **Tailwind CSS 4** | Estilização Utilitária | Design responsivo mobile-first com paleta artesanal suave e sem CSS extra não utilizado. |
| **Lucide Icons** | Iconografia | Ícones limpos e acessíveis. |
| **Canvas Confetti** | Micro-interação UX | Feedback de celebração visual ao concluir o envio do pedido. |

---

## 📂 3. Estrutura do Projeto

```text
ProjetoWeLembrancinhas/
├── src/
│   ├── app/
│   │   ├── globals.css      # Variáveis de tema e animações
│   │   ├── layout.tsx       # Root layout, fontes serifadas e metadados SEO
│   │   └── page.tsx         # Orquestração da Home e filtros reativos
│   ├── components/
│   │   ├── Header.tsx       # Barra de navegação e busca em tempo real
│   │   ├── HeroBanner.tsx   # Apresentação da artesã e proposta de valor
│   │   ├── CategoryFilter.tsx # Filtro horizontal baseado nos Stories do Instagram
│   │   ├── ProductCard.tsx  # Card com badges de pedido mínimo e preço
│   │   ├── ProductModal.tsx # Modal interativo de personalização do item
│   │   ├── CartDrawer.tsx   # Gaveta lateral com resumo do pedido
│   │   ├── CheckoutModal.tsx # Formulário de dados de entrega e disparo WhatsApp
│   │   ├── InstagramIcon.tsx # SVG otimizado do Instagram
│   │   ├── WhatsappButton.tsx # Botão flutuante de atendimento rápido
│   │   └── Footer.tsx       # Rodapé com créditos de Engenharia (Inatel)
│   ├── context/
│   │   └── CartContext.tsx  # Gerenciamento de estado global e formatador de pedido
│   ├── data/
│   │   ├── categories.ts    # Modelos de categorias oficiais
│   │   └── products.ts      # Catálogo e dados da artesã Wenilze Fróes
│   └── types/
│       └── index.ts         # Contratos e interfaces de domínio
```

---

## 🚀 4. Como Executar o Projeto Localmente

```bash
# 1. Instalar as dependências
npm install

# 2. Executar em ambiente de desenvolvimento
npm run dev

# 3. Ou compilar e rodar a versão de produção
npm run build
npm run start
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## ☁️ 5. Deploy em Produção (Vercel)

Para hospedar o site de forma 100% gratuita, com certificado SSL e domínio próprio:

1. Suba o código para o seu GitHub:
   ```bash
   git add .
   git commit -m "feat: site oficial we lembrancinhas completo"
   git branch -M main
   git remote add origin https://github.com/<SEU_USUARIO>/welembrancinhas.git
   git push -u origin main
   ```
2. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
3. Importe o repositório `welembrancinhas`.
4. Clique em **Deploy**. Em menos de 1 minuto o site estará no ar com link oficial!

---

## 🎓 6. Autor

- **Desenvolvedor:** Felipe Fróes
- **Cliente / Artesã:** Wenilze Fróes — **Wê Lembrancinhas** (Pouso Alegre - MG / Paraisópolis - MG)

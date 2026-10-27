# Auditoria de acessibilidade

**Data:** 27 de outubro de 2026  
**Escopo:** inspeção estática dos componentes e estilos em `src/`, com atenção à navegação por teclado, foco visível, semântica de busca, seletor de unidade, estados e contraste.

## Resumo

A aplicação já oferece fundamentos importantes de acessibilidade: link para pular ao conteúdo, campos com rótulos associados, controles nativos de botão, nomes acessíveis para os grupos, estilos `focus-visible` e regiões para estados e erros. Foram identificados dois ajustes recomendados: melhorar o anúncio dos estados de carregamento e corrigir a direção das setas no seletor de unidade.

## Achados

| # | Severidade | Local | Achado | Correção mínima recomendada |
|---|---|---|---|---|
| 1 | Média | [`src/App.tsx`](../src/App.tsx) | A região `aria-live` está dentro de `main`, que recebe `aria-busy` durante carregamentos. Atualizações nessa região podem não ser anunciadas enquanto o conteúdo estiver ocupado. Além disso, a expressão do anúncio prioriza `searchStatus === 'success'`; como esse estado permanece após selecionar uma cidade, a conclusão do carregamento meteorológico não chega a ser anunciada. | Colocar uma única região `aria-live="polite"` fora do elemento ocupado e derivar seu texto do estado atual. Anunciar, por exemplo, busca concluída, carregamento do clima e clima carregado, sem duplicar anúncios dos componentes `status`. |
| 2 | Baixa | [`src/components/UnitToggle.tsx`](../src/components/UnitToggle.tsx) | O manipulador de teclado calcula sempre o próximo índice, tanto para `ArrowLeft` quanto para `ArrowRight`. Com as duas unidades atuais, ambas as teclas alternam para a mesma opção, contrariando a direção esperada. | Calcular o índice conforme a tecla (`ArrowLeft` volta; `ArrowRight` avança), ou remover o manipulador e manter os botões nativos navegáveis com `Tab`. |

### Exemplo para o seletor de unidade

Caso o comportamento de setas seja mantido, o índice pode ser calculado a partir da direção:

```tsx
const direction = event.key === 'ArrowRight' ? 1 : -1;
const nextIndex = (index + direction + units.length) % units.length;
```

O foco deve continuar sendo movido ao botão correspondente, e a unidade selecionada deve ser atualizada como já ocorre.

### Exemplo para anúncios de estado

Manter a região anunciadora fora do `main` ocupado evita que `aria-busy` também silencie a própria mensagem. O texto pode ser derivado dos estados de busca e clima, com uma precedência explícita para o carregamento e o resultado do clima selecionado.

## Verificações sem achados relevantes

### Navegação por teclado e foco

- O link “Pular para o conteúdo” leva ao `main` focável (`tabIndex={-1}`).
- Busca, botões de seleção de cidade, botões de unidade, botão de nova tentativa e links são controles nativos e estão disponíveis na sequência de teclado.
- Os controles interativos observados têm estilos `focus-visible` com contorno de 2 px. A busca também tem foco visível.
- Não foi identificada dependência de interação exclusivamente por mouse. O problema das setas do seletor está descrito no achado 2.

### Semântica e nomes acessíveis

- A busca usa `role="search"`, nome acessível e `<label>` associado ao campo.
- A validação do campo expõe `aria-invalid` e associa a mensagem por `aria-describedby`; a mensagem usa `role="alert"`.
- O seletor de unidade tem `role="group"` e nome acessível; cada botão tem rótulo e estado `aria-pressed`.
- As opções de cidade são botões com estado `aria-pressed`, dentro de uma seção nomeada.
- O carregamento usa `role="status"` e os erros de serviço usam `role="alert"`.

### Contraste

Foram calculadas razões de contraste das cores da paleta configurada em [`tailwind.config.js`](../tailwind.config.js), usando as cores-base opacas do tema:

| Combinação | Razão aproximada | Referência WCAG para texto normal |
|---|---:|---:|
| `slate-300` (`#cbd5e1`) sobre `night-900` (`#0b1020`) | 12,75:1 | 4,5:1 |
| `slate-400` (`#94a3b8`) sobre `night-900` (`#0b1020`) | 7,38:1 | 4,5:1 |
| `accent-400` (`#8b9bff`) sobre `night-800` (`#11162a`) | 7,02:1 | 4,5:1 |
| `rose-300` (`#fda4af`) sobre `night-900` (`#0b1020`) | 10,01:1 | 4,5:1 |
| `night-900` (`#0b1020`) sobre `accent-500` (`#6d7cff`) | 5,39:1 | 4,5:1 |

As combinações medidas atendem ao limite de contraste para texto normal. Como vários cartões e controles usam fundos translúcidos, a razão efetiva depende da composição sobre o conteúdo atrás deles; essa composição não foi verificada em navegador. Recomenda-se validar visualmente os estados reais sobre os fundos do gradiente, especialmente em telas com variações de brilho.

## Limitações

Esta auditoria foi uma revisão estática do código e das cores-base do tema. Não foram executados testes com leitores de tela, navegação manual em navegador, análise de contraste sobre fundos compostos ou ferramentas automatizadas. Portanto, os resultados não substituem uma validação manual de ponta a ponta.

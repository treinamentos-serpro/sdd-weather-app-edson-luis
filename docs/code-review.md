# Revisão de código — Weather App

**Data:** 28 de outubro de 2026
**Escopo:** código atual de `src/`, revisado contra [specs/weather-app-spec.md](../specs/weather-app-spec.md). Revisão estática: `pnpm lint`, `pnpm build` e `pnpm test` não foram executados e `tests/` não foi avaliado.

## Resumo

A aplicação implementa busca, seleção de cidade, clima atual, previsão de 5 dias, alternância °C/°F e estados de loading, erro e vazio. O serviço valida as respostas da Open-Meteo e aplica timeout de 10 s. O hook descarta respostas antigas por id de operação.

## Aderência à spec

- **Cobertos:** CA-01.1 a CA-01.5, CA-01.7, CA-02.2 a CA-02.4, CA-02.6 a CA-02.8, CA-04.1 a CA-04.3, CA-05.2 a CA-05.4 e a atribuição da Open-Meteo.
- **Lacunas:** CA-01.6 e CA-02.7 (achados 6 e 7) e CA-05.5 (achado 2).

## Achados

### Bloqueantes

Nenhum.

### Recomendados

| # | Local | Achado | Correção |
|---|---|---|---|
| 1 | [`ErrorState.tsx`](../src/components/states/ErrorState.tsx), [`App.tsx`](../src/App.tsx) | Ao clicar em "Tentar novamente", o `ErrorState` é desmontado e o foco vai para o `body` (RNF-02). | Mover o foco para `#weather-content` ou para o indicador de carregamento; ou manter o botão montado com `aria-disabled` durante o loading. |
| 2 | [`weatherService.ts`](../src/services/weatherService.ts) (`normalizeWeather`) | `current.time` inconsistente com `dates[0]` lança `invalid-response` e descarta dados válidos, contra o CA-05.5. | Tratar o horário inválido como ausente (`referenceTime = undefined`); manter o erro só para temperatura, fuso e datas. |
| 3 | [`UnitToggle.tsx`](../src/components/UnitToggle.tsx) | `aria-label="Celsius"` não contém o texto visível "°C" (WCAG 2.5.3, Label in Name). | `aria-label="°C, Celsius"` ou texto visível com `title`. |
| 4 | [`CurrentWeather.tsx`](../src/components/CurrentWeather.tsx) | `<output>` tem `role=status` implícito e anuncia mudanças de unidade/cidade sem necessidade. | Usar `<p>`/`<span>` com `aria-label`. |
| 5 | [`App.tsx`](../src/App.tsx) | `<div aria-live>` envolve um `LoadingState` que já tem `role="status"`; o anúncio de clima carregado é suprimido quando a busca está em `success`. Sobrepõe-se ao item 1 de [accessibility-audit.md](./accessibility-audit.md). | Remover o wrapper e manter uma live region persistente fora do elemento `aria-busy`, derivando o texto do estado atual. |
| 6 | [`CityResults.tsx`](../src/components/CityResults.tsx) | `selectedCity?.id === city.id` contraria a regra 4 (identidade por coordenadas). | Comparar `id`, `latitude` e `longitude`. |
| 7 | [`App.tsx`](../src/App.tsx) | CA-01.6 exige nome e contexto; loading e erro mostram só `name`. | Extrair `cityContext` para `src/lib/` e reutilizar nas mensagens. |
| 8 | [`useWeather.ts`](../src/hooks/useWeather.ts) | Requisições substituídas continuam em voo. | Passar `AbortSignal` a `searchCities`/`getWeather` e abortar ao iniciar nova operação ou desmontar. |

### Nits

9. Uma cidade inválida em `results` falha a busca inteira (`results.every(isCity)`); considerar filtrar as inválidas.
10. Código morto: [`useMockWeather.ts`](../src/hooks/useMockWeather.ts) e [`mocks/weather.ts`](../src/mocks/weather.ts) não são usados em `src/`.
11. [`CurrentWeather.tsx`](../src/components/CurrentWeather.tsx) formata a data com `split('-').reverse()`; preferir `Intl.DateTimeFormat` com `timeZone: 'UTC'` (RNF-03).
12. `SearchBar` usa `aria-[disabled=false]:hover`; confirmar suporte na versão do Tailwind no build.

## Testes sugeridos

Casos para os achados 1, 2, 3 e 6, e para CA-01.7 e CA-02.7 com respostas fora de ordem.

## Veredito

Sem bloqueantes de aderência. Resolver os achados 1 a 7 antes do merge; o 2 (CA-05.5) é o mais relevante para a spec e o 1 (foco) para a acessibilidade.

## Avaliação dos comentários

As recomendações abaixo complementam a revisão original e prevalecem sobre seu
veredito quando houver divergência. A avaliação é estática; não foram
executados testes nem validação com leitor de tela.

| # | Recomendação | Justificativa |
|---|---|---|
| 1 | **Aceitar** | A remoção do botão de nova tentativa pode deixar o foco no `body`, prejudicando a navegação exigida pelo RNF-02. Validar o destino do foco nos dois fluxos de erro. |
| 2 | **Recusar a correção proposta** | CA-05.5 trata horário ausente, não horário inconsistente. O [plano](../plans/weather-app-plan.md) e a T-10 exigem verificar a coincidência com a primeira data. Descartar a inconsistência silenciosamente pode ocultar previsão de período incorreto. |
| 3 | **Aceitar** | Incluir o símbolo visível no nome acessível melhora a identificação por tecnologia assistiva e comando de voz, conforme RNF-02 e CA-04.5. |
| 4 | **Discutir** | Evitar anúncios redundantes é razoável, mas a necessidade depende da experiência com leitores de tela. A substituição deve preservar nome e valor acessíveis; `aria-label` em um `<span>` genérico não é solução garantida. |
| 5 | **Aceitar** | O estado de busca bem-sucedida prevalece sobre o anúncio de clima carregado; a região dentro de `aria-busy` também pode ter anúncios adiados. Há relação direta com CA-05.1 e RNF-02. |
| 6 | **Aceitar o problema; discutir a correção** | A regra 4 define identidade pelas coordenadas; comparar só o ID não garante isso. Exigir também o mesmo ID pode rejeitar a mesma localização com IDs diferentes: alinhar a comparação à identidade definida na spec. |
| 7 | **Aceitar** | CA-01.6 exige nome e contexto durante a consulta. A lista pode deixar de estar visível após outra busca; mostrar o contexto também no estado meteorológico preserva a identificação. |
| 8 | **Discutir** | Cancelamento economiza rede, mas a regra 8 exige descartar respostas antigas, já tratado por IDs de operação. Se adotado, distinguir cancelamento de timeout e manter a proteção contra respostas obsoletas. |
| 9 | **Recusar a filtragem silenciosa** | A T-08 exige erro tipado para estrutura incompatível, não resultado parcial apresentado como completo. Mudança de política exige revisão do contrato e testes. |
| 10 | **Discutir parcialmente** | O hook mock parece não utilizado, mas o arquivo de dados mock é usado por testes e documentado no [README](../README.md). Não remover ambos como código morto sem avaliar esses usos. |
| 11 | **Recusar como correção obrigatória** | A formatação atual produz `dd/mm/aaaa` e não desloca a data pelo fuso do dispositivo. `Intl` pode melhorar a padronização, mas RNF-03 não exige sua utilização. |
| 12 | **Aceitar a verificação** | Confirmar geração e comportamento do seletor no build e no navegador é pertinente: RNF-02 exige ausência de hover de ação habilitada durante a busca. Não há evidência aqui de que o seletor esteja quebrado. |

Os testes sugeridos são pertinentes, mas os testes de respostas fora de ordem
já existem em [useWeather.test.ts](../tests/unit/useWeather.test.ts); avaliar
lacunas antes de duplicá-los.

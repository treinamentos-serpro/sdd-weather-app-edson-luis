# Revisão de segurança — `src/services`

**Data:** 28 de outubro de 2026
**Escopo:** [`src/services/weatherService.ts`](../src/services/weatherService.ts) (único arquivo da pasta), com OWASP Top 10 aplicado ao que é relevante para um app front-end.

## Conclusão

Sem vulnerabilidade explorável nem bloqueante. Os achados são de hardening.

## Respostas às perguntas

| Pergunta | Resposta |
|---|---|
| Injeção | Sem risco relevante. A consulta passa por `encodeURIComponent`; latitude e longitude só entram na URL após `isCity` (números finitos) e checagem de faixa em `getWeather`. Sem `eval`, `innerHTML` ou `dangerouslySetInnerHTML`; o React escapa a saída (A03). |
| Vazamento de dados | Baixo. Mensagens de erro estáticas, sem eco de corpo ou URL; `cause` fica no `Error` e a UI mostra só `message`. Sem storage nem logs. Consulta e coordenadas vão apenas à Open-Meteo, conforme a spec (RNF-06). |
| Uso inseguro de URLs | Não. Hosts fixos e HTTPS (`geocoding-api.open-meteo.com`, `api.open-meteo.com`); nada vem de entrada externa (A10 não se aplica no front-end). |
| Ausência de timeout | Existe. `AbortController` de 10 s cobre cabeçalhos e leitura do corpo; `clearTimeout` no `finally`. Sem retry automático (regra 9 da spec). |

## Mapeamento OWASP Top 10

- **A03 Injection:** mitigado.
- **A04/A08 Design inseguro e integridade:** resposta externa tratada como `unknown` e validada em runtime (tipos, datas, fuso via `Intl`, tamanho dos arrays, formato do horário); inválidas viram `invalid-response`.
- **A05 Configuração insegura:** ver recomendados 1 e 2.
- **A06 Componentes vulneráveis:** não verificado; rodar `pnpm audit` e manter `pnpm-lock.yaml` versionado.
- **A09 Logging:** não aplicável (o app não grava logs).
- **A01, A02, A07:** não aplicáveis (sem autenticação, sessão, segredo ou chave de API).

## Achados

### Recomendados

1. **Sem Content-Security-Policy** em [`index.html`](../index.html) nem em [`vite.config.ts`](../vite.config.ts) (A05). Sugestão: `default-src 'self'; connect-src https://geocoding-api.open-meteo.com https://api.open-meteo.com; img-src 'self' data:; object-src 'none'; base-uri 'none'`, preferencialmente como cabeçalho HTTP. Reforça o RNF-06.
2. **Referrer não definido.** O `fetch` envia `Referer` com a origem do app. Adicionar `referrerPolicy: 'no-referrer'` na chamada de `fetchWithTimeout` (ou `<meta name="referrer" content="no-referrer">`).

### Nits

3. Montar URLs com `new URL()` e `URLSearchParams` em vez de concatenação.
4. Limitar o comprimento da consulta (por exemplo, 100 caracteres), no serviço e no `SearchBar`.
5. Verificar `Content-Type: application/json` em `readJson` para erros mais precisos.
6. Strings externas (`name`, `admin1`, `country`) sem limite de tamanho; sem risco de XSS, e o CSS usa `break-words`.
7. Exceções inesperadas em `fetchWithTimeout` viram `network`; considerar registrar o `cause` só em desenvolvimento.
8. Requisições em voo não são abortadas ao serem substituídas (desperdício de rede, não vulnerabilidade).

## Veredito

Aprovado do ponto de vista de segurança. Aplicar o CSP (1) e o `referrerPolicy` (2) antes do lançamento e executar `pnpm audit`.

## Avaliação dos comentários

As recomendações abaixo complementam a revisão original e prevalecem sobre seu
veredito quando houver divergência. A avaliação é estática; não foram
executados testes nem auditoria de dependências.

| # | Recomendação | Justificativa |
|---|---|---|
| 1 | **Aceitar a CSP; discutir a política proposta** | É uma defesa em profundidade útil, embora não exigida explicitamente pela spec. A sugestão apresentada bloquearia as fontes do Google usadas em [index.html](../index.html); definir e testar a política conforme o ambiente de publicação. |
| 2 | **Discutir** | `no-referrer` reduz exposição desnecessária, mas a origem do app não é, por si só, a consulta ou as coordenadas protegidas pelo RNF-06. Decidir a política considerando integrações e publicação, sem tratá-la como vulnerabilidade comprovada. |
| 3 | **Discutir** | `URL` e `URLSearchParams` podem facilitar manutenção, mas a consulta já é codificada e as coordenadas são validadas; não há correção de segurança demonstrada. |
| 4 | **Discutir** | Um limite pode evitar entradas excessivas, mas 100 caracteres é arbitrário e altera o comportamento permitido pela spec. Definir limite e mensagem de validação antes de implementar. |
| 5 | **Discutir** | Verificar o tipo de conteúdo pode melhorar o diagnóstico, mas o JSON já é analisado e validado. Um filtro rígido pode rejeitar respostas legítimas sem necessidade. |
| 6 | **Discutir** | Limites podem reforçar a robustez da interface, mas não há XSS demonstrado; truncamento ou rejeição pode perder informação geográfica útil. Definir comportamento antes de restringir. |
| 7 | **Aceitar o problema; discutir a solução** | Erros inesperados não deveriam ser classificados indistintamente como falha de rede. Corrigir a classificação e preservar diagnóstico sem expor dados sensíveis; logging apenas em desenvolvimento não resolve sozinho a classificação. |
| 8 | **Discutir** | É a mesma recomendação do item 8 da [revisão de código](./code-review.md): otimização de recursos, não vulnerabilidade demonstrada. |

Executar `pnpm audit` antes do lançamento: a revisão não verificou
dependências, e o lockfile já está versionado.

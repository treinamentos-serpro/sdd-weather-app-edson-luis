# Evidências de validação e lançamento

Data da validação: 27/10/2026.

## Validação automatizada

| Comando | Resultado | Evidência |
|---|---|---|
| `pnpm lint` | Aprovado | Biome verificou 38 arquivos, sem avisos ou correções. |
| `pnpm build` | Aprovado | `tsc -b` e build Vite concluídos; bundle de produção gerado. |
| `pnpm test` | Aprovado | 15 arquivos e 187 testes unitários aprovados. |
| `pnpm test:e2e` | Aprovado | 55 testes aprovados, 11 em cada um dos cinco projetos. |

### Projetos e viewports

| Projeto Playwright | Perfil executado | Resultado |
|---|---|---|
| `chromium` | Desktop Chrome | 11/11 aprovados |
| `firefox` | Desktop Firefox | 11/11 aprovados |
| `webkit` | Desktop Safari/WebKit | 11/11 aprovados |
| `mobile-chromium` | Emulação Pixel 7/Chromium; jornada principal em 320 px e toque | 11/11 aprovados |
| `mobile-webkit` | Emulação iPhone 13/WebKit; jornada principal em 320 px e toque | 11/11 aprovados |

Os cenários de responsividade verificaram 320, 768 e 1920 pixels CSS. Os
cenários de data usaram relógio controlado próximo à meia-noite e fusos do
navegador `Pacific/Kiritimati` e `Etc/GMT+12`. Todas as chamadas Open-Meteo da
suíte foram interceptadas com respostas determinísticas; não são evidência de
desempenho da fonte ou de dispositivos físicos.

Os perfis mobile são emulações de browser, não validação em aparelhos reais.
Os navegadores foram executados com os binários Playwright disponíveis no
ambiente e não representam uma matriz de versões reais de usuários.

## Atribuição e licença Open-Meteo

Consulta às páginas oficiais em 27/10/2026:

- [Termos de uso Open-Meteo](https://open-meteo.com/en/terms): o serviço gratuito
  é destinado a uso não comercial e os dados seguem CC BY 4.0.
- [Licença dos dados Open-Meteo](https://open-meteo.com/en/licence): exige
  crédito apropriado, link para a licença, indicação de adaptações e link para
  `https://open-meteo.com/` junto à apresentação dos dados.

A interface local exibe o crédito Open-Meteo, informa que os dados foram
adaptados para apresentação e inclui o link CC BY 4.0 em todos os estados. A
aplicabilidade do plano gratuito ainda deve ser confirmada para o contexto de
uso e publicação antes do lançamento.

## Pendências de lançamento

- **T-40 — Desempenho:** a URL pública
  `https://treinamentos-serpro.github.io/sdd-weather-app-edson-luis/app/`
  responde, mas ainda serve o bundle `index-Ck-7NIXp.js`. O build local validado
  nesta execução gerou `index-AbTkern-.js` e inclui a seleção explícita de
  cidades, ausente no bundle público. Portanto, a URL publicada não corresponde
  ao código validado e seus resultados não seriam evidência válida para esta
  versão. Após publicar o build atual, executar 100 medições por fluxo sob RTT
  controlado de até 50 ms, registrar p95, latência da fonte, tempo de
  renderização, falhas e timeouts.
- **T-41 — Revisão manual:** ainda requer registro humano de contraste e
  acessibilidade, zoom real de 200%, compatibilidade em dispositivos e versões
  físicos, além da revisão dos termos para o contexto de publicação. Os testes
  automatizados e emulações desta evidência não substituem essas verificações.

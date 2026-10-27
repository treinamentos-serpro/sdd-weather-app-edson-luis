# Especificação de Produto — Weather App

## Status e objetivo

Especificação da primeira versão (v1), derivada de [discovery.md](./discovery.md). As regras abaixo são decisões de escopo para tornar a entrega verificável; mudanças posteriores devem atualizar esta especificação e seus critérios de aceite.

O produto é uma aplicação web responsiva, em português do Brasil, para pesquisar uma cidade, consultar suas condições meteorológicas atuais e ver a previsão diária de hoje e dos quatro dias seguintes. A fonte de geocodificação e meteorologia é a Open-Meteo, sem autenticação ou chave de API.

## Escopo da v1

**Incluído**

- Busca explícita de cidades pelo nome, seleção de um resultado e consulta associada à localização selecionada.
- Condições atuais e previsão diária de cinco datas de calendário consecutivas.
- Temperaturas em Celsius ou Fahrenheit, com Celsius como padrão.
- Estados de carregamento, vazio, erro, dados parciais e nova tentativa manual.
- Interface pt-BR, responsiva e acessível por teclado.

**Fora do escopo**

- Contas, autenticação, histórico, favoritos, notificações, geolocalização do dispositivo e funcionamento offline.
- Previsão horária, idiomas além de pt-BR e preferência de unidade persistida entre sessões.
- Analytics e armazenamento de consultas ou localizações em servidor ou navegador.
- Garantia de disponibilidade ou atualização da fonte meteorológica.
- Mapas, radar, imagens de satélite ou outras visualizações geográficas do clima.
- Qualidade do ar, índice UV, pólen, alertas meteorológicos ou avisos de eventos severos.
- Dados meteorológicos históricos, tendências climáticas ou previsões para além dos cinco dias definidos.
- Comparação simultânea de cidades, painel com múltiplas localizações ou compartilhamento e exportação de consultas.
- Alternância de unidades para vento, precipitação ou pressão; vento permanece em km/h, precipitação atual em mm e pressão ao nível do mar em hPa. A previsão diária usa probabilidade de precipitação em porcentagem.

## Regras de produto

1. A pessoa envia a busca por botão ou Enter; não há busca automática enquanto digita.
2. O texto é removido de espaços nas extremidades. Consultas com menos de dois caracteres após essa normalização não são enviadas.
3. São apresentados no máximo dez resultados, na ordem recebida da fonte. Cada resultado mostra o nome da cidade e, quando disponíveis, região administrativa e país.
4. A identidade da cidade selecionada é sua localização retornada pela fonte (coordenadas), não apenas seu nome. A consulta meteorológica usa essa localização e o fuso horário associado.
5. Os dias da previsão são definidos no fuso horário da cidade selecionada, não no fuso do dispositivo. O período contém hoje local e os quatro dias locais seguintes.
6. Os valores de temperatura são normalizados em Celsius antes da apresentação. Alternar a unidade não altera a cidade nem as datas e não exige nova consulta meteorológica. A preferência vale somente até a sessão atual terminar; uma nova sessão começa em Celsius.
7. Uma nova busca não remove a consulta meteorológica da cidade já selecionada. Ao selecionar outra cidade, os dados meteorológicos anteriores são removidos imediatamente; enquanto a nova consulta carrega, a nova cidade permanece identificada.
8. Uma resposta de busca ou clima só pode atualizar a interface se pertencer à busca/localização atualmente ativa. Respostas antigas ou fora de ordem são descartadas.
9. Cada requisição expira após dez segundos. Não há nova tentativa automática. Após falha ou timeout, a pessoa pode tentar novamente; os dados de outra cidade ou dados antigos não podem ser apresentados como atuais.
10. A interface informa o horário de referência fornecido para as condições atuais, no fuso da cidade. Esse horário não deve ser descrito como horário de publicação/atualização da fonte. Se ausente, informar indisponibilidade sem inventar um valor.
11. A busca e as coordenadas selecionadas são enviadas à Open-Meteo para atender à consulta. A aplicação não solicita localização do dispositivo nem persiste esses dados. A atribuição exigida pela fonte deve ser exibida.

## Requisitos funcionais

- **RF-01 — Buscar cidades:** aceitar uma consulta válida e exibir até dez resultados selecionáveis, com contexto geográfico disponível.
- **RF-02 — Consultar condições atuais:** após selecionar uma cidade, exibir temperatura e sensação térmica, condição meteorológica com ícone, umidade relativa (%), velocidade do vento (km/h), precipitação atual (mm) e pressão ao nível do mar (hPa) quando fornecidas pela fonte. O hero destaca a temperatura na unidade selecionada.
- **RF-03 — Consultar previsão diária:** exibir cinco datas locais consecutivas; para cada dia, exibir temperatura mínima e máxima, condição, probabilidade máxima de precipitação (%) e velocidade máxima do vento (km/h) quando fornecidas.
- **RF-04 — Alternar temperatura:** disponibilizar Celsius e Fahrenheit, iniciando em Celsius.
- **RF-05 — Tratar estados e falhas:** distinguir carregamento, resultados vazios, falha de serviço, timeout e dados parciais; oferecer nova tentativa em falhas recuperáveis.
- **RF-06 — Informar referência temporal:** apresentar o horário de referência das condições atuais quando fornecido, com fuso local, ou indicar que está indisponível.

## Histórias de usuário

- **US-01 — Encontrar e selecionar uma cidade:** Como pessoa que consulta o clima, quero buscar uma cidade e selecionar o resultado correto para consultar a localização desejada.
- **US-02 — Consultar condições atuais:** Como pessoa que consulta o clima, quero ver as condições atuais de uma cidade selecionada para entender o tempo neste momento.
- **US-03 — Consultar previsão diária:** Como pessoa que consulta o clima, quero ver a previsão de hoje e dos quatro dias seguintes para planejar os próximos dias.
- **US-04 — Escolher unidade de temperatura:** Como pessoa que consulta o clima, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas na unidade que prefiro.
- **US-05 — Entender estados e recuperar falhas:** Como pessoa que consulta o clima, quero saber quando uma operação está carregando, não encontrou resultados ou falhou, e poder tentar novamente quando aplicável.
- **US-06 — Entender a referência dos dados:** Como pessoa que consulta o clima, quero ver o horário de referência das condições atuais no fuso da cidade, ou saber quando ele não está disponível.

## Critérios de aceite

### RF-01 — Busca e seleção

- **CA-01.1:** Dada uma consulta com menos de dois caracteres após remover espaços nas extremidades, quando a pessoa enviar o formulário, então nenhuma requisição é feita e uma indicação de entrada inválida é apresentada.
- **CA-01.2:** Dada uma consulta válida, quando a pessoa a enviar por botão ou Enter, então o estado de carregamento da busca é anunciado e nenhum resultado de uma consulta anterior é apresentado como resultado da atual.
- **CA-01.3:** Dada uma resposta com resultados, quando a busca terminar, então são exibidos no máximo dez resultados, preservando a ordem da fonte; cada resultado identifica cidade e apresenta região e país quando disponíveis.
- **CA-01.4:** Dada uma busca concluída sem resultados, quando a resposta for exibida, então a interface informa que nenhuma cidade foi encontrada e não exibe esse estado como erro de serviço.
- **CA-01.5:** Dada uma falha ou timeout de geocodificação, quando a busca terminar, então a interface informa que não foi possível pesquisar e oferece ação para tentar novamente.
- **CA-01.6:** Dada uma pessoa que seleciona um resultado, quando a consulta meteorológica começar, então o nome e o contexto desse resultado permanecem identificados e os dados solicitados correspondem às coordenadas selecionadas.
- **CA-01.7:** Dadas duas buscas em sequência cuja primeira resposta chega por último, quando ambas terminarem, então apenas os resultados da busca mais recente são exibidos.

### RF-02 e RF-03 — Dados meteorológicos

- **CA-02.1:** Dada uma localização selecionada e uma resposta válida, quando os dados forem exibidos, então a tela identifica a cidade e apresenta os campos atuais e diários definidos neste documento, com unidades e datas associadas aos respectivos valores.
- **CA-02.2:** Dada uma cidade cujo fuso difere do dispositivo, quando a previsão for exibida, então as cinco datas correspondem a hoje e aos quatro dias seguintes no fuso da cidade, inclusive em consultas próximas à meia-noite.
- **CA-02.3:** Dada uma previsão com dados para cinco dias, quando renderizada, então aparecem exatamente cinco datas distintas e consecutivas, cada uma com seu próprio conjunto de valores.
- **CA-02.4:** Dado que um campo meteorológico está ausente, quando os demais dados são exibidos, então o campo ausente é identificado como indisponível, sem `0`, valor anterior ou texto que o represente como dado válido.
- **CA-02.5:** Dado que faltam dados de um dia, quando a previsão for exibida, então a data continua identificada e o dia é indicado como indisponível; os demais dias permanecem visíveis.
- **CA-02.6:** Dada uma resposta sem dados atuais utilizáveis ou sem localização/fuso utilizável, quando a consulta terminar, então a interface informa que não foi possível exibir os dados meteorológicos, sem apresentar valores fabricados.
- **CA-02.7:** Dada uma consulta meteorológica em andamento, quando a pessoa selecionar outra cidade, então os dados da cidade anterior não são associados à nova seleção, mesmo que sua resposta chegue depois.
- **CA-02.8:** Dado um código meteorológico reconhecido, quando a condição for exibida, então seu rótulo em pt-BR corresponde à tabela de códigos WMO; para código desconhecido, a condição é identificada como indisponível.

### RF-04 — Unidades

- **CA-04.1:** Dada uma nova sessão, quando a aplicação for aberta, então Celsius está selecionado.
- **CA-04.2:** Dada uma temperatura em Celsius, quando a pessoa selecionar Fahrenheit, então todas as temperaturas atuais e previstas disponíveis são convertidas pela fórmula `°F = (°C × 9/5) + 32`; o inverso usa `°C = (°F − 32) × 5/9`.
- **CA-04.3:** Dado qualquer valor convertido, quando apresentado, então é arredondado ao inteiro mais próximo e acompanhado do símbolo correto (`°C` ou `°F`); por exemplo, `0 °C` é `32 °F` e `20 °C` é `68 °F`.
- **CA-04.4:** Dada uma alteração de unidade durante carregamento ou após a consulta, quando a operação terminar, então valores disponíveis aparecem na unidade selecionada sem alterar a cidade ou o período.
- **CA-04.5:** Dado o controle de unidade, quando operado por teclado ou consultado por tecnologia assistiva, então seus rótulos e estado selecionado são identificáveis.

### RF-05 e RF-06 — Estados, erros e atualização

- **CA-05.1:** Dada uma requisição de busca ou clima pendente, quando a operação estiver em andamento, então o estado de carregamento fica associado à região correspondente e é anunciado sem exigir foco no indicador.
- **CA-05.2:** Dada uma falha de rede, resposta de serviço inválida ou requisição sem resposta em dez segundos, quando a operação terminar, então a interface apresenta mensagem apropriada, preserva a cidade selecionada quando houver e oferece nova tentativa.
- **CA-05.3:** Dado um erro meteorológico, quando a pessoa tentar novamente, então uma nova consulta é feita para a cidade ainda selecionada; não há repetição automática.
- **CA-05.4:** Dada uma resposta bem-sucedida que contenha horário de referência das condições atuais, quando os dados forem exibidos, então esse horário é apresentado no fuso da cidade sob o rótulo “Referência dos dados”.
- **CA-05.5:** Dada uma resposta sem horário de referência, quando os dados forem exibidos, então a interface informa que o horário está indisponível e não infere a hora a partir do relógio do dispositivo.

## Requisitos não funcionais

- **RNF-01 — Responsividade:** em viewports de 320 a 1920 pixels CSS e zoom de 200%, conteúdo e controles permanecem utilizáveis, sem rolagem horizontal da página. Verificar no mínimo 320, 768 e 1920 pixels.
- **RNF-02 — Acessibilidade:** atender WCAG 2.2 nível AA. Todos os fluxos devem funcionar por teclado, ter foco visível, ordem de foco lógica, rótulos programáticos, contraste AA e anúncios acessíveis de carregamento, resultados e erros. Nenhuma informação pode depender apenas de cor.
  - Durante a busca, o formulário informa `aria-busy` e o botão indisponível não apresenta hover de ação habilitada. Ao receber cidades, o foco vai ao título dos resultados se ainda estiver na busca ou tiver retornado ao corpo da página; não interrompe quem navegou para outro controle. Alternar unidades não desloca o foco.
- **RNF-03 — Idioma e formatos:** textos, condições meteorológicas e datas são apresentados em pt-BR; datas e horas usam o fuso da cidade para dados meteorológicos e formatos locais para números. Temperaturas sempre exibem unidade.
- **RNF-04 — Compatibilidade:** validar o fluxo principal nas duas versões estáveis mais recentes de Chrome, Firefox, Safari e Edge; em dispositivos móveis, nas duas versões principais mais recentes de Android com Chrome e iOS com Safari.
- **RNF-05 — Desempenho (meta):** em teste com a versão publicada e rede controlada (RTT até 50 ms, sem perda de pacotes), medir do envio da busca/seleção até a renderização dos resultados. Em 100 execuções por fluxo, o percentil 95 deve ser de até 2 s para busca e 3 s para clima. Registrar separadamente latência da fonte; falha ou lentidão externa não pode ser mascarada como sucesso.
- **RNF-06 — Privacidade:** não solicitar permissão de localização, não usar analytics e não gravar consulta, coordenadas ou unidade em armazenamento persistente. Confirmar no navegador que nenhuma dessas informações é enviada a destinos além da fonte necessária à consulta.
- **RNF-07 — Fonte externa:** cumprir limites, termos e requisitos de atribuição vigentes da Open-Meteo. Indisponibilidade, resposta inválida e timeout da fonte devem resultar nos estados definidos em RF-05, não em conteúdo fictício.

## Tabela de rastreabilidade

Cada linha relaciona uma história aos critérios de aceite que a verificam e aos requisitos não funcionais que condicionam sua implementação e validação. Os critérios compartilhados aparecem em mais de uma linha quando cobrem comportamentos usados por histórias distintas.

| User Story | Critérios de aceite | Requisitos não funcionais relevantes |
|---|---|---|
| **US-01 — Encontrar e selecionar uma cidade** | CA-01.1–CA-01.7; CA-02.7 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-07 |
| **US-02 — Consultar condições atuais** | CA-01.6; CA-02.1, CA-02.4, CA-02.6–CA-02.8; CA-05.1–CA-05.3 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-07 |
| **US-03 — Consultar previsão diária** | CA-01.6; CA-02.1–CA-02.8; CA-05.1–CA-05.3 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-07 |
| **US-04 — Escolher unidade de temperatura** | CA-04.1–CA-04.5 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-06 |
| **US-05 — Entender estados e recuperar falhas** | CA-01.2, CA-01.4–CA-01.5; CA-02.4–CA-02.7; CA-05.1–CA-05.3 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-07 |
| **US-06 — Entender a referência dos dados** | CA-05.4–CA-05.5 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-07 |

## Matriz mínima de testes

1. Busca válida com nenhum, um e mais de dez resultados; cidade homônima com região/país; consulta inválida; falha e timeout.
2. Duas buscas consecutivas com respostas fora de ordem; selecionar outra cidade durante uma consulta meteorológica.
3. Resposta completa, resposta parcial, ausência total de dados atuais, dia sem dados e horário de referência ausente.
4. Cidade cujo fuso está adiante e outra cujo fuso está atrás do dispositivo; testar próximo à meia-noite local e mudança de data.
5. Conversão nos dois sentidos, com valores negativos, zero e positivos; mudança de unidade durante carregamento.
6. Fluxos de busca, seleção, nova tentativa e alternância de unidade somente com teclado e com tecnologia assistiva.
7. Viewports e navegadores definidos em RNF-01 e RNF-04; verificação das metas de latência definidas em RNF-05.

## Critérios para lançamento

- Atribuição e uso da Open-Meteo revisados conforme os termos vigentes.
- Textos finais de erro, vazio e indisponibilidade revisados em pt-BR.
- Matriz de compatibilidade, acessibilidade e desempenho executada, com resultados registrados.
- Ambiente de publicação e responsável por acompanhar falhas da aplicação e da fonte definidos antes da disponibilização pública.

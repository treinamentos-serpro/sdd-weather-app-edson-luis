# Discovery — Aplicação de previsão do tempo

## Contexto

A empresa precisa de uma aplicação que permita aos usuários consultar informações meteorológicas de cidades. A experiência deve atender tanto ao uso em computadores quanto em dispositivos móveis e apresentar dados de forma clara, incluindo condições atuais e previsão para os próximos cinco dias.

## Personas propostas

Estas personas são hipóteses iniciais, pois os usuários prioritários ainda precisam ser validados com as partes interessadas.

### 1. Marina, pessoa que se desloca diariamente

- **Objetivo principal:** consultar rapidamente o clima atual para decidir como se vestir e se precisa levar guarda-chuva antes de sair.
- **Contexto de uso:** principalmente no celular, em momentos curtos antes de sair de casa ou durante o deslocamento.
- **Métrica de sucesso para Marina:** consegue encontrar sua cidade e entender as condições atuais em até 30 segundos, sem precisar repetir a busca ou interpretar informações ambíguas.

### 2. Rafael, organizador de viagens

- **Objetivo principal:** verificar a previsão dos próximos cinco dias no destino para escolher datas e preparar a viagem.
- **Contexto de uso:** principalmente no desktop, ao comparar opções e planejar com antecedência; pode revisar a previsão no celular depois.
- **Métrica de sucesso para Rafael:** encontra a cidade pretendida e identifica as condições previstas para cada um dos cinco dias sem confundir datas ou precisar consultar outra fonte para entender a apresentação.

### 3. Luiza, visitante de uma cidade desconhecida

- **Objetivo principal:** consultar o clima de uma cidade que não conhece bem e compreender as temperaturas na unidade que usa habitualmente.
- **Contexto de uso:** celular durante a viagem ou desktop antes da partida; pode pesquisar nomes de cidades semelhantes.
- **Métrica de sucesso para Luiza:** seleciona a cidade correta a partir do contexto apresentado nos resultados e reconhece os valores de temperatura na unidade escolhida tanto no clima atual quanto na previsão.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise cidades pelo nome.
- **RF-02 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF-03 — Consultar previsão:** exibir a previsão do tempo para os próximos cinco dias.
- **RF-04 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit.
- **RF-05 — Atualizar valores exibidos:** refletir a unidade selecionada nas temperaturas apresentadas.
- **RF-06 — Informar falhas de consulta:** informar claramente quando uma busca não encontrar resultados ou quando os dados meteorológicos não puderem ser carregados.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade:** oferecer uma experiência utilizável em dispositivos móveis e telas maiores.
- **RNF-02 — Usabilidade:** apresentar informações e controles de forma clara, facilitando a busca e a leitura da previsão.
- **RNF-03 — Acessibilidade:** permitir navegação e interação compreensíveis por pessoas com diferentes necessidades de acesso.
- **RNF-04 — Desempenho:** responder às ações de busca e consulta em tempo adequado, sem atrasos perceptíveis.

## Revisão e classificação dos requisitos

| Item | Classificação | Avaliação |
|---|---|---|
| RF-01 — Buscar cidades | Funcional | Descreve uma ação oferecida ao usuário. |
| RF-02 — Consultar clima atual | Funcional | Define uma informação que o sistema deve apresentar. |
| RF-03 — Consultar previsão | Funcional | Define a previsão que o sistema deve exibir. |
| RF-04 — Alternar unidades | Funcional | Especifica uma interação disponível na aplicação. |
| RF-05 — Atualizar valores exibidos | Funcional | Define como o sistema deve reagir à mudança de unidade. |
| RNF-01 — Responsividade | Não-funcional | Define uma qualidade de uso em diferentes tamanhos de tela. |
| RNF-02 — Usabilidade | Não-funcional | Trata da clareza e facilidade de uso, mas precisa de critérios mais objetivos. |
| RNF-03 — Acessibilidade | Não-funcional | A classificação está correta; o texto anterior misturava acessibilidade com uso em telas menores, aspecto de responsividade. |
| RNF-04 — Desempenho | Não-funcional | Trata do tempo de resposta, mas “tempo adequado” e “sem atrasos perceptíveis” não são verificáveis. |
| RNF-05 — Tratamento de falhas (classificação original) | Funcional | Estava classificado incorretamente: informar resultados vazios e falhas é um comportamento observável do sistema. Foi movido para RF-06. |

## Requisitos não-funcionais propostos

Os valores abaixo são sugestões iniciais e devem ser validados com as partes interessadas antes de se tornarem critérios de aceite.

- **RNF-05 — Desempenho:** em condições normais de rede, exibir resultados de busca em até 2 segundos e dados meteorológicos em até 3 segundos no percentil 95.
- **RNF-06 — Acessibilidade:** atender ao WCAG 2.2 nível AA, incluindo navegação por teclado, foco visível, contraste adequado e rótulos compatíveis com leitores de tela.
- **RNF-07 — Responsividade:** manter conteúdo e controles utilizáveis em larguras de 320 px a 1920 px, sem rolagem horizontal da página.
- **RNF-08 — Disponibilidade:** manter disponibilidade mensal de pelo menos 99,5%, excluindo manutenções programadas. Definir como a meta se aplica quando a fonte externa de dados estiver indisponível.
- **RNF-09 — Compatibilidade:** suportar as duas versões estáveis mais recentes de Chrome, Firefox, Safari e Edge, além dos navegadores móveis correspondentes.
- **RNF-10 — Atualização dos dados:** informar o horário da última atualização e atualizar os dados em até um intervalo acordado após a fonte disponibilizá-los.

Riscos e perguntas em aberto não são, por si só, requisitos. Eles podem levar a novos requisitos, como desambiguar cidades com o mesmo nome ou definir como a previsão de cinco dias será apresentada.

## Riscos

Os riscos abaixo são estimativas qualitativas com base nas lacunas identificadas nesta Discovery. As probabilidades devem ser revistas quando as decisões em aberto forem validadas.

| # | Categoria | Risco | Probabilidade | Impacto | Estratégia de mitigação |
|---|---|---|---|---|---|
| R-01 | Produto | Usuários prioritários e critérios de sucesso não estão definidos; o app pode entregar funcionalidades sem resolver a necessidade principal. | Alta | Alto — prioridades e decisões de experiência podem precisar ser refeitas. | Validar com as partes interessadas quem usará o app, em quais situações e quais métricas indicarão sucesso; registrar critérios de aceite antes da implementação. |
| R-02 | Produto | Cidades com nomes iguais ou semelhantes podem levar à seleção do local errado. | Alta | Alto — o usuário pode confiar na previsão de outro local. | Exibir contexto nos resultados, como região e país; definir regras para consultas curtas, vazias e ambíguas; testar casos de cidades homônimas. |
| R-03 | Técnico | Indisponibilidade, lentidão, limites ou dados incompletos da fonte meteorológica podem impedir ou degradar as consultas. | Média | Alto — clima e previsão podem ficar indisponíveis ou desatualizados. | Tratar timeout e erros explicitamente, oferecer nova tentativa e monitorar falhas; se houver cache, indicar o horário da última atualização e não apresentar dados antigos como atuais. |
| R-04 | Produto / Técnico | “Próximos cinco dias” não define se a previsão é por dias de calendário ou períodos de 24 horas, nem qual fuso horário usar. | Média | Médio/Alto — usuários podem interpretar de formas distintas o período apresentado. | Acordar a definição com as partes interessadas e exibir as datas no fuso da cidade consultada; transformar a decisão em critério de aceite e teste. |
| R-05 | Técnico | Busca e consulta podem exceder as metas de desempenho propostas, que ainda não têm condições de rede e método de medição definidos. | Média | Alto — atrasos podem levar usuários a abandonar a consulta. | Definir como medir os tempos e o percentil 95; evitar chamadas desnecessárias na busca e acompanhar latência e erros em operação. |
| R-06 | Produto | Campos meteorológicos, unidades, idioma e formatação ainda não estão completamente definidos. | Média | Alto — dados inconsistentes ou ambíguos podem reduzir a confiança e causar interpretação incorreta. | Decidir quais dados serão exibidos e em quais unidades; aplicar a preferência consistentemente e validar conversões, datas e formatos. |
| R-07 | Produto / Técnico | Requisitos de responsividade e acessibilidade não têm critérios de validação completos. | Média | Alto — pessoas em dispositivos móveis ou usando tecnologias assistivas podem ter dificuldade de uso. | Definir cenários de teste e critérios observáveis; validar navegação por teclado, foco, leitores de tela, contraste e tamanhos de tela representativos. |
| R-08 | Produto / Privacidade | Não está definido se haverá coleta ou envio de localização, histórico ou métricas, nem as regras de consentimento e retenção. | Média | Alto — coleta não esperada pode prejudicar a confiança e gerar obrigações de conformidade. | Minimizar os dados coletados; definir finalidade, consentimento e retenção antes de implementar localização ou analytics; documentar o que é enviado à fonte externa. |

## Perguntas em Aberto

Os pontos abaixo precisam de validação com as partes interessadas. As perguntas em aberto não são requisitos aprovados; seguir sem resposta pode gerar os impactos indicados.

### Produto e escopo

| # | Pergunta em aberto | Impacto de seguir sem resposta |
|---|---|---|
| 1 | Quem são os usuários prioritários e em que situações consultarão o app? | Não haverá base para priorizar informações, controles e decisões de experiência. |
| 2 | Qual é o objetivo principal do produto e como será medido o sucesso (por exemplo, buscas concluídas, retorno de usuários ou rapidez para encontrar uma cidade)? | A equipe pode entregar funcionalidades sem saber se resolvem o problema, e não haverá critério para avaliar o resultado. |
| 3 | O produto é apenas uma experiência web responsiva ou há requisitos de instalação, funcionamento como PWA ou suporte nativo? | Pode haver retrabalho de arquitetura, instalação e compatibilidade se a expectativa ultrapassar um site responsivo. |
| 4 | Autenticação, histórico, favoritos e notificações estão fora do escopo desta entrega ou apenas não foram detalhados? | A suposição de que não são necessários pode excluir necessidades importantes; incluí-los sem confirmação aumenta escopo e custo. |
| 5 | Existem requisitos de marca, identidade visual ou diretrizes de conteúdo? | A interface pode precisar de revisão visual ou editorial depois de implementada. |

### Busca e seleção de cidades

| # | Pergunta em aberto | Impacto de seguir sem resposta |
|---|---|---|
| 6 | A busca aceita apenas nomes de cidades ou também país, estado/região, coordenadas e localização atual do usuário? | O contrato da busca e a apresentação dos resultados podem não atender quem não conhece o nome exato ou quer consultar a própria localização. |
| 7 | Como distinguir cidades com o mesmo nome — quais dados devem aparecer em cada resultado, como região e país? | O usuário pode selecionar a cidade errada e receber informações meteorológicas de outro lugar. |
| 8 | Que países, regiões, idiomas e alfabetos a busca deve cobrir? Deve reconhecer acentos, transliterações, nomes alternativos e erros de digitação? | A cobertura e a qualidade da busca ficam indefinidas, podendo excluir usuários ou produzir resultados inconsistentes. |
| 9 | A busca é enviada ao digitar, após uma ação explícita ou das duas formas? Há autocomplete, limite de resultados e regra de ordenação? | A interação pode ser lenta ou confusa e gerar chamadas excessivas; também não haverá comportamento previsível para validação. |
| 10 | O que deve acontecer com consulta vazia, texto inválido ou buscas muito curtas? | Estados comuns ficam sem tratamento definido e podem causar resultados confusos ou chamadas desnecessárias. |

### Dados meteorológicos e apresentação

| # | Pergunta em aberto | Impacto de seguir sem resposta |
|---|---|---|
| 11 | O que significa “condições atuais”: observação mais recente, valor estimado para o momento ou outro dado fornecido pela fonte? Como mostrar o horário dessa informação? | Um dado atrasado ou estimado pode ser apresentado como atual e interpretado incorretamente. |
| 12 | Quais campos são obrigatórios para o clima atual e para cada período da previsão — temperatura, sensação térmica, condição, precipitação, vento, umidade, entre outros? | “Exibir a previsão” não define conteúdo suficiente para desenhar a interface ou aceitar a entrega. |
| 13 | Os cinco dias são dias de calendário ou janelas de 24 horas? Qual fuso horário define a virada do dia: o da cidade consultada ou o do usuário? | O intervalo exibido pode variar conforme horário e localização, causando divergência sobre quais dias a previsão cobre. |
| 14 | A previsão será diária, horária ou ambas? Se houver dados horários, com que granularidade e por quanto tempo? | A estrutura visual, o volume de dados e a interpretação da previsão permanecem indefinidos. |
| 15 | Como representar dados ausentes, indisponíveis ou de baixa confiança para um campo ou período específico? | A interface pode exibir lacunas como valores incorretos, omitir informação sem explicação ou comprometer a confiança do usuário. |
| 16 | A alternância Celsius/Fahrenheit se aplica somente à temperatura ou também há preferência de unidades para vento, precipitação e outros dados? | A tela pode misturar convenções sem deixar isso claro, criando risco de interpretação errada. |
| 17 | Qual unidade deve ser usada inicialmente e a preferência deve persistir entre visitas? Em qual dispositivo ou contexto? | O usuário pode precisar configurar a unidade repetidamente ou encontrar uma unidade inicial inesperada; persistência também afeta testes e armazenamento. |
| 18 | Em que idioma serão apresentados a interface, as condições meteorológicas, as datas e os números? É necessário suporte multilíngue? | Idioma e formatos podem ser inconsistentes entre interface e dados, além de exigir retrabalho caso a localização seja necessária. |

### Estados, falhas e dependências

| # | Pergunta em aberto | Impacto de seguir sem resposta |
|---|---|---|
| 19 | Quais estados de carregamento devem existir para busca e consulta do clima? O usuário pode continuar usando a interface durante a espera? | Sem comportamento definido, a aplicação pode parecer travada ou permitir ações que geram resultados contraditórios. |
| 20 | O que acontece quando a fonte externa falha, demora, limita requisições ou retorna dados incompletos? Deve haver tentativa automática, opção de tentar novamente ou exibição de dados anteriores? | A experiência varia conforme a falha; usuários podem ficar sem explicação ou ver dados antigos como atuais. |
| 21 | A aplicação deve funcionar sem conexão ou manter a última consulta disponível? Se sim, por quanto tempo e com qual indicação de atualização? | Não será possível definir o comportamento offline nem evitar que dados em cache sejam confundidos com dados recentes. |
| 22 | Qual fonte de geocodificação e meteorologia será usada? Quais são seus limites, cobertura, termos de uso e exigências de atribuição? | Cobertura, custo, licenciamento e limites de requisição podem inviabilizar a solução ou exigir mudanças após a implementação. |
| 23 | Como será definida a disponibilidade de 99,5%: quais componentes e períodos entram no cálculo e como se contabiliza a indisponibilidade da fonte externa? | A meta não é verificável sem uma fronteira de medição; equipe e partes interessadas podem divergir sobre seu cumprimento. |

### Critérios não funcionais e aceite

| # | Pergunta em aberto | Impacto de seguir sem resposta |
|---|---|---|
| 24 | O que caracteriza “condições normais de rede” para a meta de busca em até 2 s e clima em até 3 s no percentil 95? Onde e como esses tempos serão medidos? | Os números propostos não são reproduzíveis nem testáveis sem condições, ponto de medição e método acordados. |
| 25 | Quais tamanhos de tela e critérios definem uma experiência “utilizável”? A ausência de rolagem horizontal vale para qualquer conteúdo e orientação? | O requisito de responsividade pode ser considerado cumprido apesar de controles ilegíveis ou difíceis de usar. |
| 26 | O WCAG 2.2 AA se aplica à aplicação inteira? Quais tecnologias assistivas, navegadores e testes serão usados para verificar conformidade? | A meta de acessibilidade pode virar uma declaração sem critérios de aceite e deixar barreiras importantes sem detecção. |
| 27 | “Duas versões estáveis mais recentes” será atualizado continuamente? Quais versões de navegadores móveis e sistemas operacionais entram no suporte? | O conjunto suportado muda com o tempo e pode gerar incompatibilidades ou divergências sobre o que precisa ser corrigido. |
| 28 | Qual intervalo de atualização dos dados é esperado e como será definido que a fonte disponibilizou novos dados? | “Atualizar em até um intervalo acordado” não permite implementar nem verificar a atualização ou comunicar a defasagem. |
| 29 | Quais são os critérios de aceite para cada requisito funcional e para os principais estados de erro, vazio e carregamento? | “Buscar”, “consultar” e “informar claramente” permitem interpretações diferentes, tornando a conclusão da entrega subjetiva. |

### Privacidade e operação

| # | Pergunta em aberto | Impacto de seguir sem resposta |
|---|---|---|
| 30 | O app coletará localização, histórico de buscas, métricas de uso ou outros dados? O que será enviado à fonte externa e por quanto tempo será retido? | Pode haver coleta ou compartilhamento de dados sem finalidade, transparência ou regras de retenção definidas. |
| 31 | Há requisitos de privacidade, consentimento e conformidade legal aplicáveis aos países atendidos? | A implementação pode não atender às obrigações relevantes, especialmente se usar localização ou analytics. |
| 32 | Como serão monitorados erros, desempenho e disponibilidade? Quem recebe alertas e como são tratados incidentes da fonte externa? | Uma meta operacional pode existir no documento sem meios para detectar ou responder a falhas. |
| 33 | Onde e como a aplicação será publicada? Existem requisitos de ambiente, domínio, segurança ou processo de lançamento? | A entrega pode funcionar localmente, mas faltar decisões necessárias para disponibilização e operação. |

**Lacuna central:** o briefing identifica capacidades desejadas, mas ainda não define suficientemente os dados exibidos, os limites da busca, os comportamentos para estados e falhas nem os critérios observáveis para considerar a experiência pronta. Essas decisões são pré-requisitos para transformar os requisitos em critérios de aceite verificáveis.

## Decisões

| Decisão | Justificativa | Perguntas em aberto que resolve |
|---|---|---|
| Usar a Open-Meteo como fonte de geocodificação e meteorologia, sem chave de API. | Evita exigir uma chave para consultar os serviços e define a fonte a integrar nesta etapa. | Define a fonte para a pergunta 22. Cobertura, limites, termos de uso e atribuição ainda precisam ser verificados. |
| Considerar cinco dias como hoje e os quatro dias seguintes. | Define um intervalo de cinco dias de calendário, incluindo o dia da consulta. | Esclarece a duração e o tipo de período da pergunta 13; o fuso horário usado para determinar “hoje” ainda precisa ser definido. |
| Usar Celsius como unidade padrão. | É a unidade inicial escolhida para a experiência em pt-BR; a alternância para Fahrenheit continua prevista. | Define a unidade inicial da pergunta 17. A persistência da preferência continua em aberto. |
| Não oferecer autenticação nem persistência de dados no servidor. | Mantém esta entrega sem contas de usuário nem armazenamento de dados em um servidor. | Delimita o escopo da pergunta 4 e esclarece a ausência de armazenamento no servidor na pergunta 30; coleta de dados e eventual armazenamento no cliente ainda precisam ser definidos. |
| Apresentar a interface em português do Brasil (pt-BR). | Mantém textos, datas e formatos da experiência alinhados ao idioma definido para os usuários desta entrega. | Define o idioma da interface na pergunta 18; suporte a outros idiomas não faz parte desta decisão. |

## Suposições

- A consulta será feita para uma cidade selecionada pelo usuário.
- A previsão deve cobrir hoje e os quatro dias seguintes.
- Celsius e Fahrenheit são as únicas unidades necessárias nesta etapa.
- A aplicação terá acesso aos serviços da Open-Meteo.
- O briefing não exige autenticação, histórico de buscas, favoritos ou notificações.
- O layout deve adaptar-se a dispositivos móveis sem exigir uma aplicação nativa.

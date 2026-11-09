# CORE

Website estático com GSAP e ScrollTrigger, baseado nos frames Figma 201:1067, 201:781, 201:138 e 201:502 do ficheiro GUbV7ylhiIDdZXWEuEkAmO.

## Utilização

Servir a pasta `dist` com qualquer servidor HTTP estático. A configuração de publicação encontra-se em `.openai/hosting.json`.

## Fidelidade e recursos

- Duas fotografias e três marcas SVG originais do Figma, mais três novas fotografias geradas com ImageGen, servidas localmente. Fotografias entregues em WebP; originais em source-assets/.
- Textos preservados, incluindo as repetições nas secções da fundadora e workbook.
- Os blocos cinzentos destas duas secções são placeholders presentes no design original.
- As fontes especificadas no Figma são CC Timeline High Trial Regular e CC Timeline Trial Light. Os ficheiros de fonte não foram fornecidos. A implementação usa Arial/Helvetica como alternativa; fornecer versões web licenciadas para alcançar a fidelidade tipográfica final.
- Os frames fornecidos são desktop. A composição mobile foi adaptada para manter a hierarquia e legibilidade.
- Sem formulário ou ligação de download do workbook, pois estes elementos e o ficheiro não constam dos frames.

## Movimento e acessibilidade

Introdução de 1350 ms com a marca CORE a aparecer letra a letra de baixo para cima (100 ms entre letras), preservando o SVG original, sem bloquear o conteúdo ou depender da rede. Entrada discreta das fotografias e revelação dos títulos e parágrafos letra a letra ao fazer scroll, inspirada em https://menkind.co/en/overmenkind. Atrasos progressivos limitados a 800 ms e deslocamento vertical suave; cada parágrafo é ativado independentemente. A versão acessível mantém o texto integral, sem separar letras na leitura assistida. O conteúdo é visível sem JavaScript. `prefers-reduced-motion` desativa as animações e o preloader. HTML semântico, idioma pt-PT, ligação para saltar ao conteúdo, foco visível e imagens repetidas decorativas.

## Performance

GSAP 3.15.0 e ScrollTrigger guardados em dist/vendor/. Sem fontes remotas ou pedidos para URLs temporários do Figma. Cinco fotografias distintas nos cinco lugares da hero; dimensões reservadas para evitar deslocamentos de layout. Apenas opacity e translate são animados; IntersectionObserver deixa de observar os elementos após a entrada.

As fotografias da hero respondem suavemente ao rato com profundidades diferentes (até 16 px na horizontal e 10,4 px na vertical). Regressam à posição inicial ao sair da hero. O efeito só funciona com rato e sem movimento reduzido; atualizações agrupadas com requestAnimationFrame, sem ciclo contínuo.

Atualização de direção de arte: três fotografias criadas com ImageGen (arquiteto, chef e marceneiro) substituem as imagens repetidas nas posições b/c/e, mantendo a grid. Prompts em image-prompts.json; originais em source-assets/ e versões web em dist/assets/. A entrada das fotografias sobe 42 px em sequência. A posição do logótipo no preloader coincide com a da hero em todos os breakpoints.

Animações adaptadas do exemplo local EDDY: duas passagens das letras (0,9 s de entrada, stagger 0,06 s, saída 0,6 s), cortina ascendente de 1,3 s e imagens reveladas por máscara inferior de 1,4 s com deslocamento interno de 25% e intervalos de 0,1 s. O CORE usa um único logótipo persistente, fixo na posição da grid, para preservar o alinhamento pedido. Duração total da cortina: 3,875 s. As imagens começam aos 3,025 s. Mantidas as fotografias e o efeito do rato.

Hero atualizada segundo o frame Figma 205:1180: faixa com “ALINHAMENTO PROFISSIONAL” à esquerda e “& BEM-ESTAR” à direita, 24 px, tracking 0,96 px e margens 40/16 px no desktop; adaptação de tamanho e margens em mobile.

Hero a 100svh: copy ancorado dentro da base da hero, fotografias com área inferior reservada e tamanhos adaptados à altura do ecrã. Copy usa a revelação letra a letra dos títulos, disparada em conjunto com a entrada das imagens após o preloader.

Footer: monograma e CORE com revelação por máscara de baixo para cima, com duração e easing dos títulos. O CORE entra letra a letra. IntersectionObserver observa as marcas na base do footer, executa uma vez e respeita movimento reduzido. Verificado no navegador: pendente no topo e ativado ao chegar ao footer.

Títulos das secções com 80 px de espaço até ao conteúdo, em desktop e mobile.

Migração GSAP: timelines para preloader e imagens; ScrollTrigger para textos, placeholders e footer; quickTo para movimento do rato. CSS mantém o layout e as máscaras. Foram preservados os textos acessíveis, os atrasos por letra e a preferência de movimento reduzido. Bibliotecas servidas localmente, sem dependência de CDN na execução. Verificado no navegador sem erros de consola; footer passa de oculto a visível apenas ao entrar no ecrã.

Secção Serviços inserida depois de Conhece o CORE e antes da mensagem da fundadora, com os quatro serviços aprovados, layout editorial, 80 px após o título e revelação GSAP durante scroll. As setas são elementos visuais; não foram inventados destinos de marcação ou páginas de serviço.

Workbook redesenhado conforme Figma 223:311: título e capa centrados, intervalo 80 px, capa 438×580 px, SVG originais do monograma e CORE, copy na base e sombra. Versão responsiva e entrada GSAP durante scroll.

Download do Workbook: botão no hover/foco (sempre visível em touch), formulário em diálogo e PDF fora de dist. Ligação a Google Sheets preparada em google-sheets-webhook.gs e endpoint local em local-server.py. Configuração real ainda necessária: consultar WORKBOOK-SETUP.md. Não publicar apenas dist para este fluxo. Pré-visualização do formulário em http://127.0.0.1:4174/. Sem conector configurado, os pedidos não são guardados e não há entrega do PDF.

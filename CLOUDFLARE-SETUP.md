# Ativar o CORE na Cloudflare

1. Criar um Worker ligado ao repositório MiguelCrua/core, branch main.
2. Usar o ficheiro wrangler.jsonc da raiz. O comando de publicação é `npx wrangler deploy`; a preparação dos ficheiros é executada automaticamente.
3. No Google Apps Script, colar google-sheets-webhook.gs, definir WEBHOOK_SECRET nas propriedades do projeto, executar setupCoreWorkbook e publicar como aplicação Web (executar como proprietário, acesso Qualquer pessoa).
4. Nas definições do Worker, adicionar CORE_SHEETS_WEBHOOK e CORE_SHEETS_SECRET como segredos. Nunca colocar estes valores no GitHub ou no código do navegador.
5. O PDF é copiado para a área interna dos assets. run_worker_first deve permanecer true: o Worker bloqueia todas as rotas __private e só entrega o ficheiro após confirmação do Google Sheets. Não publicar .cloudflare-assets num alojamento estático separado.
6. Testar em produção com um contacto de teste: confirmar uma linha na folha, PDF descarregado e acesso direto ao PDF bloqueado.

A publicação e a ligação às contas ainda precisam de ser concluídas. Os testes locais usam um serviço simulado, sem escrever contactos reais.

O endpoint limita pedidos a cinco por minuto por endereço IP.

O Worker é executado em todos os pedidos para proteger o PDF; o site fica sujeito à quota gratuita de pedidos Workers, incluindo os ficheiros estáticos. Antes de abrir ao público, acrescentar o aviso de privacidade real do CORE ao formulário.

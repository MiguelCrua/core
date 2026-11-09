# Download do Workbook com recolha de contactos

O botão na capa abre um formulário de nome e email. O servidor valida os campos, envia o contacto para Google Sheets e só entrega o PDF se a folha confirmar a gravação. Não há ligação pública ao PDF na pasta dist.

## Ativar Google Sheets

1. Na conta Google da CORE, criar um projeto em https://script.google.com/ e colar o conteúdo de `google-sheets-webhook.gs`.
2. Em Definições do projeto → Propriedades do script, definir `WEBHOOK_SECRET` com um valor aleatório longo e privado. Este valor deve existir apenas nas propriedades do script e nas variáveis do servidor, nunca no código do navegador.
3. Executar `setupCoreWorkbook` uma vez e autorizar o acesso. A função cria a folha privada e mostra o respetivo URL no registo de execução. Para uma folha existente com um separador Contactos e as mesmas quatro colunas, definir `SHEET_ID` antes da execução.
4. Implementar → Nova implementação → Aplicação Web. Executar como o proprietário e permitir acesso a Qualquer pessoa. O endpoint aceita apenas pedidos com o segredo configurado; a folha não é partilhada publicamente.
5. Configurar no servidor `CORE_SHEETS_WEBHOOK` com o URL `/exec` devolvido pela implementação e `CORE_SHEETS_SECRET` com o mesmo valor privado do passo 2.
6. Iniciar `local-server.py --port 4174` com Python 3 e abrir http://127.0.0.1:4174/. O PDF encontra-se em `private/Core - Workbook.pdf`.

Sem esta configuração, o formulário mostra uma mensagem de indisponibilidade e não entrega o PDF. Não apresenta sucesso nem simula contactos guardados.

## Publicação

O servidor Python é apenas para pré-visualização local. O alojamento estático atual não executa o endpoint POST. Para publicar é necessário um backend com as mesmas variáveis privadas, validação, proteção contra abuso e entrega do PDF fora da pasta pública. A folha regista data, nome, email e origem; os emails repetidos não criam uma segunda linha.

Antes de disponibilizar ao público, acrescentar no formulário a ligação para o aviso de privacidade real da CORE. O fluxo não inscreve automaticamente em newsletters nem afirma que o email foi verificado.

# Escala Clara Web

Versao web independente do Escala Clara para uso local. Nenhum arquivo do projeto iOS em `../EscalaClara/` e alterado por esta aplicacao.

## Recursos

- PWA responsiva, priorizando a experiencia de iPhone e utilizavel em computadores, tablets e Android.
- Funciona offline apos o primeiro carregamento ou instalacao.
- Dados dos plantões armazenados somente no navegador do dispositivo.
- Mesmo esquema de backup do iOS: arquivos JSON `.escalaclara` com `schemaVersion`, `exportedAt` e registros de plantões em ISO 8601.
- Importacao por mesclagem de UUID ou substituicao completa, compativel com arquivos exportados pela versao iPhone.

## Executar e instalar

1. Sirva esta pasta por HTTPS ou `localhost`; Service Workers nao funcionam ao abrir `index.html` diretamente pelo sistema de arquivos.
2. Abra a URL no Safari do iPhone e use **Compartilhar > Adicionar a Tela de Inicio**, ou use a opcao de instalacao do navegador em Android/desktop.
3. Apos o primeiro carregamento, o app shell fica disponivel offline. O backup continua sendo recomendado antes de limpar dados do navegador ou trocar de aparelho.

Um servidor estatico simples que exista no seu ambiente pode ser usado para desenvolvimento. A aplicacao nao depende de servidor, banco de dados ou API em producao.

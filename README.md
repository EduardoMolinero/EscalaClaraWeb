# Escala Clara Web

Versao web independente do Escala Clara para uso local. Nenhum arquivo do projeto iOS em `../EscalaClara/` e alterado por esta aplicacao.

## Recursos

- PWA responsiva, priorizando a experiencia de iPhone e utilizavel em computadores, tablets e Android.
- Funciona offline apos o primeiro carregamento ou instalacao.
- Dados dos plantões armazenados somente no navegador do dispositivo.
- Mesmo esquema de backup do iOS: arquivos JSON `.escalaclara` com `schemaVersion`, `exportedAt` e registros de plantões em ISO 8601.
- Importacao por mesclagem de UUID ou substituicao completa, compativel com arquivos exportados pela versao iPhone.
- Calendario mensal com indicadores de cor por plantao.
- Lista de plantões do dia selecionada abaixo do calendario, com acoes de marcar pago/pendente e excluir (com confirmacao).
- Formulario de plantao com data e hora completas (suporta plantoes noturnos que cruzam a meia-noite).
- Copia de escala para uma data especifica.
- Repeticao semanal: selecione dias da semana para repetir os plantões de um dia em datas futuras (ate 12 semanas).

## Executar e instalar

1. Sirva esta pasta por HTTPS ou `localhost`; Service Workers nao funcionam ao abrir `index.html` diretamente pelo sistema de arquivos.
2. Abra a URL no Safari do iPhone e use **Compartilhar > Adicionar a Tela de Inicio**, ou use a opcao de instalacao do navegador em Android/desktop.
3. Apos o primeiro carregamento, o app shell fica disponivel offline. O backup continua sendo recomendado antes de limpar dados do navegador ou trocar de aparelho.

Um servidor estatico simples que exista no seu ambiente pode ser usado para desenvolvimento. A aplicacao nao depende de servidor, banco de dados ou API em producao.

## Integracao com DoctorID

O DoctorID e um sistema interno da empresa. Para integrar, seriam necessarios:

1. **API oficial do DoctorID** - documentacao, endpoints e autenticacao fornecidos pela empresa.
2. **Exportacao de dados** - se o DoctorID permitir exportar plantões (CSV, JSON, iCal), o arquivo podera ser importado manualmente no Escala Clara Web apos conversao para o formato `.escalaclara`.
3. **Sincronizacao automatica** - exigiria desenvolvimento de um conector especifico (backend ou extensao) com credenciais validas, o que esta fora do escopo deste projeto local.

**Status atual:** Nenhuma integracao automatica implementada. Use a exportacao manual do DoctorID (se disponivel) e importe via backup ou cadastro manual.

# Implantação

1. Implante o backend no Google Apps Script como aplicativo da Web.
2. Configure a URL da implantação, terminada em `/exec`, em `apiUrl` no arquivo `config.js`.
3. Publique `index.html`, `home.css`, `home.js`, `inscricao.html`, `site.css`, `site.js`, `inscricao.js` e `config.js` na mesma pasta do repositório. Inclua a pasta `assets`, especialmente o banner `banner-grand-prix.jpg`/`.webp`/`-900.webp`, `abertura-grand-prix.mp4` e `abertura-poster.jpg`, usados na página inicial.
4. Em **Settings > Pages**, selecione a branch e a pasta que contêm `index.html`.
5. Abra o site publicado e verifique o carregamento das demandas e o envio de uma inscrição de teste.

A planilha de dados deve permanecer restrita à organização. Não publique credenciais, dados de inscritos ou arquivos internos no repositório. A URL do aplicativo da Web em `config.js` é pública e não deve ser usada como senha ou segredo.

O topo da página usa o banner do folder. O vídeo do GP fica na seção de demandas, sem áudio e em loop enquanto está visível, com botão para pausar. Com redução de movimento ou economia de dados ativada, o vídeo só é carregado mediante ação do visitante. O cronograma é exibido em calendário (outubro e novembro de 2026). Os estilos da página inicial ficam em `home.css`; o formulário continua usando `site.css`.

## Arquivo da inscrição

O arquivo (somente PDF, até 8 MB) é obrigatório somente quando o líder ou algum integrante é menor de 18 anos; o formulário e o `Code.gs` conferem isso. O formulário não pede mais o RA (a coluna Z continua na planilha, vazia). Depois de validar a inscrição, o `Code.gs` cria na pasta do projeto no Drive (`GP_PASTA_ID`) uma subpasta `<equipe> - <protocolo>` com o arquivo nomeado com o nome do líder. Se a gravação na planilha falhar, a subpasta é descartada.

Na aba `Inscricoes`, na linha do líder de cada equipe: a coluna AB (`arquivo_url`) traz o link clicável do arquivo e a coluna AC (`arquivo_conferido`) é uma lista (`Pendente`, `Correto`, `Incorreto`) para a conferência manual. Ao atualizar o Apps Script, execute `configurar` para criar os cabeçalhos AB e AC e autorizar o acesso ao Drive; depois publique uma nova versão da implantação.

## Submissão de trabalhos

A página `submissao.html` (com `submissao.js`) recebe o trabalho da escuderia: dados do líder, demanda, **2 links** e **2 arquivos** (PDF, Word, PowerPoint, Excel, ZIP, PNG, JPG ou MP4, até 10 MB cada). O botão só habilita com tudo preenchido e a declaração marcada; o `Code.gs` repete essas conferências (inclusive o conteúdo real dos arquivos).

Cada envio cria uma subpasta `<equipe> - <protocolo>` dentro da pasta `Submissoes`, que fica na pasta do projeto no Drive, com os dois arquivos, e uma linha na aba `Submissoes` da planilha (links, nomes dos arquivos, link da subpasta). Ao atualizar o Apps Script, execute `configurar` para criar a pasta e a aba, e publique uma nova versão da implantação.

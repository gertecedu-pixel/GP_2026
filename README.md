# Implantação

1. Implante o backend no Google Apps Script como aplicativo da Web.
2. Configure a URL da implantação, terminada em `/exec`, em `apiUrl` no arquivo `config.js`.
3. Publique `index.html`, `home.css`, `home.js`, `inscricao.html`, `site.css`, `site.js`, `inscricao.js` e `config.js` na mesma pasta do repositório. Inclua a pasta `assets`, especialmente o banner `banner-grand-prix.jpg`/`.webp`/`-900.webp`, `abertura-grand-prix.mp4` e `abertura-poster.jpg`, usados na página inicial.
4. Em **Settings > Pages**, selecione a branch e a pasta que contêm `index.html`.
5. Abra o site publicado e verifique o carregamento das demandas e o envio de uma inscrição de teste.

A planilha de dados deve permanecer restrita à organização. Não publique credenciais, dados de inscritos ou arquivos internos no repositório. A URL do aplicativo da Web em `config.js` é pública e não deve ser usada como senha ou segredo.

O topo da página usa o banner do folder. O vídeo do GP fica na seção de demandas, sem áudio e em loop enquanto está visível, com botão para pausar. Com redução de movimento ou economia de dados ativada, o vídeo só é carregado mediante ação do visitante. O cronograma é exibido em calendário (outubro e novembro de 2026). Os estilos da página inicial ficam em `home.css`; o formulário continua usando `site.css`.

# Implantação

1. Implante o backend no Google Apps Script como aplicativo da Web.
2. Configure a URL da implantação, terminada em `/exec`, em `apiUrl` no arquivo `config.js`.
3. Publique `index.html`, `inscricao.html`, `inscricao.js` e `config.js` na mesma pasta do repositório.
4. Em **Settings > Pages**, selecione a branch e a pasta que contêm `index.html`.
5. Abra o site publicado e verifique o carregamento das demandas e o envio de uma inscrição de teste.

A planilha de dados deve permanecer restrita à organização. Não publique credenciais, dados de inscritos ou arquivos internos no repositório. A URL do aplicativo da Web em `config.js` é pública e não deve ser usada como senha ou segredo.

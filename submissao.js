/* A URL do serviço é configurada em config.js. */
const form = document.querySelector('#submissao');
const message = document.querySelector('#mensagem');
const submit = document.querySelector('#enviar');
const hint = document.querySelector('#dica');
const apiUrl = window.GP_CONFIG?.apiUrl || '';
const ARQUIVO_MAX_BYTES = 10 * 1024 * 1024;
const ARQUIVO_EXT = /\.(pdf|docx?|pptx?|xlsx?|zip|png|jpe?g|mp4)$/i;
let servicoPronto = false;
let ocupado = false;
let requestId = crypto.randomUUID();
let lastSignature = '';
let enviado = false;

async function consultarServico(options = {}, limite = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limite);
  try {
    const response = await fetch(apiUrl, {...options, redirect:'follow', signal:controller.signal});
    if (!response.ok) throw new Error('O serviço está indisponível. Tente novamente mais tarde.');
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function aviso(text, error = false) {
  message.textContent = text;
  message.className = error ? 'error' : 'aside-note';
  message.hidden = false;
}

function lerArquivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo. Selecione-o novamente.'));
    reader.onload = () => resolve({nome:file.name, base64:String(reader.result).split(',')[1] || ''});
    reader.readAsDataURL(file);
  });
}

// Habilita o botão somente com tudo preenchido: dois links, dois arquivos válidos e a declaração.
function validar() {
  const telefone = form.elements.lider_telefone;
  const digitos = telefone.value.replace(/\D/g, '');
  telefone.setCustomValidity(!telefone.value || (/^[+\d\s().-]+$/.test(telefone.value) && /^(?:55)?\d{10,11}$/.test(digitos)) ? '' : 'Informe um telefone com DDD.');
  for (const nome of ['equipe', 'lider_nome']) {
    const el = form.elements[nome];
    el.setCustomValidity(el.value.trim().length >= (nome === 'equipe' ? 2 : 3) ? '' : 'Preencha este campo.');
  }
  for (const nome of ['link1', 'link2']) {
    const el = form.elements[nome];
    let ok = false;
    try { const u = new URL(el.value); ok = ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password && u.hostname.includes('.'); } catch { /* inválido */ }
    el.setCustomValidity(ok ? '' : 'Informe um link HTTP ou HTTPS válido.');
  }
  for (const nome of ['arquivo1', 'arquivo2']) {
    const el = form.elements[nome], f = el.files[0];
    const ok = Boolean(f) && f.size > 0 && f.size <= ARQUIVO_MAX_BYTES && ARQUIVO_EXT.test(f.name);
    el.setCustomValidity(ok ? '' : 'Selecione um arquivo válido, não vazio, de até 10 MB.');
    document.querySelector('#' + nome + '-estado').textContent = f ? f.name + ' · ' + (f.size / 1048576).toFixed(2) + ' MB' + (ok ? '' : ' · arquivo inválido') : 'Nenhum arquivo selecionado.';
  }
  const pronto = form.checkValidity();
  submit.disabled = ocupado || enviado || !servicoPronto || !pronto;
  hint.textContent = pronto ? 'Tudo preenchido. Revise os dados e finalize a submissão.' : 'Preencha todos os campos, inclua os dois links e os dois arquivos e marque a declaração.';
  return pronto;
}
form.addEventListener('input', () => { if (!ocupado) validar(); });
form.addEventListener('change', () => { if (!ocupado) validar(); });

async function carregar() {
  if (!/^https:\/\/script\.google\.com\/(?:macros|a\/macros\/[a-zA-Z0-9.-]+)\/s\/[\w-]+\/exec$/.test(apiUrl)) {
    aviso('A submissão ainda não está disponível neste site. Tente novamente mais tarde.', true);
    return;
  }
  try {
    const data = await consultarServico();
    if (!data.ok || !Array.isArray(data.demandas)) throw new Error(data.error || 'Serviço indisponível.');
    servicoPronto = true;
    message.hidden = true;
    validar();
  } catch (_) {
    aviso('Não foi possível conectar ao serviço de submissão. Recarregue a página para tentar novamente.', true);
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (ocupado || !validar()) { form.reportValidity(); return; }
  const campos = {};
  for (const nome of ['equipe', 'lider_nome', 'lider_email', 'lider_telefone', 'demanda_id', 'link1', 'link2']) campos[nome] = form.elements[nome].value;
  const arquivos = ['arquivo1', 'arquivo2'].map(nome => form.elements[nome].files[0]);
  // A mesma tentativa mantém o identificador; qualquer mudança nos dados gera outro.
  const assinatura = JSON.stringify([campos, arquivos.map(f => [f.name, f.size, f.lastModified])]);
  if (lastSignature && lastSignature !== assinatura) requestId = crypto.randomUUID();
  lastSignature = assinatura;
  ocupado = true;
  submit.disabled = true;
  submit.textContent = 'Enviando arquivos…';
  const inputs = [...form.querySelectorAll('input, select')];
  inputs.forEach(el => el.disabled = true);
  aviso('Enviando o trabalho. Aguarde a confirmação, isso pode levar alguns minutos.');
  try {
    const [arquivo1, arquivo2] = await Promise.all(arquivos.map(lerArquivo));
    // text/plain evita preflight; a resposta JSON precisa ser lida para confirmar.
    const data = await consultarServico({method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({...campos, tipo:'submissao', arquivo1, arquivo2, confirmacao_dados:form.elements.confirmacao_dados.checked, request_id:requestId})}, 300000);
    if (!data.ok || !data.protocolo) throw new Error(data.error || 'Não foi possível confirmar o recebimento.');
    enviado = true;
    document.querySelector('#protocolo').textContent = data.protocolo;
    form.hidden = true;
    message.hidden = true;
    document.querySelector('#sucesso').hidden = false;
    document.querySelector('#sucesso').scrollIntoView({behavior:'smooth', block:'center'});
  } catch (err) {
    aviso(err.name === 'AbortError'
      ? 'O serviço demorou para responder e não foi possível confirmar o envio. Tente enviar novamente nesta página, sem recarregar: o mesmo envio não será duplicado.'
      : err instanceof TypeError ? 'A conexão falhou e não foi possível confirmar o envio. Tente novamente: o mesmo envio não será duplicado.' : err.message, true);
    message.scrollIntoView({behavior:'smooth', block:'center'});
  } finally {
    ocupado = false;
    if (!enviado) inputs.forEach(el => el.disabled = false);
    submit.textContent = 'Finalizar submissão';
    validar();
  }
});
carregar();

/* A URL do serviço é configurada em config.js. */
const form = document.querySelector('#inscricao');
const message = document.querySelector('#mensagem');
const submit = document.querySelector('#enviar');
const apiUrl = window.GP_CONFIG?.apiUrl || '';
let requestId = crypto.randomUUID();
let lastPayload = '';
let lastSuccessfulId = '';
const ARQUIVO_MAX_BYTES = 8 * 1024 * 1024;
const ARQUIVO_TIPOS = ['application/pdf'];

// Um PDF por participante: de 4 a 5 arquivos.
const ARQUIVOS_MIN = 4;
const ARQUIVOS_MAX = 5;
const ARQUIVOS_TOTAL_MAX_BYTES = 20 * 1024 * 1024;
const arquivoInput = document.querySelector('#arquivo');
const arquivoLista = document.querySelector('#arquivo-lista');
function atualizarListaArquivos() {
  const files = [...arquivoInput.files];
  arquivoLista.textContent = files.length ? files.map(f => f.name + ' (' + (f.size / 1048576).toFixed(2) + ' MB)').join(' · ') : 'Nenhum arquivo selecionado.';
}
arquivoInput.addEventListener('change', atualizarListaArquivos);

function lerArquivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo. Selecione-o novamente.'));
    reader.onload = () => resolve({nome:file.name, tipo:file.type, base64:String(reader.result).split(',')[1] || ''});
    reader.readAsDataURL(file);
  });
}

async function consultarServico(options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
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

// Até 4 integrantes além do líder.
const MAX_INTEGRANTES = 4;
// A equipe precisa de no mínimo 4 participantes: o líder e pelo menos 3 integrantes.
const MIN_INTEGRANTES = 3;
const addButton = document.querySelector('#adicionar');
const members = document.querySelector('#integrantes');
function atualizarMinimo() {
  const total = members.querySelectorAll('.member').length;
  const aviso = document.querySelector('#minimo-integrantes');
  aviso.textContent = total >= MIN_INTEGRANTES
    ? 'Equipe com ' + (total + 1) + ' participantes (líder + ' + total + ' integrantes). Mínimo atendido.'
    : 'Faltam ' + (MIN_INTEGRANTES - total) + ' integrante(s): a equipe precisa de no mínimo 4 participantes (líder + 3 integrantes). Participantes até agora: ' + (total + 1) + '.';
}
function atualizarLimite() {
  atualizarMinimo();
  const full = members.querySelectorAll('.member').length >= MAX_INTEGRANTES;
  addButton.hidden = full;
  document.querySelector('#limite-integrantes').hidden = !full;
}
addButton.addEventListener('click', () => {
  if (members.querySelectorAll('.member').length >= MAX_INTEGRANTES) return;
  const item = document.querySelector('#modelo-integrante').content.cloneNode(true);
  item.querySelector('button').addEventListener('click', e => { e.currentTarget.closest('.member').remove(); atualizarLimite(); });
  members.append(item);
  atualizarLimite();
});

atualizarMinimo();

async function carregar() {
  if (!/^https:\/\/script\.google\.com\/(?:macros|a\/macros\/[a-zA-Z0-9.-]+)\/s\/[\w-]+\/exec$/.test(apiUrl)) {
    aviso('As inscrições ainda não estão disponíveis neste site. Tente novamente mais tarde.', true);
    return;
  }
  try {
    const data = await consultarServico();
    if (!data.ok || !Array.isArray(data.demandas)) throw new Error(data.error || 'Serviço indisponível.');
    submit.disabled = false;
    message.hidden = true;
  } catch (_) {
    aviso('Não foi possível conectar ao serviço de inscrições. Recarregue a página para tentar novamente.', true);
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.reportValidity() || submit.disabled) return;
  if (members.querySelectorAll('.member').length < MIN_INTEGRANTES) {
    aviso('A equipe precisa ter no mínimo 4 participantes: o líder e pelo menos 3 integrantes. Adicione os integrantes que faltam.', true);
    message.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  const files = [...arquivoInput.files];
  if (files.length < ARQUIVOS_MIN || files.length > ARQUIVOS_MAX) { aviso('Envie de ' + ARQUIVOS_MIN + ' a ' + ARQUIVOS_MAX + ' arquivos PDF (um por participante). Você selecionou ' + files.length + '.', true); message.scrollIntoView({behavior:'smooth',block:'center'}); return; }
  if (files.some(f => !ARQUIVO_TIPOS.includes(f.type) || !/\.pdf$/i.test(f.name))) { aviso('Formato de arquivo não aceito. Envie somente PDF.', true); return; }
  if (files.some(f => f.size === 0 || f.size > ARQUIVO_MAX_BYTES)) { aviso('Cada arquivo deve ter no máximo 8 MB.', true); return; }
  if (files.reduce((t, f) => t + f.size, 0) > ARQUIVOS_TOTAL_MAX_BYTES) { aviso('O total dos arquivos deve ter no máximo 20 MB.', true); return; }
  const {arquivo: _, ...fields} = Object.fromEntries(new FormData(form));
  let arquivos;
  try { arquivos = await Promise.all(files.map(lerArquivo)); } catch (err) { aviso(err.message, true); return; }
  const payload = {...fields, arquivos, confirmacao_dados:form.elements.confirmacao_dados.checked,
    integrantes:[...document.querySelectorAll('#integrantes .member')].map(m => ({
      nome:m.querySelector('[data-field=nome]').value,
      idade:m.querySelector('[data-field=idade]').value
    }))};
  const serialized = JSON.stringify(payload);
  if (lastPayload && lastPayload !== serialized) requestId = crypto.randomUUID();
  lastPayload = serialized;
  submit.disabled = true;
  submit.textContent = 'Enviando…';
  const inputs = [...form.querySelectorAll('input, select, button')];
  inputs.forEach(el => el.disabled = true);
  aviso('Aguarde a confirmação da inscrição.');
  try {
    // text/plain evita preflight; a resposta JSON precisa ser lida para confirmar.
    const data = await consultarServico({method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({...payload, request_id:requestId})});
    if (!data.ok || !data.protocolo) throw new Error(data.error || 'Não foi possível confirmar o envio.');
    lastSuccessfulId = requestId;
    aviso('Inscrição recebida! Guarde seu protocolo: ' + data.protocolo + '. A inscrição ainda passará pela homologação da organização.');
    form.hidden = true;
    message.scrollIntoView({behavior:'smooth',block:'center'});
  } catch (err) {
    if (err.name === 'AbortError') {
      aviso('O serviço demorou para responder e não foi possível confirmar a inscrição. Tente enviar novamente nesta página, sem recarregar: o mesmo envio não será duplicado.', true);
    } else {
    aviso(err instanceof TypeError ? 'A conexão falhou e não foi possível confirmar a inscrição. Tente enviar novamente: o mesmo envio não será duplicado.' : err.message, true);
    }
    message.scrollIntoView({behavior:'smooth',block:'center'});
  } finally {
    if (lastSuccessfulId !== requestId) inputs.forEach(el => el.disabled = false);
    submit.textContent = 'Inscrever equipe';
  }
});
carregar();

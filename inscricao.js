/* A URL do serviço é configurada em config.js. */
const form = document.querySelector('#inscricao');
const message = document.querySelector('#mensagem');
const submit = document.querySelector('#enviar');
const apiUrl = window.GP_CONFIG?.apiUrl || '';
let requestId = crypto.randomUUID();
let lastPayload = '';
let lastSuccessfulId = '';

async function consultarServico(options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
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
const addButton = document.querySelector('#adicionar');
const members = document.querySelector('#integrantes');
function atualizarLimite() {
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
  const fields = Object.fromEntries(new FormData(form));
  const payload = {...fields, confirmacao_dados:form.elements.confirmacao_dados.checked,
    integrantes:[...document.querySelectorAll('#integrantes .member')].map(m => ({
      nome:m.querySelector('[data-field=nome]').value,
      ra:m.querySelector('[data-field=ra]').value,
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

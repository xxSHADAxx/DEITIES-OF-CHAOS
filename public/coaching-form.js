
function submitCoaching() {
  // Verificar cooldown local (24h) como primera barrera
  var lastSent = localStorage.getItem('dc_coaching_sent');
  if (lastSent) {
    var diff = Date.now() - parseInt(lastSent);
    var hours24 = 24 * 60 * 60 * 1000;
    if (diff < hours24) {
      var remaining = Math.ceil((hours24 - diff) / 3600000);
      alert('⚠️ Ya enviaste una solicitud. Espera ' + remaining + ' hora(s) antes de enviar otra.');
      return;
    }
  }

  var name      = (document.getElementById('c-name')    || {value:''}).value.trim();
  var discord   = (document.getElementById('c-discord') || {value:''}).value.trim();
  var coach     = (document.getElementById('c-type')    || {value:''}).value.trim();
  var pkg       = (document.getElementById('c-package') || {value:''}).value.trim();
  var character = (document.getElementById('c-char')    || {value:''}).value.trim();
  var elo       = (document.getElementById('c-elo')     || {value:''}).value.trim();
  var message   = (document.getElementById('c-msg')     || {value:''}).value.trim();

  if (!name || !discord || !coach || !pkg || !character || !elo || !message) {
    alert('⚠️ Por favor llene todas las casillas.');
    return;
  }

  var btn = document.getElementById('btn-send');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Enviando...'; }

  // Envia al BACKEND — no a Discord directamente
  fetch('/api/coaching', {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({ name, discord, coach, pkg, character, elo, message })
  })
  .then(function(res) { return res.json().then(function(data) { return { status: res.status, data: data }; }); })
  .then(function(result) {
    var succ = document.getElementById('c-success');
    if (result.status === 200 && result.data.success) {
      // Guardar cooldown
      localStorage.setItem('dc_coaching_sent', Date.now().toString());
      if (succ) succ.style.display = 'block';
      ['c-name','c-discord','c-type','c-package','c-char','c-elo','c-msg'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
      if (btn) { btn.disabled = false; btn.innerHTML = '✦ Enviar Solicitud ✦'; }
      setTimeout(function() { if (succ) succ.style.display = 'none'; }, 5000);
      checkCoachingFormStatus();
    } else if (result.status === 429) {
      // Rate limit del servidor
      alert('⚠️ ' + (result.data.error || 'Demasiadas solicitudes. Espera 24 horas.'));
      if (btn) { btn.disabled = false; btn.innerHTML = '✦ Enviar Solicitud ✦'; }
    } else {
      alert('❌ ' + (result.data.error || 'Error al enviar. Intenta de nuevo.'));
      if (btn) { btn.disabled = false; btn.innerHTML = '✦ Enviar Solicitud ✦'; }
    }
  })
  .catch(function() {
    alert('❌ Error de conexión. Verifica tu internet e intenta de nuevo.');
    if (btn) { btn.disabled = false; btn.innerHTML = '✦ Enviar Solicitud ✦'; }
  });
}

function checkCoachingFormStatus() {
  var formBox = document.querySelector('#page-coaching .form-box');
  var btnSend = document.getElementById('btn-send');
  if (!formBox) return;

  var lastSent = localStorage.getItem('dc_coaching_sent');
  if (lastSent) {
    var diff = Date.now() - parseInt(lastSent);
    var hours24 = 24 * 60 * 60 * 1000;
    if (diff < hours24) {
      var remaining = Math.ceil((hours24 - diff) / 3600000);
      var inputs = formBox.querySelectorAll('input,select,textarea');
      inputs.forEach(function(el) { el.style.opacity = '0.3'; el.style.pointerEvents = 'none'; });
      if (btnSend) { btnSend.disabled = true; btnSend.style.opacity = '0.4'; btnSend.style.cursor = 'not-allowed'; }
      var waitMsg = document.getElementById('coaching-wait-msg');
      if (!waitMsg) {
        waitMsg = document.createElement('div');
        waitMsg.id = 'coaching-wait-msg';
        waitMsg.style.cssText = 'text-align:center;padding:20px;border:1px solid rgba(255,100,100,0.4);background:rgba(255,50,50,0.06);font-family:\'Cinzel\',serif;font-size:13px;color:rgba(255,150,150,0.9);margin-top:16px;letter-spacing:0.1em;';
        formBox.appendChild(waitMsg);
      }
      waitMsg.innerHTML = '⏰ Ya enviaste una solicitud.<br><span style="font-size:11px;opacity:0.7;">Podrás enviar otra en aproximadamente <strong>' + remaining + 'h</strong>.</span>';
      waitMsg.style.display = 'block';
      return;
    }
  }
  var waitMsg = document.getElementById('coaching-wait-msg');
  if (waitMsg) waitMsg.style.display = 'none';
  var inputs = formBox.querySelectorAll('input,select,textarea');
  inputs.forEach(function(el) { el.style.opacity = ''; el.style.pointerEvents = ''; });
  if (btnSend) { btnSend.disabled = false; btnSend.style.opacity = ''; btnSend.style.cursor = ''; }
}


const API = '../api';

function formatoCOP(n) { return '$' + Number(n).toLocaleString('es-CO'); }

const modalidad = new URLSearchParams(location.search).get('modalidad')
                  || sessionStorage.getItem('tp_modalidad')
                  || 'segura';

// Badge superior + info detallada
const badge = document.getElementById('modBadge');
const modInfoEl = document.getElementById('modInfoCk');

const modalidadData = {
  segura: {
    badge: '✓ Compra Segura',
    info: '<strong>Compra Segura</strong>Estás seguro de la pieza. Garantía 30 días por defecto de fábrica. No aplica devolución por equivocación de modelo.'
  },
  prestamo: {
    badge: '↻ Préstamo',
    info: '<strong>Modalidad Préstamo</strong>Pruebas la tarjeta hasta 72 h. Si no funciona o no es la correcta, la devuelves y reintegramos el 100% de tu dinero.'
  }
};

const mod = modalidadData[modalidad] || modalidadData.segura;
badge.textContent = mod.badge;
badge.className = 'mod-badge ' + modalidad;
modInfoEl.className = 'modalidad-info ' + modalidad;
modInfoEl.innerHTML = mod.info;

// ---- Cargar resumen del carrito ----
async function cargarResumen() {
  const cont = document.getElementById('sumItems');
  try {
    const res = await fetch(`${API}/carrito.php`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      cont.innerHTML = '<div class=\"loading\">Tu carrito está vacío. <a href=\"../catalogo/catalogo.html\" style=\"color:#0E4A8A;font-weight:700\">Volver al catálogo</a></div>';
      document.getElementById('btnConfirm').disabled = true;
      return;
    }

    cont.innerHTML = data.items.map(it => {
      const img = it.imagen
        ? `<img src=\"../${it.imagen}\" onerror=\"this.outerHTML='<div class=\\'ph\\'>📺</div>'\">`
        : '<div class=\"ph\">📺</div>';
      return `
        <div class=\"sum-item\">
          ${img}
          <div>
            <div class=\"name\">${it.nombre}</div>
            <div class=\"qty\">Cant: ${it.cantidad} · ${it.marca}</div>
          </div>
          <span class=\"pr\">${formatoCOP(it.precio * it.cantidad)}</span>
        </div>`;
    }).join('');

    document.getElementById('sumSub').textContent = formatoCOP(data.subtotal);
    document.getElementById('sumEnv').textContent = formatoCOP(data.envio);
    document.getElementById('sumTot').textContent = formatoCOP(data.total);
  } catch (e) {
    cont.innerHTML = '<div class=\"loading\">Error al cargar el carrito.</div>';
  }
}

// ---- Selección de método de pago: mostrar panel ----
const paneles = ['nequi', 'daviplata', 'pse', 'tarjeta'];
document.querySelectorAll('input[name=\"metodo\"]').forEach(r => {
  r.addEventListener('change', () => {
    paneles.forEach(m => document.getElementById('panel-' + m).classList.add('hidden'));
    document.getElementById('panel-' + r.value).classList.remove('hidden');
  });
});

// ---- Formato auto: tarjeta y vencimiento ----
document.querySelector('input[name=\"card_num\"]')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
});
document.querySelector('input[name=\"card_exp\"]')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
  e.target.value = v;
});
document.querySelector('input[name=\"card_cvv\"]')?.addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// ---- Confirmar ----
document.getElementById('btnConfirm').addEventListener('click', async () => {
  // Validar dirección
  const required = ['receptor', 'telefono', 'direccion', 'barrio'];
  for (const name of required) {
    const el = document.querySelector(`[name=\"${name}\"]`);
    if (!el || !el.value.trim()) {
      alert('Completa todos los datos de entrega (campos con *).');
      el?.focus(); return;
    }
  }
  // Validar método de pago
  const metodo = document.querySelector('input[name=\"metodo\"]:checked');
  if (!metodo) { alert('Selecciona un método de pago.'); return; }

  // Validación específica por método
  const m = metodo.value;
  if (m === 'nequi' && !document.querySelector('[name=\"nequi_cel\"]').value.trim()) { alert('Ingresa tu celular Nequi.'); return; }
  if (m === 'daviplata' && !document.querySelector('[name=\"dp_cel\"]').value.trim()) { alert('Ingresa tu celular DaviPlata.'); return; }
  if (m === 'pse' && !document.querySelector('[name=\"pse_banco\"]').value) { alert('Selecciona tu banco.'); return; }
  if (m === 'tarjeta') {
    const num = document.querySelector('[name=\"card_num\"]').value.replace(/\s/g, '');
    const name = document.querySelector('[name=\"card_name\"]').value.trim();
    const exp = document.querySelector('[name=\"card_exp\"]').value;
    const cvv = document.querySelector('[name=\"card_cvv\"]').value;
    if (num.length < 13 || !name || exp.length < 5 || cvv.length < 3) {
      alert('Completa todos los datos de la tarjeta.'); return;
    }
  }

  // Simular procesamiento
  const btn = document.getElementById('btnConfirm');
  btn.disabled = true; btn.textContent = 'Procesando pago...';

  setTimeout(async () => {
    // Vaciar carrito
    try { await fetch(`${API}/carrito.php?action=clear`, { method: 'POST' }); } catch (e) {}
    try { sessionStorage.removeItem('tp_modalidad'); } catch (e) {}

    const orderNum = String(Math.floor(Math.random() * 900000) + 100000);
    document.getElementById('orderNum').textContent = orderNum;
    document.getElementById('successMsg').textContent =
      modalidad === 'prestamo'
        ? 'Tu pedido en modalidad PRÉSTAMO ha sido recibido. Tienes 72 horas para probar la tarjeta. Te contactaremos por WhatsApp.'
        : 'Tu pedido (Compra Segura) ha sido recibido. Te contactaremos por WhatsApp para coordinar la entrega.';
    document.getElementById('successModal').classList.add('show');
  }, 1200);
});

document.addEventListener('DOMContentLoaded', async () => {
  // Checkout requiere sesion SIEMPRE
  const user = await TecnoAuth.gateRequireLogin('finalizar tu compra');
  if (!user) return;
  cargarResumen();
});
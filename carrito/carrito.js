const API = '../api';

function formatoCOP(n) { return '$' + Number(n).toLocaleString('es-CO'); }

async function cargar() {
  const cont = document.getElementById('cartItems');
  cont.innerHTML = '<div class="loading">Cargando...</div>';
  try {
    const res = await fetch(`${API}/carrito.php`);
    const data = await res.json();
    if (data.login_required) {
      // Por si acaso, aunque el gate ya redirigio
      const next = encodeURIComponent(location.pathname);
      location.href = `../login/login.html?next=${next}`;
      return;
    }
    render(data);
  } catch (e) {
    cont.innerHTML = '<div class="empty-cart"><h3>Error de conexión</h3><p>Verifica XAMPP.</p></div>';
  }
}

function render(data) {
  const cont = document.getElementById('cartItems');
  const info = document.getElementById('infoShipping');

  document.getElementById('cartCount').textContent = data.cantidad_items || 0;
  document.getElementById('itemCount').textContent = data.cantidad_items || 0;
  document.getElementById('subtotal').textContent  = formatoCOP(data.subtotal || 0);
  document.getElementById('envio').textContent     = formatoCOP(data.envio || 0);
  document.getElementById('total').textContent     = formatoCOP(data.total || 0);

  if (!data.items || data.items.length === 0) {
    cont.innerHTML = `
      <div class="empty-cart" data-testid="empty-cart">
        <div class="icon">🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p>Agrega productos para empezar a comprar.</p>
        <a href="../catalogo/catalogo.html">Explorar catálogo</a>
      </div>`;
    info.style.display = 'none';
    document.getElementById('btnPay').disabled = true;
    return;
  }

  info.style.display = 'flex';
  document.getElementById('btnPay').disabled = false;

  cont.innerHTML = data.items.map(it => {
    const img = it.imagen ? `<img src="../${it.imagen}" onerror="this.outerHTML='<span class=\\'ph\\'>Sin imagen</span>'">` : '<span class="ph">Sin imagen</span>';
    return `
      <div class="cart-row" data-testid="cart-row-${it.carrito_id}">
        <div class="img">${img}</div>
        <div class="info">
          <span class="tag">${it.marca} • ${it.tipo}</span>
          <h4>${it.nombre}</h4>
          <span class="modelo">Modelo: ${it.modelo}</span>
          <div class="qty" data-testid="qty-${it.carrito_id}">
            <button data-id="${it.carrito_id}" data-q="${it.cantidad - 1}" aria-label="Disminuir">-</button>
            <span>${it.cantidad}</span>
            <button data-id="${it.carrito_id}" data-q="${it.cantidad + 1}" aria-label="Aumentar">+</button>
          </div>
        </div>
        <div class="right">
          <button class="btn-trash" data-remove="${it.carrito_id}" data-testid="remove-${it.carrito_id}" aria-label="Eliminar">🗑️</button>
          <div class="price">${formatoCOP(it.precio * it.cantidad)}</div>
        </div>
      </div>`;
  }).join('');

  cont.querySelectorAll('.qty button').forEach(b => {
    b.addEventListener('click', () => actualizar(b.dataset.id, parseInt(b.dataset.q, 10)));
  });
  cont.querySelectorAll('[data-remove]').forEach(b => {
    b.addEventListener('click', () => {
      if (confirm('¿Eliminar este producto del carrito?')) eliminar(b.dataset.remove);
    });
  });
}

async function actualizar(id, cantidad) {
  try {
    await fetch(`${API}/carrito.php?action=update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrito_id: id, cantidad })
    });
    cargar();
  } catch (e) { alert('Error'); }
}

async function eliminar(id) {
  try {
    await fetch(`${API}/carrito.php?action=remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrito_id: id })
    });
    cargar();
  } catch (e) { alert('Error'); }
}

document.getElementById('btnPay').addEventListener('click', () => {
  const modalidad = document.querySelector('input[name="modalidad"]:checked');
  if (!modalidad) {
    alert('Por favor selecciona una modalidad: Compra Segura o Préstamo.');
    return;
  }
  location.href = `../checkout/checkout.html?modalidad=${modalidad.value}`;
});

// Definiciones de modalidad
const modInfoEl = document.getElementById('modInfo');
const infos = {
  segura: `
    <h4>✓ Compra Segura</h4>
    <p>Para técnicos que ya verificaron que esta es la tarjeta correcta para su televisor.</p>
    <ul>
      <li>Garantía de funcionamiento de 30 días.</li>
      <li>La tarjeta se entrega testeada al 100%.</li>
      <li><strong>No aplica devolución</strong> por equivocación en el modelo.</li>
      <li>Cambio solo si la pieza llega con falla de fábrica.</li>
    </ul>`,
  prestamo: `
    <h4>↻ Préstamo (Garantía de prueba)</h4>
    <p>Para técnicos que aún no están 100% seguros de que esta sea la pieza correcta.</p>
    <ul>
      <li>Te enviamos la tarjeta y la pagas al recibirla.</li>
      <li>Tienes hasta <strong>72 horas</strong> para probarla en el TV.</li>
      <li>Si funciona, la compra queda en firme.</li>
      <li>Si <strong>no funciona</strong> o no era la tarjeta, la devuelves y te reintegramos el 100% del dinero.</li>
    </ul>`
};
document.querySelectorAll('input[name="modalidad"]').forEach(r => {
  r.addEventListener('change', () => {
    modInfoEl.className = 'mod-info ' + r.value;
    modInfoEl.innerHTML = infos[r.value];
    try { sessionStorage.setItem('tp_modalidad', r.value); } catch (e) {}
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  await TecnoAuth.updateNavbar();
  // El carrito requiere sesion SIEMPRE
  const user = await TecnoAuth.gateRequireLogin('ver tu carrito de compras');
  if (!user) return;
  cargar();
});

const API = '../api';

function formatoCOP(n) { return '$' + Number(n).toLocaleString('es-CO'); }

function cardHTML(p) {
  const img = p.imagen ? `<img src=\"../${p.imagen}\" alt=\"${p.nombre}\" onerror=\"this.style.display='none'; this.nextElementSibling.style.display='flex';\">` : '';
  const stock = p.stock > 0 ? `<span class=\"stock-tag\">Stock: ${p.stock}</span>` : '';
  return `
    <div class=\"card\" data-testid=\"result-card-${p.id}\">
      <div class=\"card-img\">
        ${img}
        <div class=\"placeholder\" ${img ? 'style=\"display:none\"' : ''}>Sin imagen</div>
        <span class=\"brand-tag\">${p.marca}</span>
        ${stock}
      </div>
      <div class=\"card-body\">
        <span class=\"card-tipo\">${p.tipo}</span>
        <span class=\"card-modelo\">Mod: ${p.modelo}</span>
        <div class=\"card-name\">${p.nombre}</div>
        <div class=\"card-foot\">
          <span class=\"card-price\">${formatoCOP(p.precio)}</span>
          <button class=\"btn-add\" data-id=\"${p.id}\" data-testid=\"add-cart-${p.id}\">🛒</button>
        </div>
      </div>
    </div>`;
}

let currentQ = '';

async function buscar() {
  const grid = document.getElementById('grid');
  const totalEl = document.getElementById('totalCount');
  grid.innerHTML = '<div class=\"loading\">Buscando...</div>';

  if (!currentQ) {
    grid.innerHTML = `
      <div class=\"empty-state\" data-testid=\"search-empty\">
        <div class=\"icon\">🔍</div>
        <h3>Escribe algo para buscar</h3>
        <p>Ingresa un modelo de TV o el tipo de tarjeta que necesitas.</p>
      </div>`;
    totalEl.textContent = '0';
    return;
  }

  const marcas = Array.from(document.querySelectorAll('input[name=\"marca\"]:checked')).map(x => x.value);
  const tipos  = Array.from(document.querySelectorAll('input[name=\"tipo\"]:checked')).map(x => x.value);

  try {
    const res = await fetch(`${API}/buscar.php?q=${encodeURIComponent(currentQ)}`);
    const data = await res.json();
    let productos = data.productos || [];

    if (marcas.length) productos = productos.filter(p => marcas.includes(p.marca));
    if (tipos.length)  productos = productos.filter(p => tipos.includes(p.tipo));

    totalEl.textContent = productos.length;

    if (productos.length === 0) {
      grid.innerHTML = `
        <div class=\"empty-state\" data-testid=\"search-no-results\">
          <div class=\"icon\">🔍</div>
          <h3>No se encontraron tarjetas</h3>
          <p>No tenemos resultados para \"<strong>${currentQ}</strong>\". Intenta buscar solo el modelo numérico o contáctanos por WhatsApp para encargos especiales.</p>
          <button onclick=\"limpiarBusqueda()\" data-testid=\"clear-search\">Limpiar búsqueda</button>
        </div>`;
      return;
    }

    grid.innerHTML = productos.map(cardHTML).join('');
    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => agregarCarrito(btn.dataset.id));
    });
  } catch (e) {
    grid.innerHTML = '<div class=\"empty-state\"><h3>Error de conexión</h3><p>Verifica que XAMPP esté corriendo.</p></div>';
  }
}

function limpiarBusqueda() {
  currentQ = '';
  document.querySelector('#searchBar input').value = '';
  document.querySelector('#navSearch input').value = '';
  history.replaceState(null, '', 'busqueda.html');
  buscar();
}
window.limpiarBusqueda = limpiarBusqueda;

async function agregarCarrito(id) {
  try {
    const res = await fetch(`${API}/carrito.php?action=add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: id, cantidad: 1 })
    });
    const data = await res.json();
    if (data.ok) { actualizarContador(); alert('Producto agregado'); }
    else alert(data.error);
  } catch (e) { alert('Error de conexion'); }
}

async function actualizarContador() {
  try {
    const res = await fetch(`${API}/carrito.php`);
    const data = await res.json();
    document.getElementById('cartCount').textContent = data.cantidad_items || 0;
  } catch (e) { /* */ }
}

async function verificarSesion() {
  try {
    const res = await fetch(`${API}/sesion.php`);
    const data = await res.json();
    if (data.autenticado) {
      const btn = document.getElementById('btnLogin');
      const inicial = (data.usuario.nombre || '?').trim().charAt(0).toUpperCase();
      btn.innerHTML = `<span class=\"user-avatar\" style=\"display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#0E4A8A;color:#fff;font-weight:700;font-size:14px;vertical-align:middle;\">${inicial}</span>`;
      btn.href = '#';
      btn.title = data.usuario.nombre + ' (clic para cerrar sesion)';
      btn.onclick = async (e) => {
        e.preventDefault();
        if (confirm('¿Cerrar sesion?')) { await fetch(`${API}/logout.php`); location.reload(); }
      };

    }
  } catch (e) { /* */ }
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  currentQ = params.get('q') || '';
  if (currentQ) {
    document.querySelector('#searchBar input').value = currentQ;
    document.querySelector('#navSearch input').value = currentQ;
  }

  let timeout;
  document.querySelector('#searchBar input').addEventListener('input', e => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      currentQ = e.target.value.trim();
      const newUrl = currentQ ? `busqueda.html?q=${encodeURIComponent(currentQ)}` : 'busqueda.html';
      history.replaceState(null, '', newUrl);
      buscar();
    }, 300);
  });

  document.getElementById('navSearch').addEventListener('submit', e => {
    e.preventDefault();
    currentQ = e.target.q.value.trim();
    document.querySelector('#searchBar input').value = currentQ;
    history.replaceState(null, '', currentQ ? `busqueda.html?q=${encodeURIComponent(currentQ)}` : 'busqueda.html');
    buscar();
  });

  document.querySelectorAll('.filters input[type=\"checkbox\"]').forEach(cb => {
    cb.addEventListener('change', buscar);
  });

  buscar();
  actualizarContador();
  verificarSesion();
});
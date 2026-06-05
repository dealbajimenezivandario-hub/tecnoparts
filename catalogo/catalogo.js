const API = '../api';

function formatoCOP(n) { return '$' + Number(n).toLocaleString('es-CO'); }

function cardHTML(p) {
  const img = p.imagen ? `<img src=\"../${p.imagen}\" alt=\"${p.nombre}\" onerror=\"this.style.display='none'; this.nextElementSibling.style.display='flex';\">` : '';
  const stock = p.stock > 0 ? `<span class=\"stock-tag\">Stock: ${p.stock}</span>` : '';
  return `
    <div class=\"card\" data-testid=\"product-card-${p.id}\">
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
          <button class=\"btn-add\" data-id=\"${p.id}\" data-testid=\"add-cart-${p.id}\" title=\"Agregar al carrito\">🛒</button>
        </div>
      </div>
    </div>`;
}

function getQuery() {
  const params = new URLSearchParams(location.search);
  return {
    q: params.get('q') || '',
    marcas: (params.get('marcas') || '').split(',').filter(Boolean),
    tipos: (params.get('tipos') || '').split(',').filter(Boolean)
  };
}

let currentQ = '';

async function cargar() {
  const grid = document.getElementById('grid');
  const totalEl = document.getElementById('totalCount');
  grid.innerHTML = '<div class=\"loading\">Cargando...</div>';

  const marcas = Array.from(document.querySelectorAll('input[name=\"marca\"]:checked')).map(x => x.value);
  const tipos  = Array.from(document.querySelectorAll('input[name=\"tipo\"]:checked')).map(x => x.value);

  let url;
  if (currentQ) {
    url = `${API}/buscar.php?q=${encodeURIComponent(currentQ)}`;
  } else {
    const params = new URLSearchParams();
    if (marcas.length) params.set('marcas', marcas.join(','));
    if (tipos.length)  params.set('tipos',  tipos.join(','));
    url = `${API}/productos.php?${params.toString()}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    let productos = data.productos || [];

    // Si hay busqueda y filtros activos, filtramos en cliente
    if (currentQ && (marcas.length || tipos.length)) {
      productos = productos.filter(p =>
        (!marcas.length || marcas.includes(p.marca)) &&
        (!tipos.length  || tipos.includes(p.tipo))
      );
    }

    totalEl.textContent = productos.length;

    if (productos.length === 0) {
      grid.innerHTML = `
        <div class=\"empty-state\">
          <div class=\"icon\">🔍</div>
          <h3>No se encontraron tarjetas</h3>
          <p>${currentQ ? `No tenemos resultados para \"${currentQ}\". Intenta buscar solo el modelo numérico o contáctanos por WhatsApp para encargos especiales.` : 'Ajusta los filtros para ver más resultados.'}</p>
          ${currentQ ? '<button onclick=\"limpiarBusqueda()\">Limpiar búsqueda</button>' : ''}
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
  history.replaceState(null, '', 'catalogo.html');
  cargar();
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
    if (data.ok) {
      actualizarContador();
      alert('Producto agregado al carrito');
    } else alert(data.error || 'Error');
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
  const params = getQuery();
  currentQ = params.q;
  if (currentQ) {
    document.querySelector('#searchBar input').value = currentQ;
    document.querySelector('#navSearch input').value = currentQ;
  }
  params.marcas.forEach(m => {
    const el = document.querySelector(`input[name=\"marca\"][value=\"${m}\"]`);
    if (el) el.checked = true;
  });
  params.tipos.forEach(t => {
    const el = document.querySelector(`input[name=\"tipo\"][value=\"${t}\"]`);
    if (el) el.checked = true;
  });

  document.querySelectorAll('.filters input[type=\"checkbox\"]').forEach(cb => {
    cb.addEventListener('change', cargar);
  });

  let timeout;
  document.querySelector('#searchBar input').addEventListener('input', e => {
    clearTimeout(timeout);
    timeout = setTimeout(() => { currentQ = e.target.value.trim(); cargar(); }, 300);
  });

  document.getElementById('navSearch').addEventListener('submit', e => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (q) location.href = `../busqueda/busqueda.html?q=${encodeURIComponent(q)}`;
  });

  cargar();
  actualizarContador();
  verificarSesion();
});
const API = '../api';

function formatoCOP(n) { return '$' + Number(n).toLocaleString('es-CO'); }

function cardHTML(p) {
  const img = p.imagen ? `<img src="../${p.imagen}" alt="${p.nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : '';
  const stock = p.stock > 0 ? `<span class="stock-tag">Stock: ${p.stock}</span>` : '';
  const creador = p.creador_nombre || 'TecnoParts';
  const creadorIcon = p.creador_rol === 'tecnico' ? '🛠️' : '🏪';
  return `
    <div class="card" data-testid="product-card-${p.id}">
      <div class="card-img">
        ${img}
        <div class="placeholder" ${img ? 'style="display:none"' : ''}>Sin imagen</div>
        <span class="brand-tag">${p.marca}</span>
        ${stock}
      </div>
      <div class="card-body">
        <span class="card-tipo">${p.tipo}</span>
        <span class="card-modelo">Mod: ${p.modelo}</span>
        <div class="card-name">${p.nombre}</div>
        <div class=\"card-creador\" title=\"Publicado por ${creador}\">${creadorIcon} ${creador}</div>
        <div class="card-foot">
          <span class="card-price">${formatoCOP(p.precio)}</span>
          <button class="btn-add" data-id="${p.id}" data-testid="add-cart-${p.id}" title="Agregar al carrito">🛒</button>
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
  grid.innerHTML = '<div class="loading">Cargando...</div>';

  const marcas = Array.from(document.querySelectorAll('input[name="marca"]:checked')).map(x => x.value);
  const tipos  = Array.from(document.querySelectorAll('input[name="tipo"]:checked')).map(x => x.value);

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
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch (parseErr) {
      grid.innerHTML = `<div class="empty-state"><h3>Respuesta no valida del servidor</h3>
        <p style="font-family:monospace;background:#fff3cd;padding:12px;border-radius:8px;white-space:pre-wrap;text-align:left;max-width:800px;margin:12px auto;">${text.slice(0,800).replace(/</g,'&lt;')}</p>
        <p>Abre <a href="../api/diagnostico.php" target="_blank">api/diagnostico.php</a>.</p></div>`;
      return;
    }
    if (!data.ok) {
      grid.innerHTML = `<div class="empty-state"><h3>Error del servidor</h3><p>${data.error || 'Error desconocido'}</p></div>`;
      return;
    }
    let productos = data.productos || [];

    if (currentQ && (marcas.length || tipos.length)) {
      productos = productos.filter(p =>
        (!marcas.length || marcas.includes(p.marca)) &&
        (!tipos.length  || tipos.includes(p.tipo))
      );
    }

    totalEl.textContent = productos.length;

    if (productos.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <h3>No se encontraron tarjetas</h3>
          <p>${currentQ ? `No tenemos resultados para "${currentQ}".` : 'Ajusta los filtros para ver mas resultados.'}</p>
          ${currentQ ? '<button onclick="limpiarBusqueda()">Limpiar busqueda</button>' : ''}
        </div>`;
      return;
    }

    grid.innerHTML = productos.map(cardHTML).join('');
    grid.querySelectorAll('.card').forEach(c => {
      const id = c.dataset.testid.replace('product-card-', '');
      c.style.cursor = 'pointer';
      c.addEventListener('click', e => { if (!e.target.closest('.btn-add')) location.href = `../producto/producto.html?id=${id}`; });
    });
    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); agregarCarrito(btn.dataset.id); });
    });
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><h3>Error de red</h3><p>${e.message}</p></div>`;
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
  const user = await TecnoAuth.requireLogin('agregar productos al carrito');
  if (!user) return;
  try {
    const res = await fetch(`${API}/carrito.php?action=add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: id, cantidad: 1 })
    });
    const data = await res.json();
    if (data.ok) { TecnoAuth.refreshCartCount(); alert('Producto agregado al carrito'); }
    else alert(data.error || 'Error');
  } catch (e) { alert('Error de conexion'); }
}

document.addEventListener('DOMContentLoaded', () => {
  TecnoAuth.updateNavbar();
  TecnoAuth.refreshCartCount();

  const params = getQuery();
  currentQ = params.q;
  if (currentQ) {
    document.querySelector('#searchBar input').value = currentQ;
    document.querySelector('#navSearch input').value = currentQ;
  }
  params.marcas.forEach(m => {
    const el = document.querySelector(`input[name="marca"][value="${m}"]`);
    if (el) el.checked = true;
  });
  params.tipos.forEach(t => {
    const el = document.querySelector(`input[name="tipo"][value="${t}"]`);
    if (el) el.checked = true;
  });

  document.querySelectorAll('.filters input[type="checkbox"]').forEach(cb => {
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
});

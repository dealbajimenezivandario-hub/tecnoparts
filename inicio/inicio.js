// ===== Inicio - TecnoParts =====
const API = '../api';

function formatoCOP(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

function cardHTML(p) {
  const img = p.imagen ? `<img src="../${p.imagen}" alt="${p.nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : '';
    const creador = p.creador_nombre || 'TecnoParts';
  const creadorIcon = p.creador_rol === 'tecnico' ? '🛠️' : '🏪';
  return `
    <div class="card" data-testid="product-card-${p.id}">
      <div class="card-img">
        ${img}
        <div class="placeholder" ${img ? 'style="display:none"' : ''}>Sin imagen</div>
        <span class="brand-tag">${p.marca}</span>
      </div>
      <div class="card-body">
        <span class="card-modelo">${p.modelo}</span>
        <span class="card-tipo">${p.tipo}</span>
        <div class="card-name">${p.nombre}</div>
        <div class=\"card-creador\" title=\"Publicado por ${creador}\">${creadorIcon} ${creador}</div>
        <div class="card-foot">
          <span class="card-price">${formatoCOP(p.precio)}</span>
          <button class="btn-add" data-id="${p.id}" data-testid="add-cart-${p.id}" title="Agregar al carrito">→</button>
        </div>
      </div>
    </div>`;
}

async function cargarDestacados() {
  const grid = document.getElementById('destacadosGrid');
  try {
    let res = await fetch(`${API}/productos.php?destacado=1`);
    let text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch (e) {
      grid.innerHTML = `<div class="empty"><b>Respuesta invalida del servidor:</b><pre style="text-align:left;white-space:pre-wrap;background:#fff3cd;padding:12px;border-radius:8px;max-width:800px;margin:12px auto;">${text.slice(0,800).replace(/</g,'&lt;')}</pre><p>Abre <a href="../api/diagnostico.php" target="_blank">diagnostico.php</a>.</p></div>`;
      return;
    }
    if (!data.ok) {
      grid.innerHTML = `<div class="empty"><b>Error del servidor:</b> ${data.error}<br><a href="../api/diagnostico.php" target="_blank">Ver diagnostico</a></div>`;
      return;
    }
    if (!data.productos || data.productos.length === 0) {
      res = await fetch(`${API}/productos.php`);
      data = await res.json();
    }
    if (!data.ok || !data.productos || data.productos.length === 0) {
      grid.innerHTML = `<div class="empty">
        Aun no hay productos en la base de datos.<br>
        <a href="../api/diagnostico.php" target="_blank">Ver diagnostico</a>
      </div>`;
      return;
    }
    grid.innerHTML = data.productos.slice(0, 4).map(cardHTML).join('');
    grid.querySelectorAll('.card').forEach(c => {
      const id = c.dataset.testid.replace('product-card-', '');
      c.style.cursor = 'pointer';
      c.addEventListener('click', e => { if (!e.target.closest('.btn-add')) location.href = `../producto/producto.html?id=${id}`; });
    });
    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); agregarCarrito(btn.dataset.id); });
    });
  } catch (e) {
    grid.innerHTML = `<div class="empty"><b>Error de red:</b> ${e.message}<br><a href="../api/diagnostico.php" target="_blank">Ver diagnostico</a></div>`;
  }
}

async function agregarCarrito(productoId) {
  const user = await TecnoAuth.requireLogin('agregar productos al carrito');
  if (!user) return;
  try {
    const res = await fetch(`${API}/carrito.php?action=add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: productoId, cantidad: 1 })
    });
    const data = await res.json();
    if (data.ok) {
      TecnoAuth.refreshCartCount();
      alert('Producto agregado al carrito');
    } else {
      alert(data.error || 'Error al agregar');
    }
  } catch (e) { alert('Error de conexion'); }
}

function setupBuscadores() {
  const ir = (q) => {
    const query = q.trim();
    if (!query) return;
    location.href = `../busqueda/busqueda.html?q=${encodeURIComponent(query)}`;
  };
  document.getElementById('heroSearch').addEventListener('submit', e => {
    e.preventDefault(); ir(e.target.q.value);
  });
  document.getElementById('navSearch').addEventListener('submit', e => {
    e.preventDefault(); ir(e.target.q.value);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  TecnoAuth.updateNavbar();
  TecnoAuth.refreshCartCount();
  cargarDestacados();
  setupBuscadores();
});

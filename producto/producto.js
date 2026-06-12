
const API = '../api';
const fmt = n => '$' + Number(n).toLocaleString('es-CO');

const id = new URLSearchParams(location.search).get('id');
const main = document.getElementById('prodMain');

async function cargar() {
  if (!id) { main.innerHTML = '<div class="loading">ID no especificado.</div>'; return; }
  try {
    const res = await fetch(`${API}/productos.php?id=${id}`);
    const data = await res.json();
    if (!data.ok) { main.innerHTML = `<div class="loading">${data.error || 'Producto no encontrado'}</div>`; return; }
    render(data.producto);
    cargarRelacionados(data.producto);
  } catch (e) {
    main.innerHTML = '<div class="loading">Error de conexión. Verifica XAMPP.</div>';
  }
}

function render(p) {
  document.getElementById('pageTitle').textContent = p.nombre + ' - TecnoParts';
  const img = p.imagen
    ? `<img src="../${p.imagen}" alt="${p.nombre}" onerror="this.outerHTML='<div class=\\'ph\\'>📺</div>'">`
    : '<div class="ph">📺</div>';
  const stockTag = p.stock > 0
    ? `<span class="tag stock">✓ En stock (${p.stock})</span>`
    : `<span class="tag nostock">Sin stock</span>`;
  const desc = p.descripcion ? `<div class="prod-desc"><h3>Descripción</h3>${p.descripcion}</div>` : '';

  main.innerHTML = `
    <div class="prod-gallery">${img}</div>
    <div class="prod-info">
      <div class="prod-tags">
        <span class="tag brand">${p.marca}</span>
        <span class="tag tipo">${p.tipo}</span>
        ${stockTag}
      </div>
      <h1>${p.nombre}</h1>
      <span class="prod-modelo">Ref: ${p.modelo}</span>
      <div class="prod-price">${fmt(p.precio)}</div>

      <div class="prod-details">
        <div class="detail-row"><span class="lbl">Marca</span><span class="val">${p.marca}</span></div>
        <div class="detail-row"><span class="lbl">Tipo de tarjeta</span><span class="val">${p.tipo}</span></div>
        <div class="detail-row"><span class="lbl">Referencia / Modelo</span><span class="val">${p.modelo}</span></div>
        <div class="detail-row"><span class="lbl">Stock disponible</span><span class="val">${p.stock} unidades</span></div>
        ${p.ubicacion ? `<div class="detail-row"><span class="lbl">Ubicación</span><span class="val">${p.ubicacion}</span></div>` : ''}
        <div class="detail-row"><span class="lbl">Publicado por</span><span class="val">${(p.creador_rol === 'tecnico' ? '🛠️ ' : '🏪 ') + (p.creador_nombre || 'TecnoParts')}</span></div>
        <div class="detail-row"><span class="lbl">Entrega</span><span class="val">Mismo día en Santa Marta</span></div>
      </div>

      ${desc}

      <button class="btn-buy" id="btnAdd" data-testid="btn-add-cart" ${p.stock <= 0 ? 'disabled' : ''}>
        🛒 ${p.stock > 0 ? 'Agregar al carrito' : 'Sin stock disponible'}
      </button>
      <a href="../catalogo/catalogo.html" class="btn-secondary" style="display:block;text-align:center;text-decoration:none">← Volver al catálogo</a>
    </div>`;

  document.getElementById('btnAdd').addEventListener('click', async () => {
    const user = await TecnoAuth.requireLogin('agregar productos al carrito');
    if (!user) return;
    try {
      const r = await fetch(`${API}/carrito.php?action=add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: p.id, cantidad: 1 })
      });
      const d = await r.json();
      if (d.ok) { alert('✓ Agregado al carrito'); TecnoAuth.refreshCartCount(); }
      else alert(d.error);
    } catch (e) { alert('Error de conexión'); }
  });
}

async function cargarRelacionados(p) {
  try {
    const res = await fetch(`${API}/productos.php`);
    const data = await res.json();
    const otros = (data.productos || []).filter(x => x.id != p.id).slice(0, 4);
    const grid = document.getElementById('relatedGrid');
    grid.innerHTML = otros.map(r => {
      const img = r.imagen ? `<img src="../${r.imagen}" onerror="this.outerHTML='<div class=\\'ph\\'>📺</div>'">` : '<div class="ph">📺</div>';
      return `
        <div class="card" onclick="location.href='producto.html?id=${r.id}'">
          <div class="card-img">${img}</div>
          <div class="card-body">
            <span class="card-tipo">${r.tipo}</span>
            <div class="card-name">${r.nombre}</div>
            <span class="card-price">${fmt(r.precio)}</span>
          </div>
        </div>`;
    }).join('');
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  TecnoAuth.updateNavbar();
  TecnoAuth.refreshCartCount();
  cargar();
});
// ===== Inicio - TecnoParts =====
const API = '../api';

function formatoCOP(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

function cardHTML(p) {
  const img = p.imagen ? `<img src=\"../${p.imagen}\" alt=\"${p.nombre}\" onerror=\"this.style.display='none'; this.nextElementSibling.style.display='flex';\">` : '';
  return `
    <div class=\"card\" data-testid=\"product-card-${p.id}\">
      <div class=\"card-img\">
        ${img}
        <div class=\"placeholder\" ${img ? 'style=\"display:none\"' : ''}>Sin imagen</div>
        <span class=\"brand-tag\">${p.marca}</span>
      </div>
      <div class=\"card-body\">
        <span class=\"card-modelo\">${p.modelo}</span>
        <span class=\"card-tipo\">${p.tipo}</span>
        <div class=\"card-name\">${p.nombre}</div>
        <div class=\"card-foot\">
          <span class=\"card-price\">${formatoCOP(p.precio)}</span>
          <button class=\"btn-add\" data-id=\"${p.id}\" data-testid=\"add-cart-${p.id}\" title=\"Agregar al carrito\">→</button>
        </div>
      </div>
    </div>`;
}

async function cargarDestacados() {
  const grid = document.getElementById('destacadosGrid');
  try {
    const res = await fetch(`${API}/productos.php?destacado=1`);
    const data = await res.json();
    if (!data.ok || data.productos.length === 0) {
      grid.innerHTML = '<div class=\"empty\">No hay productos destacados disponibles.</div>';
      return;
    }
    grid.innerHTML = data.productos.slice(0, 4).map(cardHTML).join('');
    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => agregarCarrito(btn.dataset.id));
    });
  } catch (e) {
    grid.innerHTML = '<div class=\"empty\">Error al cargar productos. Verifica que XAMPP esté corriendo.</div>';
  }
}

async function agregarCarrito(productoId) {
  try {
    const res = await fetch(`${API}/carrito.php?action=add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: productoId, cantidad: 1 })
    });
    const data = await res.json();
    if (data.ok) {
      actualizarContadorCarrito();
      alert('Producto agregado al carrito');
    } else {
      alert(data.error || 'Error al agregar');
    }
  } catch (e) {
    alert('Error de conexion');
  }
}

async function actualizarContadorCarrito() {
  try {
    const res = await fetch(`${API}/carrito.php`);
    const data = await res.json();
    document.getElementById('cartCount').textContent = data.cantidad_items || 0;
  } catch (e) { /* silencioso */ }
}

async function verificarSesion() {
  try {
    const res = await fetch(`${API}/sesion.php`);
    const data = await res.json();
    if (data.autenticado) {
      const btn = document.getElementById('btnLogin');
      const inicial = (data.usuario.nombre || '?').trim().charAt(0).toUpperCase();
      btn.innerHTML = `<span class=\"user-avatar\" title=\"${data.usuario.nombre}\" style=\"display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#0E4A8A;color:#fff;font-weight:700;font-size:14px;vertical-align:middle;\">${inicial}</span>`;
      btn.href = '#';
      btn.title = data.usuario.nombre + ' (clic para cerrar sesion)';
      btn.onclick = async (e) => {
        e.preventDefault();
        if (confirm('¿Cerrar sesion?')) {
          await fetch(`${API}/logout.php`);
          location.reload();
        }
      };
    }
  } catch (e) { /* silencioso */ }
}

function setupBuscadores() {
  const ir = (q) => {
    const query = q.trim();
    if (!query) return;
    location.href = `../busqueda/busqueda.html?q=${encodeURIComponent(query)}`;
  };
  document.getElementById('heroSearch').addEventListener('submit', e => {
    e.preventDefault();
    ir(e.target.q.value);
  });
  document.getElementById('navSearch').addEventListener('submit', e => {
    e.preventDefault();
    ir(e.target.q.value);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  cargarDestacados();
  actualizarContadorCarrito();
  verificarSesion();
  setupBuscadores();
});

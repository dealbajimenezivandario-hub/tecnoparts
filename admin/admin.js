const API = '../api';

const form      = document.getElementById('adminForm');
const formMsg   = document.getElementById('formMsg');
const imgInput  = document.getElementById('imgInput');
const imgPrev   = document.getElementById('imgPreview');
const uploader  = document.getElementById('imgUploader');
const tbody     = document.getElementById('prodBody');

function formatoCOP(n) { return '$' + Number(n).toLocaleString('es-CO'); }

function showMsg(text, type) {
  formMsg.textContent = text;
  formMsg.className = 'msg ' + type;
}

// --- Preview de imagen + drag & drop ---
function showPreview(file) {
  const url = URL.createObjectURL(file);
  imgPrev.innerHTML = `<img src=\"${url}\" alt=\"preview\">`;
}

uploader.addEventListener('click', e => {
  if (e.target.tagName !== 'INPUT') imgInput.click();
});
imgInput.addEventListener('change', e => {
  if (e.target.files[0]) showPreview(e.target.files[0]);
});
['dragenter', 'dragover'].forEach(ev =>
  uploader.addEventListener(ev, e => { e.preventDefault(); uploader.classList.add('drag'); })
);
['dragleave', 'drop'].forEach(ev =>
  uploader.addEventListener(ev, e => { e.preventDefault(); uploader.classList.remove('drag'); })
);
uploader.addEventListener('drop', e => {
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    imgInput.files = dt.files;
    showPreview(file);
  }
});

// --- Submit del formulario ---
form.addEventListener('submit', async e => {
  e.preventDefault();
  formMsg.style.display = 'none';
  const btn = form.querySelector('button[type=\"submit\"]');
  btn.disabled = true; btn.textContent = 'Guardando...';

  try {
    const fd = new FormData(form);
    const res = await fetch(`${API}/admin_producto.php`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.ok) {
      showMsg('✓ ' + data.mensaje, 'success');
      form.reset();
      imgPrev.innerHTML = '<span class=\"ph\">📷 Haz clic o arrastra una imagen</span>';
      cargarProductos();
    } else {
      showMsg(data.error || 'Error al guardar', 'error');
    }
  } catch (err) {
    showMsg('Error de conexión. Verifica XAMPP.', 'error');
  }
  btn.disabled = false; btn.textContent = '💾 Guardar Tarjeta';
});

// --- Listado ---
async function cargarProductos() {
  tbody.innerHTML = '<tr><td colspan=\"9\" class=\"loading\">Cargando...</td></tr>';
  try {
    const res = await fetch(`${API}/admin_producto.php`);
    const data = await res.json();
    if (!data.ok || data.productos.length === 0) {
      tbody.innerHTML = '<tr><td colspan=\"9\" class=\"loading\">No hay productos cargados.</td></tr>';
      return;
    }
    tbody.innerHTML = data.productos.map(p => {
      const img = p.imagen
        ? `<img class=\"thumb\" src=\"../${p.imagen}\" alt=\"\" onerror=\"this.outerHTML='<div class=\'thumb-ph\'>📺</div>'\">`
        : `<div class=\"thumb-ph\">📺</div>`;
      return `
        <tr data-testid=\"row-${p.id}\">
          <td>${img}</td>
          <td>${p.nombre}</td>
          <td><span class=\"ref\">${p.modelo}</span></td>
          <td>${p.marca}</td>
          <td>${p.tipo}</td>
          <td><span class=\"price\">${formatoCOP(p.precio)}</span></td>
          <td>${p.ubicacion || '<span style=\"color:#9CA3AF\">—</span>'}</td>
          <td>${p.stock}</td>
          <td><button class=\"btn-del\" data-id=\"${p.id}\" data-testid=\"del-${p.id}\" title=\"Eliminar\">🗑️</button></td>
        </tr>`;
    }).join('');
    tbody.querySelectorAll('.btn-del').forEach(b => {
      b.addEventListener('click', () => eliminar(b.dataset.id));
    });
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan=\"9\" class=\"loading\">Error de conexión. Verifica XAMPP.</td></tr>';
  }
}

async function eliminar(id) {
  if (!confirm('¿Eliminar este producto del inventario?')) return;
  try {
    const fd = new FormData();
    fd.append('id', id);
    const res = await fetch(`${API}/admin_producto.php?action=delete`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.ok) cargarProductos();
    else alert(data.error);
  } catch (e) { alert('Error de conexión'); }
}

document.getElementById('reloadBtn').addEventListener('click', cargarProductos);
document.addEventListener('DOMContentLoaded', cargarProductos);

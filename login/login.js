
const API = '../api';

const tabs         = document.querySelectorAll('.tab');
const loginForm    = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMsg     = document.getElementById('loginMsg');
const registerMsg  = document.getElementById('registerMsg');

// Si la URL trae ?tab=register o ?next=..., activamos tab adecuada
const urlParams = new URLSearchParams(location.search);
if (urlParams.get('tab') === 'register') {
  tabs.forEach(x => x.classList.remove('active'));
  document.querySelector('[data-tab="register"]').classList.add('active');
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
}
const nextUrl = urlParams.get('next');

tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  if (t.dataset.tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  }
}));

// Visual: marcar radio seleccionado
document.querySelectorAll('input[name="rol"]').forEach(r => {
  r.addEventListener('change', () => {
    document.querySelectorAll('.rol-card').forEach(c => c.classList.remove('selected'));
    r.closest('.rol-card').classList.add('selected');
  });
});
document.querySelector('input[name="rol"]:checked')?.closest('.rol-card')?.classList.add('selected');

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg ' + type;
}

function redirectAfterAuth(rol) {
  if (nextUrl) { location.href = nextUrl; return; }
  location.href = '../inicio/inicio.html';
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  const body = { email: fd.get('email'), password: fd.get('password') };
  const btn = loginForm.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Ingresando...';
  try {
    const res = await fetch(`${API}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.ok) {
      showMsg(loginMsg, `¡Bienvenido ${data.usuario.nombre}! (${data.usuario.rol})`, 'success');
      setTimeout(() => redirectAfterAuth(data.usuario.rol), 700);
    } else {
      showMsg(loginMsg, data.error || 'Error al iniciar sesion', 'error');
    }
  } catch (err) {
    showMsg(loginMsg, 'Error de conexion. Verifica XAMPP.', 'error');
  }
  btn.disabled = false; btn.textContent = 'Ingresar a mi cuenta';
});

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(registerForm);
  const body = {
    nombre: fd.get('nombre'),
    email: fd.get('email'),
    telefono: fd.get('telefono'),
    rol: fd.get('rol'),
    password: fd.get('password')
  };
  const btn = registerForm.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Creando cuenta...';
  try {
    const res = await fetch(`${API}/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.ok) {
      showMsg(registerMsg, `¡Cuenta de ${data.usuario.rol} creada! Redirigiendo...`, 'success');
      setTimeout(() => redirectAfterAuth(data.usuario.rol), 900);
    } else {
      showMsg(registerMsg, data.error || 'Error al registrar', 'error');
    }
  } catch (err) {
    showMsg(registerMsg, 'Error de conexion. Verifica XAMPP.', 'error');
  }
  btn.disabled = false; btn.textContent = 'Crear mi cuenta';
});

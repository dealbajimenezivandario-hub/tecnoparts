const API = '../api';

const tabs        = document.querySelectorAll('.tab');
const loginForm   = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMsg    = document.getElementById('loginMsg');
const registerMsg = document.getElementById('registerMsg');

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

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg ' + type;
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  const body = { email: fd.get('email'), password: fd.get('password') };
  const btn = loginForm.querySelector('button[type=\"submit\"]');
  btn.disabled = true; btn.textContent = 'Ingresando...';
  try {
    const res = await fetch(`${API}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.ok) {
      showMsg(loginMsg, '¡Bienvenido ' + data.usuario.nombre + '!', 'success');
      setTimeout(() => location.href = '../inicio/inicio.html', 800);
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
    password: fd.get('password')
  };
  const btn = registerForm.querySelector('button[type=\"submit\"]');
  btn.disabled = true; btn.textContent = 'Creando cuenta...';
  try {
    const res = await fetch(`${API}/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.ok) {
      showMsg(registerMsg, '¡Cuenta creada! Redirigiendo...', 'success');
      setTimeout(() => location.href = '../inicio/inicio.html', 1000);
    } else {
      showMsg(registerMsg, data.error || 'Error al registrar', 'error');
    }
  } catch (err) {
    showMsg(registerMsg, 'Error de conexion. Verifica XAMPP.', 'error');
  }
  btn.disabled = false; btn.textContent = 'Registrarme ahora';
});

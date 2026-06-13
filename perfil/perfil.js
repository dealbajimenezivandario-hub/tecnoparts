const API = '../api';

const tabs = document.querySelectorAll('.tab');
const profileForm = document.getElementById('profileForm');
const securityForm = document.getElementById('securityForm');
const profileMsg = document.getElementById('profileMsg');
const securityMsg = document.getElementById('securityMsg');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg ' + type;
}

function setActiveTab(tabName) {
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
    const content = document.querySelector(`[data-tab-content="${t.dataset.tab}"]`);
    if (content) content.classList.toggle('hidden', t.dataset.tab !== tabName);
  });
}

tabs.forEach(t => {
  t.addEventListener('click', () => setActiveTab(t.dataset.tab));
});

function updateAvatarPreview(src) {
  if (!src) {
    avatarPreview.innerHTML = '📷';
    return;
  }
  avatarPreview.innerHTML = `<img src="${src}" alt="Avatar de usuario">`;
}

async function loadProfile() {
  try {
    const res = await fetch(`${API}/sesion.php`);
    const data = await res.json();
    if (!data.autenticado) {
      location.href = '../login/login.html?next=../perfil/perfil.html';
      return;
    }
    const user = data.usuario;
    profileForm.nombre.value = user.nombre || '';
    profileForm.email.value = user.email || '';
    profileForm.rol.value = user.rol || '';
    updateAvatarPreview(user.avatar ? `../${user.avatar}` : '');
  } catch (err) {
    showMsg(profileMsg, 'No se pudo cargar la información de perfil.', 'error');
  }
}

profileForm.addEventListener('submit', async e => {
  e.preventDefault();
  profileMsg.textContent = '';
  profileMsg.className = 'msg';

  const nombre = profileForm.nombre.value.trim();
  const email = profileForm.email.value.trim();
  if (!nombre || !email) {
    showMsg(profileMsg, 'Nombre y correo son obligatorios.', 'error');
    return;
  }

  const formData = new FormData(profileForm);
  formData.set('nombre', nombre);
  formData.set('email', email);

  try {
    const res = await fetch(`${API}/update_profile.php`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showMsg(profileMsg, data.error || 'Error al guardar el perfil.', 'error');
      return;
    }
    if (data.usuario && data.usuario.avatar) {
      updateAvatarPreview(`../${data.usuario.avatar}`);
    }
    showMsg(profileMsg, data.mensaje || 'Perfil actualizado con éxito.', 'success');
  } catch (err) {
    showMsg(profileMsg, 'Error de conexión al servidor.', 'error');
  }
});

securityForm.addEventListener('submit', async e => {
  e.preventDefault();
  securityMsg.textContent = '';
  securityMsg.className = 'msg';

  const password = securityForm.password.value;
  const confirmPassword = securityForm.confirmPassword.value;
  if (!password || password.length < 8) {
    showMsg(securityMsg, 'La contraseña debe tener al menos 8 caracteres.', 'error');
    return;
  }
  if (password !== confirmPassword) {
    showMsg(securityMsg, 'Las contraseñas no coinciden.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/update_profile.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showMsg(securityMsg, data.error || 'Error al actualizar la contraseña.', 'error');
      return;
    }
    securityForm.password.value = '';
    securityForm.confirmPassword.value = '';
    showMsg(securityMsg, data.mensaje || 'Contraseña actualizada con éxito.', 'success');
  } catch (err) {
    showMsg(securityMsg, 'Error de conexión al servidor.', 'error');
  }
});

avatarInput?.addEventListener('change', () => {
  const file = avatarInput.files?.[0];
  if (!file) {
    updateAvatarPreview('');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => updateAvatarPreview(reader.result);
  reader.readAsDataURL(file);
});

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await TecnoAuth.logout();
    location.href = '../login/login.html';
  });
}

loadProfile();

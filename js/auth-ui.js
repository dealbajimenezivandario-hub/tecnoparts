// ============================================================
// TecnoParts - Helpers de Autenticacion y Navbar (compartido)
// Incluir en cada pagina ANTES del JS especifico de la pagina.
// ============================================================
(function () {
  const API = location.pathname.includes('/admin/') || location.pathname.includes('/inicio/')
              || location.pathname.includes('/catalogo/') || location.pathname.includes('/busqueda/')
              || location.pathname.includes('/carrito/') || location.pathname.includes('/checkout/')
              || location.pathname.includes('/login/')   || location.pathname.includes('/producto/')
              ? '../api' : 'api';

  let sessionCache = null;

  async function getSession(forceReload = false) {
    if (sessionCache && !forceReload) return sessionCache;
    try {
      const res = await fetch(`${API}/sesion.php`);
      sessionCache = await res.json();
    } catch (e) {
      sessionCache = { ok: false, autenticado: false };
    }
    return sessionCache;
  }

  // Actualiza el navbar:
  //  - Si autenticado: muestra avatar circular con inicial + logout al hacer clic
  //  - Si rol != tecnico: oculta los links "+ Agregar Tarjeta"
  async function updateNavbar() {
    const session = await getSession();
    const btnLogin = document.getElementById('btnLogin');
    const addCardLinks = document.querySelectorAll('.nav-add-card');

    if (session.autenticado) {
      const u = session.usuario;
      const inicial = (u.nombre || '?').trim().charAt(0).toUpperCase();
      const color = u.rol === 'tecnico' ? '#0E4A8A' : '#0d9488';
      if (btnLogin) {
        btnLogin.innerHTML = `<span class="user-avatar" title="${u.nombre} (${u.rol})"
          style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;
                 border-radius:50%;background:${color};color:#fff;font-weight:700;font-size:14px;
                 vertical-align:middle;border:2px solid #fff;box-shadow:0 0 0 2px ${color};">
          ${inicial}</span>`;
        btnLogin.href = '#';
        btnLogin.title = `${u.nombre} - ${u.rol} (clic para cerrar sesion)`;
        btnLogin.onclick = async (e) => {
          e.preventDefault();
          if (confirm(`¿Cerrar sesion de ${u.nombre}?`)) {
            await fetch(`${API}/logout.php`);
            location.reload();
          }
        };
      }
      // Solo técnico ve "Agregar Tarjeta"
      addCardLinks.forEach(el => {
        el.style.display = u.rol === 'tecnico' ? '' : 'none';
      });
    } else {
      addCardLinks.forEach(el => { el.style.display = 'none'; });
    }
    return session;
  }

  // Para acciones que requieren login (agregar al carrito, pagar, etc.)
  // Si no hay sesion, redirige a /login/login.html?next=URL_ACTUAL
  async function requireLogin(actionName = 'continuar') {
    const session = await getSession();
    if (session.autenticado) return session.usuario;
    const next = encodeURIComponent(location.pathname + location.search);
    if (confirm(`Para ${actionName} debes iniciar sesion o registrarte.\n\n¿Ir a la pagina de inicio de sesion?`)) {
      location.href = `../login/login.html?next=${next}`;
    }
    return null;
  }

  // Para paginas restringidas (admin, carrito, checkout)
  async function gateRequireLogin(actionName = 'acceder a esta seccion') {
    const session = await getSession();
    if (session.autenticado) return session.usuario;
    const next = encodeURIComponent(location.pathname + location.search);
    location.href = `../login/login.html?next=${next}`;
    return null;
  }

  async function gateRequireRol(rol, mensaje = 'acceder a esta seccion') {
    const user = await gateRequireLogin();
    if (!user) return null;
    if (user.rol !== rol) {
      alert(`Esta seccion es solo para usuarios con rol "${rol}". Tu cuenta es "${user.rol}".`);
      location.href = '../inicio/inicio.html';
      return null;
    }
    return user;
  }

  // Numero de items del carrito (solo si hay sesion)
  async function refreshCartCount() {
    const el = document.getElementById('cartCount');
    if (!el) return;
    const session = await getSession();
    if (!session.autenticado) { el.textContent = '0'; return; }
    try {
      const res = await fetch(`${API}/carrito.php`);
      const data = await res.json();
      el.textContent = data.cantidad_items || 0;
    } catch (e) { el.textContent = '0'; }
  }

  window.TecnoAuth = {
    api: API,
    getSession,
    updateNavbar,
    requireLogin,
    gateRequireLogin,
    gateRequireRol,
    refreshCartCount
  };
})();

<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Metodo no permitido'], 405);
}

$usuarioId = requireLogin();
$data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$nombre   = trim($data['nombre'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

$hasAvatarUpload = !empty($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK;
if ($nombre === '' && $email === '' && $password === '' && !$hasAvatarUpload) {
    jsonResponse(['ok' => false, 'error' => 'No hay datos para actualizar'], 400);
}

$pdo = getDB();

if ($email !== '') {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['ok' => false, 'error' => 'Correo electronico invalido'], 400);
    }
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?');
    $stmt->execute([$email, $usuarioId]);
    if ($stmt->fetch()) {
        jsonResponse(['ok' => false, 'error' => 'Este correo ya esta registrado'], 409);
    }
}

$params = [];
$sql = 'UPDATE usuarios SET ';
$set = [];

if ($nombre !== '') {
    $set[] = 'nombre = ?';
    $params[] = $nombre;
}
if ($email !== '') {
    $set[] = 'email = ?';
    $params[] = $email;
}
if ($password !== '') {
    if (strlen($password) < 8) {
        jsonResponse(['ok' => false, 'error' => 'La contrasena debe tener al menos 8 caracteres'], 400);
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $set[] = 'password = ?';
    $params[] = $hash;
}

$avatarPath = null;
if (!empty($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
    $avatarFile = $_FILES['avatar'];
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $origin = $avatarFile['name'];
    $tmp = $avatarFile['tmp_name'];
    $ext = strtolower(pathinfo($origin, PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed, true)) {
        jsonResponse(['ok' => false, 'error' => 'Extensión de imagen no permitida'], 400);
    }
    if ($avatarFile['size'] > 2 * 1024 * 1024) {
        jsonResponse(['ok' => false, 'error' => 'La imagen no puede pesar más de 2MB'], 400);
    }

    $saveDir = __DIR__ . '/../img/avatars';
    if (!is_dir($saveDir) && !mkdir($saveDir, 0755, true)) {
        jsonResponse(['ok' => false, 'error' => 'No se pudo crear el directorio de avatar'], 500);
    }

    $safeName = preg_replace('/[^a-z0-9]+/i', '_', pathinfo($origin, PATHINFO_FILENAME));
    $fileName = sprintf('%s_%s.%s', $safeName, bin2hex(random_bytes(8)), $ext);
    $dest = $saveDir . '/' . $fileName;

    if (!move_uploaded_file($tmp, $dest)) {
        jsonResponse(['ok' => false, 'error' => 'No se pudo guardar la imagen de perfil'], 500);
    }

    $avatarPath = 'img/avatars/' . $fileName;
    $set[] = 'profile_image = ?';
    $params[] = $avatarPath;
}

if (count($set) === 0) {
    jsonResponse(['ok' => false, 'error' => 'No hay datos para actualizar'], 400);
}

$sql .= implode(', ', $set) . ' WHERE id = ?';
$params[] = $usuarioId;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

if ($nombre !== '') {
    $_SESSION['usuario_nombre'] = $nombre;
}
if ($email !== '') {
    $_SESSION['usuario_email'] = $email;
}
if ($avatarPath !== null) {
    $_SESSION['usuario_avatar'] = $avatarPath;
}

jsonResponse([
    'ok' => true,
    'mensaje' => 'Perfil actualizado correctamente',
    'usuario' => [
        'id' => $usuarioId,
        'nombre' => $_SESSION['usuario_nombre'] ?? '',
        'email' => $_SESSION['usuario_email'] ?? '',
        'telefono' => $_SESSION['usuario_tel'] ?? '',
        'rol' => $_SESSION['usuario_rol'] ?? 'comprador',
        'avatar' => $_SESSION['usuario_avatar'] ?? null
    ]
]);

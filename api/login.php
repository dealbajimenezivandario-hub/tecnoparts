<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Metodo no permitido'], 405);
}

$data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';

if ($email === '' || $password === '') {
    jsonResponse(['ok' => false, 'error' => 'Correo y contrasena son obligatorios'], 400);
}

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id, nombre, email, telefono, rol, password, profile_image FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    jsonResponse(['ok' => false, 'error' => 'Correo o contrasena incorrectos'], 401);
}

$_SESSION['usuario_id']     = (int) $user['id'];
$_SESSION['usuario_nombre'] = $user['nombre'];
$_SESSION['usuario_email']  = $user['email'];
$_SESSION['usuario_rol']    = $user['rol'] ?: 'comprador';
$_SESSION['usuario_tel']    = $user['telefono'] ?? '';
$_SESSION['usuario_avatar'] = $user['profile_image'] ?? null;

jsonResponse([
    'ok' => true,
    'mensaje' => 'Sesion iniciada',
    'usuario' => [
        'id' => (int) $user['id'],
        'nombre' => $user['nombre'],
        'email' => $user['email'],
        'telefono' => $user['telefono'],
        'rol' => $user['rol'] ?: 'comprador',
        'avatar' => $user['profile_image'] ?? null
    ]
]);

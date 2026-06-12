<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Metodo no permitido'], 405);
}

$data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$nombre   = trim($data['nombre']   ?? '');
$email    = trim($data['email']    ?? '');
$telefono = trim($data['telefono'] ?? '');
$rol      = trim($data['rol']      ?? 'comprador');
$password = $data['password']      ?? '';

if ($nombre === '' || $email === '' || $password === '' || $telefono === '') {
    jsonResponse(['ok' => false, 'error' => 'Nombre, email, telefono y contrasena son obligatorios'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['ok' => false, 'error' => 'Correo electronico invalido'], 400);
}
if (strlen($password) < 8) {
    jsonResponse(['ok' => false, 'error' => 'La contrasena debe tener al menos 8 caracteres'], 400);
}
if (!in_array($rol, ['comprador', 'tecnico'], true)) {
    jsonResponse(['ok' => false, 'error' => 'Rol invalido. Debe ser comprador o tecnico'], 400);
}

$pdo = getDB();
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['ok' => false, 'error' => 'Este correo ya esta registrado'], 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare('INSERT INTO usuarios (nombre, email, telefono, rol, password) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$nombre, $email, $telefono, $rol, $hash]);
$userId = (int) $pdo->lastInsertId();

$_SESSION['usuario_id']     = $userId;
$_SESSION['usuario_nombre'] = $nombre;
$_SESSION['usuario_email']  = $email;
$_SESSION['usuario_rol']    = $rol;
$_SESSION['usuario_tel']    = $telefono;

jsonResponse([
    'ok' => true,
    'mensaje' => 'Cuenta creada correctamente',
    'usuario' => [
        'id' => $userId,
        'nombre' => $nombre,
        'email' => $email,
        'telefono' => $telefono,
        'rol' => $rol
    ]
]);

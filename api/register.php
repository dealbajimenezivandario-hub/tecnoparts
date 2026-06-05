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
$password = $data['password']      ?? '';

if ($nombre === '' || $email === '' || $password === '') {
    jsonResponse(['ok' => false, 'error' => 'Todos los campos son obligatorios'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['ok' => false, 'error' => 'Correo electronico invalido'], 400);
}
if (strlen($password) < 8) {
    jsonResponse(['ok' => false, 'error' => 'La contrasena debe tener al menos 8 caracteres'], 400);
}

$pdo = getDB();
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['ok' => false, 'error' => 'Este correo ya esta registrado'], 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)');
$stmt->execute([$nombre, $email, $hash]);
$userId = (int) $pdo->lastInsertId();

$_SESSION['usuario_id']     = $userId;
$_SESSION['usuario_nombre'] = $nombre;
$_SESSION['usuario_email']  = $email;

jsonResponse([
    'ok' => true,
    'mensaje' => 'Cuenta creada correctamente',
    'usuario' => ['id' => $userId, 'nombre' => $nombre, 'email' => $email]
]);

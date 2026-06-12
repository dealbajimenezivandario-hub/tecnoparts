<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();

$pdo = getDB();

// ===== AUTORIZACION =====
// Todas las operaciones del admin requieren sesion + rol = tecnico
$usuarioId = requireRol('tecnico');

// Listar SOLO los productos creados por este tecnico
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT id, modelo, nombre, marca, tipo, precio, stock, imagen, ubicacion, destacado
                           FROM productos
                           WHERE usuario_id = ?
                           ORDER BY fecha_creacion DESC');
    $stmt->execute([$usuarioId]);
    jsonResponse(['ok' => true, 'productos' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Metodo no permitido'], 405);
}

$action = $_GET['action'] ?? 'create';

if ($action === 'delete') {
    $id = (int) ($_POST['id'] ?? json_decode(file_get_contents('php://input'), true)['id'] ?? 0);
    if (!$id) jsonResponse(['ok' => false, 'error' => 'id requerido'], 400);

    // Solo puede borrar SUS propias tarjetas
    $stmt = $pdo->prepare('SELECT usuario_id FROM productos WHERE id = ?');
    $stmt->execute([$id]);
    $owner = $stmt->fetchColumn();
    if ($owner === false) jsonResponse(['ok' => false, 'error' => 'Producto no existe'], 404);
    if ((int) $owner !== $usuarioId) {
        jsonResponse(['ok' => false, 'error' => 'No puedes eliminar tarjetas que no creaste tu'], 403);
    }
    $stmt = $pdo->prepare('DELETE FROM productos WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$id, $usuarioId]);
    jsonResponse(['ok' => true, 'mensaje' => 'Producto eliminado']);
}

// Crear producto
$nombre      = trim($_POST['nombre']      ?? '');
$modelo      = trim($_POST['modelo']      ?? '');
$marca       = trim($_POST['marca']       ?? '');
$tipo        = trim($_POST['tipo']        ?? '');
$precio      = (int)  ($_POST['precio']   ?? 0);
$stock       = (int)  ($_POST['stock']    ?? 1);
$ubicacion   = trim($_POST['ubicacion']   ?? '');
$descripcion = trim($_POST['descripcion'] ?? '');

if ($nombre === '' || $modelo === '' || $marca === '' || $tipo === '' || $precio <= 0) {
    jsonResponse(['ok' => false, 'error' => 'Nombre, referencia, marca, tipo y precio son obligatorios'], 400);
}

$imagenPath = null;
if (!empty($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
    $allowed = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
    $tmp     = $_FILES['imagen']['tmp_name'];
    $size    = $_FILES['imagen']['size'];
    $origin  = $_FILES['imagen']['name'];
    $ext     = strtolower(pathinfo($origin, PATHINFO_EXTENSION));

    if ($size > 5 * 1024 * 1024)            jsonResponse(['ok' => false, 'error' => 'La imagen no debe superar 5MB'], 400);
    if (!isset($allowed[$ext]))             jsonResponse(['ok' => false, 'error' => 'Formato no permitido'], 400);
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $tmp); finfo_close($finfo);
    if (!in_array($mime, $allowed, true))   jsonResponse(['ok' => false, 'error' => 'El archivo no es una imagen valida'], 400);

    $dir = __DIR__ . '/../img';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $safe = preg_replace('/[^a-z0-9]+/i', '_', strtolower(pathinfo($origin, PATHINFO_FILENAME)));
    $filename = $safe . '_' . time() . '.' . $ext;
    $dest = $dir . '/' . $filename;
    if (!move_uploaded_file($tmp, $dest)) jsonResponse(['ok' => false, 'error' => 'No se pudo guardar la imagen'], 500);
    $imagenPath = 'img/' . $filename;
}

$destacado = isset($_POST['destacado']) ? (int) $_POST['destacado'] : 1;
$stmt = $pdo->prepare('INSERT INTO productos
    (modelo, nombre, marca, tipo, precio, stock, imagen, descripcion, ubicacion, destacado, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([$modelo, $nombre, $marca, $tipo, $precio, $stock, $imagenPath, $descripcion, $ubicacion, $destacado, $usuarioId]);

jsonResponse([
    'ok' => true,
    'mensaje' => 'Tarjeta agregada correctamente',
    'id' => (int) $pdo->lastInsertId(),
    'imagen' => $imagenPath
]);

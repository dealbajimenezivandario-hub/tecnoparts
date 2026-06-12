<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ===== Todo el carrito requiere sesion (no se permiten invitados) =====
$usuarioId = requireLogin();

if ($method === 'GET' || $action === 'list') {
    $sql = "SELECT c.id AS carrito_id, c.cantidad,
                   p.id, p.modelo, p.nombre, p.marca, p.tipo, p.precio, p.stock, p.imagen
            FROM carrito c
            JOIN productos p ON p.id = c.producto_id
            WHERE c.usuario_id = ?
            ORDER BY c.fecha DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuarioId]);
    $items = $stmt->fetchAll();

    $subtotal = 0;
    foreach ($items as $it) $subtotal += $it['precio'] * $it['cantidad'];
    $envio = $items ? 50000 : 0;

    jsonResponse([
        'ok' => true,
        'items' => $items,
        'subtotal' => $subtotal,
        'envio' => $envio,
        'total' => $subtotal + $envio,
        'cantidad_items' => array_sum(array_column($items, 'cantidad'))
    ]);
}

$data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

if ($action === 'add') {
    $productoId = (int) ($data['producto_id'] ?? 0);
    $cantidad   = max(1, (int) ($data['cantidad'] ?? 1));
    if (!$productoId) jsonResponse(['ok' => false, 'error' => 'producto_id requerido'], 400);

    $stmt = $pdo->prepare('SELECT id FROM productos WHERE id = ?');
    $stmt->execute([$productoId]);
    if (!$stmt->fetch()) jsonResponse(['ok' => false, 'error' => 'Producto no existe'], 404);

    $stmt = $pdo->prepare('SELECT id, cantidad FROM carrito WHERE producto_id = ? AND usuario_id = ?');
    $stmt->execute([$productoId, $usuarioId]);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmt = $pdo->prepare('UPDATE carrito SET cantidad = ? WHERE id = ?');
        $stmt->execute([$existing['cantidad'] + $cantidad, $existing['id']]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)');
        $stmt->execute([$usuarioId, $productoId, $cantidad]);
    }
    jsonResponse(['ok' => true, 'mensaje' => 'Producto agregado al carrito']);
}

if ($action === 'update') {
    $carritoId = (int) ($data['carrito_id'] ?? 0);
    $cantidad  = (int) ($data['cantidad'] ?? 0);
    if (!$carritoId) jsonResponse(['ok' => false, 'error' => 'carrito_id requerido'], 400);

    if ($cantidad <= 0) {
        $stmt = $pdo->prepare('DELETE FROM carrito WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$carritoId, $usuarioId]);
        jsonResponse(['ok' => true, 'mensaje' => 'Item eliminado']);
    }
    $stmt = $pdo->prepare('UPDATE carrito SET cantidad = ? WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$cantidad, $carritoId, $usuarioId]);
    jsonResponse(['ok' => true, 'mensaje' => 'Cantidad actualizada']);
}

if ($action === 'remove') {
    $carritoId = (int) ($data['carrito_id'] ?? 0);
    if (!$carritoId) jsonResponse(['ok' => false, 'error' => 'carrito_id requerido'], 400);
    $stmt = $pdo->prepare('DELETE FROM carrito WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$carritoId, $usuarioId]);
    jsonResponse(['ok' => true, 'mensaje' => 'Item eliminado']);
}

if ($action === 'clear') {
    $stmt = $pdo->prepare('DELETE FROM carrito WHERE usuario_id = ?');
    $stmt->execute([$usuarioId]);
    jsonResponse(['ok' => true, 'mensaje' => 'Carrito vaciado']);
}

jsonResponse(['ok' => false, 'error' => 'Accion invalida'], 400);

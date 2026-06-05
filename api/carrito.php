"<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$usuarioId = $_SESSION['usuario_id'] ?? null;
if (!$usuarioId && empty($_SESSION['guest_id'])) {
    $_SESSION['guest_id'] = bin2hex(random_bytes(16));
}
$sesionId = $_SESSION['guest_id'] ?? null;

function ownerWhere(&$params, $usuarioId, $sesionId) {
    if ($usuarioId) { $params[] = $usuarioId; return 'usuario_id = ?'; }
    $params[] = $sesionId; return 'sesion_id = ?';
}

if ($method === 'GET' || $action === 'list') {
    $params = [];
    $where  = ownerWhere($params, $usuarioId, $sesionId);
    $sql = \"SELECT c.id AS carrito_id, c.cantidad,
                   p.id, p.modelo, p.nombre, p.marca, p.tipo, p.precio, p.stock, p.imagen
            FROM carrito c
            JOIN productos p ON p.id = c.producto_id
            WHERE $where
            ORDER BY c.fecha DESC\";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
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

    $params = [$productoId];
    $where  = ownerWhere($params, $usuarioId, $sesionId);
    $stmt = $pdo->prepare(\"SELECT id, cantidad FROM carrito WHERE producto_id = ? AND $where\");
    $stmt->execute($params);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmt = $pdo->prepare('UPDATE carrito SET cantidad = ? WHERE id = ?');
        $stmt->execute([$existing['cantidad'] + $cantidad, $existing['id']]);
    } elseif ($usuarioId) {
        $stmt = $pdo->prepare('INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)');
        $stmt->execute([$usuarioId, $productoId, $cantidad]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO carrito (sesion_id, producto_id, cantidad) VALUES (?, ?, ?)');
        $stmt->execute([$sesionId, $productoId, $cantidad]);
    }
    jsonResponse(['ok' => true, 'mensaje' => 'Producto agregado al carrito']);
}

if ($action === 'update') {
    $carritoId = (int) ($data['carrito_id'] ?? 0);
    $cantidad  = (int) ($data['cantidad'] ?? 0);
    if (!$carritoId) jsonResponse(['ok' => false, 'error' => 'carrito_id requerido'], 400);

    if ($cantidad <= 0) {
        $stmt = $pdo->prepare('DELETE FROM carrito WHERE id = ?');
        $stmt->execute([$carritoId]);
        jsonResponse(['ok' => true, 'mensaje' => 'Item eliminado']);
    }
    $stmt = $pdo->prepare('UPDATE carrito SET cantidad = ? WHERE id = ?');
    $stmt->execute([$cantidad, $carritoId]);
    jsonResponse(['ok' => true, 'mensaje' => 'Cantidad actualizada']);
}

if ($action === 'remove') {
    $carritoId = (int) ($data['carrito_id'] ?? 0);
    if (!$carritoId) jsonResponse(['ok' => false, 'error' => 'carrito_id requerido'], 400);
    $stmt = $pdo->prepare('DELETE FROM carrito WHERE id = ?');
    $stmt->execute([$carritoId]);
    jsonResponse(['ok' => true, 'mensaje' => 'Item eliminado']);
}

if ($action === 'clear') {
    $params = [];
    $where  = ownerWhere($params, $usuarioId, $sesionId);
    $stmt = $pdo->prepare(\"DELETE FROM carrito WHERE $where\");
    $stmt->execute($params);
    jsonResponse(['ok' => true, 'mensaje' => 'Carrito vaciado']);
}

jsonResponse(['ok' => false, 'error' => 'Accion invalida'], 400);
"
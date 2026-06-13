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

    $stmt = $pdo->prepare('SELECT id, stock FROM productos WHERE id = ?');
    $stmt->execute([$productoId]);
    $producto = $stmt->fetch();
    if (!$producto) jsonResponse(['ok' => false, 'error' => 'Producto no existe'], 404);
    if ($producto['stock'] <= 0) jsonResponse(['ok' => false, 'error' => 'Producto sin stock disponible'], 409);

    $stmt = $pdo->prepare('SELECT id, cantidad FROM carrito WHERE producto_id = ? AND usuario_id = ?');
    $stmt->execute([$productoId, $usuarioId]);
    $existing = $stmt->fetch();
    $nuevoCantidad = $cantidad + ($existing['cantidad'] ?? 0);

    if ($nuevoCantidad > $producto['stock']) {
        jsonResponse([
            'ok' => false,
            'error' => "No hay suficiente stock. Solo quedan {$producto['stock']} unidades disponibles."
        ], 409);
    }

    if ($existing) {
        $stmt = $pdo->prepare('UPDATE carrito SET cantidad = ? WHERE id = ?');
        $stmt->execute([$nuevoCantidad, $existing['id']]);
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

    $stmt = $pdo->prepare('SELECT c.id, c.cantidad, p.stock FROM carrito c JOIN productos p ON p.id = c.producto_id WHERE c.id = ? AND c.usuario_id = ?');
    $stmt->execute([$carritoId, $usuarioId]);
    $item = $stmt->fetch();
    if (!$item) jsonResponse(['ok' => false, 'error' => 'Item de carrito no encontrado'], 404);

    if ($cantidad <= 0) {
        $stmt = $pdo->prepare('DELETE FROM carrito WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$carritoId, $usuarioId]);
        jsonResponse(['ok' => true, 'mensaje' => 'Item eliminado']);
    }

    if ($cantidad > $item['stock']) {
        jsonResponse([
            'ok' => false,
            'error' => "No hay suficiente stock. Solo quedan {$item['stock']} unidades disponibles."
        ], 409);
    }

    $stmt = $pdo->prepare('UPDATE carrito SET cantidad = ? WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$cantidad, $carritoId, $usuarioId]);
    jsonResponse(['ok' => true, 'mensaje' => 'Cantidad actualizada']);
}

if ($action === 'checkout') {
    $modalidad = trim($data['modalidad'] ?? 'segura');
    $metodo    = trim($data['metodo'] ?? '');

    $stmt = $pdo->prepare('SELECT c.id AS carrito_id, c.cantidad, p.id AS producto_id, p.stock, p.precio
                           FROM carrito c
                           JOIN productos p ON p.id = c.producto_id
                           WHERE c.usuario_id = ?');
    $stmt->execute([$usuarioId]);
    $items = $stmt->fetchAll();

    if (!$items) {
        jsonResponse(['ok' => false, 'error' => 'El carrito está vacío'], 400);
    }

    $errores = [];
    $subtotal = 0;
    foreach ($items as $item) {
        if ($item['cantidad'] > $item['stock']) {
            $errores[] = "El producto ID {$item['producto_id']} tiene solo {$item['stock']} unidades disponibles.";
        }
        $subtotal += $item['cantidad'] * $item['precio'];
    }

    if ($errores) {
        jsonResponse(['ok' => false, 'error' => implode(' ', $errores)], 409);
    }

    $envio = $items ? 50000 : 0;
    $total = $subtotal + $envio;

    try {
        $pdo->beginTransaction();

        $stmtUpdate = $pdo->prepare('UPDATE productos SET stock = ? WHERE id = ?');
        foreach ($items as $item) {
            $nuevoStock = $item['stock'] - $item['cantidad'];
            if ($nuevoStock < 0) {
                throw new Exception('Stock insuficiente al procesar el pedido.');
            }
            $stmtUpdate->execute([$nuevoStock, $item['producto_id']]);
        }

        $stmtPedido = $pdo->prepare('INSERT INTO pedidos (usuario_id, subtotal, envio, total, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?)');
        $estado = $modalidad === 'prestamo' ? 'prestamo' : 'pagado';
        $stmtPedido->execute([$usuarioId, $subtotal, $envio, $total, $metodo ?: 'pendiente', $estado]);
        $pedidoId = (int) $pdo->lastInsertId();

        $stmtItem = $pdo->prepare('INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)');
        foreach ($items as $item) {
            $stmtItem->execute([$pedidoId, $item['producto_id'], $item['cantidad'], $item['precio']]);
        }

        $stmt = $pdo->prepare('DELETE FROM carrito WHERE usuario_id = ?');
        $stmt->execute([$usuarioId]);

        $pdo->commit();
        jsonResponse(['ok' => true, 'mensaje' => 'Compra confirmada', 'pedido_id' => $pedidoId, 'total' => $total]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['ok' => false, 'error' => 'No se pudo procesar el pedido: ' . $e->getMessage()], 500);
    }
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

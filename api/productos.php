"<?php
require_once __DIR__ . '/../config/db.php';
allowCors();

$pdo = getDB();
$marcas = isset($_GET['marcas']) && $_GET['marcas'] !== '' ? explode(',', $_GET['marcas']) : [];
$tipos  = isset($_GET['tipos'])  && $_GET['tipos']  !== '' ? explode(',', $_GET['tipos'])  : [];
$destacado = isset($_GET['destacado']) ? (int) $_GET['destacado'] : null;
$id        = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($id) {
    $stmt = $pdo->prepare('SELECT * FROM productos WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonResponse(['ok' => false, 'error' => 'Producto no encontrado'], 404);
    jsonResponse(['ok' => true, 'producto' => $row]);
}

$sql = 'SELECT * FROM productos WHERE 1=1';
$params = [];

if ($marcas) {
    $place = implode(',', array_fill(0, count($marcas), '?'));
    $sql  .= \" AND marca IN ($place)\";
    $params = array_merge($params, $marcas);
}
if ($tipos) {
    $place = implode(',', array_fill(0, count($tipos), '?'));
    $sql  .= \" AND tipo IN ($place)\";
    $params = array_merge($params, $tipos);
}
if ($destacado !== null) { $sql .= ' AND destacado = ?'; $params[] = $destacado; }

$sql .= ' ORDER BY destacado DESC, fecha_creacion DESC';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

jsonResponse(['ok' => true, 'total' => count($rows), 'productos' => $rows]);
"
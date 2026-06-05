"<?php
require_once __DIR__ . '/../config/db.php';
allowCors();

$q = trim($_GET['q'] ?? '');
if ($q === '') {
    jsonResponse(['ok' => true, 'q' => '', 'total' => 0, 'productos' => []]);
}

$pdo  = getDB();
$like = '%' . $q . '%';

$stmt = $pdo->prepare(
    'SELECT * FROM productos
     WHERE modelo LIKE :like1 OR nombre LIKE :like2 OR marca LIKE :like3 OR tipo LIKE :like4
     ORDER BY (modelo = :exact) DESC, destacado DESC, fecha_creacion DESC'
);
$stmt->execute([
    ':like1' => $like, ':like2' => $like, ':like3' => $like, ':like4' => $like,
    ':exact' => $q
]);
$rows = $stmt->fetchAll();

jsonResponse(['ok' => true, 'q' => $q, 'total' => count($rows), 'productos' => $rows]);
"
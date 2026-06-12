<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'ok' => false,
        'error' => 'Excepcion: ' . $e->getMessage()
    ]);

    exit;
});

require_once __DIR__ . '/../config/db.php';
allowCors();

try {
    $q = trim($_GET['q'] ?? '');

    $cols = "p.id, p.modelo, p.nombre, p.marca, p.tipo, p.precio, p.stock, p.imagen,
             p.descripcion, p.ubicacion, p.destacado, p.usuario_id, p.fecha_creacion,
             COALESCE(u.nombre, 'TecnoParts') AS creador_nombre,
             u.rol AS creador_rol";

    if ($q === '') {
        jsonResponse([
            'ok' => true,
            'q' => '',
            'total' => 0,
            'productos' => []
        ]);
    }

    $pdo = getDB();
    $like = '%' . $q . '%';

    $stmt = $pdo->prepare(
        "SELECT $cols FROM productos p
         LEFT JOIN usuarios u ON u.id = p.usuario_id
         WHERE p.modelo LIKE :like1 OR p.nombre LIKE :like2 OR p.marca LIKE :like3 OR p.tipo LIKE :like4
         ORDER BY (p.modelo = :exact) DESC, p.destacado DESC, p.fecha_creacion DESC"

    );

    $stmt->execute([
        ':like1' => $like,
        ':like2' => $like,
        ':like3' => $like,
        ':like4' => $like,
        ':exact' => $q
    ]);

    $rows = $stmt->fetchAll();

    jsonResponse([
        'ok' => true,
        'q' => $q,
        'total' => count($rows),
        'productos' => $rows
    ]);

} catch (Throwable $e) {
    jsonResponse([
        'ok' => false,
        'error' => 'Error en busqueda: ' . $e->getMessage()
    ], 500);
}
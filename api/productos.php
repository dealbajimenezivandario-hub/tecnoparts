<?php
// Forzar errores como JSON (no como HTML) para evitar romper el .json() del frontend
ini_set('display_errors', '0');
error_reporting(E_ALL);

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;

    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'ok' => false,
        'error' => "PHP $severity: $message en $file:$line"
    ]);

    exit;
});

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
    $pdo = getDB();

    $marcas    = isset($_GET['marcas']) && $_GET['marcas'] !== ''
        ? explode(',', $_GET['marcas'])
        : [];

    $tipos     = isset($_GET['tipos']) && $_GET['tipos'] !== ''
        ? explode(',', $_GET['tipos'])
        : [];

    $destacado = isset($_GET['destacado'])
        ? (int) $_GET['destacado']
        : null;

    $id = isset($_GET['id'])
        ? (int) $_GET['id']
        : null;

    // Columnas explícitas (evita problemas con columnas nuevas/legacy)
    $cols = "p.id, p.modelo, p.nombre, p.marca, p.tipo, p.precio, p.stock, p.imagen,
             p.descripcion, p.ubicacion, p.destacado, p.usuario_id, p.fecha_creacion,
             COALESCE(u.nombre, 'TecnoParts') AS creador_nombre,
             u.rol AS creador_rol";
             
    if ($id) {
        $stmt = $pdo->prepare("SELECT $cols FROM productos p
                               LEFT JOIN usuarios u ON u.id = p.usuario_id
                               WHERE p.id = ?");        $stmt->execute([$id]);

        $row = $stmt->fetch();

        if (!$row) {
            jsonResponse([
                'ok' => false,
                'error' => 'Producto no encontrado'
            ], 404);
        }

        jsonResponse([
            'ok' => true,
            'producto' => $row
        ]);
    }

        $sql = "SELECT $cols FROM productos p
            LEFT JOIN usuarios u ON u.id = p.usuario_id
            WHERE 1=1";
    $params = [];

    if ($marcas) {
        $place = implode(',', array_fill(0, count($marcas), '?'));
        $sql  .= " AND p.marca IN ($place)";
        $params = array_merge($params, $marcas);
    }

    if ($tipos) {
        $place = implode(',', array_fill(0, count($tipos), '?'));
        $sql  .= " AND p.tipo IN ($place)";
        $params = array_merge($params, $tipos);
    }

    if ($destacado !== null) { $sql .= ' AND p.destacado = ?'; $params[] = $destacado; }


    $sql .= ' ORDER BY p.destacado DESC, p.fecha_creacion DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $rows = $stmt->fetchAll();

    jsonResponse([
        'ok' => true,
        'total' => count($rows),
        'productos' => $rows
    ]);

} catch (Throwable $e) {
    jsonResponse([
        'ok' => false,
        'error' => 'Error al consultar productos: ' . $e->getMessage(),
        'sugerencia' => 'Abre api/diagnostico.php para revisar el estado de la base de datos.'
    ], 500);
}
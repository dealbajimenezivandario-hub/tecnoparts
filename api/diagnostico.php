<?php
// ============================================================
// Diagnostico TecnoParts
// Abre: http://localhost/tecnoparts/api/diagnostico.php
// Te dice exactamente que esta fallando.
// ============================================================
header('Content-Type: application/json; charset=utf-8');

$report = [
    'php_version' => PHP_VERSION,
    'pdo_mysql'   => extension_loaded('pdo_mysql'),
    'fecha'       => date('Y-m-d H:i:s'),
];

try {
    require_once __DIR__ . '/../config/db.php';
    $pdo = getDB();
    $report['db_conexion'] = 'OK';
    $report['db_nombre']   = DB_NAME;

    foreach (['usuarios', 'productos', 'carrito', 'pedidos', 'pedido_items'] as $t) {
        try {
            $c = (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
            $report['tabla_' . $t] = ['existe' => true, 'filas' => $c];
        } catch (PDOException $e) {
            $report['tabla_' . $t] = ['existe' => false, 'error' => $e->getMessage()];
        }
    }

    try {
        $cols = $pdo->query('SHOW COLUMNS FROM productos')->fetchAll(PDO::FETCH_COLUMN);
        $report['columnas_productos'] = $cols;
    } catch (PDOException $e) {
        $report['columnas_productos'] = 'Error: ' . $e->getMessage();
    }

    try {
        $sample = $pdo->query('SELECT id, modelo, nombre, marca, precio, destacado FROM productos LIMIT 3')->fetchAll();
        $report['muestra_productos'] = $sample;
    } catch (PDOException $e) {
        $report['muestra_productos'] = 'Error: ' . $e->getMessage();
    }

    $report['resultado'] = 'BD funcionando. Si las tarjetas no se ven, revisa la consola del navegador (F12).';
} catch (Throwable $e) {
    $report['db_conexion'] = 'FALLA';
    $report['error'] = $e->getMessage();
    $report['resultado'] = 'No se pudo conectar a MySQL. Abre el Panel de XAMPP y haz Start en MySQL.';
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
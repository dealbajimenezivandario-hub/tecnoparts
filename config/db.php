<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'tecnoparts_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            ensureSchema($pdo);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Error de conexion: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

function ensureSchema(PDO $pdo) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM productos LIKE 'ubicacion'");
        if ($stmt->rowCount() === 0) {
            $pdo->exec("ALTER TABLE productos ADD COLUMN ubicacion VARCHAR(150) DEFAULT NULL AFTER descripcion");
        }
    } catch (PDOException $e) {
        // Si la tabla productos aun no existe, no migramos (importacion pendiente).
    }
}    

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function startSession() {
    if (session_status() === PHP_SESSION_NONE) session_start();
}

function allowCors() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

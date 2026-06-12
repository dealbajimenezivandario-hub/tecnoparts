<?php
// ============================================================
// TecnoParts - Conexion a Base de Datos + Auto-Bootstrap
// ============================================================
ini_set('display_errors', '0');
error_reporting(E_ALL);

define('DB_HOST', 'localhost');
define('DB_NAME', 'tecnoparts_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function getDB() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $dsnServer = 'mysql:host=' . DB_HOST . ';charset=' . DB_CHARSET;
        $server = new PDO($dsnServer, DB_USER, DB_PASS, $options);
        $server->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "`
                       DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        ensureSchema($pdo);
        seedProductosSiVacio($pdo);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => 'Error de conexion: ' . $e->getMessage(),
            'sugerencia' => 'Verifica que MySQL este corriendo en XAMPP.'
        ]);
        exit;
    }
    return $pdo;
}

function ensureSchema(PDO $pdo) {
    // usuarios (con telefono y rol)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `usuarios` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `nombre` VARCHAR(150) NOT NULL,
        `email` VARCHAR(150) NOT NULL UNIQUE,
        `telefono` VARCHAR(30) DEFAULT NULL,
        `rol` VARCHAR(20) NOT NULL DEFAULT 'comprador',
        `password` VARCHAR(255) NOT NULL,
        `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // productos (con usuario_id)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `productos` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `modelo` VARCHAR(100) NOT NULL,
        `nombre` VARCHAR(200) NOT NULL,
        `marca` VARCHAR(50) NOT NULL,
        `tipo` VARCHAR(50) NOT NULL,
        `precio` INT(11) NOT NULL,
        `stock` INT(11) NOT NULL DEFAULT 0,
        `imagen` VARCHAR(255) DEFAULT NULL,
        `descripcion` TEXT,
        `ubicacion` VARCHAR(150) DEFAULT NULL,
        `destacado` TINYINT(1) DEFAULT 0,
        `usuario_id` INT(11) DEFAULT NULL,
        `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_modelo` (`modelo`),
        KEY `idx_marca` (`marca`),
        KEY `idx_tipo` (`tipo`),
        KEY `idx_usuario` (`usuario_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS `carrito` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `usuario_id` INT(11) DEFAULT NULL,
        `sesion_id` VARCHAR(100) DEFAULT NULL,
        `producto_id` INT(11) NOT NULL,
        `cantidad` INT(11) NOT NULL DEFAULT 1,
        `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_usuario` (`usuario_id`),
        KEY `idx_sesion` (`sesion_id`),
        KEY `idx_producto` (`producto_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS `pedidos` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `usuario_id` INT(11) NOT NULL,
        `subtotal` INT(11) NOT NULL,
        `envio` INT(11) NOT NULL DEFAULT 50000,
        `total` INT(11) NOT NULL,
        `metodo_pago` VARCHAR(30) DEFAULT 'pendiente',
        `estado` VARCHAR(30) NOT NULL DEFAULT 'pendiente',
        `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_usuario` (`usuario_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS `pedido_items` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `pedido_id` INT(11) NOT NULL,
        `producto_id` INT(11) NOT NULL,
        `cantidad` INT(11) NOT NULL,
        `precio` INT(11) NOT NULL,
        PRIMARY KEY (`id`),
        KEY `idx_pedido` (`pedido_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Auto-migracion para BDs que existian antes
    $migrations = [
        "ALTER TABLE productos ADD COLUMN ubicacion VARCHAR(150) DEFAULT NULL AFTER descripcion" => "SHOW COLUMNS FROM productos LIKE 'ubicacion'",
        "ALTER TABLE productos ADD COLUMN destacado TINYINT(1) DEFAULT 0"                         => "SHOW COLUMNS FROM productos LIKE 'destacado'",
        "ALTER TABLE productos ADD COLUMN usuario_id INT(11) DEFAULT NULL"                        => "SHOW COLUMNS FROM productos LIKE 'usuario_id'",
        "ALTER TABLE usuarios  ADD COLUMN telefono VARCHAR(30) DEFAULT NULL"                      => "SHOW COLUMNS FROM usuarios LIKE 'telefono'",
        "ALTER TABLE usuarios  ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'comprador'"           => "SHOW COLUMNS FROM usuarios LIKE 'rol'",
    ];
    foreach ($migrations as $alter => $check) {
        try {
            $stmt = $pdo->query($check);
            if ($stmt && $stmt->rowCount() === 0) $pdo->exec($alter);
        } catch (PDOException $e) { /* no-op */ }
    }
}

function seedProductosSiVacio(PDO $pdo) {
    try {
        $count = (int) $pdo->query('SELECT COUNT(*) FROM productos')->fetchColumn();
        if ($count > 0) return;

        $datos = [
            ['UN55RU7100KXZL', 'Main Board Samsung UN55RU7100', 'Samsung', 'Main Board', 180000, 5, 'img/main_samsung_un55ru7100.jpg', 'Tarjeta principal compatible con TV Samsung UN55RU7100. Probada y garantizada.', 'Bodega A - Estante 1', 1],
            ['43UM7300PDA',   'Power Supply LG 43UM7300',     'LG',      'Fuente de Poder', 150000, 2, 'img/power_lg_43um7300.jpg', 'Fuente de poder original para TV LG 43UM7300. Funcionamiento 100%.', 'Bodega A - Estante 2', 1],
            ['XBR-65X900F',   'T-Con Board Sony XBR-65X900F', 'Sony',    'T-Con', 120000, 4, 'img/tcon_sony_xbr65x900f.jpg', 'Tarjeta T-Con para TV Sony XBR-65X900F. Testeada antes del envio.', 'Bodega B - Estante 1', 1],
            ['55UK6550PUB',   'Main Board LG 55UK6550',       'LG',      'Main Board', 175000, 3, 'img/main_lg_55uk6550.jpg', 'Main Board para LG 55UK6550. Lista para instalar.', 'Bodega A - Estante 1', 1],
            ['UN43J5200BAK',  'Power Supply Samsung UN43J5200','Samsung','Fuente de Poder', 110000, 8, 'img/power_samsung_un43j5200.jpg', 'Fuente original Samsung UN43J5200. Garantia 30 dias.', 'Bodega A - Estante 2', 1],
            ['QN65Q70RAFXZA', 'T-Con Board Samsung QN65Q70R', 'Samsung', 'T-Con', 140000, 2, 'img/tcon_samsung_qn65q70r.jpg', 'Tarjeta T-Con Samsung QN65Q70R QLED. Pieza testeada.', 'Bodega B - Estante 1', 1],
        ];
        $stmt = $pdo->prepare('INSERT INTO productos
            (modelo, nombre, marca, tipo, precio, stock, imagen, descripcion, ubicacion, destacado, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)');
        foreach ($datos as $r) $stmt->execute($r);
    } catch (PDOException $e) { /* no-op */ }
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

// Helpers de autenticacion (usados por endpoints protegidos)
function requireLogin() {
    startSession();
    if (empty($_SESSION['usuario_id'])) {
        jsonResponse(['ok' => false, 'error' => 'No autenticado', 'login_required' => true], 401);
    }
    return (int) $_SESSION['usuario_id'];
}

function requireRol($rolEsperado) {
    $uid = requireLogin();
    $rol = $_SESSION['usuario_rol'] ?? 'comprador';
    if ($rol !== $rolEsperado) {
        jsonResponse(['ok' => false, 'error' => "Acceso denegado. Esta accion requiere rol: $rolEsperado"], 403);
    }
    return $uid;
}

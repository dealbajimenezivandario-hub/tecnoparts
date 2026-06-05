"<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();
$_SESSION = [];
session_destroy();
jsonResponse(['ok' => true, 'mensaje' => 'Sesion cerrada']);
"
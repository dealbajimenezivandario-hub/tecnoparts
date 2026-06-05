<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();

if (!empty($_SESSION['usuario_id'])) {
    jsonResponse([
        'ok' => true,
        'autenticado' => true,
        'usuario' => [
            'id'     => (int) $_SESSION['usuario_id'],
            'nombre' => $_SESSION['usuario_nombre'] ?? '',
            'email'  => $_SESSION['usuario_email']  ?? ''
        ]
    ]);
}
jsonResponse(['ok' => true, 'autenticado' => false]);

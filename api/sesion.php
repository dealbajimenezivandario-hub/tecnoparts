<?php
require_once __DIR__ . '/../config/db.php';
allowCors();
startSession();

if (!empty($_SESSION['usuario_id'])) {
    if (empty($_SESSION['usuario_avatar'])) {
        $pdo = getDB();
        $stmt = $pdo->prepare('SELECT profile_image FROM usuarios WHERE id = ?');
        $stmt->execute([(int) $_SESSION['usuario_id']]);
        $row = $stmt->fetch();
        if ($row && !empty($row['profile_image'])) {
            $_SESSION['usuario_avatar'] = $row['profile_image'];
        }
    }

    jsonResponse([
        'ok' => true,
        'autenticado' => true,
        'usuario' => [
            'id'       => (int) $_SESSION['usuario_id'],
            'nombre'   => $_SESSION['usuario_nombre'] ?? '',
            'email'    => $_SESSION['usuario_email']  ?? '',
            'telefono' => $_SESSION['usuario_tel']    ?? '',
            'rol'      => $_SESSION['usuario_rol']    ?? 'comprador',
            'avatar'   => $_SESSION['usuario_avatar'] ?? null
        ]
    ]);
}
jsonResponse(['ok' => true, 'autenticado' => false]);

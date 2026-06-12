-- =====================================================
-- TecnoParts - Esquema de base de datos (XAMPP / phpMyAdmin)
-- =====================================================
-- Nota: A partir de la version 2026.02 NO es necesario ejecutar
-- este SQL manualmente. config/db.php hace auto-bootstrap.
-- Este archivo queda como referencia y respaldo.

CREATE DATABASE IF NOT EXISTS `tecnoparts_db`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tecnoparts_db`;

-- USUARIOS (con telefono y rol)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `rol` VARCHAR(20) NOT NULL DEFAULT 'comprador',
  `password` VARCHAR(255) NOT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PRODUCTOS (con dueño técnico)
CREATE TABLE IF NOT EXISTS `productos` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CARRITO
CREATE TABLE IF NOT EXISTS `carrito` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PEDIDOS
CREATE TABLE IF NOT EXISTS `pedidos` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pedido_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` INT(11) NOT NULL,
  `producto_id` INT(11) NOT NULL,
  `cantidad` INT(11) NOT NULL,
  `precio` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pedido` (`pedido_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migraciones para BDs existentes (compatibilidad)
ALTER TABLE `usuarios`  ADD COLUMN IF NOT EXISTS `telefono` VARCHAR(30) DEFAULT NULL;
ALTER TABLE `usuarios`  ADD COLUMN IF NOT EXISTS `rol` VARCHAR(20) NOT NULL DEFAULT 'comprador';
ALTER TABLE `productos` ADD COLUMN IF NOT EXISTS `ubicacion` VARCHAR(150) DEFAULT NULL AFTER `descripcion`;
ALTER TABLE `productos` ADD COLUMN IF NOT EXISTS `destacado` TINYINT(1) DEFAULT 0;
ALTER TABLE `productos` ADD COLUMN IF NOT EXISTS `usuario_id` INT(11) DEFAULT NULL;
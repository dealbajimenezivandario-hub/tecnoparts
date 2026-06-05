CREATE DATABASE IF NOT EXISTS `tecnoparts_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `tecnoparts_db`;

DROP TABLE IF EXISTS `pedido_items`;
DROP TABLE IF EXISTS `pedidos`;
DROP TABLE IF EXISTS `carrito`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `productos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `modelo` VARCHAR(100) NOT NULL,
  `nombre` VARCHAR(200) NOT NULL,
  `marca` VARCHAR(50) NOT NULL,
  `tipo` VARCHAR(50) NOT NULL,
  `precio` INT(11) NOT NULL,
  `stock` INT(11) NOT NULL DEFAULT 0,
  `imagen` VARCHAR(255) DEFAULT NULL,
  `descripcion` TEXT,
  `destacado` TINYINT(1) DEFAULT 0,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_modelo` (`modelo`),
  KEY `idx_marca` (`marca`),
  KEY `idx_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `carrito` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) DEFAULT NULL,
  `sesion_id` VARCHAR(100) DEFAULT NULL,
  `producto_id` INT(11) NOT NULL,
  `cantidad` INT(11) NOT NULL DEFAULT 1,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_sesion` (`sesion_id`),
  KEY `idx_producto` (`producto_id`),
  CONSTRAINT `fk_carrito_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_carrito_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pedidos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `subtotal` INT(11) NOT NULL,
  `envio` INT(11) NOT NULL DEFAULT 10000,
  `total` INT(11) NOT NULL,
  `metodo_pago` VARCHAR(30) DEFAULT 'pendiente',
  `estado` VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario_id`),
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pedido_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` INT(11) NOT NULL,
  `producto_id` INT(11) NOT NULL,
  `cantidad` INT(11) NOT NULL,
  `precio` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pedido` (`pedido_id`),
  CONSTRAINT `fk_items_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario demo (password: demo1234)
INSERT INTO `usuarios` (`nombre`, `email`, `password`) VALUES
('Tecnico Demo', 'demo@tecnoparts.com', '$2b$10$QIi70gw6UsanuLqHBzPtqe.pSnbqD8vgYg2d4uoR3PIQpyrb.kLMy');

INSERT INTO `productos` (`modelo`, `nombre`, `marca`, `tipo`, `precio`, `stock`, `imagen`, `descripcion`, `destacado`) VALUES
('UN55RU7100KXZL', 'Main Board Samsung UN55RU7100', 'Samsung', 'Main Board', 180000, 5, 'img/main_samsung_un55ru7100.jpg', 'Tarjeta principal compatible con TV Samsung UN55RU7100. Probada y garantizada.', 1),
('43UM7300PDA', 'Power Supply LG 43UM7300', 'LG', 'Fuente de Poder', 150000, 2, 'img/power_lg_43um7300.jpg', 'Fuente de poder original para TV LG 43UM7300. Funcionamiento 100%.', 1),
('XBR-65X900F', 'T-Con Board Sony XBR-65X900F', 'Sony', 'T-Con', 120000, 4, 'img/tcon_sony_xbr65x900f.jpg', 'Tarjeta T-Con para TV Sony XBR-65X900F. Testeada antes del envio.', 1),
('55UK6550PUB', 'Main Board LG 55UK6550', 'LG', 'Main Board', 175000, 3, 'img/main_lg_55uk6550.jpg', 'Main Board para LG 55UK6550. Lista para instalar.', 1),
('UN43J5200BAK', 'Power Supply Samsung UN43J5200', 'Samsung', 'Fuente de Poder', 110000, 8, 'img/power_samsung_un43j5200.jpg', 'Fuente original Samsung UN43J5200. Garantia 30 dias.', 0),
('QN65Q70RAFXZA', 'T-Con Board Samsung QN65Q70R', 'Samsung', 'T-Con', 140000, 2, 'img/tcon_samsung_qn65q70r.jpg', 'Tarjeta T-Con Samsung QN65Q70R QLED. Pieza testeada.', 0);
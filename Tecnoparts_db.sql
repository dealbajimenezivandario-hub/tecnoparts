-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-06-2026 a las 23:36:10
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tecnoparts_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carrito`
--

CREATE TABLE `carrito` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `sesion_id` varchar(100) DEFAULT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `fecha` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `carrito`
--

INSERT INTO `carrito` (`id`, `usuario_id`, `sesion_id`, `producto_id`, `cantidad`, `fecha`) VALUES
(3, 2, NULL, 7, 1, '2026-06-07 21:31:05'),
(6, 2, NULL, 1, 2, '2026-06-08 11:05:17'),
(7, 2, NULL, 2, 1, '2026-06-08 11:05:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `subtotal` int(11) NOT NULL,
  `envio` int(11) NOT NULL DEFAULT 10000,
  `total` int(11) NOT NULL,
  `metodo_pago` varchar(30) DEFAULT 'pendiente',
  `estado` varchar(30) NOT NULL DEFAULT 'pendiente',
  `fecha` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_items`
--

CREATE TABLE `pedido_items` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `modelo` varchar(100) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `precio` int(11) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `imagen` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `ubicacion` varchar(150) DEFAULT NULL,
  `destacado` tinyint(1) DEFAULT 0,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `modelo`, `nombre`, `marca`, `tipo`, `precio`, `stock`, `imagen`, `descripcion`, `ubicacion`, `destacado`, `fecha_creacion`, `usuario_id`) VALUES
(1, 'UN55RU7100KXZL', 'Main Board Samsung UN55RU7100', 'Samsung', 'Main Board', 180000, 5, 'img/main_samsung_un55ru7100.jpg', 'Tarjeta principal compatible con TV Samsung UN55RU7100. Probada y garantizada.', NULL, 1, '2026-05-07 11:25:39', NULL),
(2, '43UM7300PDA', 'Power Supply LG 43UM7300', 'LG', 'Fuente de Poder', 150000, 2, 'img/power_lg_43um7300.jpg', 'Fuente de poder original para TV LG 43UM7300. Funcionamiento 100%.', NULL, 1, '2026-05-07 11:25:39', NULL),
(3, 'XBR-65X900F', 'T-Con Board Sony XBR-65X900F', 'Sony', 'T-Con', 120000, 4, 'img/tcon_sony_xbr65x900f.jpg', 'Tarjeta T-Con para TV Sony XBR-65X900F. Testeada antes del envio.', NULL, 1, '2026-05-07 11:25:39', NULL),
(4, '55UK6550PUB', 'Main Board LG 55UK6550', 'LG', 'Main Board', 175000, 3, 'img/main_lg_55uk6550.jpg', 'Main Board para LG 55UK6550. Lista para instalar.', NULL, 1, '2026-05-07 11:25:39', NULL),
(5, 'UN43J5200BAK', 'Power Supply Samsung UN43J5200', 'Samsung', 'Fuente de Poder', 110000, 8, 'img/power_samsung_un43j5200.jpg', 'Fuente original Samsung UN43J5200. Garantia 30 dias.', NULL, 0, '2026-05-07 11:25:39', NULL),
(7, 'UN55UJKZL', 'Main Samsung', 'Samsung', 'Main Board', 250000, 1, 'img/main_samsung_1780890520.jpg', '', 'La esperanza', 0, '2026-06-07 20:48:40', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp(),
  `telefono` varchar(30) DEFAULT NULL,
  `rol` varchar(20) NOT NULL DEFAULT 'comprador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `fecha_registro`, `telefono`, `rol`) VALUES
(1, 'Tecnico Demo', 'demo@tecnoparts.com', '$2b$10$QIi70gw6UsanuLqHBzPtqe.pSnbqD8vgYg2d4uoR3PIQpyrb.kLMy', '2026-05-07 11:25:39', NULL, 'comprador'),
(2, 'Ivan Dario De Alba Jimenez', 'dealbajimenezivandario@gmail.com', '$2y$10$JIfjBevPxZb18KaLANRmVu8ezQHdPeygBmsQArnUXjGAmpYa4DsNu', '2026-06-02 17:24:32', NULL, 'comprador'),
(3, 'Tecnologias y Servicios Ivan', 'tsismpruebas@gmail.com', '$2y$10$VJNm2spHSNooomfk2AERMePc1vWOa841CjF1AsTxn9GFXjJSIfXm2', '2026-06-09 15:51:42', '3005934778', 'tecnico');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `carrito`
--
ALTER TABLE `carrito`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_sesion` (`sesion_id`),
  ADD KEY `idx_producto` (`producto_id`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario_id`);

--
-- Indices de la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pedido` (`pedido_id`),
  ADD KEY `fk_items_producto` (`producto_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_modelo` (`modelo`),
  ADD KEY `idx_marca` (`marca`),
  ADD KEY `idx_tipo` (`tipo`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `carrito`
--
ALTER TABLE `carrito`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `carrito`
--
ALTER TABLE `carrito`
  ADD CONSTRAINT `fk_carrito_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_carrito_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  ADD CONSTRAINT `fk_items_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_items_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

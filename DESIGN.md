# Sistema de diseño de PLAYLOG!

## Alcance y fuentes

Este documento registra la identidad existente, sin modificar el frontend. Se basa en `frontend/src/index.css`, `frontend/src/responsive.css`, los CSS de `frontend/src/paginas/` y sus componentes React, integrados desde P3 en `4825f30`.

`main.tsx` carga el CSS global y responsive; las páginas importan sus estilos. Existen valores directos y variables locales además de los tokens globales. Esta descripción no significa que todo el CSS esté normalizado ni que se haya probado visualmente en cada pantalla.

## Colores

| Uso actual | Variable global | Valor |
| --- | --- | --- |
| Morado principal | `--purple` | `#6517ed` |
| Morado oscuro | `--purple-dark` | `#3b096e` |
| Amarillo de marca y llamadas a la acción | `--yellow` | `#ffe500` |
| Rosa | `--pink` | `#ff79c6` |
| Naranja y foco | `--orange` | `#ff641b` |
| Tinta, texto y bordes | `--ink` | `#21142d` |
| Fondo cálido | `--paper` | `#fff9ec` |
| Blanco | `--white` | `#ffffff` |

Los alias de las páginas, como `--detalle-morado`, `--fj-purple`, `--hp-purple` y `--np-morado`, conservan esos colores. Los estilos existentes de error y de logro alcanzado tienen colores adicionales; se reutilizará su patrón correspondiente, sin declarar una paleta nueva.

Las futuras reglas de E2 usarán variables documentadas. Añadir o normalizar tokens CSS corresponde a una modificación de frontend autorizada y especificada, no a esta fase.

## Tipografía

- DM Sans para texto, navegación y controles; respaldo `sans-serif`.
- Barlow Condensed para títulos, marca y cifras destacadas; respaldos `Impact, sans-serif`.
- Los encabezados principales usan peso 900 y composición marcada, con mayúsculas en los usos existentes.
- `h1` global: `clamp(3rem, 7vw, 6rem)`; `h2`: `clamp(2rem, 4vw, 3.5rem)`.
- Los párrafos globales tienen interlineado 1.55. Las páginas pueden ajustar tamaños de sus componentes.
- Se mantienen las fuentes ya referenciadas por Google Fonts; no se incorpora otro proveedor ni tipografía.

## Espaciado, bordes y distribución

El proyecto no declara una escala única de espaciado. Son frecuentes separaciones de 8, 10, 12, 15, 18, 20, 24 y 30 px; se seguirá el patrón del componente vecino, sin convertir esos valores en una escala obligatoria.

- El contenedor de navegación global usa `min(1200px, calc(100% - 40px))`.
- Se utilizan bordes oscuros de 2 px; `--border` ya representa ese patrón.
- Botones y campos suelen usar radios de 12 px; tarjetas, 20 px; etiquetas redondeadas, hasta 100 px.
- Las sombras son sólidas y desplazadas, normalmente entre 4 y 8 px, sin desenfoque.
- Los encabezados visuales combinan fondo de marca, borde, sombra y arte existente.
- La biblioteca usa tarjetas; detalle y formularios distribuyen contenido en columnas que se reorganizan en pantallas pequeñas.

No se impondrá una nueva cuadrícula ni se unificarán todos los breakpoints. `responsive.css` contiene reglas globales a 1000, 700 y 390 px; hay umbrales adicionales por página que deben conservarse al revisar la cascada.

## Componentes y estados

Son patrones visuales existentes, no una biblioteca nueva de componentes React.

| Patrón | Referencias existentes | Regla para continuar |
| --- | --- | --- |
| Navegación y marca | `site-header`, `main-nav`, `brand` y menú móvil en `App.tsx` | Mantener PLAYLOG!, enlaces activos y comportamiento del menú. |
| Botones | `playlog-button`, `detalle-boton`, `historial-boton` | Reutilizar jerarquía, borde y sombra; distinguir acciones principales y secundarias. |
| Tarjetas | `game-card`, `stat-card`, `historial-tarjeta` | Conservar geometría y jerarquía de título, datos y acción. |
| Filtros | `filtro-chip` y controles equivalentes de cada página | Mostrar selección y conservar `aria-pressed` donde existe. |
| Formularios | `FormularioVideojuego` y `NuevaPartida` | Mantener etiquetas, ayudas, límites, carga y bloqueo de doble envío existentes. |
| Progreso | Barras del detalle, biblioteca e historial | Mostrar el dato real; no convertir una carga fallida en progreso cero. |
| Carga, error y vacío | Mensajes con `role="status"` o `role="alert"` e imágenes existentes | Separar estados; ofrecer acciones coherentes con lo disponible. |
| Portadas y logros | `frontend/public/images/` y recursos usados por las páginas | Mantener placeholders, alternativas y tratamiento de imágenes decorativas. |

## Tono de los textos

La interfaz se dirige a la persona de forma cercana, breve y motivadora, con lenguaje de videojuegos ya presente. Mantener el español de los flujos y las frases existentes de marca; no traducir ni reemplazar encabezados sin una solicitud.

Los errores deben explicar la situación y permitir una acción clara. Evitar culpar al usuario, prometer datos no disponibles o mostrar detalles internos del backend que no le ayuden a decidir.

## Accesibilidad y revisión

Los componentes ya declaran etiquetas, nombres accesibles, estados y barras de progreso. El CSS incluye `:focus-visible` con contorno naranja de 3 px y separación de 4 px, además de reglas `prefers-reduced-motion`.

Al cambiar frontend se comprobarán teclado, foco visible, etiquetas asociadas, lectura de errores, nombres de botones de icono, estados de progreso y movimiento reducido. El color no debe ser la única señal de estado.

La revisión en navegador deberá comprobar contraste, zoom, desbordamiento y disposición real. No se declara conformidad completa de accesibilidad ni una revisión visual ya realizada.

## No hacemos

- No cambiamos la identidad visual ni incorporamos un tema nuevo.
- No añadimos librerías de UI, iconos o fuentes sin justificación y autorización.
- No realizamos una refactorización global del CSS como parte del harness.
- No añadimos pantallas, botones o funciones fuera del alcance aprobado.
- No mostramos estadísticas ficticias ni usamos cero para ocultar un error de carga.
- No sustituimos la navegación y los recursos existentes por un sistema nuevo.
- No imponemos animaciones nuevas ni ignoramos movimiento reducido.
- No mezclamos llamadas HTTP dentro de nuevos componentes cuando corresponden a `src/api/`.

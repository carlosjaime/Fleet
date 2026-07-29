# Marca FleetOps

Activos de marca en SVG, con el texto ya convertido a trazados
vectoriales (sin dependencia de fuentes en tiempo de renderizado).

| Archivo | Uso |
|---|---|
| `isotipo.svg` | Ícono de marca solo (glifo "F"). Usado en la app (sidebar, header) y como base del favicon. |
| `logo-dark-bg.svg` | Logotipo completo (isotipo + wordmark), texto claro — para fondos oscuros. |
| `logo-light-bg.svg` | Logotipo completo, texto oscuro — para fondos claros (p. ej. el README en modo claro de GitHub). |
| `banner.svg` | Banner ancho (1280×400) para el encabezado del README, con textura de grid y tagline. |

## Fuentes

- **Isotipo** (glifo "F"): [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) Bold — trazo anguloso y técnico, evoca telemetría/HUD.
- **Wordmark** ("FleetOps"): [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) Bold/Medium — geométrica, moderna, es la fuente de marca (`--font-brand`) usada en la app para logotipo y encabezados hero.

## Regenerar

Los SVG se generaron con un script de Python (`fontTools`) que extrae los
contornos de cada glifo y los compone en trazados vectoriales — no se
requiere el script para usar los archivos ya generados, solo si se
necesita cambiar el texto, las fuentes o los colores. El script no forma
parte del repositorio (es una utilidad de una sola vez); para
regenerarlo, instala `fonttools` y usa `fontTools.pens.svgPathPen` sobre
los `.ttf` de Chakra Petch Bold y Space Grotesk (variable, instanciada en
wght 500/700).

## Paleta

- Ámbar (`#FFB020`) — fondo del isotipo.
- Fondo oscuro (`#090A0F`) — glifo del isotipo, texto sobre fondo claro.
- Texto claro (`#F4F6F8`) — wordmark sobre fondo oscuro.

# ClimateStudio — Aplicación de escritorio para Windows

Empaqueta **ClimateStudio** (lectura de archivos EPW y análisis bioclimático)
como aplicación nativa de Windows usando **Electron**. El `.exe` resultante
**no depende de WebView2 ni de ningún runtime**: corre en cualquier
**Windows 10+ x64**. App 100 % offline (zero-CDN): Chart.js, html2canvas, jsPDF
y las fuentes (Barlow, DM Sans, DM Mono) están embebidas en el HTML.

## Base metodológica

- **Confort adaptativo ASHRAE 55-2010**, banda del 90 % (±2,5 °C) y del 80 % (±3,5 °C).
  También disponibles ASHRAE 55 estático (PMV), EN 15251 Cat. II y EN 16798-1 adaptativo.
- **Temperaturas representativas por percentil**, siguiendo los cortes de ASHRAE
  Fundamentals: 1 % de refrigeración (P99) y 99 % de calefacción (P1), los mismos
  que el EPW trae en su línea DESIGN CONDITIONS. Una hora anómala —un fallo de
  sensor en un archivo AMY— deja de desplazar la lectura varios grados. El valor
  absoluto se conserva siempre en el tooltip, con aviso visual cuando difieren.
  Los mapas de calor (Timetable y Tablas Promedio) acotan su escala de color al
  mismo rango P1–P99, de modo que un fallo sostenido de sensor no aplaste el
  contraste; las celdas fuera del rango toman el color del extremo y los valores
  mínimo y máximo reales se siguen resaltando en la tabla.
- **Psicrometría a la presión real de la estación**, tomada del EPW o derivada de la
  altitud. Indispensable en ciudades andinas: a 2 500 m, usar 101,325 kPa subestima
  la razón de mezcla alrededor de un 37 %.
- **Posición solar** con declinación y ecuación del tiempo de Spencer (1971) y
  corrección de longitud y huso horario.
- **Estrategias pasivas derivadas del modelo de confort activo**: cada hora se asigna
  a la primera técnica capaz de llevarla a la zona de confort, y se reporta el
  **confort acumulado** que aporta cada estrategia sobre las anteriores.
- **Carta bioclimática de Givoni** independiente, en su propia pestaña.
- **Temperatura del suelo** leída de la línea GROUND TEMPERATURES del EPW, en las
  profundidades que el archivo declare (habitualmente 0,5, 2 y 4 m). Si el archivo
  no las trae, se estiman con Kusuda-Achenbach y se avisa de ello.
- **Pluviometría** leída del campo 34 del EPW (*Liquid Precipitation Depth*), con
  totales mensuales, distribución horaria, reparto por intensidades y **rosa de
  lluvia**: la precipitación cruzada con la dirección del viento concurrente, que
  indica qué fachadas reciben el agua. No confunde este campo con el 29
  (*Precipitable Water*), que mide el vapor de la columna atmosférica y no es lluvia.
  Si el archivo no trae precipitación —el caso de buena parte de los TMY3 e IWEC—,
  lo dice explícitamente en lugar de mostrar ceros.
- **Corrector térmico de archivos EPW**: desplaza las temperaturas un número dado de
  grados —uniforme, diferenciado día/noche o mes a mes— conservando la coherencia
  entre bulbo seco, punto de rocío y humedad relativa. Pensado para representar la
  isla de calor urbana a partir de registros de estaciones rurales o periurbanas.
  Exporta un EPW válido con la cabecera anotada. También permite **editar los totales
  mensuales de precipitación**. En los meses que ya tienen lluvia se reescalan sus horas,
  de modo que no cambia qué días llueve ni el reparto de intensidades, solo la magnitud.
  En los meses que el archivo trae secos la lluvia se **inyecta** en las horas más
  nubladas y húmedas del propio mes: el número de horas sale de la fracción media de
  horas lluviosas del archivo y las intensidades, de su distribución real. El método es
  determinista y solo escribe el campo 34; no ajusta nubosidad, radiación ni códigos de
  tiempo presente, lo que conviene declarar si el archivo se usa para simulación energética.

## Estructura

```
climatestudio-desktop/
├─ ClimateStudio.html              ← la aplicación (zero-CDN, en la raíz)
├─ src/main.js                     ← proceso principal de Electron
├─ scripts/check-offline.js        ← guardián de autocontención (corre en CI)
├─ build/icon.ico                  ← icono multirresolución (16–256 px)
├─ .github/workflows/build-windows.yml
├─ package.json
└─ .gitignore
```

## Compilar en GitHub

1. Sube esta carpeta a un repositorio.
2. **Actions → Build Windows → Run workflow** (o empuja una etiqueta `v1.9.2`).
3. Descarga desde la pestaña **Releases**:
   - `ClimateStudio-1.9.2-portable.exe` → se abre sin instalar.
   - `ClimateStudio-1.9.2-setup.exe` → instalador.

El instalador es **por usuario** (`perMachine: false`): no pide permisos de
administrador y se instala en `%LOCALAPPDATA%`. Si se necesita una instalación
para todos los usuarios del equipo, cambiar a `"perMachine": true` en
`build.nsis` del `package.json`; entonces sí solicitará elevación (UAC).

> **Aviso de SmartScreen.** Los ejecutables no están firmados digitalmente, así
> que Windows mostrará «Editor desconocido» la primera vez. Es esperable. Para
> eliminarlo hace falta un certificado de firma de código (OV o EV).

## Local (opcional, requiere Node.js)

```bash
npm install
npm start           # abre la app en modo desarrollo
npm run check:offline   # verifica que el HTML siga siendo autocontenido
npm run dist        # genera dist/*.exe
```

## Nota sobre el HTML

`ClimateStudio.html` funciona igual abierto directamente en un navegador que
dentro del `.exe`: es el mismo archivo, sin modificaciones. Antes de reemplazarlo
conviene ejecutar `npm run check:offline`; el workflow lo hace automáticamente y
aborta la compilación si vuelve a aparecer una dependencia remota.

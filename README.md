# ClimateStudio — Aplicación de escritorio para Windows

Empaqueta **ClimateStudio** (lectura de archivos EPW y análisis bioclimático)
como aplicación nativa de Windows usando **Electron**. El `.exe` resultante
**no depende de WebView2 ni de ningún runtime**: corre en cualquier
**Windows 10+ x64**. App 100 % offline (zero-CDN): Chart.js, html2canvas, jsPDF
y las fuentes (Barlow, DM Sans, DM Mono) están embebidas en el HTML.

## Base metodológica

- **Confort adaptativo ASHRAE 55-2010**, banda del 90 % (±2,5 °C) y del 80 % (±3,5 °C).
  También disponibles ASHRAE 55 estático (PMV), EN 15251 Cat. II y EN 16798-1 adaptativo.
- **Psicrometría a la presión real de la estación**, tomada del EPW o derivada de la
  altitud. Indispensable en ciudades andinas: a 2 500 m, usar 101,325 kPa subestima
  la razón de mezcla alrededor de un 37 %.
- **Posición solar** con declinación y ecuación del tiempo de Spencer (1971) y
  corrección de longitud y huso horario.
- **Estrategias pasivas derivadas del modelo de confort activo**: cada hora se asigna
  a la primera técnica capaz de llevarla a la zona de confort, y se reporta el
  **confort acumulado** que aporta cada estrategia sobre las anteriores.
- **Carta bioclimática de Givoni** independiente, en su propia pestaña.
- **Temperatura del suelo** por Kusuda-Achenbach, con la amplitud de la onda anual
  (medias mensuales) y el desfase referido al mes más frío.

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
2. **Actions → Build Windows → Run workflow** (o empuja una etiqueta `v1.1.0`).
3. Descarga desde la pestaña **Releases**:
   - `ClimateStudio-1.1.0-portable.exe` → se abre sin instalar.
   - `ClimateStudio-1.1.0-setup.exe` → instalador.

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

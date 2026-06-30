# ClimateStudio — Aplicación de escritorio para Windows

Empaqueta **ClimateStudio** (lectura de archivos EPW y análisis bioclimático)
como aplicación nativa de Windows usando **Electron**. El `.exe` resultante
**no depende de WebView2 ni de ningún runtime**: corre en cualquier
**Windows 10+ x64**. App 100 % offline (zero-CDN): Chart.js, html2canvas, jsPDF
y las fuentes (Barlow, DM Sans, DM Mono) están embebidas en el HTML.

Confort adaptativo **ASHRAE 55-2010 sobre la banda del 90 % (±2,5 °C)**.

## Estructura
```
climatestudio-desktop/
├─ ClimateStudio.html              ← la aplicación (zero-CDN, en la raíz)
├─ src/main.js                     ← proceso principal de Electron
├─ .github/workflows/build-windows.yml
├─ package.json
└─ .gitignore
```

## Compilar en GitHub
1. Sube esta carpeta a un repositorio.
2. **Actions → Build Windows → Run workflow** (o empuja una etiqueta `v1.0.0`).
3. Descarga desde la pestaña **Releases**:
   - `ClimateStudio-1.0.0-portable.exe` → se abre sin instalar.
   - `ClimateStudio-1.0.0-setup.exe` → instalador opcional.

## Local (opcional, requiere Node.js)
```bash
npm install
npm start
npm run dist
```

#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════
//  Verificación previa al empaquetado: ClimateStudio.html debe ser
//  autocontenido. Una sola etiqueta src/href remota basta para que la
//  app se rompa en un equipo sin red — y no de forma elegante: si
//  Chart.js no carga, la línea `Chart.defaults...` aborta TODO el script
//  en línea y media aplicación deja de existir.
//  Este guardián corre en CI para que esa regresión nunca llegue al .exe.
// ════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', 'ClimateStudio.html');
const errors = [];
const ok = [];

if (!fs.existsSync(HTML)) {
  console.error('✗ No se encontró ClimateStudio.html en la raíz del repositorio.');
  process.exit(1);
}
const src = fs.readFileSync(HTML, 'utf8');

// 1. Ninguna etiqueta debe apuntar a la red
const remote = src.match(/(?:src|href)\s*=\s*["']https?:\/\/[^"']+/gi) || [];
if (remote.length) errors.push('Recursos remotos (' + remote.length + '):\n    ' + remote.join('\n    '));
else ok.push('sin etiquetas src/href remotas');

// 2. Las librerías deben estar embebidas
[['Chart.js', /Chart\.js 4\.\d+\.\d+ — embebido|chart\.umd/i],
 ['html2canvas', /html2canvas [\d.]+ — embebido|html2canvas/i],
 ['jsPDF', /jsPDF [\d.]+ — embebido|jspdf/i]].forEach(([name, re]) => {
  if (re.test(src)) ok.push(name + ' embebido');
  else errors.push(name + ' no aparece embebido en el HTML');
});

// 3. Las tipografías deben ir en base64
const fonts = (src.match(/data:font\/woff2;base64/g) || []).length;
if (fonts >= 3) ok.push(fonts + ' tipografías woff2 embebidas');
else errors.push('sólo ' + fonts + ' tipografías embebidas (se esperaban 14)');

// 4. Ninguna referencia a un source map externo
if (/sourceMappingURL=/.test(src)) errors.push('quedan referencias a sourceMappingURL');
else ok.push('sin referencias a source maps');

console.log('ClimateStudio.html — ' + (src.length / 1048576).toFixed(2) + ' MB');
ok.forEach(o => console.log('  ✓ ' + o));
if (errors.length) {
  console.error('\nLa verificación de autocontención FALLÓ:');
  errors.forEach(e => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('\nVerificación de autocontención superada.');

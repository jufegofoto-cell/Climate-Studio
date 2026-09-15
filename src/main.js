// ════════════════════════════════════════════════════════════════════
//  ClimateStudio — proceso principal de Electron
//  Envuelve la app HTML autocontenida (ClimateStudio.html) en una ventana
//  de escritorio. Electron incluye su propio Chromium: NO depende de
//  WebView2 ni de ningún runtime; corre en cualquier Windows 10+ x64.
// ════════════════════════════════════════════════════════════════════
'use strict';
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_VERSION = app.getVersion();

// Localiza el HTML. Empaquetado va dentro de app.asar junto a package.json,
// así que __dirname/.. lo resuelve tanto en desarrollo como en el .exe.
// Se comprueban rutas alternativas por si el HTML se deja fuera del asar
// (build.asarUnpack) o junto al ejecutable en la versión portable.
function resolveAppHtml() {
  const candidates = [
    path.join(__dirname, '..', 'ClimateStudio.html'),
    path.join(process.resourcesPath || '', 'app.asar', 'ClimateStudio.html'),
    path.join(process.resourcesPath || '', 'ClimateStudio.html'),
    path.join(path.dirname(app.getPath('exe')), 'ClimateStudio.html'),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (_) { /* ruta no accesible */ }
  }
  return candidates[0];
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  // Segunda instancia: salir de inmediato. Antes, app.quit() no impedía que
  // whenReady() siguiera su curso y llegara a abrir una ventana fugaz.
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  function createMainWindow() {
    const win = new BrowserWindow({
      width: 1600, height: 1000, minWidth: 1100, minHeight: 700,
      backgroundColor: '#ffffff',
      title: 'ClimateStudio ' + APP_VERSION,
      icon: path.join(__dirname, '..', 'build', 'icon.ico'),
      show: false,
      webPreferences: {
        contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false
      }
    });
    win.once('ready-to-show', () => win.show());

    const html = resolveAppHtml();
    if (!fs.existsSync(html)) {
      dialog.showErrorBox('ClimateStudio',
        'No se encontró ClimateStudio.html.\n\nRuta esperada:\n' + html +
        '\n\nVerifique que el archivo esté incluido en "build.files" del package.json.');
      app.quit();
      return win;
    }
    win.loadFile(html);

    win.webContents.on('did-fail-load', (_e, code, desc) => {
      dialog.showErrorBox('ClimateStudio', 'No se pudo cargar la interfaz (' + code + '): ' + desc);
    });

    // Enlaces externos → navegador del sistema (la app es offline; no debería haber).
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (e, url) => {
      if (!url.startsWith('file://')) {
        e.preventDefault();
        if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      }
    });
    return win;
  }

  function buildMenu() {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'Archivo', submenu: [{ role: 'quit', label: 'Salir' }] },
      { label: 'Ver', submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom 100%' },
        { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' }
      ]},
      { label: 'Ayuda', submenu: [{
        label: 'Acerca de ClimateStudio',
        click: () => dialog.showMessageBox({
          type: 'info', title: 'Acerca de', message: 'ClimateStudio ' + APP_VERSION,
          detail: 'Lectura de archivos EPW y análisis bioclimático.\n\n' +
                  '• Confort adaptativo ASHRAE 55-2010, banda de 90 % (±2,5 °C) y de 80 % (±3,5 °C).\n' +
                  '  También ASHRAE 55 estático, EN 15251 Cat. II y EN 16798-1 adaptativo.\n' +
                  '• Psicrometría a la presión real de la estación, tomada del EPW o derivada\n' +
                  '  de la altitud. Sin criterio de humedad en los modelos adaptativos, que\n' +
                  '  no lo establecen.\n' +
                  '• Posición solar con declinación y ecuación del tiempo de Spencer (1971),\n' +
                  '  corregida por longitud y huso horario.\n' +
                  '• Estrategias pasivas derivadas del modelo de confort activo, con reporte\n' +
                  '  de confort acumulado por estrategia.\n' +
                  '• Carta bioclimática de Givoni independiente.\n' +
                  '• Temperatura del suelo por Kusuda-Achenbach.\n' +
                  '• Corrector térmico de archivos EPW: desplaza las temperaturas conservando\n' +
                  '  la coherencia psicrométrica, para representar la isla de calor urbana.\n\n' +
                  'Aplicación autocontenida: no requiere conexión a internet.\n' +
                  'Universidad de San Buenaventura - Pasto.\n\nElectron ' + process.versions.electron + '.',
          buttons: ['Cerrar']
        })
      }]}
    ]));
  }

  // Identificador para la barra de tareas y las notificaciones de Windows.
  // Debe coincidir con build.appId para que el anclaje al inicio funcione bien.
  if (process.platform === 'win32') app.setAppUserModelId('co.edu.usb.climatestudio');

  app.whenReady().then(() => {
    buildMenu();
    createMainWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}

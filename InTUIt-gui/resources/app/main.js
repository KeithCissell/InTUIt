const electron = require('electron');
const {app, BrowserWindow} = electron;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  var win = new BrowserWindow({
    width:1400, height: 900,
    autoHideMenuBar: true,
    useContentSize: true
  });
  win.loadURL('file://' + __dirname + '/index.html');
  win.webContents.openDevTools(); //opens web dev tools in window
  win.focus();
});

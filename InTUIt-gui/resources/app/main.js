const electron = require('electron');
const {app, BrowserWindow} = electron;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  var win = new BrowserWindow({
    width:1350, height: 770,
    minHeight: 715,
    autoHideMenuBar: true,
    useContentSize: true
    //resizable: false
  });
  win.loadURL('file://' + __dirname + '/loginIndex.html');
  win.focus();
  win.webContents.openDevTools(); //opens web dev tools in window
});

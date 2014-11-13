// Load native UI library
var gui = require('nw.gui'); //or global.window.nwDispatcher.requireNwGui() (see https://github.com/rogerwang/node-webkit/issues/707)

// Get the current window
var win = gui.Window.get();
var winIsVisible = true;


// Prevent close
win.on('close', function() {
  this.hide(); // Pretend to be closed already
  winIsVisible = false;
});

/*
hide by default and do:
onload = function() {
  win.show();
};*/

//
//

function toggleWindow() {
  if(winIsVisible) {
    win.hide();
  } else {
    win.show();
  }
  winIsVisible = !winIsVisible;
  console.log('Visible ' + winIsVisible);
}

var tray = new gui.Tray({ title: 'Teamwall', icon: 'icon.png' });

var option = {
  key : "Ctrl+Alt+T",
  active : function() {
     console.log("Global desktop keyboard shortcut: " + this.key + " active.");
    toggleWindow();
  }
};
var shortcut = new gui.Shortcut(option);
gui.App.registerGlobalHotKey(shortcut);

function quitApp() {
  gui.App.unregisterGlobalHotKey(shortcut);
  gui.App.quit();
}

// Give it a menu
var menu = new gui.Menu();
menu.append(new gui.MenuItem({
  label: 'Toggle Visible',
  click: function() {
    toggleWindow();
  }
}));
menu.append(new gui.MenuItem({ type: 'separator' }));
menu.append(new gui.MenuItem({
  label: 'Quit',
  key: "q",
  modifiers: "command",
  click: function() {
    quitApp();
  }
}));
tray.menu = menu;

// Remove the tray
//tray.remove();
//tray = null;

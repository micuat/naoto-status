/* global Torus jdom css */
/* global Hydra */

class HydraApp extends Torus.StyledComponent {
  init() {
    this.canvas = document.createElement("CANVAS");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.hydra = new Hydra({
      canvas: this.canvas,
      detectAudio: false,
      enableStreamCapture: false
    });
    osc().out();
  }
  compose() {
    return this.canvas;
  }
}

class CodeApp extends Torus.StyledComponent {
  init() {
    this.el = document.createElement("TEXTAREA");
    
    
// https://github.com/ojack/hydra/blob/3dcbf85c22b9f30c45b29ac63066e4bbb00cf225/hydra-server/app/src/editor.js
const flashCode = (l0, l1) => {
  if (l0 === undefined) l0 = cm.firstLine();
  if (l1 === undefined) l1 = cm.lastLine() + 1;
  let count = 0;
  for(let l = l0; l < l1; l++) {
    const start = { line: l, ch: 0 };
    const end = { line: l + 1, ch: 0 };
    setTimeout(() => {
      const marker = cm.markText(start, end, { className: "styled-background" });
      setTimeout(() => marker.clear(), 300);
    }, count * 500 / (Math.max(1, l1 - l0)));
    count++;
  }
};

const getLine = () => {
  var c = cm.getCursor();
  var s = cm.getLine(c.line);
  flashCode(c.line, c.line + 1);
  return s;
};

const getCurrentBlock = () => {
  // thanks to graham wakefield + gibber
  var editor = cm;
  var pos = editor.getCursor();
  var startline = pos.line;
  var endline = pos.line;
  while (startline > 0 && cm.getLine(startline) !== "") {
    startline--;
  }
  while (endline < editor.lineCount() && cm.getLine(endline) !== "") {
    endline++;
  }
  var pos1 = {
    line: startline,
    ch: 0
  };
  var pos2 = {
    line: endline,
    ch: 0
  };
  var str = editor.getRange(pos1, pos2);

  flashCode(startline, endline);

  return str;
};

const editorConsoleText = document.getElementById("editor-console-text");
const evalCode = (c) => {
  try {
    let result = eval(c);
    if (result === undefined) result = "";
    editorConsoleText.innerText = result;
    editorConsoleText.className = "normal";
    localStorage.setItem("hydracode", cm.getValue());
  } catch (e) {
    console.log(e);
    editorConsoleText.innerText = e;
    editorConsoleText.className = "error";
  }
}

toggleCode = () {
  if (container.style.visibility == "hidden") {
    container.style.visibility = "inherit";
  } else {
    container.style.visibility = "hidden";
  }
}

const commands = {
  evalAll: () => {
    const code = cm.getValue();
    flashCode();
    evalCode(code);
  },
  toggleEditor: () => {
    toggleCode();
  },
  evalLine: () => {
    const code = getLine();
    evalCode(code);
  },
  toggleComment: () => {
    cm.toggleComment();
  },
  evalBlock: () => {
    const code = getCurrentBlock();
    evalCode(code);
  }
};

const keyMap = {
  evalAll: { key: "ctrl+shift+enter" },
  toggleEditor: { key: "ctrl+shift+h" },
  toggleComment: { key: "ctrl+/" },
  evalLine: { key: "shift+enter,ctrl+enter" },
  evalBlock: { key: "alt+enter" }
};

// enable in textarea
hotkeys.filter = function(event) {
  return true;
};
const commandNames = Object.keys(keyMap);
for (const commandName of commandNames) {
  const hk = keyMap[commandName];
  if (typeof commands[commandName] === "function") {
    hotkeys(hk.key, function(e, hotkeyHandler) {
      e.preventDefault();
      commands[commandName]();
    });
  }
}

  }
  styles() {
    return css`
.editor-console {
  font-family: monospace;
  font-variant-ligatures: no-common-ligatures;
  font-size: 14pt;
  color: #000000;
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.5);
}
`
  }
  render() {
    let r = super.render();
    if (this.cm == undefined) {
      this.cm = CodeMirror.fromTextArea(this.el, {
        theme: "paraiso-dark",
        value: "a",
        mode: { name: "javascript", globalVars: true },
        lineWrapping: true,
        styleSelectedText: true
      });
      this.cm.setValue(
        `osc(50,0.1,1.5).rotate(()=>mouse.y/100).modulate(noise(3),()=>mouse.x/window.innerWidth/4).out()`
      );
      setTimeout(() => this.cm.refresh(), 0);
    }
    this.cm.refresh()
    return r;
  }
  compose() {
    return jdom`
    <div>
    <div class="editor-container">
    ${this.el}
    </div>
    <div class="editor-console">
    >> <code></code>
    </div>
    </div>
    `;
  }
}

class App extends Torus.StyledComponent {
  init() {
    this.hydraApp = new HydraApp();
    this.codeApp = new CodeApp();
  }
  styles() {
    return css`
      position: absolute;
      width: 100%;
      height: 100%;
    `;
  }
  compose() {
    return jdom`<div class="wrapper">
    ${this.hydraApp.node}
    ${this.codeApp.node}
    </>`;
  }
}

const app = new App();
document.querySelector("div#app").appendChild(app.node);

// // https://github.com/ojack/hydra/blob/3dcbf85c22b9f30c45b29ac63066e4bbb00cf225/hydra-server/app/src/editor.js
// const flashCode = function(start, end) {
//   if (!start) start = { line: cm.firstLine(), ch: 0 };
//   if (!end) end = { line: cm.lastLine() + 1, ch: 0 };
//   var marker = cm.markText(start, end, { className: "styled-background" });
//   setTimeout(() => marker.clear(), 300);
// };

// const getLine = function() {
//   var c = cm.getCursor();
//   var s = cm.getLine(c.line);
//   flashCode({ line: c.line, ch: 0 }, { line: c.line + 1, ch: 0 });
//   return s;
// };

// const getCurrentBlock = function () { // thanks to graham wakefield + gibber
//   var editor = cm
//   var pos = editor.getCursor()
//   var startline = pos.line
//   var endline = pos.line
//   while (startline > 0 && cm.getLine(startline) !== '') {
//     startline--
//   }
//   while (endline < editor.lineCount() && cm.getLine(endline) !== '') {
//     endline++
//   }
//   var pos1 = {
//     line: startline,
//     ch: 0
//   }
//   var pos2 = {
//     line: endline,
//     ch: 0
//   }
//   var str = editor.getRange(pos1, pos2)

//   flashCode(pos1, pos2)

//   return str
// }

// {
//   // init
//   const code = cm.getValue();
//   hydra.eval(code);
// }

// window.onkeydown = e => {
//   if (cm.hasFocus()) {
//     if (e.keyCode === 13) {
//       e.preventDefault();
//       if (e.ctrlKey === true && e.shiftKey === true) {
//         // ctrl - shift - enter: evalAll
//         const code = cm.getValue();
//         flashCode();
//         hydra.eval(code);
//       } else if (e.ctrlKey === true && e.shiftKey === false) {
//         // ctrl - enter: evalLine
//         const code = getLine();
//         hydra.eval(code);
//       } else if (e.altKey === true) {
//         // alt - enter: evalBlock
//         const code = getCurrentBlock();
//    console.log(code)
//         hydra.eval(code);
//       }
//     }
//   }
// };

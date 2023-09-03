import html from "choo/html";
import { css } from "@emotion/css";

import menu from "./views/menu.js";
import card from "./views/card.js";
import dialog from "./views/dialog.js";
import doc from "./views/doc.js";

const mainCss = css`
width: 100%;
.container {
  width: 100%;
  padding-top: 1.5em;
}
.dialog {
  position: fixed;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5);
}
.columns {
  display: flex;
}
.hide {
  display: none;
}
.pointer {
  cursor: pointer;
}
.md-block {
  // min-height: 100vh;
}
.deck {
  position: relative;
  // position: fixed;
  // right: 0;
  // top: 0;
  width: 300px;
}
`;

// export module
export default function(state, emit) {
  console.log("main", state.params)
  const { key } = state.params;
  if (key !== undefined && state.docs[key] !== undefined) {
    state.currentDoc = key;
  }
  
  let content;
  if (state.currentData === undefined) {
    content = "loading";
  }
  else {
    let currentCard = "";
    let i = 0;
    currentCard = [...state.history, state.currentData].slice(-3).reverse().map(e => html`
    ${ card(state, emit, e) }
    `);
    
    content = html`
      <div class="container">
        <div id="dialogback" class="dialog ${ state.dialog ? "" : "hide" }" onclick="${ dialogBgClick }">
          ${ dialog(state, emit) }
        </div>
        <div class="columns">
          ${ doc(state, emit) }
          <div class="deck">
            ${ currentCard }
          </div>
        </div>
      </div>
    `;
  }
  
  return html`
    <div class=${ mainCss }>
      ${ menu(state, emit) }
      ${ content }
    </>
  `;
  function dialogBgClick(e) {
    if (e.target.id == "dialogback") {
      emit("hide info");
    }
  }

  //           ${ state.history.length > 0 ? html`
  //             <span onclick=${ () => backClick() }>
  //               Back
  //             </span>`
  //              : html``
  //           }
  // function backClick() {
  //   emit("back");
  // }
}

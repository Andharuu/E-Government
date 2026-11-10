const fs = require("fs");
let cs = fs.readFileSync("extension/content_script.js", "utf8");

// Remove the outer IIFE wrapper so we can inspect functions directly
cs = cs.replace(/^\s*\(function\(\)\s*\{/, "");
cs = cs.replace(/\}\)\(\);\s*$/, "");

global.window = {
  location: { origin: "https://selectorshub.com", hostname: "selectorshub.com", pathname: "/xpath-practice-page/" },
  addEventListener: () => {},
  getComputedStyle: () => ({ display: "block", visibility: "visible", opacity: "1" }),
  CSS: { escape: s => s }
};
global.document = {
  title: "SelectorsHub",
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => ({ id: '', style: {}, appendChild: () => {} }),
  body: { appendChild: () => {} },
  head: { appendChild: () => {} },
  documentElement: {
    setAttribute: () => {},
    hasAttribute: () => false
  }
};
global.MutationObserver = class {
  observe() {}
  disconnect() {}
};
global.chrome = {
  runtime: {
    sendMessage: () => {},
    onMessage: {
      addListener: () => {}
    }
  },
  storage: {
    local: {
      get: (keys, cb) => cb({})
    }
  }
};
global.IS_INSIDE_IFRAME = false;

eval(cs);

async function test() {
  console.log("Testing matchProfileKey directly on SelectorsHub mock inputs:");
  const elEmail = {
    tagName: "INPUT",
    type: "email",
    id: "userId",
    name: "email",
    placeholder: "Enter email",
    getAttribute: (attr) => (attr === "autocomplete" ? "anyrandomstring" : ""),
    closest: () => null,
    querySelector: () => null
  };
  console.log("userId ->", await matchProfileKey(elEmail));

  const elComp = {
    tagName: "INPUT",
    type: "text",
    id: "",
    name: "company",
    placeholder: "Enter your company",
    getAttribute: () => "",
    closest: () => null,
    querySelector: () => null
  };
  console.log("company ->", await matchProfileKey(elComp));

  const elMob = {
    tagName: "INPUT",
    type: "number",
    id: "",
    name: "mobile number",
    placeholder: "Enter your mobile number",
    getAttribute: () => "",
    closest: () => null,
    querySelector: () => null
  };
  console.log("mobile number ->", await matchProfileKey(elMob));
}

test();

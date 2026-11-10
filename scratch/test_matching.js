const fs = require("fs");
const cs = fs.readFileSync("extension/content_script.js", "utf8");

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

async function run() {
  const elUserId = {
    tagName: "INPUT",
    type: "email",
    id: "userId",
    name: "email",
    placeholder: "Enter email",
    getAttribute: (attr) => (attr === "autocomplete" ? "anyrandomstring" : ""),
    closest: () => null,
    querySelector: () => null
  };
  console.log("userId:", await matchProfileKey(elUserId));

  const elCompany = {
    tagName: "INPUT",
    type: "text",
    id: "",
    name: "company",
    placeholder: "Enter your company",
    getAttribute: () => "",
    closest: () => null,
    querySelector: () => null
  };
  console.log("company:", await matchProfileKey(elCompany));

  const elMobile = {
    tagName: "INPUT",
    type: "number",
    id: "",
    name: "mobile number",
    placeholder: "Enter your mobile number",
    getAttribute: () => "",
    closest: () => null,
    querySelector: () => null
  };
  console.log("mobile number:", await matchProfileKey(elMobile));

  const elFirstName = {
    tagName: "INPUT",
    type: "text",
    id: "",
    name: "test",
    placeholder: "First Enter name",
    getAttribute: () => "",
    closest: () => null,
    querySelector: () => null
  };
  console.log("First Enter name:", await matchProfileKey(elFirstName));

  const elLastName = {
    tagName: "INPUT",
    type: "text",
    id: "",
    name: "test",
    placeholder: "Enter Last name",
    getAttribute: () => "",
    closest: () => null,
    querySelector: () => null
  };
  console.log("Enter Last name:", await matchProfileKey(elLastName));
}

run();

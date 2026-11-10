const fs = require("fs");
const cs = fs.readFileSync("extension/content_script.js", "utf8");

const html = fs.readFileSync("scratch/sh.html", "utf8");
const tagRegex = /<(input|select|textarea)\b([^>]*)>/gi;
let match;
const elements = [];

while ((match = tagRegex.exec(html)) !== null) {
  const tag = match[1].toLowerCase();
  const raw = match[2];
  const getAttr = (name) => {
    const m = raw.match(new RegExp(name + '=["' + "'" + ']?([^"' + "'" + '\\s>]+)', 'i'));
    return m ? m[1] : '';
  };
  const getAttrQuoted = (name) => {
    const m = raw.match(new RegExp(name + '="([^"]*)"', 'i')) || raw.match(new RegExp(name + "='([^']*)'", 'i'));
    return m ? m[1] : getAttr(name);
  };

  const type = (getAttr('type') || (tag === 'textarea' ? 'textarea' : (tag === 'select' ? 'select' : 'text'))).toLowerCase();
  if (['hidden', 'submit', 'button', 'reset'].includes(type)) continue;

  elements.push({
    tagName: tag.toUpperCase(),
    type,
    id: getAttr('id'),
    name: getAttr('name'),
    placeholder: getAttrQuoted('placeholder'),
    title: getAttrQuoted('title'),
    autocomplete: getAttr('autocomplete'),
    getAttribute: (attr) => {
      if (attr === 'autocomplete') return getAttr('autocomplete');
      if (attr === 'formcontrolname') return getAttr('formcontrolname');
      if (attr === 'ng-reflect-name') return getAttr('ng-reflect-name');
      if (attr === 'aria-label') return getAttr('aria-label');
      if (attr === 'aria-labelledby') return getAttr('aria-labelledby');
      return '';
    },
    closest: () => null,
    querySelector: () => null
  });
}

global.window = {
  addEventListener: () => {},
  getComputedStyle: () => ({ display: "block", visibility: "visible", opacity: "1" }),
  CSS: { escape: s => s }
};
global.document = {
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};
global.IS_INSIDE_IFRAME = false;
global.chrome = {
  runtime: {
    sendMessage: () => {},
    onMessage: { addListener: () => {} }
  }
};

const fnCode = cs.substring(
  cs.indexOf("const AUTOCOMPLETE_MAP"),
  cs.indexOf("async function detectFields")
);
eval(fnCode);

async function run() {
  const matched = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    try {
      const key = await matchProfileKey(el);
      if (key) {
        matched.push({ index: i + 1, id: el.id, name: el.name, ph: el.placeholder, key });
      }
    } catch (e) {
      console.error(`Error on element #${i + 1}:`, e);
    }
  }

  console.log(`Matched ${matched.length} out of ${elements.length} elements:`);
  matched.forEach(m => {
    console.log(`  [#${m.index}] id="${m.id}" name="${m.name}" ph="${m.ph}" -> KEY: ${m.key}`);
  });
}

run();

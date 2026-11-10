const fs = require("fs");
const html = fs.readFileSync("scratch/sh.html", "utf8");

// Parse all inputs in sh.html
const inputRegex = /<input\b([^>]*)>/gi;
let match;
let count = 0;
const list = [];

while ((match = inputRegex.exec(html)) !== null) {
  count++;
  const raw = match[1];
  const getAttr = (name) => {
    const m = raw.match(new RegExp(name + '=["' + "'" + ']?([^"' + "'" + '\\s>]+)', 'i'));
    return m ? m[1] : '';
  };
  const getAttrQuoted = (name) => {
    const m = raw.match(new RegExp(name + '="([^"]*)"', 'i')) || raw.match(new RegExp(name + "='([^']*)'", 'i'));
    return m ? m[1] : getAttr(name);
  };

  list.push({
    index: count,
    type: getAttr('type') || 'text',
    id: getAttr('id'),
    name: getAttr('name'),
    placeholder: getAttrQuoted('placeholder'),
    title: getAttrQuoted('title'),
    autocomplete: getAttr('autocomplete'),
    raw: match[0]
  });
}

console.log("Total inputs parsed:", list.length);

// Let us inspect the visible candidate inputs
const visibleCandidates = list.filter(x => !['hidden', 'submit', 'button', 'reset'].includes(x.type.toLowerCase()));
console.log("Visible candidates:", visibleCandidates.length);

// Print the first 25
visibleCandidates.slice(0, 25).forEach(x => {
  console.log(`[${x.index}] type=${x.type} id="${x.id}" name="${x.name}" ph="${x.placeholder}" title="${x.title}" auto="${x.autocomplete}"`);
});

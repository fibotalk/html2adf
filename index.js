const { parse } = require("himalaya");
let tagMap = {
  ul: "bulletList",
  li: "listItem",
  pre: "codeBlock",
  hr: "rule",
  h1: {
    "type": "heading",
    "attrs": {
      "level": 1
    },
  },
  h2: {
    "type": "heading",
    "attrs": {
      "level": 2
    },
  },
  h3: {
    "type": "heading",
    "attrs": {
      "level": 3
    },
  },
  h4: {
    "type": "heading",
    "attrs": {
      "level": 4
    },
  },
  h5: {
    "type": "heading",
    "attrs": {
      "level": 5
    },
  },
  h6: {
    "type": "heading",
    "attrs": {
      "level": 6
    },
  },
  ol: "orderedList",
  p: "paragraph",
  table: "table",
  td: "tableCell",
  tr: "tableRow",
};

/**
 * Convert html to Atlassian Document Format
 * @param {string} html 
 */
module.exports = function format(html) {
  let json = parse(html);
  return {
    version: 1,
    type: "doc",
    content: formatChildren(json),
  };
}

/**
 * 
 * @param {object[]} tags 
 */
function formatChildren(tags) {
  for (let i = 0; i < tags.length; i++) {
    switch (tags[i].type) {
      case "text":
        formatText(tags[i]);
        break;
      case "element":
        let status = formatElement(tags[i]);
        if (!status) {
          tags.splice(i, 1);
          i--;
        }
    }
  }
  return tags;
}

/**
 * Format text
 * @param {*} tag 
 */
function formatText(tag) {
  tag.text = tag.content;
  delete tag.content;
}

/**
 * Format other elements
 * @param {*} tag 
 * @returns 
 */
function formatElement(tag) {
  if (!tagMap[tag.tagName])
    return false;
  switch (typeof tagMap[tag.tagName]) {
    case "object":
      Object.assign(tag, tagMap[tag.tagName]);
      break;
    default:
      tag.type = tagMap[tag.tagName];
  }
  delete tag.tagName;
  delete tag.attributes;
  if (tag.children) {
    if (tag.children.length) {
      tag.content = formatChildren(tag.children);
    }
    delete tag.children;
  }
  return true;
}
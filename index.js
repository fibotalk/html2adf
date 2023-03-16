const { parse } = require("himalaya");
const tagMap = {
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
  p: { type: "paragraph", content: [] },
  table: {
    type: "table",
    attrs: {
      "isNumberColumnEnabled": false,
      "layout": "default",
    }
  },
  td: { type: "tableCell", content: [] },
  tr: { type: "tableRow", content: [] },
  th: { type: "tableHeader", content: [] },
};

const textTypes = {
  strong: "strong",
  i: "em",
  u: "underline",
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
 * @param {object} parent : parent tag
 */
function formatChildren(tags, parent) {
  for (let i = 0; i < tags.length; i++) {
    let status = true;
    switch (tags[i].type) {
      case "text":
        status = formatText(tags[i], parent);
        break;
      case "element":
        status = formatElement(tags[i], parent);
        break;
    }
    if (!status) {
      tags.splice(i, 1);
      i--;
    }
  }
  return tags;
}

/**
 * Format text
 * @param {*} tag 
 * @param {object} parent : parent tag
 */
function formatText(tag, parent) {
  let txt = tag.content.replace(/[\n\r ]/g, '');
  if (!txt)
    return false;
  tag.text = tag.content;
  delete tag.content;
  if (!parent || parent.type == "tableCell") {
    tag.type = "paragraph";
    tag.content = [{
      type: "text",
      text: tag.text,
    }];
    delete tag.text;
  }
  return true;
}

/**
 * Format other elements
 * @param {*} tag 
 * @param {object} parent : parent tag
 * @returns 
 */
function formatElement(tag, parent) {
  if (tagMap[tag.tagName]) {
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
        tag.content = formatChildren(tag.children, tag);
      }
      delete tag.children;
    }
    return true;
  } else if (textTypes[tag.tagName]) {
    Object.assign(tag, handleTextType(tag));
    delete tag.tagName;
    delete tag.attributes;
    delete tag.children;
    return true;
  } else {
    return false;
  }
}

/**
 * Merge all the child tags into one obj
 * @param {*} tag 
 */
function handleTextType(tag) {
  let obj = {
    type: "text",
    marks: [],
    text: "",
  };
  mergeTree(tag, obj);
  return obj;
}

/**
 * Merge the obj tree into obj.marks
 * @param {*} tag 
 * @param {*} obj 
 */
function mergeTree(tag, obj) {
  if (tag.type == "text") {
    obj.text += tag.content;
  } else {
    obj.marks.push({
      type: textTypes[tag.tagName],
    });
  }
  if (tag.children && tag.children.length) {
    mergeTree(tag.children[0], obj);
  }
}
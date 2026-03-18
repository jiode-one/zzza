#!/usr/bin/env node

// packages/cli/zzza/src/index.ts
import path4 from "path";
import { readFileSync, lstatSync } from "fs";
import { fileURLToPath } from "url";
import { Command } from "commander";

// packages/cli/zzza/src/manifest.ts
import fs from "fs";
import path from "path";

// node_modules/jsonc-parser/lib/esm/impl/scanner.js
function createScanner(text, ignoreTrivia = false) {
  const len = text.length;
  let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
  function scanHexDigits(count, exact) {
    let digits = 0;
    let value2 = 0;
    while (digits < count || !exact) {
      let ch = text.charCodeAt(pos);
      if (ch >= 48 && ch <= 57) {
        value2 = value2 * 16 + ch - 48;
      } else if (ch >= 65 && ch <= 70) {
        value2 = value2 * 16 + ch - 65 + 10;
      } else if (ch >= 97 && ch <= 102) {
        value2 = value2 * 16 + ch - 97 + 10;
      } else {
        break;
      }
      pos++;
      digits++;
    }
    if (digits < count) {
      value2 = -1;
    }
    return value2;
  }
  function setPosition(newPosition) {
    pos = newPosition;
    value = "";
    tokenOffset = 0;
    token = 16;
    scanError = 0;
  }
  function scanNumber() {
    let start = pos;
    if (text.charCodeAt(pos) === 48) {
      pos++;
    } else {
      pos++;
      while (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
      }
    }
    if (pos < text.length && text.charCodeAt(pos) === 46) {
      pos++;
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
      } else {
        scanError = 3;
        return text.substring(start, pos);
      }
    }
    let end = pos;
    if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
      pos++;
      if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) {
        pos++;
      }
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
        end = pos;
      } else {
        scanError = 3;
      }
    }
    return text.substring(start, end);
  }
  function scanString() {
    let result = "", start = pos;
    while (true) {
      if (pos >= len) {
        result += text.substring(start, pos);
        scanError = 2;
        break;
      }
      const ch = text.charCodeAt(pos);
      if (ch === 34) {
        result += text.substring(start, pos);
        pos++;
        break;
      }
      if (ch === 92) {
        result += text.substring(start, pos);
        pos++;
        if (pos >= len) {
          scanError = 2;
          break;
        }
        const ch2 = text.charCodeAt(pos++);
        switch (ch2) {
          case 34:
            result += '"';
            break;
          case 92:
            result += "\\";
            break;
          case 47:
            result += "/";
            break;
          case 98:
            result += "\b";
            break;
          case 102:
            result += "\f";
            break;
          case 110:
            result += "\n";
            break;
          case 114:
            result += "\r";
            break;
          case 116:
            result += "	";
            break;
          case 117:
            const ch3 = scanHexDigits(4, true);
            if (ch3 >= 0) {
              result += String.fromCharCode(ch3);
            } else {
              scanError = 4;
            }
            break;
          default:
            scanError = 5;
        }
        start = pos;
        continue;
      }
      if (ch >= 0 && ch <= 31) {
        if (isLineBreak(ch)) {
          result += text.substring(start, pos);
          scanError = 2;
          break;
        } else {
          scanError = 6;
        }
      }
      pos++;
    }
    return result;
  }
  function scanNext() {
    value = "";
    scanError = 0;
    tokenOffset = pos;
    lineStartOffset = lineNumber;
    prevTokenLineStartOffset = tokenLineStartOffset;
    if (pos >= len) {
      tokenOffset = len;
      return token = 17;
    }
    let code = text.charCodeAt(pos);
    if (isWhiteSpace(code)) {
      do {
        pos++;
        value += String.fromCharCode(code);
        code = text.charCodeAt(pos);
      } while (isWhiteSpace(code));
      return token = 15;
    }
    if (isLineBreak(code)) {
      pos++;
      value += String.fromCharCode(code);
      if (code === 13 && text.charCodeAt(pos) === 10) {
        pos++;
        value += "\n";
      }
      lineNumber++;
      tokenLineStartOffset = pos;
      return token = 14;
    }
    switch (code) {
      // tokens: []{}:,
      case 123:
        pos++;
        return token = 1;
      case 125:
        pos++;
        return token = 2;
      case 91:
        pos++;
        return token = 3;
      case 93:
        pos++;
        return token = 4;
      case 58:
        pos++;
        return token = 6;
      case 44:
        pos++;
        return token = 5;
      // strings
      case 34:
        pos++;
        value = scanString();
        return token = 10;
      // comments
      case 47:
        const start = pos - 1;
        if (text.charCodeAt(pos + 1) === 47) {
          pos += 2;
          while (pos < len) {
            if (isLineBreak(text.charCodeAt(pos))) {
              break;
            }
            pos++;
          }
          value = text.substring(start, pos);
          return token = 12;
        }
        if (text.charCodeAt(pos + 1) === 42) {
          pos += 2;
          const safeLength = len - 1;
          let commentClosed = false;
          while (pos < safeLength) {
            const ch = text.charCodeAt(pos);
            if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
              pos += 2;
              commentClosed = true;
              break;
            }
            pos++;
            if (isLineBreak(ch)) {
              if (ch === 13 && text.charCodeAt(pos) === 10) {
                pos++;
              }
              lineNumber++;
              tokenLineStartOffset = pos;
            }
          }
          if (!commentClosed) {
            pos++;
            scanError = 1;
          }
          value = text.substring(start, pos);
          return token = 13;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
      // numbers
      case 45:
        value += String.fromCharCode(code);
        pos++;
        if (pos === len || !isDigit(text.charCodeAt(pos))) {
          return token = 16;
        }
      // found a minus, followed by a number so
      // we fall through to proceed with scanning
      // numbers
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        value += scanNumber();
        return token = 11;
      // literals and unknown symbols
      default:
        while (pos < len && isUnknownContentCharacter(code)) {
          pos++;
          code = text.charCodeAt(pos);
        }
        if (tokenOffset !== pos) {
          value = text.substring(tokenOffset, pos);
          switch (value) {
            case "true":
              return token = 8;
            case "false":
              return token = 9;
            case "null":
              return token = 7;
          }
          return token = 16;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
    }
  }
  function isUnknownContentCharacter(code) {
    if (isWhiteSpace(code) || isLineBreak(code)) {
      return false;
    }
    switch (code) {
      case 125:
      case 93:
      case 123:
      case 91:
      case 34:
      case 58:
      case 44:
      case 47:
        return false;
    }
    return true;
  }
  function scanNextNonTrivia() {
    let result;
    do {
      result = scanNext();
    } while (result >= 12 && result <= 15);
    return result;
  }
  return {
    setPosition,
    getPosition: () => pos,
    scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
    getToken: () => token,
    getTokenValue: () => value,
    getTokenOffset: () => tokenOffset,
    getTokenLength: () => pos - tokenOffset,
    getTokenStartLine: () => lineStartOffset,
    getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
    getTokenError: () => scanError
  };
}
function isWhiteSpace(ch) {
  return ch === 32 || ch === 9;
}
function isLineBreak(ch) {
  return ch === 10 || ch === 13;
}
function isDigit(ch) {
  return ch >= 48 && ch <= 57;
}
var CharacterCodes;
(function(CharacterCodes2) {
  CharacterCodes2[CharacterCodes2["lineFeed"] = 10] = "lineFeed";
  CharacterCodes2[CharacterCodes2["carriageReturn"] = 13] = "carriageReturn";
  CharacterCodes2[CharacterCodes2["space"] = 32] = "space";
  CharacterCodes2[CharacterCodes2["_0"] = 48] = "_0";
  CharacterCodes2[CharacterCodes2["_1"] = 49] = "_1";
  CharacterCodes2[CharacterCodes2["_2"] = 50] = "_2";
  CharacterCodes2[CharacterCodes2["_3"] = 51] = "_3";
  CharacterCodes2[CharacterCodes2["_4"] = 52] = "_4";
  CharacterCodes2[CharacterCodes2["_5"] = 53] = "_5";
  CharacterCodes2[CharacterCodes2["_6"] = 54] = "_6";
  CharacterCodes2[CharacterCodes2["_7"] = 55] = "_7";
  CharacterCodes2[CharacterCodes2["_8"] = 56] = "_8";
  CharacterCodes2[CharacterCodes2["_9"] = 57] = "_9";
  CharacterCodes2[CharacterCodes2["a"] = 97] = "a";
  CharacterCodes2[CharacterCodes2["b"] = 98] = "b";
  CharacterCodes2[CharacterCodes2["c"] = 99] = "c";
  CharacterCodes2[CharacterCodes2["d"] = 100] = "d";
  CharacterCodes2[CharacterCodes2["e"] = 101] = "e";
  CharacterCodes2[CharacterCodes2["f"] = 102] = "f";
  CharacterCodes2[CharacterCodes2["g"] = 103] = "g";
  CharacterCodes2[CharacterCodes2["h"] = 104] = "h";
  CharacterCodes2[CharacterCodes2["i"] = 105] = "i";
  CharacterCodes2[CharacterCodes2["j"] = 106] = "j";
  CharacterCodes2[CharacterCodes2["k"] = 107] = "k";
  CharacterCodes2[CharacterCodes2["l"] = 108] = "l";
  CharacterCodes2[CharacterCodes2["m"] = 109] = "m";
  CharacterCodes2[CharacterCodes2["n"] = 110] = "n";
  CharacterCodes2[CharacterCodes2["o"] = 111] = "o";
  CharacterCodes2[CharacterCodes2["p"] = 112] = "p";
  CharacterCodes2[CharacterCodes2["q"] = 113] = "q";
  CharacterCodes2[CharacterCodes2["r"] = 114] = "r";
  CharacterCodes2[CharacterCodes2["s"] = 115] = "s";
  CharacterCodes2[CharacterCodes2["t"] = 116] = "t";
  CharacterCodes2[CharacterCodes2["u"] = 117] = "u";
  CharacterCodes2[CharacterCodes2["v"] = 118] = "v";
  CharacterCodes2[CharacterCodes2["w"] = 119] = "w";
  CharacterCodes2[CharacterCodes2["x"] = 120] = "x";
  CharacterCodes2[CharacterCodes2["y"] = 121] = "y";
  CharacterCodes2[CharacterCodes2["z"] = 122] = "z";
  CharacterCodes2[CharacterCodes2["A"] = 65] = "A";
  CharacterCodes2[CharacterCodes2["B"] = 66] = "B";
  CharacterCodes2[CharacterCodes2["C"] = 67] = "C";
  CharacterCodes2[CharacterCodes2["D"] = 68] = "D";
  CharacterCodes2[CharacterCodes2["E"] = 69] = "E";
  CharacterCodes2[CharacterCodes2["F"] = 70] = "F";
  CharacterCodes2[CharacterCodes2["G"] = 71] = "G";
  CharacterCodes2[CharacterCodes2["H"] = 72] = "H";
  CharacterCodes2[CharacterCodes2["I"] = 73] = "I";
  CharacterCodes2[CharacterCodes2["J"] = 74] = "J";
  CharacterCodes2[CharacterCodes2["K"] = 75] = "K";
  CharacterCodes2[CharacterCodes2["L"] = 76] = "L";
  CharacterCodes2[CharacterCodes2["M"] = 77] = "M";
  CharacterCodes2[CharacterCodes2["N"] = 78] = "N";
  CharacterCodes2[CharacterCodes2["O"] = 79] = "O";
  CharacterCodes2[CharacterCodes2["P"] = 80] = "P";
  CharacterCodes2[CharacterCodes2["Q"] = 81] = "Q";
  CharacterCodes2[CharacterCodes2["R"] = 82] = "R";
  CharacterCodes2[CharacterCodes2["S"] = 83] = "S";
  CharacterCodes2[CharacterCodes2["T"] = 84] = "T";
  CharacterCodes2[CharacterCodes2["U"] = 85] = "U";
  CharacterCodes2[CharacterCodes2["V"] = 86] = "V";
  CharacterCodes2[CharacterCodes2["W"] = 87] = "W";
  CharacterCodes2[CharacterCodes2["X"] = 88] = "X";
  CharacterCodes2[CharacterCodes2["Y"] = 89] = "Y";
  CharacterCodes2[CharacterCodes2["Z"] = 90] = "Z";
  CharacterCodes2[CharacterCodes2["asterisk"] = 42] = "asterisk";
  CharacterCodes2[CharacterCodes2["backslash"] = 92] = "backslash";
  CharacterCodes2[CharacterCodes2["closeBrace"] = 125] = "closeBrace";
  CharacterCodes2[CharacterCodes2["closeBracket"] = 93] = "closeBracket";
  CharacterCodes2[CharacterCodes2["colon"] = 58] = "colon";
  CharacterCodes2[CharacterCodes2["comma"] = 44] = "comma";
  CharacterCodes2[CharacterCodes2["dot"] = 46] = "dot";
  CharacterCodes2[CharacterCodes2["doubleQuote"] = 34] = "doubleQuote";
  CharacterCodes2[CharacterCodes2["minus"] = 45] = "minus";
  CharacterCodes2[CharacterCodes2["openBrace"] = 123] = "openBrace";
  CharacterCodes2[CharacterCodes2["openBracket"] = 91] = "openBracket";
  CharacterCodes2[CharacterCodes2["plus"] = 43] = "plus";
  CharacterCodes2[CharacterCodes2["slash"] = 47] = "slash";
  CharacterCodes2[CharacterCodes2["formFeed"] = 12] = "formFeed";
  CharacterCodes2[CharacterCodes2["tab"] = 9] = "tab";
})(CharacterCodes || (CharacterCodes = {}));

// node_modules/jsonc-parser/lib/esm/impl/string-intern.js
var cachedSpaces = new Array(20).fill(0).map((_, index) => {
  return " ".repeat(index);
});
var maxCachedValues = 200;
var cachedBreakLinesWithSpaces = {
  " ": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\n" + " ".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + " ".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r\n" + " ".repeat(index);
    })
  },
  "	": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\n" + "	".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + "	".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r\n" + "	".repeat(index);
    })
  }
};
var supportedEols = ["\n", "\r", "\r\n"];

// node_modules/jsonc-parser/lib/esm/impl/format.js
function format(documentText, range, options) {
  let initialIndentLevel;
  let formatText;
  let formatTextStart;
  let rangeStart;
  let rangeEnd;
  if (range) {
    rangeStart = range.offset;
    rangeEnd = rangeStart + range.length;
    formatTextStart = rangeStart;
    while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) {
      formatTextStart--;
    }
    let endOffset = rangeEnd;
    while (endOffset < documentText.length && !isEOL(documentText, endOffset)) {
      endOffset++;
    }
    formatText = documentText.substring(formatTextStart, endOffset);
    initialIndentLevel = computeIndentLevel(formatText, options);
  } else {
    formatText = documentText;
    initialIndentLevel = 0;
    formatTextStart = 0;
    rangeStart = 0;
    rangeEnd = documentText.length;
  }
  const eol = getEOL(options, documentText);
  const eolFastPathSupported = supportedEols.includes(eol);
  let numberLineBreaks = 0;
  let indentLevel = 0;
  let indentValue;
  if (options.insertSpaces) {
    indentValue = cachedSpaces[options.tabSize || 4] ?? repeat(cachedSpaces[1], options.tabSize || 4);
  } else {
    indentValue = "	";
  }
  const indentType = indentValue === "	" ? "	" : " ";
  let scanner = createScanner(formatText, false);
  let hasError = false;
  function newLinesAndIndent() {
    if (numberLineBreaks > 1) {
      return repeat(eol, numberLineBreaks) + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    const amountOfSpaces = indentValue.length * (initialIndentLevel + indentLevel);
    if (!eolFastPathSupported || amountOfSpaces > cachedBreakLinesWithSpaces[indentType][eol].length) {
      return eol + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    if (amountOfSpaces <= 0) {
      return eol;
    }
    return cachedBreakLinesWithSpaces[indentType][eol][amountOfSpaces];
  }
  function scanNext() {
    let token = scanner.scan();
    numberLineBreaks = 0;
    while (token === 15 || token === 14) {
      if (token === 14 && options.keepLines) {
        numberLineBreaks += 1;
      } else if (token === 14) {
        numberLineBreaks = 1;
      }
      token = scanner.scan();
    }
    hasError = token === 16 || scanner.getTokenError() !== 0;
    return token;
  }
  const editOperations = [];
  function addEdit(text, startOffset, endOffset) {
    if (!hasError && (!range || startOffset < rangeEnd && endOffset > rangeStart) && documentText.substring(startOffset, endOffset) !== text) {
      editOperations.push({ offset: startOffset, length: endOffset - startOffset, content: text });
    }
  }
  let firstToken = scanNext();
  if (options.keepLines && numberLineBreaks > 0) {
    addEdit(repeat(eol, numberLineBreaks), 0, 0);
  }
  if (firstToken !== 17) {
    let firstTokenStart = scanner.getTokenOffset() + formatTextStart;
    let initialIndent = indentValue.length * initialIndentLevel < 20 && options.insertSpaces ? cachedSpaces[indentValue.length * initialIndentLevel] : repeat(indentValue, initialIndentLevel);
    addEdit(initialIndent, formatTextStart, firstTokenStart);
  }
  while (firstToken !== 17) {
    let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
    let secondToken = scanNext();
    let replaceContent = "";
    let needsLineBreak = false;
    while (numberLineBreaks === 0 && (secondToken === 12 || secondToken === 13)) {
      let commentTokenStart = scanner.getTokenOffset() + formatTextStart;
      addEdit(cachedSpaces[1], firstTokenEnd, commentTokenStart);
      firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
      needsLineBreak = secondToken === 12;
      replaceContent = needsLineBreak ? newLinesAndIndent() : "";
      secondToken = scanNext();
    }
    if (secondToken === 2) {
      if (firstToken !== 1) {
        indentLevel--;
      }
      ;
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 1) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else if (secondToken === 4) {
      if (firstToken !== 3) {
        indentLevel--;
      }
      ;
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 3) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else {
      switch (firstToken) {
        case 3:
        case 1:
          indentLevel++;
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 5:
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 12:
          replaceContent = newLinesAndIndent();
          break;
        case 13:
          if (numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 6:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 10:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (secondToken === 6 && !needsLineBreak) {
            replaceContent = "";
          }
          break;
        case 7:
        case 8:
        case 9:
        case 11:
        case 2:
        case 4:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else {
            if ((secondToken === 12 || secondToken === 13) && !needsLineBreak) {
              replaceContent = cachedSpaces[1];
            } else if (secondToken !== 5 && secondToken !== 17) {
              hasError = true;
            }
          }
          break;
        case 16:
          hasError = true;
          break;
      }
      if (numberLineBreaks > 0 && (secondToken === 12 || secondToken === 13)) {
        replaceContent = newLinesAndIndent();
      }
    }
    if (secondToken === 17) {
      if (options.keepLines && numberLineBreaks > 0) {
        replaceContent = newLinesAndIndent();
      } else {
        replaceContent = options.insertFinalNewline ? eol : "";
      }
    }
    const secondTokenStart = scanner.getTokenOffset() + formatTextStart;
    addEdit(replaceContent, firstTokenEnd, secondTokenStart);
    firstToken = secondToken;
  }
  return editOperations;
}
function repeat(s, count) {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += s;
  }
  return result;
}
function computeIndentLevel(content, options) {
  let i = 0;
  let nChars = 0;
  const tabSize = options.tabSize || 4;
  while (i < content.length) {
    let ch = content.charAt(i);
    if (ch === cachedSpaces[1]) {
      nChars++;
    } else if (ch === "	") {
      nChars += tabSize;
    } else {
      break;
    }
    i++;
  }
  return Math.floor(nChars / tabSize);
}
function getEOL(options, text) {
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (ch === "\r") {
      if (i + 1 < text.length && text.charAt(i + 1) === "\n") {
        return "\r\n";
      }
      return "\r";
    } else if (ch === "\n") {
      return "\n";
    }
  }
  return options && options.eol || "\n";
}
function isEOL(text, offset) {
  return "\r\n".indexOf(text.charAt(offset)) !== -1;
}

// node_modules/jsonc-parser/lib/esm/impl/parser.js
var ParseOptions;
(function(ParseOptions2) {
  ParseOptions2.DEFAULT = {
    allowTrailingComma: false
  };
})(ParseOptions || (ParseOptions = {}));
function parse(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentProperty = null;
  let currentParent = [];
  const previousParents = [];
  function onValue(value) {
    if (Array.isArray(currentParent)) {
      currentParent.push(value);
    } else if (currentProperty !== null) {
      currentParent[currentProperty] = value;
    }
  }
  const visitor = {
    onObjectBegin: () => {
      const object = {};
      onValue(object);
      previousParents.push(currentParent);
      currentParent = object;
      currentProperty = null;
    },
    onObjectProperty: (name) => {
      currentProperty = name;
    },
    onObjectEnd: () => {
      currentParent = previousParents.pop();
    },
    onArrayBegin: () => {
      const array = [];
      onValue(array);
      previousParents.push(currentParent);
      currentParent = array;
      currentProperty = null;
    },
    onArrayEnd: () => {
      currentParent = previousParents.pop();
    },
    onLiteralValue: onValue,
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  return currentParent[0];
}
function parseTree(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentParent = { type: "array", offset: -1, length: -1, children: [], parent: void 0 };
  function ensurePropertyComplete(endOffset) {
    if (currentParent.type === "property") {
      currentParent.length = endOffset - currentParent.offset;
      currentParent = currentParent.parent;
    }
  }
  function onValue(valueNode) {
    currentParent.children.push(valueNode);
    return valueNode;
  }
  const visitor = {
    onObjectBegin: (offset) => {
      currentParent = onValue({ type: "object", offset, length: -1, parent: currentParent, children: [] });
    },
    onObjectProperty: (name, offset, length) => {
      currentParent = onValue({ type: "property", offset, length: -1, parent: currentParent, children: [] });
      currentParent.children.push({ type: "string", value: name, offset, length, parent: currentParent });
    },
    onObjectEnd: (offset, length) => {
      ensurePropertyComplete(offset + length);
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onArrayBegin: (offset, length) => {
      currentParent = onValue({ type: "array", offset, length: -1, parent: currentParent, children: [] });
    },
    onArrayEnd: (offset, length) => {
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onLiteralValue: (value, offset, length) => {
      onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
      ensurePropertyComplete(offset + length);
    },
    onSeparator: (sep, offset, length) => {
      if (currentParent.type === "property") {
        if (sep === ":") {
          currentParent.colonOffset = offset;
        } else if (sep === ",") {
          ensurePropertyComplete(offset);
        }
      }
    },
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  const result = currentParent.children[0];
  if (result) {
    delete result.parent;
  }
  return result;
}
function findNodeAtLocation(root, path5) {
  if (!root) {
    return void 0;
  }
  let node = root;
  for (let segment of path5) {
    if (typeof segment === "string") {
      if (node.type !== "object" || !Array.isArray(node.children)) {
        return void 0;
      }
      let found = false;
      for (const propertyNode of node.children) {
        if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === segment && propertyNode.children.length === 2) {
          node = propertyNode.children[1];
          found = true;
          break;
        }
      }
      if (!found) {
        return void 0;
      }
    } else {
      const index = segment;
      if (node.type !== "array" || index < 0 || !Array.isArray(node.children) || index >= node.children.length) {
        return void 0;
      }
      node = node.children[index];
    }
  }
  return node;
}
function visit(text, visitor, options = ParseOptions.DEFAULT) {
  const _scanner = createScanner(text, false);
  const _jsonPath = [];
  let suppressedCallbacks = 0;
  function toNoArgVisit(visitFunction) {
    return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisit(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisitWithPath(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
  }
  function toBeginVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks++;
      } else {
        let cbReturn = visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice());
        if (cbReturn === false) {
          suppressedCallbacks = 1;
        }
      }
    } : () => true;
  }
  function toEndVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks--;
      }
      if (suppressedCallbacks === 0) {
        visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
      }
    } : () => true;
  }
  const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
  const disallowComments = options && options.disallowComments;
  const allowTrailingComma = options && options.allowTrailingComma;
  function scanNext() {
    while (true) {
      const token = _scanner.scan();
      switch (_scanner.getTokenError()) {
        case 4:
          handleError(
            14
            /* ParseErrorCode.InvalidUnicode */
          );
          break;
        case 5:
          handleError(
            15
            /* ParseErrorCode.InvalidEscapeCharacter */
          );
          break;
        case 3:
          handleError(
            13
            /* ParseErrorCode.UnexpectedEndOfNumber */
          );
          break;
        case 1:
          if (!disallowComments) {
            handleError(
              11
              /* ParseErrorCode.UnexpectedEndOfComment */
            );
          }
          break;
        case 2:
          handleError(
            12
            /* ParseErrorCode.UnexpectedEndOfString */
          );
          break;
        case 6:
          handleError(
            16
            /* ParseErrorCode.InvalidCharacter */
          );
          break;
      }
      switch (token) {
        case 12:
        case 13:
          if (disallowComments) {
            handleError(
              10
              /* ParseErrorCode.InvalidCommentToken */
            );
          } else {
            onComment();
          }
          break;
        case 16:
          handleError(
            1
            /* ParseErrorCode.InvalidSymbol */
          );
          break;
        case 15:
        case 14:
          break;
        default:
          return token;
      }
    }
  }
  function handleError(error, skipUntilAfter = [], skipUntil = []) {
    onError(error);
    if (skipUntilAfter.length + skipUntil.length > 0) {
      let token = _scanner.getToken();
      while (token !== 17) {
        if (skipUntilAfter.indexOf(token) !== -1) {
          scanNext();
          break;
        } else if (skipUntil.indexOf(token) !== -1) {
          break;
        }
        token = scanNext();
      }
    }
  }
  function parseString(isValue) {
    const value = _scanner.getTokenValue();
    if (isValue) {
      onLiteralValue(value);
    } else {
      onObjectProperty(value);
      _jsonPath.push(value);
    }
    scanNext();
    return true;
  }
  function parseLiteral() {
    switch (_scanner.getToken()) {
      case 11:
        const tokenValue = _scanner.getTokenValue();
        let value = Number(tokenValue);
        if (isNaN(value)) {
          handleError(
            2
            /* ParseErrorCode.InvalidNumberFormat */
          );
          value = 0;
        }
        onLiteralValue(value);
        break;
      case 7:
        onLiteralValue(null);
        break;
      case 8:
        onLiteralValue(true);
        break;
      case 9:
        onLiteralValue(false);
        break;
      default:
        return false;
    }
    scanNext();
    return true;
  }
  function parseProperty() {
    if (_scanner.getToken() !== 10) {
      handleError(3, [], [
        2,
        5
        /* SyntaxKind.CommaToken */
      ]);
      return false;
    }
    parseString(false);
    if (_scanner.getToken() === 6) {
      onSeparator(":");
      scanNext();
      if (!parseValue()) {
        handleError(4, [], [
          2,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
    } else {
      handleError(5, [], [
        2,
        5
        /* SyntaxKind.CommaToken */
      ]);
    }
    _jsonPath.pop();
    return true;
  }
  function parseObject() {
    onObjectBegin();
    scanNext();
    let needsComma = false;
    while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 2 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (!parseProperty()) {
        handleError(4, [], [
          2,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
      needsComma = true;
    }
    onObjectEnd();
    if (_scanner.getToken() !== 2) {
      handleError(7, [
        2
        /* SyntaxKind.CloseBraceToken */
      ], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseArray() {
    onArrayBegin();
    scanNext();
    let isFirstElement = true;
    let needsComma = false;
    while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 4 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (isFirstElement) {
        _jsonPath.push(0);
        isFirstElement = false;
      } else {
        _jsonPath[_jsonPath.length - 1]++;
      }
      if (!parseValue()) {
        handleError(4, [], [
          4,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
      needsComma = true;
    }
    onArrayEnd();
    if (!isFirstElement) {
      _jsonPath.pop();
    }
    if (_scanner.getToken() !== 4) {
      handleError(8, [
        4
        /* SyntaxKind.CloseBracketToken */
      ], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseValue() {
    switch (_scanner.getToken()) {
      case 3:
        return parseArray();
      case 1:
        return parseObject();
      case 10:
        return parseString(true);
      default:
        return parseLiteral();
    }
  }
  scanNext();
  if (_scanner.getToken() === 17) {
    if (options.allowEmptyContent) {
      return true;
    }
    handleError(4, [], []);
    return false;
  }
  if (!parseValue()) {
    handleError(4, [], []);
    return false;
  }
  if (_scanner.getToken() !== 17) {
    handleError(9, [], []);
  }
  return true;
}
function getNodeType(value) {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "object": {
      if (!value) {
        return "null";
      } else if (Array.isArray(value)) {
        return "array";
      }
      return "object";
    }
    default:
      return "null";
  }
}

// node_modules/jsonc-parser/lib/esm/impl/edit.js
function setProperty(text, originalPath, value, options) {
  const path5 = originalPath.slice();
  const errors = [];
  const root = parseTree(text, errors);
  let parent = void 0;
  let lastSegment = void 0;
  while (path5.length > 0) {
    lastSegment = path5.pop();
    parent = findNodeAtLocation(root, path5);
    if (parent === void 0 && value !== void 0) {
      if (typeof lastSegment === "string") {
        value = { [lastSegment]: value };
      } else {
        value = [value];
      }
    } else {
      break;
    }
  }
  if (!parent) {
    if (value === void 0) {
      throw new Error("Can not delete in empty document");
    }
    return withFormatting(text, { offset: root ? root.offset : 0, length: root ? root.length : 0, content: JSON.stringify(value) }, options);
  } else if (parent.type === "object" && typeof lastSegment === "string" && Array.isArray(parent.children)) {
    const existing = findNodeAtLocation(parent, [lastSegment]);
    if (existing !== void 0) {
      if (value === void 0) {
        if (!existing.parent) {
          throw new Error("Malformed AST");
        }
        const propertyIndex = parent.children.indexOf(existing.parent);
        let removeBegin;
        let removeEnd = existing.parent.offset + existing.parent.length;
        if (propertyIndex > 0) {
          let previous = parent.children[propertyIndex - 1];
          removeBegin = previous.offset + previous.length;
        } else {
          removeBegin = parent.offset + 1;
          if (parent.children.length > 1) {
            let next = parent.children[1];
            removeEnd = next.offset;
          }
        }
        return withFormatting(text, { offset: removeBegin, length: removeEnd - removeBegin, content: "" }, options);
      } else {
        return withFormatting(text, { offset: existing.offset, length: existing.length, content: JSON.stringify(value) }, options);
      }
    } else {
      if (value === void 0) {
        return [];
      }
      const newProperty = `${JSON.stringify(lastSegment)}: ${JSON.stringify(value)}`;
      const index = options.getInsertionIndex ? options.getInsertionIndex(parent.children.map((p) => p.children[0].value)) : parent.children.length;
      let edit;
      if (index > 0) {
        let previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      } else if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty + "," };
      }
      return withFormatting(text, edit, options);
    }
  } else if (parent.type === "array" && typeof lastSegment === "number" && Array.isArray(parent.children)) {
    const insertIndex = lastSegment;
    if (insertIndex === -1) {
      const newProperty = `${JSON.stringify(value)}`;
      let edit;
      if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        const previous = parent.children[parent.children.length - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else if (value === void 0 && parent.children.length >= 0) {
      const removalIndex = lastSegment;
      const toRemove = parent.children[removalIndex];
      let edit;
      if (parent.children.length === 1) {
        edit = { offset: parent.offset + 1, length: parent.length - 2, content: "" };
      } else if (parent.children.length - 1 === removalIndex) {
        let previous = parent.children[removalIndex - 1];
        let offset = previous.offset + previous.length;
        let parentEndOffset = parent.offset + parent.length;
        edit = { offset, length: parentEndOffset - 2 - offset, content: "" };
      } else {
        edit = { offset: toRemove.offset, length: parent.children[removalIndex + 1].offset - toRemove.offset, content: "" };
      }
      return withFormatting(text, edit, options);
    } else if (value !== void 0) {
      let edit;
      const newProperty = `${JSON.stringify(value)}`;
      if (!options.isArrayInsertion && parent.children.length > lastSegment) {
        const toModify = parent.children[lastSegment];
        edit = { offset: toModify.offset, length: toModify.length, content: newProperty };
      } else if (parent.children.length === 0 || lastSegment === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: parent.children.length === 0 ? newProperty : newProperty + "," };
      } else {
        const index = lastSegment > parent.children.length ? parent.children.length : lastSegment;
        const previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else {
      throw new Error(`Can not ${value === void 0 ? "remove" : options.isArrayInsertion ? "insert" : "modify"} Array index ${insertIndex} as length is not sufficient`);
    }
  } else {
    throw new Error(`Can not add ${typeof lastSegment !== "number" ? "index" : "property"} to parent of type ${parent.type}`);
  }
}
function withFormatting(text, edit, options) {
  if (!options.formattingOptions) {
    return [edit];
  }
  let newText = applyEdit(text, edit);
  let begin = edit.offset;
  let end = edit.offset + edit.content.length;
  if (edit.length === 0 || edit.content.length === 0) {
    while (begin > 0 && !isEOL(newText, begin - 1)) {
      begin--;
    }
    while (end < newText.length && !isEOL(newText, end)) {
      end++;
    }
  }
  const edits = format(newText, { offset: begin, length: end - begin }, { ...options.formattingOptions, keepLines: false });
  for (let i = edits.length - 1; i >= 0; i--) {
    const edit2 = edits[i];
    newText = applyEdit(newText, edit2);
    begin = Math.min(begin, edit2.offset);
    end = Math.max(end, edit2.offset + edit2.length);
    end += edit2.content.length - edit2.length;
  }
  const editLength = text.length - (newText.length - end) - begin;
  return [{ offset: begin, length: editLength, content: newText.substring(begin, end) }];
}
function applyEdit(text, edit) {
  return text.substring(0, edit.offset) + edit.content + text.substring(edit.offset + edit.length);
}

// node_modules/jsonc-parser/lib/esm/main.js
var ScanError;
(function(ScanError2) {
  ScanError2[ScanError2["None"] = 0] = "None";
  ScanError2[ScanError2["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
  ScanError2[ScanError2["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
  ScanError2[ScanError2["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
  ScanError2[ScanError2["InvalidUnicode"] = 4] = "InvalidUnicode";
  ScanError2[ScanError2["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
  ScanError2[ScanError2["InvalidCharacter"] = 6] = "InvalidCharacter";
})(ScanError || (ScanError = {}));
var SyntaxKind;
(function(SyntaxKind2) {
  SyntaxKind2[SyntaxKind2["OpenBraceToken"] = 1] = "OpenBraceToken";
  SyntaxKind2[SyntaxKind2["CloseBraceToken"] = 2] = "CloseBraceToken";
  SyntaxKind2[SyntaxKind2["OpenBracketToken"] = 3] = "OpenBracketToken";
  SyntaxKind2[SyntaxKind2["CloseBracketToken"] = 4] = "CloseBracketToken";
  SyntaxKind2[SyntaxKind2["CommaToken"] = 5] = "CommaToken";
  SyntaxKind2[SyntaxKind2["ColonToken"] = 6] = "ColonToken";
  SyntaxKind2[SyntaxKind2["NullKeyword"] = 7] = "NullKeyword";
  SyntaxKind2[SyntaxKind2["TrueKeyword"] = 8] = "TrueKeyword";
  SyntaxKind2[SyntaxKind2["FalseKeyword"] = 9] = "FalseKeyword";
  SyntaxKind2[SyntaxKind2["StringLiteral"] = 10] = "StringLiteral";
  SyntaxKind2[SyntaxKind2["NumericLiteral"] = 11] = "NumericLiteral";
  SyntaxKind2[SyntaxKind2["LineCommentTrivia"] = 12] = "LineCommentTrivia";
  SyntaxKind2[SyntaxKind2["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
  SyntaxKind2[SyntaxKind2["LineBreakTrivia"] = 14] = "LineBreakTrivia";
  SyntaxKind2[SyntaxKind2["Trivia"] = 15] = "Trivia";
  SyntaxKind2[SyntaxKind2["Unknown"] = 16] = "Unknown";
  SyntaxKind2[SyntaxKind2["EOF"] = 17] = "EOF";
})(SyntaxKind || (SyntaxKind = {}));
var parse2 = parse;
var ParseErrorCode;
(function(ParseErrorCode2) {
  ParseErrorCode2[ParseErrorCode2["InvalidSymbol"] = 1] = "InvalidSymbol";
  ParseErrorCode2[ParseErrorCode2["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
  ParseErrorCode2[ParseErrorCode2["PropertyNameExpected"] = 3] = "PropertyNameExpected";
  ParseErrorCode2[ParseErrorCode2["ValueExpected"] = 4] = "ValueExpected";
  ParseErrorCode2[ParseErrorCode2["ColonExpected"] = 5] = "ColonExpected";
  ParseErrorCode2[ParseErrorCode2["CommaExpected"] = 6] = "CommaExpected";
  ParseErrorCode2[ParseErrorCode2["CloseBraceExpected"] = 7] = "CloseBraceExpected";
  ParseErrorCode2[ParseErrorCode2["CloseBracketExpected"] = 8] = "CloseBracketExpected";
  ParseErrorCode2[ParseErrorCode2["EndOfFileExpected"] = 9] = "EndOfFileExpected";
  ParseErrorCode2[ParseErrorCode2["InvalidCommentToken"] = 10] = "InvalidCommentToken";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
  ParseErrorCode2[ParseErrorCode2["InvalidUnicode"] = 14] = "InvalidUnicode";
  ParseErrorCode2[ParseErrorCode2["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
  ParseErrorCode2[ParseErrorCode2["InvalidCharacter"] = 16] = "InvalidCharacter";
})(ParseErrorCode || (ParseErrorCode = {}));
function modify(text, path5, value, options) {
  return setProperty(text, path5, value, options);
}
function applyEdits(text, edits) {
  let sortedEdits = edits.slice(0).sort((a, b) => {
    const diff = a.offset - b.offset;
    if (diff === 0) {
      return a.length - b.length;
    }
    return diff;
  });
  let lastModifiedOffset = text.length;
  for (let i = sortedEdits.length - 1; i >= 0; i--) {
    let e = sortedEdits[i];
    if (e.offset + e.length <= lastModifiedOffset) {
      text = applyEdit(text, e);
    } else {
      throw new Error("Overlapping edit");
    }
    lastModifiedOffset = e.offset;
  }
  return text;
}

// packages/cli/zzza/src/manifest.ts
var FORMAT = { insertSpaces: true, tabSize: 2, eol: "\n" };
var DEFAULT_MANIFEST_FILE = "slice.jsonc";
function manifestPath(cwd = process.cwd(), filename = DEFAULT_MANIFEST_FILE) {
  return path.join(cwd, filename);
}
function initTemplate() {
  return `{
  // Global settings for zzza.
  // This file is safe to edit by hand.
  // Comments and formatting will be preserved.
  "settings": {
    // The file generated by \`zzza build\`
    "contextFile": "slice_context.md",

    // Common generated / metadata paths are ignored by default.
    // Add paths or glob patterns zzza should ignore here
    "ignore": ["node_modules/**", "dist/**", ".git/**"],

    // File filters applied when expanding directories.
    // These are glob-lite (extension + substring based).
    "dirInclude": ["**/*.ts", "**/*.html", "**/*.css", "**/*.scss", "**/*.md"],
    "dirExclude": ["**/*.map", "**/*.min.*"],

    // Optional: token warning (estimate) for slice_context.md.
    // This is an approximation; actual truncation depends on your model/tool.
    "tokenWarn": { "modelMaxTokens": 128000, "warnAt": 0.85 },

    // Optional: generate a context tree from specific roots.
    // mode: "dirs-only" is more token-efficient than "dirs-and-files".
    // Example:
    // "tree": { "roots": ["src"], "mode": "dirs-only", "maxDepth": 6, "maxEntries": 500 }
    "tree": { "roots": [], "mode": "dirs-only", "maxDepth": 6, "maxEntries": 500 }
  },

  // Slices are named groups of files.
  // Each slice belongs to a "group" (a simple tag, often a color).
  "slices": []
}
`;
}
function ensureManifest(cwd = process.cwd()) {
  const file = manifestPath(cwd);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, initTemplate(), "utf8");
    return { file, created: true };
  }
  return { file, created: false };
}
function readManifest(file) {
  const raw = fs.readFileSync(file, "utf8");
  const data = parse2(raw);
  if (!data?.settings || !Array.isArray(data?.slices)) {
    throw new Error(`Invalid manifest shape: ${file}`);
  }
  return { raw, data };
}
function writeManifest(file, raw) {
  fs.writeFileSync(file, raw, "utf8");
}
function slugId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function uniqueSliceId(base, slices) {
  let id = base;
  let n = 2;
  while (slices.some((s) => s.id === id)) {
    id = `${base}-${n}`;
    n++;
  }
  return id;
}
function normChannel(group) {
  return group.trim().toLowerCase();
}
function relPosix(p) {
  const cleaned = (p ?? "").toString().replace(/\\/g, "/").replace(/\/+$/g, "");
  const abs = path.resolve(cleaned || ".");
  const cwd = process.cwd();
  const rel = path.relative(cwd, abs);
  const isOutside = rel.startsWith("..") || path.isAbsolute(rel);
  const out = isOutside ? abs : rel;
  return out.split(path.sep).join("/").replace(/\/+$/g, "");
}
function samePath(a, b) {
  const na = a.replace(/\\/g, "/").replace(/\/+$/g, "");
  const nb = b.replace(/\\/g, "/").replace(/\/+$/g, "");
  return na === nb;
}
function normStoredPath(p) {
  return (p ?? "").toString().replace(/\\/g, "/").replace(/\/+$/g, "");
}
function sanitizeItems(items) {
  const order = [];
  const byPath = /* @__PURE__ */ new Map();
  for (const it of items) {
    const p = normStoredPath(it.path);
    if (!p) continue;
    const existing = byPath.get(p);
    if (!existing) {
      order.push(p);
      byPath.set(p, { kind: it.kind, path: p });
      continue;
    }
    if (existing.kind === "file" && it.kind === "dir") {
      byPath.set(p, { kind: "dir", path: p });
    }
  }
  const cleaned = order.map((p) => byPath.get(p)).filter(Boolean);
  const before = items.map((i) => `${i.kind}:${normStoredPath(i.path)}`).join("|");
  const after = cleaned.map((i) => `${i.kind}:${i.path}`).join("|");
  return { items: cleaned, changed: before !== after };
}
function addToSlice(args) {
  const { manifestFile, sliceName, group, inputPaths } = args;
  let channelChanged = false;
  const { raw, data } = readManifest(manifestFile);
  const baseId = slugId(sliceName);
  const chan = normChannel(group ?? "default");
  const paths = inputPaths.map(relPosix).map((p) => p.replace(/\/+$/g, "")).filter((p) => p.length > 0);
  let slice = data.slices.find((s) => s.name === sliceName) ?? data.slices.find((s) => s.id === baseId);
  let next = raw;
  if (!slice) {
    const id = uniqueSliceId(baseId, data.slices);
    const newSlice = { id, name: sliceName, group: chan, items: [] };
    const edits = modify(next, ["slices", data.slices.length], newSlice, { formattingOptions: FORMAT });
    next = applyEdits(next, edits);
    writeManifest(manifestFile, next);
  }
  const { raw: raw2, data: data2 } = readManifest(manifestFile);
  slice = data2.slices.find((s) => s.name === sliceName) ?? data2.slices.find((s) => s.id === baseId);
  if (!slice) throw new Error("Failed to create slice");
  if (typeof group === "string" && group.trim().length > 0 && slice.group !== chan) {
    const idx2 = data2.slices.findIndex((s) => s.id === slice.id);
    const edits = modify(raw2, ["slices", idx2, "group"], chan, { formattingOptions: FORMAT });
    next = applyEdits(raw2, edits);
    writeManifest(manifestFile, next);
    channelChanged = true;
  } else {
    next = raw2;
  }
  const { raw: raw3, data: data3 } = readManifest(manifestFile);
  const idx = data3.slices.findIndex((s) => s.id === slice.id);
  const s3 = data3.slices[idx];
  const sanitized = sanitizeItems(s3.items);
  if (sanitized.changed) {
    const edits = modify(raw3, ["slices", idx, "items"], sanitized.items, { formattingOptions: FORMAT });
    const nextRaw = applyEdits(raw3, edits);
    writeManifest(manifestFile, nextRaw);
    const reread = readManifest(manifestFile);
    const sIdx = reread.data.slices.findIndex((s) => s.id === slice.id);
    const sNow = reread.data.slices[sIdx];
    s3.items = sNow.items;
  }
  const kind = args.kindOverride ?? "file";
  const filePaths = [];
  const dirPaths = [];
  for (const p of paths) {
    const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
    try {
      const st = fs.lstatSync(abs);
      if (st.isDirectory()) dirPaths.push(p);
      else filePaths.push(p);
    } catch {
      if (kind === "dir") dirPaths.push(p);
      else filePaths.push(p);
    }
  }
  const addFiles = kind === "file" ? filePaths : [];
  const addDirs = kind === "dir" ? dirPaths : kind === "file" ? dirPaths : [];
  if (addDirs.length > 0) {
    const pruned = s3.items.filter((it) => !(it.kind === "file" && addDirs.some((p) => samePath(normStoredPath(it.path), normStoredPath(p)))));
    if (pruned.length !== s3.items.length) {
      const edits = modify(raw3, ["slices", idx, "items"], pruned, { formattingOptions: FORMAT });
      const nextItemsRaw = applyEdits(raw3, edits);
      writeManifest(manifestFile, nextItemsRaw);
      const reread = readManifest(manifestFile);
      const sIdx = reread.data.slices.findIndex((s) => s.id === slice.id);
      const sNow = reread.data.slices[sIdx];
      s3.items = sNow.items;
    }
  }
  const existingFiles = new Set(s3.items.filter((i) => i.kind === "file").map((i) => i.path.replace(/\/+$/g, "")));
  const existingDirs = new Set(s3.items.filter((i) => i.kind === "dir").map((i) => i.path.replace(/\/+$/g, "")));
  const fileAdds = addFiles.filter((p) => !existingFiles.has(p)).map((p) => ({ kind: "file", path: p }));
  const dirAdds = addDirs.filter((p) => !existingDirs.has(p)).map((p) => ({ kind: "dir", path: p }));
  const toAdd = [...fileAdds, ...dirAdds];
  if (toAdd.length === 0)
    return {
      changed: channelChanged,
      added: 0,
      groupChanged: channelChanged,
      channelChanged
    };
  let out = raw3;
  const base = s3.items.length;
  for (let i = 0; i < toAdd.length; i++) {
    const edits = modify(out, ["slices", idx, "items", base + i], toAdd[i], { formattingOptions: FORMAT });
    out = applyEdits(out, edits);
  }
  writeManifest(manifestFile, out);
  return {
    changed: true,
    added: toAdd.length,
    groupChanged: channelChanged,
    channelChanged
  };
}
function removeFromSlice(args) {
  const { manifestFile, sliceName, inputPaths } = args;
  const { raw, data } = readManifest(manifestFile);
  const id = slugId(sliceName);
  const idx = data.slices.findIndex((s) => s.id === id);
  if (idx === -1) return { changed: false, removed: 0 };
  const paths = new Set(inputPaths.map(relPosix).map(normStoredPath));
  const before = data.slices[idx].items.length;
  const kept = data.slices[idx].items.filter((i) => !paths.has(normStoredPath(i.path)));
  const after = kept.length;
  if (after === before) return { changed: false, removed: 0 };
  const edits = modify(raw, ["slices", idx, "items"], kept, { formattingOptions: FORMAT });
  const next = applyEdits(raw, edits);
  writeManifest(manifestFile, next);
  return { changed: true, removed: before - after };
}
function removeSlice(args) {
  const { manifestFile, sliceName } = args;
  const { raw, data } = readManifest(manifestFile);
  const id = slugId(sliceName);
  const idx = data.slices.findIndex((s) => s.name === sliceName || s.id === id);
  if (idx === -1) return { changed: false };
  const kept = data.slices.filter((_, i) => i !== idx);
  const edits = modify(raw, ["slices"], kept, { formattingOptions: FORMAT });
  const next = applyEdits(raw, edits);
  writeManifest(manifestFile, next);
  return { changed: true };
}

// packages/cli/zzza/src/list.ts
function norm(p) {
  return (p ?? "").toString().replace(/\\/g, "/");
}
function getSlices(manifestFile) {
  const res = readManifest(manifestFile);
  return res?.data?.slices ?? [];
}
function findSlice(slices, sliceName) {
  const needle = (sliceName ?? "").trim().toLowerCase();
  return slices.find((s) => (s.id ?? "").toLowerCase() === needle) ?? slices.find((s) => (s.name ?? "").toLowerCase() === needle);
}
function sliceGroup(s) {
  return (s.group ?? "default").toString().toLowerCase();
}
function listSlicesCmd(manifestFile) {
  const slices = getSlices(manifestFile);
  if (slices.length === 0) return;
  const maxName = Math.max(...slices.map((s) => (s.name ?? s.id ?? "").length));
  for (const s of slices) {
    const name = s.name ?? s.id;
    const g = sliceGroup(s);
    console.log(`${name.padEnd(maxName, " ")} (${g})`);
  }
}
function listSliceCmd(manifestFile, sliceName) {
  const slices = getSlices(manifestFile);
  const s = findSlice(slices, sliceName);
  if (!s) {
    console.log(`Slice not found: ${sliceName}`);
    process.exitCode = 1;
    return;
  }
  for (const it of s.items ?? []) {
    const p = norm(it.path);
    if (!p) continue;
    if (it.kind === "dir") console.log(p.endsWith("/") ? p : `${p}/`);
    else console.log(p);
  }
}
function listGroupCmd(manifestFile, sliceName) {
  const slices = getSlices(manifestFile);
  const s = findSlice(slices, sliceName);
  if (!s) {
    console.log(`Slice not found: ${sliceName}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${s.name ?? s.id} \u2192 ${sliceGroup(s)}`);
}
function listGroupsCmd(manifestFile) {
  const slices = getSlices(manifestFile);
  if (slices.length === 0) return;
  const groups = /* @__PURE__ */ new Map();
  for (const s of slices) {
    const g = sliceGroup(s);
    const arr = groups.get(g) ?? [];
    arr.push(s.name ?? s.id);
    groups.set(g, arr);
  }
  const groupNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  let first = true;
  for (const g of groupNames) {
    const names = (groups.get(g) ?? []).slice().sort((a, b) => a.localeCompare(b));
    if (!first) console.log("");
    first = false;
    console.log(`${g}:`);
    for (const name of names) {
      console.log(`  - ${name}`);
    }
  }
}

// packages/cli/zzza/src/build.ts
import fs2 from "fs";
import path2 from "path";
var DIR_EXTS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".jsonc",
  ".md",
  ".txt"
]);
function globLiteExts(patterns) {
  if (!patterns || patterns.length === 0) return null;
  const exts = /* @__PURE__ */ new Set();
  for (const p of patterns) {
    const m = p.match(/\*\*\/\*\.([a-z0-9]+)$/i);
    if (m) exts.add("." + m[1].toLowerCase());
  }
  return exts.size ? exts : null;
}
function matchesExclude(rel, patterns) {
  if (!patterns) return false;
  const name = rel.toLowerCase();
  return patterns.some((p) => {
    if (p.endsWith(".map")) return name.endsWith(".map");
    if (p.includes(".min.")) return name.includes(".min.");
    return false;
  });
}
function estimateTokensFromChars(charCount) {
  return Math.ceil(charCount / 4);
}
function collectDirFiles(dirRel, includeExts, exclude) {
  const out = [];
  const stack = [dirRel];
  while (stack.length) {
    const cur = stack.pop();
    const abs = path2.isAbsolute(cur) ? cur : path2.resolve(process.cwd(), cur);
    let entries;
    try {
      entries = fs2.readdirSync(abs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const base = cur.replaceAll("\\", "/");
      const rel = (base + "/" + e.name).replaceAll("//", "/");
      if (e.isDirectory()) {
        stack.push(rel);
      } else {
        const ext = path2.extname(e.name).toLowerCase();
        if (includeExts && !includeExts.has(ext)) continue;
        if (!includeExts && !DIR_EXTS.has(ext)) continue;
        if (matchesExclude(rel, exclude)) continue;
        out.push(rel);
      }
    }
  }
  return out.sort();
}
function buildCmd(manifestFile, target) {
  const { data } = readManifest(manifestFile);
  const outFile = path2.join(process.cwd(), data.settings?.contextFile ?? "slice_context.md");
  const missingFiles = [];
  const needle = target?.trim().toLowerCase();
  const chosen = !needle ? data.slices : data.slices.some((s) => s.group.toLowerCase() === needle) ? data.slices.filter((s) => s.group.toLowerCase() === needle) : data.slices.filter((s) => s.id.toLowerCase() === needle || s.name.toLowerCase() === needle);
  if (needle && chosen.length === 0) {
    throw new Error(`Nothing matched "${target}" (group or slice)`);
  }
  const ignore = data.settings?.ignore ?? [];
  const includeExts = globLiteExts(data.settings?.dirInclude);
  const exclude = data.settings?.dirExclude ?? [];
  const treeCfg = data.settings?.tree;
  const includedFiles = Array.from(
    new Set(
      chosen.flatMap((s) => {
        const files = s.items.filter((i) => i.kind === "file").map((i) => i.path);
        const dirs = s.items.filter((i) => i.kind === "dir").flatMap((i) => collectDirFiles(i.path, includeExts, exclude));
        return [...files, ...dirs];
      })
    )
  ).sort((a, b) => a.localeCompare(b));
  function addPath(root, p) {
    const parts = p.split("/").filter(Boolean);
    let node = root;
    for (const part of parts) {
      node[part] ||= {};
      node = node[part];
    }
  }
  function renderTree(node, prefix = "") {
    const keys = Object.keys(node).sort((a, b) => a.localeCompare(b));
    const lines = [];
    keys.forEach((key, idx) => {
      const last = idx === keys.length - 1;
      const branch = last ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
      lines.push(prefix + branch + key);
      const child = node[key];
      const childKeys = Object.keys(child);
      if (childKeys.length > 0) {
        const nextPrefix = prefix + (last ? "    " : "\u2502   ");
        lines.push(...renderTree(child, nextPrefix));
      }
    });
    return lines;
  }
  let md = `<!--
This file was generated by zzza.
The following is a context map of user selected files for AI-assisted work.
Treat missing files or warnings below as signals, rather than errors.
-->

# zzza Context

`;
  md += needle ? `Built for: \`${target}\`

` : `Built for: \`all\`

`;
  md += `## Included files (${includedFiles.length})

`;
  for (const f of includedFiles) {
    md += `- \`${f}\`
`;
  }
  md += `
`;
  const treeRoot = {};
  const treeMaxDepth = treeCfg?.maxDepth ?? 6;
  const treeMaxEntries = treeCfg?.maxEntries ?? 500;
  const treeMode = treeCfg?.mode ?? "dirs-and-files";
  const ignorePrefixes = ignore.map((r) => r.trim()).filter(Boolean).map((r) => r.endsWith("/**") ? r.slice(0, -3) : r).filter((r) => !r.includes("*"));
  function isIgnored(rel) {
    const norm2 = rel.replaceAll("\\", "/");
    return ignorePrefixes.some((pfx) => norm2 === pfx || norm2.startsWith(pfx + "/"));
  }
  let treeEntries = 0;
  function walkTree(rootRel, depth) {
    if (treeEntries >= treeMaxEntries) return;
    if (depth > treeMaxDepth) return;
    const absRoot = path2.isAbsolute(rootRel) ? rootRel : path2.resolve(process.cwd(), rootRel);
    let dirents;
    try {
      dirents = fs2.readdirSync(absRoot, { withFileTypes: true });
    } catch {
      addPath(treeRoot, rootRel.replaceAll("\\", "/"));
      treeEntries++;
      return;
    }
    dirents.sort((a, b) => a.name.localeCompare(b.name));
    for (const d of dirents) {
      if (treeEntries >= treeMaxEntries) return;
      const childRel = (rootRel.replaceAll("\\", "/") + "/" + d.name).replaceAll("//", "/");
      if (isIgnored(childRel)) continue;
      if (d.isDirectory()) {
        addPath(treeRoot, childRel);
        treeEntries++;
        walkTree(childRel, depth + 1);
      } else {
        if (treeMode === "dirs-and-files") {
          addPath(treeRoot, childRel);
          treeEntries++;
        }
      }
    }
  }
  const roots = (treeCfg?.roots ?? []).map((r) => r.trim()).filter(Boolean);
  if (roots.length > 0) {
    for (const r of roots) {
      if (isIgnored(r)) continue;
      addPath(treeRoot, r.replaceAll("\\", "/"));
      treeEntries++;
      walkTree(r, 1);
    }
  } else {
    for (const p of includedFiles) addPath(treeRoot, p);
  }
  md += `## Context Tree

`;
  md += "```txt\n";
  md += ".\n";
  md += renderTree(treeRoot).join("\n") + "\n";
  md += "```\n\n";
  for (const s of chosen) {
    md += `## Slice: ${s.name} (${s.id})
`;
    md += `group: \`${s.group}\`

`;
    const fileItems = s.items.filter((i) => i.kind === "file");
    const dirItems = s.items.filter((i) => i.kind === "dir");
    for (const d of dirItems) {
      md += `### Directory: \`${d.path}\`

`;
      const expanded = collectDirFiles(d.path, includeExts, exclude);
      if (expanded.length === 0) {
        missingFiles.push(d.path);
        md += "_(missing, unreadable, or empty after filters)_\n\n";
      } else {
        md += `Expanded files (${expanded.length}):

`;
        for (const f of expanded) md += `- \`${f}\`
`;
        md += "\n";
      }
    }
    const allFiles = Array.from(
      /* @__PURE__ */ new Set([
        ...fileItems.map((i) => i.path),
        ...dirItems.flatMap((i) => collectDirFiles(i.path, includeExts, exclude))
      ])
    ).sort();
    for (const relPath of allFiles) {
      const abs = path2.isAbsolute(relPath) ? relPath : path2.resolve(process.cwd(), relPath);
      md += `### File: \`${relPath}\`

`;
      try {
        const txt = fs2.readFileSync(abs, "utf8");
        md += "```txt\n" + txt + "\n```\n\n";
      } catch {
        missingFiles.push(relPath);
        md += "_(missing or unreadable)_\n\n";
      }
    }
  }
  if (missingFiles.length > 0) {
    const warnList = missingFiles.map((p) => `\u2022 ${p}`).join("\n");
    const warnBlock = `> \u26A0\uFE0F Build warning
>
> The following files were referenced in slice.jsonc
> but could not be read at build time:
>
` + warnList.split("\n").map((line) => `> ${line}`).join("\n") + `

`;
    md = warnBlock + md;
  }
  fs2.writeFileSync(outFile, md, "utf8");
  const tw = data.settings?.tokenWarn;
  if (tw?.modelMaxTokens) {
    const warnAt = typeof tw.warnAt === "number" ? tw.warnAt : 0.85;
    const estimatedTokens = estimateTokensFromChars(md.length);
    const threshold = Math.floor(tw.modelMaxTokens * warnAt);
    if (estimatedTokens >= threshold) {
      console.log("");
      console.log("\u26A0\uFE0F Context size warning");
      console.log(`Estimated tokens: ~${estimatedTokens.toLocaleString()}`);
      console.log(
        `Configured max: ${tw.modelMaxTokens.toLocaleString()} (warnAt ${(warnAt * 100).toFixed(0)}%)`
      );
      console.log("");
      console.log("Tip: build a single slice/group, or tighten dirInclude/dirExclude.");
    }
  }
  console.log(`\u2713 Built ${path2.relative(process.cwd(), outFile)}`);
  if (missingFiles.length > 0) {
    console.log("");
    console.log(`\u26A0\uFE0F  ${missingFiles.length} file${missingFiles.length === 1 ? "" : "s"} could not be read:
`);
    for (const p of missingFiles) {
      console.log(`  \u2022 ${p}`);
      console.log(`    (path not found or unreadable)`);
    }
    console.log("");
    console.log("Tip: Run `zzza doctor` to diagnose common issues.");
  }
}

// packages/cli/zzza/src/doctor.ts
import fs3 from "fs";
import path3 from "path";
function fmt(sev) {
  if (sev === "ok") return "\u2713";
  if (sev === "warn") return "\u26A0\uFE0F ";
  return "\u2139\uFE0F ";
}
function push(findings, severity, message, detail) {
  findings.push({ severity, message, detail });
}
function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}
function normPosix(p) {
  return p.replaceAll("\\", "/");
}
function absFromCwd(relOrAbs) {
  const p = relOrAbs;
  if (path3.isAbsolute(p)) return p;
  return path3.resolve(process.cwd(), p);
}
function existsAndReadable(absPath) {
  try {
    fs3.accessSync(absPath, fs3.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
function estimateTokensFromChars2(charCount) {
  return Math.ceil(charCount / 4);
}
function safeStat(absPath) {
  try {
    return fs3.statSync(absPath);
  } catch {
    return null;
  }
}
function doctorCmd() {
  const { file, created } = ensureManifest(process.cwd());
  console.log(`Manifest: ${file} ${created ? "(created)" : "(found)"}`);
  let data = null;
  try {
    const parsed = readManifest(file);
    data = parsed.data;
  } catch (e) {
    console.log("");
    console.log("\u26A0\uFE0F  Could not read manifest.");
    console.log(`   ${String(e)}`);
    console.log("");
    console.log("Tip: Open slice.jsonc and ensure it is valid JSONC.");
    return;
  }
  const findings = [];
  const settings = data?.settings;
  if (!settings || typeof settings !== "object") {
    push(findings, "warn", "Missing or invalid settings object", [
      'Expected: "settings": { ... }'
    ]);
  } else {
    if (typeof settings.contextFile !== "string" || settings.contextFile.trim() === "") {
      push(findings, "warn", "settings.contextFile is missing or not a string", [
        'Expected: "contextFile": "slice_context.md"'
      ]);
    } else {
      push(findings, "ok", `contextFile: ${settings.contextFile}`);
    }
    if (!isStringArray(settings.ignore)) {
      push(findings, "warn", "settings.ignore is missing or not an array of strings", [
        'Expected: "ignore": ["node_modules/**", "dist/**", ".git/**"]'
      ]);
    } else {
      push(findings, "ok", `ignore rules: ${settings.ignore.length}`);
    }
    const tree2 = settings.tree;
    if (tree2 !== void 0 && tree2 !== null && typeof tree2 !== "object") {
      push(findings, "warn", "settings.tree exists but is not an object");
    } else if (tree2) {
      const mode = tree2.mode;
      if (mode !== void 0 && mode !== "dirs-only" && mode !== "dirs-and-files") {
        push(findings, "warn", `Invalid tree.mode: "${String(mode)}"`, [
          'Expected: "dirs-only" or "dirs-and-files"'
        ]);
      } else if (mode) {
        push(findings, "ok", `tree.mode: ${mode}`);
      }
      if (tree2.roots !== void 0 && !isStringArray(tree2.roots)) {
        push(findings, "warn", "settings.tree.roots is not an array of strings");
      } else if (Array.isArray(tree2.roots)) {
        push(findings, "ok", `tree.roots: ${tree2.roots.length}`);
      }
      if (tree2.maxDepth !== void 0 && typeof tree2.maxDepth !== "number") {
        push(findings, "warn", "settings.tree.maxDepth is not a number");
      }
      if (tree2.maxEntries !== void 0 && typeof tree2.maxEntries !== "number") {
        push(findings, "warn", "settings.tree.maxEntries is not a number");
      }
    }
  }
  const ignore = isStringArray(settings?.ignore) ? settings.ignore : [];
  const hasNodeModules = ignore.some((x) => normPosix(x).startsWith("node_modules"));
  const hasDist = ignore.some((x) => normPosix(x).startsWith("dist"));
  const hasGit = ignore.some((x) => normPosix(x).startsWith(".git"));
  if (ignore.length === 0) {
    push(findings, "warn", "No ignore rules configured", [
      "Common defaults:",
      '  "node_modules/**", "dist/**", ".git/**"'
    ]);
  } else {
    if (!hasNodeModules) {
      push(findings, "info", "node_modules is not ignored", [
        'Consider adding: "node_modules/**" (recommended for sane builds)'
      ]);
    }
    if (!hasDist) {
      push(findings, "info", "dist is not ignored", [
        'Consider adding: "dist/**" (recommended to avoid build artifacts)'
      ]);
    }
    if (!hasGit) {
      push(findings, "info", ".git is not ignored", [
        'Consider adding: ".git/**" (recommended to avoid repository metadata)'
      ]);
    }
  }
  const slices = Array.isArray(data?.slices) ? data.slices : [];
  if (!Array.isArray(data?.slices)) {
    push(findings, "warn", "Missing or invalid slices array", ['Expected: "slices": []']);
  } else {
    push(findings, "ok", `slices: ${slices.length}`);
  }
  let missingCount = 0;
  let unreadableCount = 0;
  let totalFiles = 0;
  for (const s of slices) {
    const sliceName = typeof s?.name === "string" ? s.name : String(s?.id ?? "unknown");
    const items = Array.isArray(s?.items) ? s.items : [];
    for (const it of items) {
      if (it?.kind !== "file" || typeof it?.path !== "string") continue;
      totalFiles++;
      const rel = normPosix(it.path);
      const abs = absFromCwd(rel);
      const st = safeStat(abs);
      if (!st) {
        missingCount++;
        push(findings, "warn", `Missing file referenced by slice "${sliceName}"`, [rel]);
        continue;
      }
      if (!existsAndReadable(abs)) {
        unreadableCount++;
        push(findings, "warn", `Unreadable file referenced by slice "${sliceName}"`, [rel]);
      }
    }
  }
  if (totalFiles > 0) {
    push(findings, "ok", `slice file references: ${totalFiles}`);
  }
  if (missingCount === 0 && unreadableCount === 0 && totalFiles > 0) {
    push(findings, "ok", "All referenced slice files are readable");
  }
  const tree = settings?.tree;
  const roots = isStringArray(tree?.roots) ? tree.roots : [];
  if (roots.length > 0) {
    for (const r of roots) {
      const rel = normPosix(r);
      const abs = absFromCwd(rel);
      const st = safeStat(abs);
      if (!st) {
        push(findings, "warn", `Tree root does not exist`, [rel]);
      } else if (!st.isDirectory()) {
        push(findings, "info", `Tree root is not a directory`, [rel]);
      } else if (!existsAndReadable(abs)) {
        push(findings, "warn", `Tree root is not readable`, [rel]);
      }
    }
  } else {
    push(findings, "info", "No tree.roots configured (Context Tree will fall back to included files)");
  }
  const contextFile = typeof settings?.contextFile === "string" ? settings.contextFile : "slice_context.md";
  const contextAbs = absFromCwd(contextFile);
  if (safeStat(contextAbs)) {
    try {
      const txt = fs3.readFileSync(contextAbs, "utf8");
      const charCount = txt.length;
      const estimatedTokens = estimateTokensFromChars2(charCount);
      push(findings, "info", "Estimated context size (last build)", [
        `~${estimatedTokens.toLocaleString()} tokens`,
        `~${Math.ceil(charCount / 1024)} KB`
      ]);
      const tw = settings?.tokenWarn;
      if (tw?.modelMaxTokens) {
        push(findings, "info", "Token warning configuration", [
          `modelMaxTokens: ${tw.modelMaxTokens.toLocaleString()}`,
          `warnAt: ${((tw.warnAt ?? 0.85) * 100).toFixed(0)}%`
        ]);
      }
    } catch {
      push(findings, "info", "Context file exists but could not be read");
    }
  } else {
    push(findings, "info", "No context file found", [
      "Run `zzza build` to generate slice_context.md"
    ]);
  }
  console.log("");
  const oks = findings.filter((f) => f.severity === "ok");
  const infos = findings.filter((f) => f.severity === "info");
  const warns = findings.filter((f) => f.severity === "warn");
  const ordered = [...warns, ...infos, ...oks];
  for (const f of ordered) {
    console.log(`${fmt(f.severity)} ${f.message}`);
    if (f.detail && f.detail.length) {
      for (const line of f.detail) console.log(`   ${line}`);
    }
  }
  console.log("");
  console.log(
    warns.length > 0 ? `Summary: ${warns.length} warning(s), ${infos.length} info` : `Summary: \u2713 no warnings (${infos.length} info)`
  );
  console.log("");
  console.log("Typing tip (strongly recommended):");
  console.log('  alias sli="zzza"');
  console.log("");
  console.log("Docs:");
  console.log("  https://jiode.one/oss/slice");
}

// packages/cli/zzza/src/text.ts
var PROGRAM_DESCRIPTION = "Focus on just a slice of your code when working with AI.";
var WELCOME = `\u{1F355} zzza initialized.

Focus on just a slice of your code when working with AI.
Or take the whole pie when you need it.

Tip: Add this alias to your terminal config for easy access:
  alias sli="zzza"

More tips:
  zzza --tips

  Jiode.One
  Widely Expected Software.
  Learn more at https://jiode.one
`;
function versionText(version) {
  return `zzza v${version} \u{1F355}

Focus on just a slice.
https://jiode.one
`;
}
var ABOUT = `zzza \u{1F355}

zzza helps you focus on just a slice of your code when working with AI.
It generates explicit, file-based context you can inspect, version, and trust.

Learn more:
  https://jiode.one/oss/slice
`;
var HELP_FOOTER = `
Tip:
  alias sli="zzza"

Docs:
  https://jiode.one/oss/slice
`;

// packages/cli/zzza/src/index.ts
var program = new Command();
var pkgPath = path4.resolve(
  path4.dirname(fileURLToPath(import.meta.url)),
  "../package.json"
);
var pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
program.version(versionText(pkg.version), "-v, --version", "Show version");
program.name("zzza").description(PROGRAM_DESCRIPTION).option("--tips", "Show the welcome message / tips");
program.hook("preAction", (_thisCmd, _actionCmd) => {
  const opts = program.opts();
  if (opts.tips) {
    console.log(WELCOME);
    process.exit(0);
  }
});
program.command("about").description("What zzza is and why it exists").action(() => {
  console.log(ABOUT);
});
program.command("init").description("Create slice.jsonc (safe to run multiple times)").action(() => {
  const { file, created } = ensureManifest(process.cwd());
  console.log(
    created ? `\u2713 zzza initialized (created ${path4.basename(file)})` : `\u2713 zzza already initialized (${path4.basename(file)} exists)`
  );
  console.log("");
  console.log(WELCOME);
});
program.command("doctor").description("Check your setup and print helpful tips").action(() => doctorCmd());
program.command("add").description("Add path(s) to a slice").argument("<slice>", "slice name").argument("<path...>", "path(s) to add").option("-c, --group <group>", "group tag (advanced)").action((slice, p, opts) => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  const filePaths = [];
  const dirPaths = [];
  for (const raw of p) {
    const abs = path4.isAbsolute(raw) ? raw : path4.resolve(process.cwd(), raw);
    try {
      if (lstatSync(abs).isDirectory()) dirPaths.push(raw);
      else filePaths.push(raw);
    } catch {
      filePaths.push(raw);
    }
  }
  let totalAdded = 0;
  let changed = false;
  let groupChanged = false;
  if (dirPaths.length > 0) {
    const resDir = addToSlice({
      manifestFile: file,
      sliceName: slice,
      group: opts.group,
      inputPaths: dirPaths,
      kindOverride: "dir"
    });
    totalAdded += resDir.added;
    changed ||= resDir.changed;
    groupChanged ||= resDir.groupChanged;
  }
  if (filePaths.length > 0) {
    const resFile = addToSlice({
      manifestFile: file,
      sliceName: slice,
      group: opts.group,
      inputPaths: filePaths
    });
    totalAdded += resFile.added;
    changed ||= resFile.changed;
    groupChanged ||= resFile.groupChanged;
  }
  if (changed) {
    if (totalAdded > 0) {
      console.log(`\u2713 Added ${totalAdded} item(s) to "${slice}"`);
    } else if (groupChanged) {
      console.log(
        `\u2713 Updated "${slice}" group to "${(opts.group ?? "default").toLowerCase()}"`
      );
    } else {
      console.log(`\u2713 Updated "${slice}"`);
    }
  } else {
    console.log(`No changes (already in "${slice}")`);
  }
});
program.command("add-dir").description("Add directory path(s) to a slice (expanded at build time)").argument("<slice>", "slice name").argument("<path...>", "directory path(s) to add").option("-c, --group <group>", "group tag (advanced)").action((slice, p, opts) => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  const res = addToSlice({
    manifestFile: file,
    sliceName: slice,
    group: opts.group,
    inputPaths: p,
    kindOverride: "dir"
  });
  if (res.changed) {
    if (res.added > 0) {
      console.log(`\u2713 Added ${res.added} dir item(s) to "${slice}"`);
    } else if (res.groupChanged) {
      console.log(
        `\u2713 Updated "${slice}" group to "${(opts.group ?? "default").toLowerCase()}"`
      );
    } else {
      console.log(`\u2713 Updated "${slice}"`);
    }
  } else {
    console.log(`No changes (already in "${slice}")`);
  }
});
program.command("group").description("Assign a slice to a group").argument("<slice>", "slice name").argument("<group>", "group name").action((slice, group) => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  const res = addToSlice({
    manifestFile: file,
    sliceName: slice,
    group,
    inputPaths: []
  });
  const g = group.trim().toLowerCase();
  if (res.groupChanged || res.channelChanged) {
    console.log(`\u2713 Updated "${slice}" group to "${g}"`);
  } else {
    console.log(`No changes ("${slice}" already in "${g}")`);
  }
});
program.command("remove").description("Remove a path from a slice").argument("<slice>", "slice name").argument("<path...>", "path(s) to remove").action((slice, p) => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  const res = removeFromSlice({ manifestFile: file, sliceName: slice, inputPaths: p });
  console.log(res.changed ? `\u2713 Removed ${res.removed} item(s) from "${slice}"` : "No changes");
});
var list = program.command("list").description("List slices, slice contents, or groups");
list.action(() => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  listSlicesCmd(file);
});
list.command("slices").description("List all slices").action(() => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  listSlicesCmd(file);
});
list.command("slice").description("List all paths included in a slice").argument("<slice>", "slice name").action((slice) => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  listSliceCmd(file, slice);
});
list.command("group").description("Show the group for a slice").argument("<slice>", "slice name").action((slice) => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  listGroupCmd(file, slice);
});
list.command("groups").description("List all groups and the slices in them").action(() => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  listGroupsCmd(file);
});
program.command("build").description("Generate slice_context.md (for all slices, or a group/slice)").argument("[target]", "optional: group name OR slice name").action((target) => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  buildCmd(file, target);
});
program.command("rmslice").description("Remove a slice entirely").argument("<slice>", "Slice name").action((slice) => {
  const manifestFile = manifestPath(process.cwd(), DEFAULT_MANIFEST_FILE);
  const res = removeSlice({ manifestFile, sliceName: slice });
  if (res.changed) {
    console.log(`\u2713 Removed slice "${slice}"`);
  } else {
    console.log("No changes (slice not found)");
  }
});
program.addHelpText("after", HELP_FOOTER);
program.parse(process.argv);

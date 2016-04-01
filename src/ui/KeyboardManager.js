/**
 * @module fw/ui/KeysManager
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */
'use strict';

var dom = require('../dom');
var ModuleError = require('../error/ModuleError');
var types = require('../types');

var key, keyCode;

var activeKey = null;
var shiftActive = false;
var ctrlActive = false;
var altActive = false;
var metaActive = false;

var keyCodes = {
    'BACKSPACE':     8,
    'TAB':           9,
    'ENTER':         13,
    'SHIFT':         16,
    'CTRL':          17,
    'ALT':           18,
    'PAUSE':         19,
    'CAPS_LOCK':     20,
    'ESCAPE':        27,
    'SPACE':         32,
    'PAGE_UP':       33,
    'PAGE_DOWN':     34,
    'END':           35,
    'HOME':          36,
    'ARROW_LEFT':    37,
    'ARROW_UP':      38,
    'ARROW_RIGHT':   39,
    'ARROW_DOWN':    40,
    'PRINT_SCREEN':  44,
    'INSERT':        45,
    'DELETE':        46,
    '0':             48,
    '1':             49,
    '2':             50,
    '3':             51,
    '4':             52,
    '5':             53,
    '6':             54,
    '7':             55,
    '8':             56,
    '9':             57,
    'a':             65,
    'b':             66,
    'c':             67,
    'd':             68,
    'e':             69,
    'f':             70,
    'g':             71,
    'h':             72,
    'i':             73,
    'j':             74,
    'k':             75,
    'l':             76,
    'm':             77,
    'n':             78,
    'o':             79,
    'p':             80,
    'q':             81,
    'r':             82,
    's':             83,
    't':             84,
    'u':             85,
    'v':             86,
    'w':             87,
    'x':             88,
    'y':             89,
    'z':             90,
    'WINDOW_LEFT':   91,
    'WINDOW_RIGHT':  92,
    'SELECT':        93,
    'NUMPAD_0':      96,
    'NUMPAD_1':      97,
    'NUMPAD_2':      98,
    'NUMPAD_3':      99,
    'NUMPAD_4':      100,
    'NUMPAD_5':      101,
    'NUMPAD_6':      102,
    'NUMPAD_7':      103,
    'NUMPAD_8':      104,
    'NUMPAD_9':      105,
    'MULTIPLY':      106,
    'ADD':           107,
    'SUBSTRACT':     109,
    'DECIMAL_POINT': 110,
    'DIVIDE':        111,
    'F1':            112,
    'F2':            113,
    'F3':            114,
    'F4':            115,
    'F5':            116,
    'F6':            117,
    'F7':            118,
    'F8':            119,
    'F9':            120,
    'F10':           121,
    'F11':           122,
    'F12':           123,
    'SCROLL_LOCK':   124,
};

dom.documentReady().then(registerKeyEvents);

function refreshKeys(e) {
    activeKey = e.which;
    shiftActive = e.shiftKey;
    altActive = e.altKey;
    metaActive = e.metaKey;
    ctrlActive = e.ctrlKey;
}

function registerKeyEvents() {
    window.addEventListener('keydown', refreshKeys, true);
    window.addEventListener('keyup', refreshKeys, true);
}

function isActive(keys) {
    keys = types.isArray(keys) ? keys : [keys];

    var counter = 0;
    var k, n, l;

    for (n = 0, l = keys.length; n < l; n++) {
        k = keys[n];

        switch(k) {
            case 'SHIFT':
                if (shiftActive) { counter++; }
                break;
            case 'ALT':
                if (altActive) { counter++; }
                break;
            case 'META':
                if (metaActive) { counter++; }
                break;
            case 'CTRL':
                if (ctrlActive) { counter++; }
                break;
            default:
                if (keyCodes[k] === activeKey) { counter++; }
        }
    }

    return counter == l; 
}

var KeysManager = {
    code:         {},
    reversedCode: {},
    isActive:     isActive
};

for (key in keyCodes) {
    keyCode = keyCodes[key];
    Object.defineProperty(KeysManager.code, key, { value: keyCode });
    Object.defineProperty(KeysManager.reversedCode, keyCode, { value: key });
}

module.exports = KeysManager;

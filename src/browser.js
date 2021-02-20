/**
 * @module fw/browser
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var Browser = {
    isRunningLocal: function() {
        return window.location.protocol === 'file:';
    },
    getProtocol: function() {
        switch (window.location.protocol) {
            case 'http:':
                return Browser.PROTOCOL_HTTP;
            case 'https:':
                return Browser.PROTOCOL_HTTPS;
            case 'file:':
                return Browser.PROTOCOL_FILE;
       }
    }
};

Object.defineProperties(Browser, {
    PROTOCOL_HTTP:  { value: 1 },
    PROTOCOL_HTTPS: { value: 2 },
    PROTOCOL_FILE:  { value: 3 },
});

module.exports = Browser;

// Fetch browser info


/*
var userAgent = navigator.userAgent,
    browserInfo = {
        name: null,
        version: null
    };

if (userAgent.indexOf('Chrome') !== -1) {
    browserInfo.name = 'chrome';
    browserInfo.version = parseFloat(userAgent.match(/Chrome\/(\d+\.\d+)/)[1], 10);
} else if (userAgent.indexOf('Safari') !== -1) {
    browserInfo.name = 'safari';
    browserInfo.version = parseFloat(userAgent.match(/Safari\/(\d+\.\d+)/)[1], 10);
} else if (userAgent.indexOf('Firefox') !== -1) {
    browserInfo.name = 'firefox';
    browserInfo.version = parseFloat(userAgent.match(/Firefox\/(\d+\.\d+)/)[1], 10);
} else if (userAgent.indexOf('Opera') !== -1) {
    browserInfo.name = 'opera';
    browserInfo.version = parseFloat(userAgent.match(/Opera\/(\d+\.\d+)/)[1], 10);
} else if (userAgent.indexOf('OPR') !== -1) {
    browserInfo.name = 'opera';
    browserInfo.version = parseFloat(userAgent.match(/OPR\/(\d+\.\d+)/)[1], 10);
} else if (userAgent.indexOf('MSIE') !== -1) {
    browserInfo.name = 'ie';
    browserInfo.version = parseFloat(userAgent.match(/MSIE.(\d+\.\d+)/)[1], 10);
} else if (userAgent.indexOf('rv') !== -1 && userAgent.indexOf('Trident') !== -1) {
    browserInfo.name = 'ie';
    browserInfo.version = parseFloat(userAgent.match(/rv.(11\.\d+)/)[1], 10);
}
*/
/**
 * Get browser info
 * @function getBrowserInfo
 * @return {Object} browserInfo - browser info
 * @return {string} browserInfo.name - browser name ("chrome", "safari", "firefox", "opera", "ie")
 * @return {number} browserInfo.version - browser version
 */
/*
getBrowserInfo: function() {
    return browserInfo;
},
*/

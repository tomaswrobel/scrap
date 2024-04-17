// Replacement for monaco-editor/esm/vs/base/common/platform.js
// Monaco Editor attempts to detect Node environment.
// However, Parcel tries to simulate Node and the simulation
// does not work with Monaco Editor's

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
declare const importScripts: (...scripts: string[]) => void;
export const userAgent = navigator.userAgent;
export const LANGUAGE_DEFAULT = 'en';
export const isWindows = userAgent.indexOf('Windows') >= 0;
export const isMacintosh = userAgent.indexOf('Macintosh') >= 0;
export const isLinux = userAgent.indexOf('Linux') >= 0;
export const isNative = false;
export const isWeb = true;
export const isWebWorker = typeof importScripts !== 'undefined';
export const webWorkerOrigin = globalThis.origin;
export const isIOS = (userAgent.indexOf('Macintosh') >= 0 || userAgent.indexOf('iPhone') >= 0) && !!navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
export const isMobile = userAgent.indexOf('Mobi') >= 0;
export const language = navigator.language;
export const setTimeout0 = setTimeout;
export const OS = (isMacintosh || isIOS ? 2 /* OperatingSystem.Macintosh */ : (isWindows ? 1 /* OperatingSystem.Windows */ : 3 /* OperatingSystem.Linux */));
let _isLittleEndian = true;
let _isLittleEndianComputed = false;
export function isLittleEndian() {
    if (!_isLittleEndianComputed) {
        _isLittleEndianComputed = true;
        const test = new Uint8Array(2);
        test[0] = 1;
        test[1] = 2;
        const view = new Uint16Array(test.buffer);
        _isLittleEndian = (view[0] === (2 << 8) + 1);
    }
    return _isLittleEndian;
}
export const isChrome = !!(userAgent && userAgent.indexOf('Chrome') >= 0);
export const isFirefox = !!(userAgent && userAgent.indexOf('Firefox') >= 0);
export const isSafari = !!(!isChrome && (userAgent && userAgent.indexOf('Safari') >= 0));
export const isEdge = !!(userAgent && userAgent.indexOf('Edg/') >= 0);
export const isAndroid = !!(userAgent && userAgent.indexOf('Android') >= 0);

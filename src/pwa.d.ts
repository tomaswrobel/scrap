/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Non-standard types for PWA integration.
 * @author Tomáš Wróbel
 */

// Installing app
interface ExtendableEvent extends Event {
    waitUntil(fn: Promise<unknown>): void;
}

interface WindowEventMap {
    install: ExtendableEvent;
    activate: ExtendableEvent;
}

// Launching files
interface LaunchParams {
    targetURL?: string;
    files: readonly (FileSystemFileHandle | FileSystemDirectoryHandle)[];
}

interface LaunchConsumer {
    (params: LaunchParams): any;
}

interface LaunchQueue {
    setConsumer(consumer: LaunchConsumer): void;
}

declare var LaunchParams: {
    prototype: LaunchParams;
};

declare var LaunchQueue: {
    prototype: LaunchQueue;
};

declare var launchQueue: LaunchQueue;
/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Service worker for Scrap PWA.
 * @author Tomáš Wróbel
 */
import {manifest, version} from '@parcel/service-worker';

async function install() {
    const cache = await caches.open(version);
    await cache.addAll(manifest);
}

addEventListener('install', e => e.waitUntil(install()));

async function activate() {
    const keys = await caches.keys();
    await Promise.all(
        keys.map(key => key !== version && caches.delete(key))
    );
}

addEventListener('activate', e => e.waitUntil(activate()));
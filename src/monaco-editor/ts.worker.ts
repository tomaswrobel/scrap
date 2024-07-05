/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT [from-monaco-editor]
 * @author Microsoft Corporation
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Just remapped imports.
 */
import {initialize} from 'monaco-editor/worker';
import {TypeScriptWorker, create} from './tsWorker';
import ts from 'typescript';

self.onmessage = () => {
    // ignore the first message
    initialize(create);
};

export {TypeScriptWorker, create, initialize, ts};
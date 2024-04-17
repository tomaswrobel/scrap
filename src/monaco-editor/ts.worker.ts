/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {initialize} from 'monaco-editor/worker';
import {TypeScriptWorker, create} from './tsWorker';
import ts from 'typescript';

self.onmessage = () => {
    // ignore the first message
    initialize(create);
};

export {TypeScriptWorker, create, initialize, ts};
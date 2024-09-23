/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Typings for the glob import
 * @author Tomáš Wróbel
 */

/** The blocks modules. */
declare const blocks: {
    [name: string]: {
        /**
         * The block definition
         * 
         * If there is an `init` function, 
         * it's a dynamic block, 
         * mutator otherwise. 
         */
        MIXIN: {};

        /** The mutator's blocks. */
        blocks?: string[];

        /** There shouldn't be a default export. */
        default: never;
    };
};

export = blocks;
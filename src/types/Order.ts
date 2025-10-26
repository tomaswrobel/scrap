/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Order enum
 * @copyright Tomáš Wróbel 2025
 */

import {Enum} from "@scrap/utils/Enum";

export const Order = new Enum({
	ATOMIC: 0, // 0 "" ...
	NEW: 1.1, // new
	MEMBER: 1.2, // . []
	FUNCTION_CALL: 2, // ()
	INCREMENT: 3, // ++
	DECREMENT: 3, // --
	BITWISE_NOT: 4.1, // ~
	UNARY_PLUS: 4.2, // +
	UNARY_NEGATION: 4.3, // -
	LOGICAL_NOT: 4.4, // !
	TYPEOF: 4.5, // typeof
	VOID: 4.6, // void
	DELETE: 4.7, // delete
	AWAIT: 4.8, // await
	EXPONENTIATION: 5.0, // **
	MULTIPLICATION: 5.1, // *
	DIVISION: 5.2, // /
	MODULUS: 5.3, // %
	SUBTRACTION: 6.1, // -
	ADDITION: 6.2, // +
	BITWISE_SHIFT: 7, // << >> >>>
	RELATIONAL: 8, // < <= > >=
	IN: 8, // in
	INSTANCEOF: 8, // instanceof
	EQUALITY: 9, // == != === !==
	BITWISE_AND: 10, // &
	BITWISE_XOR: 11, // ^
	BITWISE_OR: 12, // |
	LOGICAL_AND: 13, // &&
	LOGICAL_OR: 14, // ||
	CONDITIONAL: 15, // ?:
	ASSIGNMENT: 16, // : += -= **= *= /= %= <<= >>= ...
	YIELD: 17, // yield
	COMMA: 18, // ,
	NONE: 99, // (...)
});
export type Order = Enum.Infer<typeof Order>;

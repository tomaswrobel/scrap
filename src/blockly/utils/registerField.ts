import * as Blockly from "blockly/core";

export function registerField(name: string) {
	return function <Class extends Blockly.fieldRegistry.RegistrableField>(
		_value: Class,
		context: ClassDecoratorContext<Class>,
	) {
		context.addInitializer(function () {
			Blockly.fieldRegistry.register(name, this);
		});
	};
}

// Classic scenario
self.whenFlag(() => {
    self.effects.brightness = 0;
    self.whenKeyPressed("any", () => {
        self.clearEffects();
        self.effects.brightness = 100;
        self.wait(1);
        self.effects.brightness = 0;
    });
});

// ECMAScript APIs
// Better than built-in, right?
const fiveString = String(5); 
const fiveNumber = Number("5");
const one = Number(true);

// Arrays infer types
const array = new Array(5, "30", false);
const numberArray = new Array(5, 5, 40);
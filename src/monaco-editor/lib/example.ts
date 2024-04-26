self.whenFlag(() => {
    self.effects.brightness = 0;
    self.whenKeyPressed("any", () => {
        self.clearEffects();
        self.effects.brightness = 100;
        self.wait(1);
        self.effects.brightness = 0;
    });
});
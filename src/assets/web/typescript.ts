self.whenFlag(() => {
	self.penDown();
	for (let i = 1; i <= 10; i++) {
		self.move(i);
	}
	self.penUp();
});

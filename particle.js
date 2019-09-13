class Particle extends Circle {

	constructor(x, y, r) {
		super(x, y, r);

		this.maxSpeed = 4;
		this.mass = this.r / 100;
		this.frictionCoeff = 100;

		this.vel = new Vector(0, 0);
		this.acc = new Vector(0, 0);

		this.color = Color(255);
	}

	update() {
		this.vel.mult(this.frictionCoeff / 100);
		this.vel.add(this.acc);
		this.acc.set(0, 0);
		if (this.maxSpeed !== undefined) this.vel.limit(this.maxSpeed);
		this.pos.add(this.vel);
	}

	render() {
		noStroke();
		fill(this.color);
		ellipse(this.pos.x, this.pos.y, this.r * 2);
	}

	applyForce(force) {
		if (force) {
			this.acc.add(force.copy().div(this.mass));
			if ((!Options || !Options.Debug.showForce)) return;
			stroke(0, 0, 255);
			force.mult(100);
			line(this.pos.x, this.pos.y, this.pos.x + force.x, this.pos.y + force.y);
		}
	}
}
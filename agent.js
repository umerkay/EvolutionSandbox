class Agent extends Particle {

	constructor(genes, x, y, options = {}) {
		super(x, y);
		const r = (options.avgRadius) ? random(options.avgRadius * (1 - options.radiusDeviation / 100), options.avgRadius * (1 + options.radiusDeviation / 100)) : 0;
		Object.assign(this, {
			r: r > 0 ? r : 5,
			massCoeff: 30,
			maxSpeed: 8,
			maxForce: 8 / 10,
			frictionCoeff: 90,

			decayAvg: 20,
			decayDeviation: 15,

			maxHitpoints: 20,
			maxHungerSaturation: 100
		});
		Object.assign(this, options);
		this.genes = genes;
		let { perceptionCoeff, nose } = this.genes;
		if(!nose) nose = this.nose;

		this.mass = this.r / this.massCoeff;
		this.perceptionRadius = this.r * perceptionCoeff;

		this.hitpoints = this.maxHitpoints;
		this.hungerSaturation = this.maxHungerSaturation;

		this.noseXoff = sqrt((nose) ** 2 - 1) / nose * this.r;
		this.noseYoff = 1 / nose * this.r;

		this.tasks = [];
	}

	//inheritance with genes

	extractProperties(values) {
		Object.assign(this, values);
	}

	isOfTypeSelf(peer) {
		return peer instanceof Agent
	}

	isHungry() {
		return this.hungerSaturation <= this.maxHungerSaturation * 3 / 4 || this.hitpoints < this.maxHitpoints
	}

	act(peerTree) {
		const { pos, r, perceptionRadius, cohesionPriority, seperationPriority, constrainPriority } = this;

		const inPerception = peerTree.retrieveFromRadius(pos.x, pos.y, perceptionRadius, this.isOfTypeSelf);
		this.inPerception = inPerception.length;

		if (this.tasks.length === 0) {
			if (this.isHungry()) this.stroll()
			else if (inPerception.length <= 2) this.stroll(() => this.inPerception > 2);
			else {
				this.cohesion(inPerception, cohesionPriority / 100);
				const colliding = peerTree.retrieveFromRadius(pos.x, pos.y, r, this.isOfTypeSelf);
				this.seperate(colliding, seperationPriority / 100);
			}
		}

		const collidingFood = EatablesTree.retrieveFromRadius(pos.x, pos.y, r, food => this.genes.preferences[food.type] > 0);
		collidingFood.forEach(food => food.onEat(this));

		if (!this.seeking && this.isHungry()) {
			const foodInPerception = EatablesTree.retrieveFromRadius(pos.x, pos.y, perceptionRadius, food => this.genes.preferences[food.type] > 0);
			if (foodInPerception.length > 0) {
				this.approachEatables(foodInPerception);
			}
		}

		for (let i = this.tasks.length - 1; i >= 0; i--) {
			if (this.tasks[i].isComplete()) {
				this.tasks.splice(i, 1);
			} else {
				this.tasks[i].perform();
			}
		}
		// console.log(Options.Debug.fleeMouse);
		if (Options.Debug.fleeMouse) this.flee(mouse, Options.Debug.fleeMouse / 100);

		// this.constrain(constrainPriority / 100);
		this.relay();
	}

	stroll(abandonFunction) {
		this.strolling = new ReachTask((this.strollPriority / 100) || 0.1 ,
			{ pos: new Vector(random(width * 0.1, width * 0.9), random(height * 0.1, height * 0.9)) }, 72,
			() => this.strolling = null,
			abandonFunction
		);
		this.assign(this.strolling);
	}

	assign(task) {
		if (task instanceof Task) {
			this.tasks.push(task);
			task.doer = this;
		}
	}

	isInPerception({ pos }) {
		return dist(this.pos, pos) <= this.perceptionRadius;
	}

	sync() {
		this.hungerSaturation -= random(this.decayAvg * ((100 + this.decayDeviation) / 100), this.decayAvg * ((100 - this.decayDeviation) / 100)) / 100;
		this.hungerSaturation = max(0, this.hungerSaturation);
		if (this.hungerSaturation <= 0) {
			this.hitpoints -= random(this.decayAvg * ((100 + this.decayDeviation) / 100), this.decayAvg * ((100 - this.decayDeviation) / 100)) / 100;
			this.color.a = (this.hitpoints / this.maxHitpoints) + 0.25;
		}
		if (random(1) < 0.1) {
			this.r += this.growthRate / 1000;
			this.perceptionRadius = this.r * this.genes.perceptionCoeff;
			this.noseXoff = sqrt((this.genes.nose) ** 2 - 1) / this.genes.nose * this.r;
			this.noseYoff = 1 / this.genes.nose * this.r;
		}
	}

	render() {
		const { nose } = this.genes;
		save();
		noStroke();
		// fill((this.hitpoints < this.maxHitpoints && mySketch._frames === 1) ? red : this.color);
		fill(this.color);
		translate(this.pos.x, this.pos.y);
		ellipse(0, 0, this.r);
		rotate(Math.atan2(this.vel.y, this.vel.x) + PI / 2);
		triangle(0, -this.r * nose, -this.noseXoff, -this.noseYoff, this.noseXoff, -this.noseYoff);
		restore();

		if (Options.Debug.showStrolling && this.strolling) {
			fill(0, 0.5);
			stroke(0, 0.5);
			line(this.pos.x, this.pos.y, this.strolling.seekee.pos.x, this.strolling.seekee.pos.y);
			ellipse(this.strolling.seekee.pos.x, this.strolling.seekee.pos.y, 2);
		}

		if (Options.Debug.showFoodPreferences) {
			const { preferences } = this.genes;
			for (let key in preferences) {
				if (preferences[key] <= 0) continue;
				const color = EatableTypes.find(type => type.type === key).fillColor;
				stroke(color);
				color.a = 0.5;
				fill(color);
				ellipse(this.pos.x, this.pos.y, preferences[key] * this.r);
			}
		}

		if (Options.Debug.showPerceptionRadius) {
			noFill();
			stroke(0);
			ellipse(this.pos.x, this.pos.y, this.perceptionRadius);
		}

		if (Options.Debug.showVel) {
			stroke(0, 255, 0);
			line(this.pos.x, this.pos.y, this.pos.x + 10 * this.vel.x, this.pos.y + 10 * this.vel.y);
		}

		if (Options.Debug.showHungerSaturation) {
			stroke(orange); noFill();
			ellipse(this.pos.x, this.pos.y, this.hungerSaturation / this.maxHungerSaturation * this.r * 0.9);
		}
	}

	reproduce() {
		var child = new Agent(copyGenes(this.genes), this.pos.x, this.pos.y, Options.Initial);
		child.vel = this.vel.copy().add(1).mult(5);
		// console.log(this.genes, child.genes);
		return child;
	}

	approachEatables(eatables) {
		let closestD = Infinity;
		let closestI = null;

		for (let i = 0; i < eatables.length; i++) {
			const d = dist(this.pos.x, this.pos.y, eatables[i].pos.x, eatables[i].pos.y);
			if (d < closestD) {
				closestD = d;
				closestI = i;
			}
		}

		if (closestI) {
			const food = eatables[closestI];
			this.strolling && this.strolling.markComplete();
			this.seeking = new SeekTask(this.genes.preferences[food.type], food, null, () => this.seeking = null);
			this.assign(this.seeking);
		}
	}

	// stroll() {

	// 	if (this.strollTo.x == null) {
	// 		// this.strollTo.x = random(width);
	// 		// this.strollTo.y = random(height);
	// 		var ran = -1 * random(50, 100);
	// 		this.strollTo.x = Math.max(0, Math.min(width, this.acc.x * ran + this.pos.x));
	// 		this.strollTo.y = Math.max(0, Math.min(height, this.acc.y * ran + this.pos.y));
	// 	}

	// 	var desired = p5.Vector.sub(this.strollTo, this.pos);

	// 	if (desired.mag() < this.actionRange) {
	// 		this.strollTo.x = random(width);
	// 		this.strollTo.y = random(height);
	// 	}

	// 	desired.limit(this.maxSpeed);
	// 	this.steer(desired);
	// }

	relay() {
		if (this.pos.x > width) { this.pos.x = 0; return true; }
		if (this.pos.x < 0) { this.pos.x = width; return true; }
		if (this.pos.y < 0) { this.pos.y = height; return true; }
		if (this.pos.y > height) { this.pos.y = 0; return true; }
	}

	steer(direction, priority = 1) { //try to steer in a particular direction
		const mag = direction.mag();
		if (!mag) return;
		this.applyForce(Vector
			.sub(direction, this.vel)
			.limit(this.maxForce)
			.mult(priority)
		);
	}

	seek(target, priority) { //seek a particular target
		this.steer(Vector.sub(target.pos || target, this.pos), priority);
	}

	reach(target, priority, dist = this.perceptionRadius) {
		let desired = Vector.sub(target.pos || target, this.pos);
		if (desired.magSq() >= dist ** 2) {
			this.steer(desired, priority);
		} else {
			const d = desired.mag() * this.maxSpeed / dist;
			if (desired.mag() < dist) return true;
			this.steer(desired.setMag(d));
		}
	}

	flee(target, priority) {
		let desired = Vector.sub(this.pos, target.pos);
		if (desired.magSq() < this.perceptionRadius ** 2)
			this.seek(target.pos, priority * -1);
	}

	// stop(d = 0) {
	// 	console.log(d);
	// 	// this.steer(Vector.mult(this.vel, this.mass / (d + 1)));
	// 	// this.steer(this.vel.copy().setMag(-this.vel.mag() / (2 * d)));
	// 	this.steer()
	// }

	follow(field, priority) {
		if (field.contains(this)) {
			this.steer(field.getElement(this.pos.x, this.pos.y), priority);
		}
	}

	align(peers, priority) {
		let sum = new Vector();
		let count = 0;

		peers.forEach(peer => {
			if (peer !== this) {
				sum.add(peer.vel);
				count++;
			}
		});

		if (count > 0) {
			this.steer(sum, priority);
		}
	}

	seperate(peers, priority) {
		const sum = new Vector();
		let count = 0;

		peers.forEach(peer => {
			if (peer !== this) {
				const diff = Vector.sub(this.pos, peer.pos);
				sum.add(diff);
				count++;
			}
		});

		if (count > 0) {
			this.steer(sum.setMag(this.maxForce), priority);
		}
	}

	cohesion(peers, priority) {
		const sum = new Vector();
		let count = 0;

		peers.forEach(peer => {
			const diff = Vector.sub(this.pos, peer.pos);
			if (peer !== this && diff.magSq() >= (this.r + peer.r) ** 2) {
				sum.add(peer.pos);
				count++;
			}
		});

		if (count > 0) {
			this.reach(sum.div(count), priority, this.r * 4);
		}
		return count;
	}

	constrain(priority) {
		if (this.pos.x < this.perceptionRadius) {
			this.steer(new Vector(this.maxSpeed, this.vel.y, priority));
		}
		else if (this.pos.x > width - this.perceptionRadius) {
			this.steer(new Vector(-this.maxSpeed, this.vel.y, priority));
		}
		else if (this.pos.y < this.perceptionRadius) {
			this.steer(new Vector(this.vel.x, this.maxSpeed, priority));
		}
		else if (this.pos.y > height - this.perceptionRadius) {
			this.steer(new Vector(this.vel.x, -this.maxSpeed, priority));
		}
	}
}

function triangle(x1, y1, x2, y2, x3, y3) {
	const ctx = Sketches.curr.currentCtx;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x3, y3);

	if (ctx.doFill !== false) ctx.fill();
	if (ctx.doStroke !== false) ctx.stroke();
}
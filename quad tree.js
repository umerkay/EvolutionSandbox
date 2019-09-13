class Branch extends Rectangle {

	constructor(x = width / 2, y = width / 2, w = width / 2, h = width / 2, limit = 5) {
		super(x, y, w, h);

		this.leaves = [];
		this.branches = [];
		this.divided = false;

		this.limit = limit;
	}

	push(item) {
		try {
			if (this.contains(item)) {

				if (!this.divided && this.leaves.length < this.limit) {

					this.leaves.push(item);
					return true;
				} else {

					if (!this.divided) this.divide();

					for (let branch of this.branches) {
						if (branch.push(item)) {
							this.leaves.push(item);
							return true;
						}
					}
				}
			}
		} catch (err) {
			console.warn(err);
			return true;
		}
	}

	pushMultiple(...items) {
		items.forEach(item => this.push(item));
	}

	retrieveFromShape(shape, arr = []) {
		if (this.isEngulfedByShape(shape)) {
			arr.push(...this.leaves);

		} if (this.intersects(shape)) {
			if (!this.divided)
				arr.push(...this.leaves.filter(leave => shape.contains(leave)));
			else
				this.branches.forEach(branch => branch.applyQuery(shape, arr));
		}
		return arr;
	}

	retrieveFromRadius(x, y, r, filter, arr = []) {
		if (this.isEngulfedByCircle(x, y, r)) {
			if(filter) arr.push(...this.leaves.filter(filter));
			else arr.push(...this.leaves);

		} else if (this.intersectsCircle(x, y, r)) {
			if (!this.divided) { //takes in filter function
				// arr.push(...this.leaves.filter(leave => Circle.contains(x, y, r, leave.pos.x, leave.pos.y)));
				arr.push(...this.leaves.filter(leave => ((!filter || filter(leave)) && leave.intersectsCircle(x, y, r))));
			} else {
				this.branches.forEach(branch => branch.retrieveFromRadius(x, y, r, filter, arr));
			}
		}
		return arr;
	}

	retrieveFromBox(x, y, w, h, arr = []) {
		if (this.isEngulfedByRect(x, y, w / 2, h / 2)) {
			arr.push(...this.leaves);

		} else if (this.intersectsRect(x, y, w / 2, h / 2)) {
			if (!this.divided)
				arr.push(...this.leaves.filter(leave => Rectangle.contains(x, y, w / 2, h / 2, leave.pos.x, leave.pos.y)));
			// arr.push(...this.leaves.filter(leave => leave.intersectsRect(x,y,w/2,h/2)));
			else
				this.branches.forEach(branch => branch.retrieveFromBox(x, y, w, h, arr));
		}
		return arr;
	}

	//write new query/filter function that takes function and returns all objects who ret true

	divide() {

		this.branches.push(new Branch(this.pos.x + this.w / 2, this.pos.y - this.h / 2, this.w / 2, this.h / 2, this.limit));
		this.branches.push(new Branch(this.pos.x - this.w / 2, this.pos.y - this.h / 2, this.w / 2, this.h / 2, this.limit));
		this.branches.push(new Branch(this.pos.x - this.w / 2, this.pos.y + this.h / 2, this.w / 2, this.h / 2, this.limit));
		this.branches.push(new Branch(this.pos.x + this.w / 2, this.pos.y + this.h / 2, this.w / 2, this.h / 2, this.limit));
		this.divided = true;

		this.leaves.forEach(leave => {
			this.branches.forEach(branch => {
				branch.push(leave);
			});
		});
	}

	empty(arr = []) {
		if (!this.divided) {
			arr.push(...this.leaves);
			this.leaves = [];
		} else {
			this.branches.forEach(branch => branch.empty(arr));
			this.branches = [];
			this.divided = false;
		}
		return arr;
	}

	render() {

		noFill();
		stroke(0);
		strokeWeight(1);
		rectMode('CENTER');
		rect(this.pos.x, this.pos.y, this.w * 2, this.h * 2);

		if (this.divided) {
			for (let branch of this.branches) {
				branch.render();
			}
		}

	}

	isEngulfedByShape(shape) {
		if (shape instanceof Circle) return this.isEngulfedByCircle(shape.pos.x, shape.pos.y, shape.r)
		if (shape instanceof Rectangle) return this.isEngulfedByRect(shape.pos.x, shape.pos.y, shape.w, shape.h)
		else throw new Error("Expected Circle of Rectangle as shape.");
	}

	isEngulfedByCircle(x, y, r) {
		return !(
			distSq(this.pos.x + this.w, this.pos.y + this.h, x, y) > r ** 2 ||
			distSq(this.pos.x + this.w, this.pos.y - this.h, x, y) > r ** 2 ||
			distSq(this.pos.x - this.w, this.pos.y + this.h, x, y) > r ** 2 ||
			distSq(this.pos.x - this.w, this.pos.y - this.h, x, y) > r ** 2
		);
	}

	isEngulfedByRect(x, y, w, h) {
		return !(
			x - w > this.pos.x - this.w ||
			x + w < this.pos.x + this.w ||
			y + h < this.pos.y + this.h ||
			y - h > this.pos.y - this.h
		);
	}

	forEach(f) {
		if (this.divided) {
			for (let branch of this.branches) {
				branch.forEach(f);
			}
		} else {
			for (let leave of this.leaves) {
				f(leave);
			}
		}
	}
}

class Tree extends Branch {

	constructor(x, y, w, h, limit, maxTier = 4) {
		super(x, y, w, h, limit);
		this.allLeaves = [];
		this.maxTier = maxTier;
		this.maxSize = 0;
	}

	restructure(newleaves = this.allLeaves) {
		this.allLeaves = newleaves;
		this.branches = [];
		this.leaves = [];
		this.allLeaves_ = [];
		this.divided = false;
		this.pushMultiple(...this.allLeaves);
	}

	clear() {
		this.allLeaves = [];
		this.empty();
	}

	add(...items) {
		for (let item of items) {
			this.allLeaves.push(item);
			this.push(item);
			if (item.r > this.maxSize) this.maxSize = item.r;
		}
	}
}
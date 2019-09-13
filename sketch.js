let mySketch;
let EntityTree, EatablesTree;
function run() {

	mySketch = new Sketch({ width: 'inherit', height: 'inherit', container: 'output' })
		.init(function () {
			background(50);
			frameRate(30);
			mouse.pos = mouse.position; //alias for internal use

			EntityTree = new Tree(width / 2, height / 2, width / 2, height / 2, 4); //create Quad Tree for storing everything
			for (let i = 0; i < (Options.Initial.totalAgents); i++) {
				EntityTree.add(new Agent(buildGenes(Options.Genes), random(width), random(height), Options.Initial)); //initiate 
			}

			EatablesTree = new Tree(width / 2, height / 2, width / 2, height / 2, 5);
			for (let i = 0; i < (Options.Initial.totalEatables); i++) {
				EatablesTree.add(Eatable.randomNew()); //initiate 
			}

			if (this._loop) this._loop();
		})
		.loop(function () {

			if (this._frames === 0) {
				el = document.querySelector('[for=frameRate]');
				// if (document.activeElement !== el)
				el.innerHTML = 'frameRate ' + frameRate() + '/';
			}

			background(50);
			const eatables = EatablesTree.allLeaves;
			for (let i = eatables.length - 1; i >= 0; i--) {
				const eatable = eatables[i];
				if (eatable.doRemove) {
					eatable.removed = true;
					eatables.splice(i, 1);
					eatables.push(Eatable.fromType(eatable.type));
					continue;
				}
				eatables[i].render();
			}

			const agents = EntityTree.allLeaves;

			agents.forEach(point => {
				// point.extractProperties(Options.Agent);
				point.act(EntityTree);
			});

			for (let i = agents.length - 1; i >= 0; i--) {
				const point = agents[i];
				point.sync();
				point.update();
				if (point.hitpoints <= 0) {
					point.removed = true;
					agents.splice(i, 1);
					agents.push(agents.length > 0 && agents[Math.floor(random(agents.length))].reproduce());
					continue;
				}
				point.render();
			}

			EatablesTree.restructure();
			EntityTree.restructure();
			if (Options.Debug.showQuadTree) EntityTree.render();
		});

	mySketch.reset = () => {
		mySketch.init(mySketch._init);
	}

	Sketches.loop();
}

function buildGenes(options) {
	let obj = {};
	for (let key in options) {
		let diff = 1;
		diff = (1 + random(-Options.Initial.geneticVariation, Options.Initial.geneticVariation) / 100);
		obj[key] = options[key] * diff;
	}
	obj.preferences = {};
	for (type of EatableTypes) {
		obj.preferences[type.type] = random(0.1, 1) * [-1, 1][floor(random(2))];
	}
	return obj;
}

function copyGenes(options) {
	return copyObj(options, Options.Initial.mutationFactor, Options.Initial.mutationRate);
}

function copyObj(obj, deviation = 25, rate) {
	let obj2 = {};
	for (let key in obj) {
		if (obj[key] instanceof Object) {
			obj2[key] = copyObj(obj[key], deviation, rate);
		} else {
			let diff = 1;
			if (random(100) < rate)
				diff = (1 + random(-deviation, deviation) / 100);
			obj2[key] = obj[key] * diff;
		}
	}
	return obj2;
}
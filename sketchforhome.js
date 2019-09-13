let mySketch;
let Options = null;
let Mouse;

class HomeAgent extends Agent {

    constructor(...args) {
        super(...args);
    }

    act(peerTree) {
        const { pos, r, perceptionRadius } = this;

        const inPerception = peerTree.retrieveFromRadius(pos.x, pos.y, perceptionRadius); this.inPerception = inPerception.length;
        this.inPerception = inPerception;

        if (this.tasks.length === 0) {
            if (inPerception.length <= 2) this.stroll(() => this.inPerception > 2);
            else {
                this.cohesion(inPerception, 0.5);
                this.align(inPerception, 0.1);
            }
        }
        for (let i = this.tasks.length - 1; i >= 0; i--) {
            if (this.tasks[i].isComplete()) {
                this.tasks.splice(i, 1);
            } else {
                this.tasks[i].perform();
            }
        }


        const colliding = peerTree.retrieveFromRadius(pos.x, pos.y, r);
        this.seperate(colliding, 0.2);
        // this.flee(Mouse, 0.8);

        this.relay();
    }

    render() {
        const { nose } = this;
        save();
        noStroke();
        fill(this.color);
        translate(this.pos.x, this.pos.y);
        ellipse(0, 0, this.r);
        rotate(Math.atan2(this.vel.y, this.vel.x) + PI / 2);
        triangle(0, -this.r * nose, -this.noseXoff, -this.noseYoff, this.noseXoff, -this.noseYoff);
        restore();
    }
}

mySketch = new Sketch({ width: 'inherit', height: 'inherit', container: 'output2' })
    .init(function () {
        
        Mouse = this.mouse;
        Mouse.pos = this.mouse.position; //alias for internal use

        EntityTree = new Tree(width / 2, height / 2, width / 2, height / 2, 4); //create Quad Tree for storing everything
        for (let i = 0; i < (50); i++) {
            EntityTree.add(new HomeAgent({ perceptionCoeff: 5 }, random(width), random(height), { nose: 2, r: 10, color: Color(100) })); //initiate 
        }
    })
    .loop(function () {
        background(255);

        Mouse = this.mouse;

        const agents = EntityTree.allLeaves;

        agents.forEach(point => {
            point.act(EntityTree);
        });

        for (let i = agents.length - 1; i >= 0; i--) {
            const point = agents[i];
            point.update();
            point.render();
        }

        EntityTree.restructure();
    });

Sketches.loop();
class Eatable extends Circle {
    constructor(type, x, y) {
        super(x, y, abs(3));
        Object.assign(this, type);
    }

    onEat(eater) {
        if (this.doRemove) return;
        if (eater.hungerSaturation >= eater.maxHungerSaturation * 2) return;
        if (eater.hungerSaturation <= 0 || eater.hitpoints < eater.maxHitpoints) {
            eater.hitpoints = min(eater.maxHitpoints, this.nutrition + eater.hitpoints);
        } else {
            eater.hungerSaturation += this.nutrition;
        }
        this.doRemove = true;
        this.removed = true;
    }

    render() {
        fill(this.fillColor);
        noStroke();
        ellipse(this.pos.x, this.pos.y, this.r);
    }

    static randomNew() {
        return new Eatable(randomFrom(EatableTypes), random(width), random(height));
        // return new Eatable(randomFrom(EatableTypes), random(width * 0.1, width * 0.9), random(height * 0.1, height * 0.9));
    }

    static fromType(param) {
        return new Eatable(EatableTypes.find(type => type.type === param), random(width), random(height));
        // return new Eatable(EatableTypes.find(type => type.type === param), random(width * 0.1, width * 0.9), random(height * 0.1, height * 0.9));
    }
}

EatableTypes = [
    {
        type: 'positron',
        nutrition: 0.5,
        fillColor: Color(50, 255, 50),
        rarity: 0.3,
        preference: 0.4,
    },
    {
        type: 'poison',
        nutrition: -2,
        fillColor: Color(255, 50, 50),
        rarity: 0.7,
        preference: 0.4,
    },
    // {
    //     type: 'resion',
    //     nutrition: 0,
    //     fillColor: Color(0, 0, 255),
    //     rarity: 0,
    //     preference: 0.2,
    // },
];

function randomFrom(a, prop = 'rarity') {
    var index = 0;
    var r = random(1);

    while (r > 0) {
        r -= a[index][prop];
        index++;
    }

    index--;
    return a[index];
};
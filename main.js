window.onload = loaded;
const __mouseClickPos = { x: 0, y: 0 };

const optionsToBuild = {
    Debug: {
        config: {
            autoReset: false,
            inputEvt: 'input',
            exclude: true
        },
        pause: {
            type: 'checkbox', checked: false,
            onChange: (value) => value ? mySketch.stopLoop() : mySketch.doLoop(),
            exclude: true,
            title: 'Pause the simulation'
        },
        toggleAll: {
            type: 'checkbox', checked: false,
            title: 'Show debugging aids: Overrides all other show options in the debug category',
            exclude: true,
            onChange: checked => {
                for (let key in Options.Debug) {
                    if (optionsToBuild.Debug[key].exclude) continue;
                    const el = document.getElementsByName(key)[0];
                    el.checked = checked;
                    el.dispatchEvent(new Event('click'));
                }
            }
        },
        showFoodPreferences: {
            type: 'checkbox', checked: true,
            title: 'Shows food preferences of each agent as a correspondingly colored circle over the agent body; in the case of multiple food preferences, these will overlap. Radius is proportional to the magnitude of preference'
        },
        showHungerSaturation: {
            type: 'checkbox', checked: false,
            title: 'The hunger saturation of agents is shown as an orange circle around the agents, with radius corresponding to the saturation level of their hunger'
        },
        showStrolling: {
            type: 'checkbox', checked: false,
            title: 'Show strolling target. Agents will stroll when they are lonely or hungry, until they are not lonely or have found food respectively'
        },
        showPerceptionRadius: {
            type: 'checkbox', checked: false,
            title: 'Show perception radius: Every agent has a limited perception radius, and can only perform actions such as cohesion and alignment with peers inside this radius'
        },
        showQuadTree: {
            type: 'checkbox', checked: false,
            title: 'The agents are not stored in a simple array, but a QuadTree data structure which makes collision detection and other behaviours more efficient for a greater number of total agents'
        },
        showForce: {
            type: 'checkbox', checked: false,
            title: 'Show Force: The force as applied to each agent is shown as a blue line, of length corresponding to magnitude'
        },
        showVel: {
            type: 'checkbox', checked: false,
            title: 'Show Velocity: The velocity of each agent is shown as a green line, of length corresponding to magnitude. This velocity is always in the direction the nose points'
        },
        frameRate: {
            type: 'number', value: '30', min: '1', max: '60', step: '1',
            onChange: value => mySketch.frameRate(parseInt(value)),
            title: 'Frame Rate: Animation frames provided by the browser as requestAnimationFrame are bottle necked to this value, or bottle necked by the browser otherwise. Browsers will usually provide upto 60fps but may sometimes provide less',
            exclude: true
        },
        fleeMouse: {
            type: 'range', value: '50', min: '0', max: '100', checked: false,
            title: 'When greater than zero, all agents will run away from the mouse pointer allowing you to reposition agents anywhere on the screen and test out behaviours. Warning: This renders evolution results inconclusive',
            exclude: true
        }
    },
    Genes: {
        config: {
            autoReset: true,
            inputEvt: 'change',
            title: 'Items inside the category will affect the genetic information that agents get'
        },
        perceptionCoeff: {
            type: 'range', value: '5', min: '1', max: '50', step: '1',
            title: 'Perception radius is the product of the perceptionCoeff and the radius of the agent. A greater perception radius means that agents are able to see more items at every moment in time, and adjusting this value will drastically change system behaviours'
        },
        nose: {
            type: 'range', value: '2', min: '0', max: '6', step: '0.1',
            title: 'Nose is a cosmetic gene. This will not affect any calculations for collision. Detemines how long the nose of the agents should be'
        },
    },
    Initial: {
        config: {
            autoReset: true,
            inputEvt: 'change'
        },
        totalEatables: {
            type: 'number', value: '500', min: '0', max: '1000', step: '1'
        },
        totalAgents: {
            type: 'number', value: '150', min: '0', max: '1000', step: '1'
        },
        'Genetic': { isHeading: true },
        geneticVariation: {
            type: 'range', value: '10', min: '0', max: '100', step: '1',
            title: 'Genetic Variation is the factor by which the initial distribution of genes allocated to agents varies around the average'
        },
        mutationFactor: {
            type: 'range', value: '30', min: '0', max: '100', step: '1',
            title: 'Whenever an agent reproduces, the genes are copied onto the offspring with some mutations. This value determines the magnitude of these mutations, if and when they occur'
        },
        mutationRate: {
            type: 'range', value: '15', min: '0', max: '100', step: '1',
            title: 'This value will determine the frequency (or rate) of mutations on the event of reproduction'
        },
        'Collective': { isHeading: true },
        cohesionPriority: {
            type: 'range', value: '50', min: '0', max: '100', step: '1',
            title: 'Agents like to stay together when they are not looking for food. This value determines how strongly they priotitise being together with other agents over other actions they perform'
        },
        seperationPriority: {
            type: 'range', value: '30', min: '0', max: '100', step: '1',
            title: 'Agents do not like bumping into each other and staying inside another agent (because there is no enforced collision mechanics implementation). This value determines how strongly they prioritise being seperate of each other over other actions they perform'
        },
        // constrainPriority: {
        //     type: 'range', value: '100', min: '0', max: '100', step: '1',
        //     title: 'Agents need to stay inside the confines of the screen and will move towards the inside when they get too close to any of the edges. This value determines how strongly they prioritise moving towards the center of the screen over other actions they perform'
        // },
        strollPriority: {
            type: 'range', value: '10', min: '0', max: '100', step: '1',
            title: 'Agents will stroll on the screen if they are hungry or lonely to find food or peers respectively. This value determines how strongly they prioritise strolling over other actions they perform'
        },
        'Indivivual Properties': { isHeading: true },
        avgRadius: {
            type: 'range', value: '8', min: '1', max: '100', step: '1',
            title: 'This value determines the average radial size of the agents. This value will affect many results and may even result in awkward behaviours if set to extreme ends'
        },
        radiusDeviation: {
            type: 'range', value: '1', min: '0', max: '100', step: '1',
            title: 'This value determines the magnitude by which the radius of each agent will differ from the average radius of the agents'
        },
        growthRate: {
            type: 'range', value: '10', min: '0', max: '100', step: '1',
            title: 'Agents will grow when they are alive for a certain time, randomly. Agents that live very long, will grow in radial size at the rate of this value'
        },
        massCoeff: {
            type: 'range', value: '30', min: '1', max: '100', step: '1',
            title: 'The mass of each agents corresponds to its size, and this value will determine how much heavier an agent is proportional to its radius'
        },
        frictionCoeff: {
            type: 'range', value: '90', min: '0', max: '100', step: '1',
            title: 'Friction is approximated as a coefficient multiplied by the velocity every frame, which means a value of 1 is no friction and 0 is maximum friction',
        },
        maxSpeed: {
            type: 'range', value: '8', min: '0', max: '30', step: '1',
            title: 'All agents can only achieve a velocity of a certain maximum magnitude, limited to this value'
        },
        maxForce: {
            type: 'range', value: '0.8', min: '0', max: '5', step: '0.1',
            title: 'All agents can only apply forces to themselves, and of a certain maximum magnitude, limited to this value'
        },
        'Lifecycle': { isHeading: true },
        maxHitpoints: {
            type: 'range', value: '20', min: '1', max: '100', step: '1',
            title: 'Agents have hitpoints which start decreasing when they are hungry. This value determines how many hitpoints they can carry'
        },
        maxHungerSaturation: {
            type: 'range', value: '20', min: '1', max: '100', step: '1',
            title: 'Agents have hunger saturation when they eat food. If this value is below a certain level, they will look for food. This value determines the maximum saturation level an agent can achieve'
        },
        decayAvg: {
            type: 'range', value: '1', min: '0', max: '20', step: '0.1',
            title: 'The hunger saturation and then hitpoints of all agents will decay by a certain value every frame. This value determines the magnitude of this decay'
        },
        decayDeviation: {
            type: 'range', value: '500', min: '0', max: '100', step: '1'
        }
    }
}

const Options = {};

function loaded() {

    const body = document.querySelector('#toolbox .body');

    for (let group in optionsToBuild) {
        const container = document.createElement('div');
        const groupObj = optionsToBuild[group];

        container.title = groupObj.config.title || group;
        container.innerHTML = group;
        if (groupObj.config.autoReset) container.innerHTML += ' (Auto Reset)';
        container.classList.add('main');
        body.appendChild(container);

        const options = optionsToBuild[group];
        Options[group] = {};

        for (let optionName in options) {
            if (optionName === 'config') continue;

            const option = options[optionName];
            const { type, value, checked, onChange, title, num } = option;

            const optionContainer = document.createElement('div');
            if (title) optionContainer.title = title;
            optionContainer.classList.add('option');

            const label = document.createElement('label');
            label.htmlFor = optionName;
            label.innerHTML = optionName;
            optionContainer.appendChild(label);

            if (option.isHeading) {
                label.classList.add('heading');
            } else {

                let input = document.createElement('input');
                for (let key in option) input[key] = option[key];
                input.name = optionName;

                const inputEvt = type == 'checkbox' ? 'click' : (groupObj.config.inputEvt || 'input');
                const targetProp = type == 'checkbox' ? 'checked' : 'value';

                input.addEventListener(inputEvt, e => {
                    const value = (type !== 'checkbox' && num !== false) ? parseFloat(e.target[targetProp]) : e.target[targetProp];
                    Options[group][e.target.name] = value;
                    if (onChange) onChange(value);
                    if (groupObj.config.autoReset || option.autoReset) {
                        mySketch.reset();
                    }
                });
                optionContainer.appendChild(input);
                Options[group][optionName] = parseFloat(value) || checked;
            }

            body.appendChild(optionContainer);
        }
    }

    document.querySelector('#toolbox .head').addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);

    document.querySelector('.minimisebtncontainer').addEventListener('click', e => {
        e.stopPropagation();
        document.querySelector('#toolbox').classList.toggle('minimise');
    });
    document.querySelector('.resetbtncontainer').addEventListener('click', e => {
        e.stopPropagation();
        mySketch.init(mySketch._init);
    });

    run();
}

function mouseUp() {
    window.removeEventListener('mousemove', divMove, true);
}

function mouseDown(e) {
    __mouseClickPos.x = e.offsetX;
    __mouseClickPos.y = e.offsetY;
    window.addEventListener('mousemove', divMove, true);
}

function divMove(e) {
    var div = document.getElementById('toolbox');
    div.style.position = 'absolute';
    div.style.top = (e.clientY - __mouseClickPos.y) + 'px';
    div.style.left = (e.clientX - __mouseClickPos.x) + 'px';
}
import createREGL from 'regl';
import { mat4 } from 'gl-matrix';
import { createLineBatch } from './LineBatch';
import { render } from 'preact';
import { computed, effect, signal } from '@preact/signals';

import seedrandom from 'seedrandom';

const canvas = document.getElementById('canvas');
const uiContainer = document.getElementById('app');


const MIN_SEED = 0;
const MIN_BATCHES = 1;
const MAX_BATCHES = 127;
const MIN_GROUPS = 1;
const MAX_GROUPS = 73;

console.log(window.location.hash)
const savedState = parseState(window.location.hash) || {
    seed: 0,
    numBatches: 17,
    numGroups: 3,
};

console.log(savedState)


let regl = (createREGL({
    canvas,
    attributes: {
        antialias: true,
        samples: 4  // This enables 2x MSAA (4 samples)
    }
}))
function resetRegl() {
    regl.destroy();
    regl = createREGL({
        canvas,
        attributes: {
            antialias: true,
            samples: 4  // This enables 2x MSAA (4 samples)
        }
    })
}

const seed = signal(savedState.seed);

const numBatches = signal(savedState.numBatches);
const numGroups = signal(savedState.numGroups);

const cameraZPosition = signal(15); // New variable for camera Z position
const aspectRatio = signal(1);

const projectionMatrix = computed(() => mat4.perspective([], Math.PI / 6, aspectRatio.value, 0.01, 1000));
const viewMatrix = computed(() => mat4.lookAt([], [0, 0, cameraZPosition.value], [0, 0, 0], [0, 1, 0]));

effect(()=>{
    window.history.pushState(false, false, `#${numBatches.value.toString().padStart(MAX_BATCHES.toString().length, "0")}${numGroups.value.toString().padStart(MAX_GROUPS.toString().length, "0")}${seed.value.toString()}`)
})

effect(() => {
    resetRegl();
    setReglFrame(regl, numBatches.value, numGroups.value, seedrandom(seed.value.toString()));
    regl.poll();
})

function resize({ innerWidth, innerHeight }) {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    aspectRatio.value = innerWidth / innerHeight;
}

effect(() => {
    viewMatrix.value;
    projectionMatrix.value;
    aspectRatio.value;
    regl.poll();
})

window.addEventListener('resize', () => resize(window), false)

resize(window);

function clamp(a, b, v) {
    if (v < a) return a;
    if (v > b) return b;
    return v;
}

/*
Parse sketch state from the hash part of the page's address when provided (window.location.hash).
*/
function parseState(hash) {
    const savedState = {
            numBatches: clamp(MIN_BATCHES, MAX_BATCHES, parseInt(hash.substring(1, 1 + MAX_BATCHES.toString().length), 10)),
            numGroups: clamp(MIN_GROUPS, MAX_GROUPS, parseInt(hash.substring(1 + MAX_BATCHES.toString().length, 1 + MAX_BATCHES.toString().length + MAX_GROUPS.toString().length), 10)),
            seed: clamp(MIN_SEED, Number.MAX_SAFE_INTEGER, parseInt(hash.substring(1 + MAX_BATCHES.toString().length + MAX_GROUPS.toString().length), 10)),
        }
    if (Object.values(savedState).some( v => Number.isNaN(v))) {
        return undefined;
    } else {
        return savedState;
    }
}


function setReglFrame(regl = regl.value, numBatches = numBatches.value, numGroups = numGroups.value, random = random.value, view = viewMatrix.value, projection = projectionMatrix.value) {
    const lineBatches = createLineBatches(regl, numBatches, numGroups, random);
    const startTime = Date.now();
    regl.frame(() => {
        regl.clear({
            color: [0, 0, 0, 1],
            depth: 1
        });

        const time = (Date.now() - startTime) / 1000; // Convert to seconds

        const uniforms = {
            view,
            projection,
            time
        };

        lineBatches.forEach(batch => batch.draw(uniforms));
    });
}


export function init() {
    const App = <div>
        <label>Lines</label>
        <group> <label>Batches</label>
            <input type='number' value={numBatches.value} min={MIN_BATCHES} max={MAX_BATCHES} onChange={(e) => { numBatches.value = parseInt(e.currentTarget.value, 10);  }} />
            <label>Groups</label>
            <input type='number' value={numGroups.value} min={MIN_GROUPS} max={MAX_GROUPS} onChange={(e) => { numGroups.value = parseInt(e.currentTarget.value, 10); }} />
        </group>
        <label>Random Seed</label>
        <input type='number' value={seed.value} min={MIN_SEED} onChange={(e) => { seed.value = parseInt(e.currentTarget.value, 10); }} />

    </div>;
    render(App, uiContainer);
}

function createLineBatches(regl, numBatches, groupsNum, random) {
    const batchConfigs = [];

    // Create groups with random pivot points
    const groups = [];
    for (let i = 0; i < groupsNum; i++) {
        groups.push({
            pivotX: (random() - 0.5) * 2, // Random pivot point between -1 and 1
            pivotY: i % 2 > 0 ? 1 : -1,
            pivotZ: 0,
        });
    }

    const batchesPerGroup = Math.floor(numBatches / groupsNum);
    const remainingBatches = numBatches % groupsNum;

    for (let groupIndex = 0; groupIndex < groupsNum; groupIndex++) {
        const batchesInThisGroup = batchesPerGroup + (groupIndex < remainingBatches ? 1 : 0);
        const group = groups[groupIndex];

        for (let i = 0; i < batchesInThisGroup; i++) {
            let rotation = mat4.create();

            // Apply random rotation without parallel/perpendicular constraint
            // but avoid angles nearly perpendicular to the viewport
            const maxAngle = Math.PI / 10 * 1; // 60 degrees
            const minAngle = 0;//Math.PI / 6; // 30 degrees

            const rotX = (random() * (maxAngle - minAngle) + minAngle) * (random() < 0.5 ? 1 : -1);
            const rotY = (random() * (maxAngle - minAngle) + minAngle) * (random() < 0.5 ? 1 : -1);
            const rotZ = random() * Math.PI * 2; // Full rotation allowed for Z-axis

            mat4.rotateX(rotation, rotation, rotX);
            mat4.rotateY(rotation, rotation, rotY);
            mat4.rotateZ(rotation, rotation, rotZ);

            // Calculate position relative to the group's pivot point
            const relativeX = (random() - 0.5) * 2; // Random position between -1 and 1
            const relativeY = 0;
            const relativeZ = (random() - 0.5) * 1;
            batchConfigs.push({
                position: [group.pivotX + relativeX, group.pivotY + relativeY, group.pivotZ + relativeZ],
                rotation: rotation,
                color: [random(), random(), random()],
                lengthVariation: 10,
                widthVariation: random() * 0.5 + 1.1, // Random width variation between 0.5 and 1
                transparencyRange: [0, 0.35], // Random range between [0.2, 0.5] and [0.7, 1.0]
            });
        }
    }

    return batchConfigs.map((config) =>
        createLineBatch(
            regl,
            config.position,
            config.rotation,
            config.color,
            config.lengthVariation,
            config.widthVariation,
            config.transparencyRange,
            config.useBurnOverlay,
            config.useDivideOverlay
        )
    );
}

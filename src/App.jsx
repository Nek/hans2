import createREGL from 'regl';
import { mat4 } from 'gl-matrix';
import { createLineBatch } from './LineBatch';
import { render } from 'preact';
import { effect, signal } from '@preact/signals';

import seedrandom from 'seedrandom';

const canvas = document.getElementById('canvas');
const uiContainer = document.getElementById('app');

let projectionMatrix, viewMatrix;
const cameraZPosition = 15; // New variable for camera Z position

const MIN_BATCHES = 1;
const MAX_BATCHES = 127;
const MIN_GROUPS = 1;
const MAX_GROUPS = 73;

const seed = signal(0);
const random = signal(seedrandom(seed.value.toString()));
const regl = signal(undefined)
const numBatches = signal(13);
const numGroups = signal(3);

effect(() => {
    random.value = seedrandom(seed.value.toString());
    regl.value = createREGL({
        canvas: canvas,
        attributes: {
            antialias: true,
            samples: 4  // This enables 2x MSAA (4 samples)
        }
    })
    upateReglFrameCB(regl.value, numBatches.value, numGroups.value, random.value);
    updateViewport(regl.value);
})


function upateReglFrameCB(regl, numBatches, numGroups, random) {
    const lineBatches = createLineBatches(regl, numBatches, numGroups, random);
    const startTime = Date.now();
    regl.frame(() => {
        regl.clear({
            color: [0, 0, 0, 1],
            depth: 1
        });

        const currentTime = (Date.now() - startTime) / 1000; // Convert to seconds

        const uniforms = {
            view: viewMatrix,
            projection: projectionMatrix,
            time: currentTime
        };

        lineBatches.forEach(batch => batch.draw(uniforms));
    });
}


export function init() {
    window.addEventListener('resize', () => updateViewport(regl.value), false);
    updateViewport(regl.value);
    const App = <div>
        <label>Lines</label>
        <group> <label>Batches</label>
        <input type='number' value={numBatches.value} min={MIN_BATCHES} max={MAX_BATCHES} onChange={(e) => { numBatches.value = parseInt(e.currentTarget.value, 10) }} />
        <label>Groups</label>
        <input type='number' value={numGroups.value} min={MIN_GROUPS} max={MAX_GROUPS} onChange={(e) => { numGroups.value = parseInt(e.currentTarget.value, 10) }} />
        </group>
        <label>Random Seed</label>
       <input type='number' value={seed.value} min={0} onChange={(e) => { seed.value = parseInt(e.currentTarget.value, 10) }} />

    </div>;
    render(App, uiContainer);
}

function updateViewport(regl) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    projectionMatrix = mat4.perspective([], Math.PI / 6, window.innerWidth / window.innerHeight, 0.01, 1000);
    viewMatrix = mat4.lookAt([], [0, 0, cameraZPosition], [0, 0, 0], [0, 1, 0]);
    regl.poll();
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

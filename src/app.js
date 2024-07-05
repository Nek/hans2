import createREGL from 'regl';
import { mat4 } from 'gl-matrix';
import { createLineBatch } from './LineBatch';

import seedrandom from 'seedrandom';
const random = seedrandom(Math.random().toString());

const canvas = document.getElementById('canvas');
const regl = createREGL({ canvas: canvas });
let lineBatches = [];
let projectionMatrix, viewMatrix;
let cameraZPosition = 5; // New variable for camera Z position

function init() {
    updateViewport();
    createLineBatches(regl, 123, 3); // Create 5 groups of batches

    window.addEventListener('resize', onWindowResize, false);

    regl.frame(() => {
        regl.clear({
            color: [0, 0, 0, 1],
            depth: 1
        });

        const uniforms = {
            view: viewMatrix,
            projection: projectionMatrix
        };

        lineBatches.forEach(batch => batch.draw(uniforms));
    });
}

function updateViewport() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    projectionMatrix = mat4.perspective([], Math.PI / 6, window.innerWidth / window.innerHeight, 0.01, 1000);
    viewMatrix = mat4.lookAt([], [0, 0, cameraZPosition], [0, 0, 0], [0, 1, 0]);
    regl.poll();
}

function createLineBatches(regl, num_batches, groupsNum) {
    const batchConfigs = [];

    // Create a grid to help distribute batches more evenly
    const gridSize = Math.ceil(Math.sqrt(num_batches));
    const cellSize = 2 / gridSize;

    // Create groups with random pivot points
    const groups = [];
    for (let i = 0; i < groupsNum; i++) {
        groups.push({
            pivotX: (random() - 0.5) * 2, // Random pivot point between -1 and 1
            pivotY: i % 2 > 0 ? 1 : -1,
            pivotZ: 0,
        });
    }

    const batchesPerGroup = Math.floor(num_batches / groupsNum);
    const remainingBatches = num_batches % groupsNum;

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
                widthVariation: random() * 0.5 + 0.5, // Random width variation between 0.5 and 1
                transparencyRange: [0, 0.35], // Random range between [0.2, 0.5] and [0.7, 1.0]
            });
        }
    }

    batchConfigs.forEach((config) => {
        const batch = createLineBatch(
            regl,
            config.position,
            config.rotation,
            config.color,
            config.lengthVariation,
            config.widthVariation,
            config.transparencyRange,
            config.useBurnOverlay,
            config.useDivideOverlay
        );

        lineBatches.push(batch);
    });
}

function onWindowResize() {
    updateViewport();
}

init();

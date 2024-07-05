import createREGL from 'regl';
import { mat4 } from 'gl-matrix';
import { createLineBatch } from './LineBatch';

import seedrandom from 'seedrandom';
const random = seedrandom(Math.random().toString());

const canvas = document.getElementById('canvas');
const regl = createREGL({ canvas: canvas });
let lineBatches = [];
let projectionMatrix, viewMatrix;

function init() {
    updateViewport();
    createLineBatches(regl, 50, false);

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
    viewMatrix = mat4.lookAt([], [0, 0, 10], [0, 0, 0], [0, 1, 0]);
    regl.poll();
}

function createLineBatches(regl, num_batches, useParallelPerpendicular = false) {
    const batchConfigs = [];

    // Create a grid to help distribute batches more evenly
    const gridSize = Math.ceil(Math.sqrt(num_batches));
    const cellSize = 2 / gridSize;

    for (let i = 0; i < num_batches; i++) {
        let rotation = mat4.create();
        
        if (useParallelPerpendicular) {
            // Randomly choose between parallel and perpendicular orientations
            const orientationType = random();
            if (orientationType < 0.33) {
                // X-axis aligned
                mat4.rotateY(rotation, rotation, Math.PI / 2);
            } else if (orientationType < 0.67) {
                // Y-axis aligned
                mat4.rotateX(rotation, rotation, Math.PI / 2);
            } else {
                // Z-axis aligned (no rotation needed)
            }

            // Add some random rotation to avoid perfect alignment, but limit the angle
            const maxRotationAngle = Math.PI / 12; // 15 degrees
            mat4.rotateX(rotation, rotation, (random() - 0.5) * maxRotationAngle);
            mat4.rotateY(rotation, rotation, (random() - 0.5) * maxRotationAngle);
            mat4.rotateZ(rotation, rotation, (random() - 0.5) * maxRotationAngle);
        } else {
            // Apply random rotation without parallel/perpendicular constraint
            // but avoid angles nearly perpendicular to the viewport
            const maxAngle = Math.PI / 3 * 1; // 60 degrees
            const minAngle = 0;//Math.PI / 6; // 30 degrees
            
            const rotX = (random() * (maxAngle - minAngle) + minAngle) * (random() < 0.5 ? 1 : -1);
            const rotY = (random() * (maxAngle - minAngle) + minAngle) * (random() < 0.5 ? 1 : -1);
            const rotZ = random() * Math.PI * 2; // Full rotation allowed for Z-axis
            
            mat4.rotateX(rotation, rotation, rotX);
            mat4.rotateY(rotation, rotation, rotY);
            mat4.rotateZ(rotation, rotation, rotZ);
        }
        
        // Calculate grid position
        const gridX = i % gridSize;
        const gridY = Math.floor(i / gridSize);
        
        // Calculate position with some randomness within the grid cell
        const posX = -1 + cellSize * (gridX + 0.25 + random() * 0.5);
        const posY = -1 + cellSize * (gridY + 0.25 + random() * 0.5);
        const posZ = (random() - 0.5) * 2; // Random depth
        
        batchConfigs.push({
            position: [posX, posY, posZ],
            rotation: rotation,
            color: [random(), random(), random()],
            lengthVariation: random() * 3 + 1,
            widthVariation: random() * 0.5 + 0.5, // Random width variation between 0.5 and 1
            transparencyRange: [0, 0.25], // Random range between [0.2, 0.5] and [0.7, 1.0]
            useBurnOverlay: random() < 0.5, // 50% chance of using burn overlay
            useDivideOverlay: random() < 0.5 // 50% chance of using divide overlay
        });
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
            true, // useSepia
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

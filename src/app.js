import createREGL from 'regl';
import { mat4 } from 'gl-matrix';
import { LineBatch } from './LineBatch';

const canvas = document.getElementById('canvas');
const regl = createREGL({ canvas: canvas });
let lineBatches = [];
let projectionMatrix, viewMatrix;

function init() {
    updateViewport();
    createLineBatches(regl, 71);

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

function createLineBatches(regl, NUM_BATCHES = 5) {
    const batchConfigs = [];

    // Create a grid to help distribute batches more evenly
    const gridSize = Math.ceil(Math.sqrt(NUM_BATCHES));
    const cellSize = 2 / gridSize;

    for (let i = 0; i < NUM_BATCHES; i++) {
        let rotation = mat4.create();
        
        // Randomly choose between parallel and perpendicular orientations
        const orientationType = Math.random();
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
        mat4.rotateX(rotation, rotation, (Math.random() - 0.5) * maxRotationAngle);
        mat4.rotateY(rotation, rotation, (Math.random() - 0.5) * maxRotationAngle);
        mat4.rotateZ(rotation, rotation, (Math.random() - 0.5) * maxRotationAngle);
        
        // Calculate grid position
        const gridX = i % gridSize;
        const gridY = Math.floor(i / gridSize);
        
        // Calculate position with some randomness within the grid cell
        const posX = -1 + cellSize * (gridX + 0.25 + Math.random() * 0.5);
        const posY = -1 + cellSize * (gridY + 0.25 + Math.random() * 0.5);
        const posZ = (Math.random() - 0.5) * 2; // Random depth
        
        batchConfigs.push({
            position: [posX, posY, posZ],
            rotation: rotation,
            mode: 'OVER',
            color: [Math.random(), Math.random(), Math.random()],
            variation: Math.random() * 3 + 1,
            transparencyRange: [0.2 + Math.random() * 0.3, 0.7 + Math.random() * 0.3] // Random range between [0.2, 0.5] and [0.7, 1.0]
        });
    }

    batchConfigs.forEach((config, index) => {
        const batch = new LineBatch(
            regl,
            config.position,
            config.rotation,
            config.mode,
            config.color,
            config.variation,
            config.transparencyRange
        );

        // Add lines to each batch with irregular steps and fading
        let y = -0.5;
        const numSegments = 50;
        while (y < 0.5 && batch.lines.length / 10 < batch.maxLines) {
            const transparency = config.transparencyRange[0] + Math.random() * (config.transparencyRange[1] - config.transparencyRange[0]);
            for (let i = 0; i < numSegments; i++) {
                const startX = -7.5 + (15 * i / numSegments);
                const endX = -7.5 + (15 * (i + 1) / numSegments);
                const startFade = Math.sin((i / numSegments) * Math.PI);
                const endFade = Math.sin(((i + 1) / numSegments) * Math.PI);
                batch.addLine([startX, y, 0], [endX, y, 0], startFade, endFade, transparency);
                
                if (batch.lines.length / 10 >= batch.maxLines) break;
            }
            // Add an irregular step
            y += 0.01 + Math.random() * 0.03;
        }
        batch.updateBuffer();

        lineBatches.push(batch);
    });
}

function onWindowResize() {
    updateViewport();
}

init();

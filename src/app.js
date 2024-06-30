import createREGL from 'regl';
import { mat4 } from 'gl-matrix';
import { LineBatch } from './LineBatch';

const canvas = document.getElementById('canvas');
const regl = createREGL({ canvas: canvas });
let lineBatches = [];
let projectionMatrix, viewMatrix;
const NUM_BATCHES = 5;

function init() {
    updateViewport();
    createLineBatches(regl);

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

function createLineBatches(regl) {
    const modes = ['OVER', 'MULTIPLY', 'ADD', 'SCREEN', 'OVERLAY', 'DARKEN', 'LIGHTEN', 'COLOR_DODGE', 'COLOR_BURN'];
    const batchConfigs = [];

    for (let i = 0; i < NUM_BATCHES; i++) {
        let rotation = mat4.create();
        mat4.rotateX(rotation, rotation, Math.random() * Math.PI * 2);
        mat4.rotateY(rotation, rotation, Math.random() * Math.PI * 2);
        mat4.rotateZ(rotation, rotation, Math.random() * Math.PI * 2);
        
        batchConfigs.push({
            position: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
            rotation: rotation,
            mode: modes[Math.floor(Math.random() * modes.length)],
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

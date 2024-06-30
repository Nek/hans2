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
    projectionMatrix = mat4.perspective([], Math.PI / 4, window.innerWidth / window.innerHeight, 0.01, 1000);
    viewMatrix = mat4.lookAt([], [0, 0, 5], [0, 0, 0], [0, 1, 0]);
    regl.poll();
}

function createLineBatches(regl) {
    const modes = ['OVER', 'MULTIPLY', 'ADD'];
    const batchConfigs = [];

    for (let i = 0; i < NUM_BATCHES; i++) {
        let rotation = mat4.create();
        mat4.rotateX(rotation, rotation, Math.random() * Math.PI * 2);
        mat4.rotateY(rotation, rotation, Math.random() * Math.PI * 2);
        mat4.rotateZ(rotation, rotation, Math.random() * Math.PI * 2);
        
        batchConfigs.push({
            position: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
            rotation: rotation,
            mode: modes[i % modes.length],
            color: [Math.random(), Math.random(), Math.random()],
            variation: Math.random() * 3 + 1
        });
    }

    batchConfigs.forEach((config, index) => {
        const batch = new LineBatch(
            regl,
            config.position,
            config.rotation,
            config.mode,
            config.color,
            config.variation
        );

        // Add parallel lines to each batch
        for (let i = 0; i < 50; i++) {
            const y = (i / 50) - 0.5;  // Distribute lines evenly from -0.5 to 0.5
            batch.addLine(
                [-2.5, y, 0],  // Start point x-coordinate changed from -0.5 to -2.5
                [2.5, y, 0]    // End point x-coordinate changed from 0.5 to 2.5
            );
        }

        lineBatches.push(batch);
    });
}

function onWindowResize() {
    updateViewport();
}

init();

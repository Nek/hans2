const canvas = document.getElementById('canvas');
const regl = createREGL({ canvas: canvas });
let lineBatches = [];
let projectionMatrix, viewMatrix;

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
    const batchConfigs = [
        { position: [0, 0, 0], rotation: mat4.rotateX([], mat4.create(), Math.PI / 4), mode: 'OVER', color: [1, 0, 0], variation: 2 },
        { position: [1, 1, 0], rotation: mat4.rotateY([], mat4.create(), Math.PI / 4), mode: 'MULTIPLY', color: [0, 1, 0], variation: 3 },
        { position: [-1, -1, 0], rotation: mat4.rotateZ([], mat4.create(), Math.PI / 4), mode: 'ADD', color: [0, 0, 1], variation: 1 }
    ];

    batchConfigs.forEach(config => {
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
                [-0.5, y, 0],
                [0.5, y, 0]
            );
        }

        lineBatches.push(batch);
    });
}

function onWindowResize() {
    updateViewport();
}

init();

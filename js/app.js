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
    // Example: Create three different line batches
    const batch1 = new LineBatch(
        regl,
        [0, 0, 0],
        mat4.rotateX([], mat4.create(), Math.PI / 4),
        'OVER',
        [1, 0, 0],
        2
    );

    const batch2 = new LineBatch(
        regl,
        [1, 1, 0],
        mat4.rotateY([], mat4.create(), Math.PI / 4),
        'MULTIPLY',
        [0, 1, 0],
        3
    );

    const batch3 = new LineBatch(
        regl,
        [-1, -1, 0],
        mat4.rotateZ([], mat4.create(), Math.PI / 4),
        'ADD',
        [0, 0, 1],
        1
    );

    // Add some example lines to each batch
    for (let i = 0; i < 50; i++) {
        batch1.addLine(
            [Math.random() - 0.5, Math.random() - 0.5, 0],
            [Math.random() - 0.5, Math.random() - 0.5, 0]
        );
        batch2.addLine(
            [Math.random() - 0.5, Math.random() - 0.5, 0],
            [Math.random() - 0.5, Math.random() - 0.5, 0]
        );
        batch3.addLine(
            [Math.random() - 0.5, Math.random() - 0.5, 0],
            [Math.random() - 0.5, Math.random() - 0.5, 0]
        );
    }

    lineBatches.push(batch1, batch2, batch3);
}

function onWindowResize() {
    updateViewport();
}

init();

let scene, camera, renderer;
let lineBatches = [];

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.position.z = 5;

    createLineBatches();

    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function createLineBatches() {
    // Example: Create three different line batches
    const batch1 = new LineBatch(
        scene,
        new THREE.Vector3(0, 0, 0),
        new THREE.Matrix4().makeRotationX(Math.PI / 4),
        'OVER',
        0xff0000,
        2
    );

    const batch2 = new LineBatch(
        scene,
        new THREE.Vector3(1, 1, 0),
        new THREE.Matrix4().makeRotationY(Math.PI / 4),
        'MULTIPLY',
        0x00ff00,
        3
    );

    const batch3 = new LineBatch(
        scene,
        new THREE.Vector3(-1, -1, 0),
        new THREE.Matrix4().makeRotationZ(Math.PI / 4),
        'ADD',
        0x0000ff,
        1
    );

    // Add some example lines to each batch
    for (let i = 0; i < 50; i++) {
        batch1.addLine(
            new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0),
            new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0)
        );
        batch2.addLine(
            new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0),
            new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0)
        );
        batch3.addLine(
            new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0),
            new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0)
        );
    }

    lineBatches.push(batch1, batch2, batch3);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Update and render the scene
    lineBatches.forEach(batch => batch.update());
    renderer.render(scene, camera);
}

init();

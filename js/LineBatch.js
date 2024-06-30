class LineBatch {
    constructor(scene, planePosition, projectionMatrix, overlayMode, color, widthVariation) {
        this.scene = scene;
        this.planePosition = planePosition;
        this.projectionMatrix = projectionMatrix;
        this.overlayMode = overlayMode;
        this.color = color;
        this.widthVariation = widthVariation;
        this.lines = [];
    }

    addLine(startPoint, endPoint) {
        const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
        const material = new THREE.LineBasicMaterial({
            color: this.color,
            linewidth: Math.random() * this.widthVariation + 1,
            blending: this.getBlendingMode(),
        });
        const line = new THREE.Line(geometry, material);
        line.applyMatrix4(this.projectionMatrix);
        line.position.add(this.planePosition);
        this.lines.push(line);
        this.scene.add(line);
    }

    getBlendingMode() {
        switch (this.overlayMode) {
            case 'OVER':
                return THREE.NormalBlending;
            case 'MULTIPLY':
                return THREE.MultiplyBlending;
            case 'ADD':
                return THREE.AdditiveBlending;
            default:
                return THREE.NormalBlending;
        }
    }

    update() {
        // Add any update logic here if needed
    }
}

class LineBatch {
    constructor(regl, planePosition, rotationMatrix, overlayMode, color, widthVariation) {
        this.regl = regl;
        this.planePosition = planePosition;
        this.rotationMatrix = rotationMatrix;
        this.overlayMode = overlayMode;
        this.color = color;
        this.widthVariation = widthVariation;
        this.lines = [];
        this.buffer = regl.buffer({
            usage: 'dynamic',
            type: 'float',
            length: 1000 * 8 * 4 // Preallocate space for 1000 lines (8 floats per line: 3 for position, 1 for fade)
        });

        this.drawLines = this.regl({
            frag: `
                precision mediump float;
                uniform vec3 color;
                varying float vFade;
                void main() {
                    gl_FragColor = vec4(color, vFade);
                }
            `,
            vert: `
                precision mediump float;
                attribute vec3 position;
                attribute float fade;
                uniform mat4 projection, view, model;
                varying float vFade;
                void main() {
                    gl_Position = projection * view * model * vec4(position, 1);
                    vFade = fade;
                }
            `,
            attributes: {
                position: {
                    buffer: this.buffer,
                    stride: 16,
                    offset: 0
                },
                fade: {
                    buffer: this.buffer,
                    stride: 16,
                    offset: 12
                }
            },
            uniforms: {
                color: () => this.color,
                model: () => {
                    let model = mat4.create();
                    mat4.translate(model, model, this.planePosition);
                    mat4.multiply(model, model, this.rotationMatrix);
                    return model;
                },
                view: regl.prop('view'),
                projection: regl.prop('projection')
            },
            count: () => this.lines.length,
            primitive: 'lines',
            blend: this.getBlendingMode()
        });
    }

    addLine(startPoint, endPoint) {
        this.lines.push(
            startPoint[0], startPoint[1], startPoint[2], 0,  // Start point with fade 0
            endPoint[0], endPoint[1], endPoint[2], 0         // End point with fade 0
        );
        this.buffer.subdata(this.lines);
    }

    getBlendingMode() {
        switch (this.overlayMode) {
            case 'OVER':
                return {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    }
                };
            case 'MULTIPLY':
                return {
                    enable: true,
                    func: {
                        src: 'zero',
                        dst: 'src color'
                    }
                };
            case 'ADD':
                return {
                    enable: true,
                    func: {
                        src: 'one',
                        dst: 'one'
                    }
                };
            default:
                return {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    }
                };
        }
    }

    draw(uniforms) {
        this.drawLines(Object.assign({}, uniforms, {
            count: this.lines.length / 3
        }));
    }
}

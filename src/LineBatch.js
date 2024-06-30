import { mat4 } from 'gl-matrix';

export class LineBatch {
    constructor(regl, planePosition, rotationMatrix, overlayMode, color, widthVariation, transparencyRange) {
        this.regl = regl;
        this.planePosition = planePosition;
        this.rotationMatrix = rotationMatrix;
        this.overlayMode = overlayMode;
        this.color = color;
        this.widthVariation = widthVariation;
        this.transparencyRange = transparencyRange;
        this.lines = [];
        this.maxLines = 10000; // Increase max lines to 10000
        this.buffer = regl.buffer({
            usage: 'dynamic',
            type: 'float',
            length: this.maxLines * 10 * 4 // Preallocate space for 10000 lines (10 floats per line: 3 for position, 1 for fade, 1 for transparency)
        });

        this.drawLines = this.regl({
            frag: `
                precision mediump float;
                uniform vec3 color;
                varying float vFade;
                varying float vTransparency;
                void main() {
                    gl_FragColor = vec4(color, vFade * vTransparency);
                }
            `,
            vert: `
                precision mediump float;
                attribute vec3 position;
                attribute float fade;
                attribute float transparency;
                uniform mat4 projection, view, model;
                varying float vFade;
                varying float vTransparency;
                void main() {
                    gl_Position = projection * view * model * vec4(position, 1);
                    vFade = fade;
                    vTransparency = transparency;
                }
            `,
            attributes: {
                position: {
                    buffer: this.buffer,
                    stride: 20,
                    offset: 0
                },
                fade: {
                    buffer: this.buffer,
                    stride: 20,
                    offset: 12
                },
                transparency: {
                    buffer: this.buffer,
                    stride: 20,
                    offset: 16
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

    addLine(startPoint, endPoint, startFade, endFade) {
        if (this.lines.length / 10 < this.maxLines) {
            const transparency = this.transparencyRange[0] + Math.random() * (this.transparencyRange[1] - this.transparencyRange[0]);
            this.lines.push(
                startPoint[0], startPoint[1], startPoint[2], startFade, transparency,
                endPoint[0], endPoint[1], endPoint[2], endFade, transparency
            );
        }
    }

    updateBuffer() {
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
            count: this.lines.length / 5 // 5 components per vertex (x, y, z, fade, transparency)
        }));
    }
}

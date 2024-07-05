import { mat4 } from 'gl-matrix';

function getBlendingMode(overlayMode) {
    if (overlayMode === 'OVER') {
        return {
            enable: true,
            func: {
                srcRGB: 'src alpha',
                srcAlpha: 1,
                dstRGB: 'one minus src alpha',
                dstAlpha: 1
            },
            equation: {
                rgb: 'add',
                alpha: 'add'
            }
        };
    } else {
        return {
            enable: true,
            func: {
                srcRGB: 'src alpha',
                srcAlpha: 1,
                dstRGB: 'one',
                dstAlpha: 1
            },
            equation: {
                rgb: 'add',
                alpha: 'add'
            }
        };
    }
}

export function createLineBatch(regl, planePosition, rotationMatrix, overlayMode, color, widthVariation, transparencyRange) {
    const maxLines = 10000;
    const lines = [];
    const buffer = regl.buffer({
        usage: 'static',
        type: 'float',
        length: maxLines * 10 * 4
    });

    const drawLines = regl({
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
                buffer: buffer,
                stride: 20,
                offset: 0
            },
            fade: {
                buffer: buffer,
                stride: 20,
                offset: 12
            },
            transparency: {
                buffer: buffer,
                stride: 20,
                offset: 16
            }
        },
        uniforms: {
            color: () => color,
            model: () => {
                let model = mat4.create();
                mat4.translate(model, model, planePosition);
                mat4.multiply(model, model, rotationMatrix);
                return model;
            },
            view: regl.prop('view'),
            projection: regl.prop('projection')
        },
        count: () => lines.length,
        primitive: 'lines',
        blend: getBlendingMode(overlayMode)
    });

    return {
        addLine: (startPoint, endPoint, startFade, endFade, transparency) => {
            if (lines.length / 10 < maxLines) {
                lines.push(
                    startPoint[0], startPoint[1], startPoint[2], startFade, transparency,
                    endPoint[0], endPoint[1], endPoint[2], endFade, transparency
                );
            }
        },
        updateBuffer: () => {
            buffer.subdata(lines);
        },
        draw: (uniforms) => {
            drawLines(Object.assign({}, uniforms, {
                count: lines.length / 5
            }));
        },
        lines,
        maxLines
    };
}

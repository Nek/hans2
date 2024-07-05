import { mat4 } from 'gl-matrix';
import { seededRandom } from './seedrandom';

export function createLineBatch(regl, planePosition, rotationMatrix, color, widthVariation, transparencyRange) {
    const quadVertices = [
        -1, -1,
        1, -1,
        1, 1,
        -1, -1,
        1, 1,
        -1, 1
    ];

    const quadBuffer = regl.buffer(quadVertices);

    const drawQuad = regl({
        frag: `
            precision mediump float;
            uniform vec3 color;
            uniform float numLines;
            uniform float widthVariation;
            uniform vec2 transparencyRange;
            varying vec2 vUv;

            uniform float randomSeed;

            float seededRandom(vec2 co) {
                float x = sin(dot(co, vec2(12.9898, 78.233)) + randomSeed) * 43758.5453;
                return fract(x);
            }

            void main() {
                float y = vUv.y * numLines;
                float lineIndex = floor(y);
                float t = fract(y);

                float lineWidth = 0.5 + widthVariation * seededRandom(vec2(lineIndex, 0.0));
                float transparency = mix(transparencyRange.x, transparencyRange.y, seededRandom(vec2(lineIndex, 1.0)));

                float sine = sin(vUv.x * 3.14159 * 2.0);
                float line = smoothstep(lineWidth, 0.0, abs(sine));

                float fade = sin(vUv.x * 3.14159);
                
                gl_FragColor = vec4(color, line * fade * transparency);
            }
        `,
        vert: `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 projection, view, model;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = projection * view * model * vec4(position, 0, 1);
            }
        `,
        attributes: {
            position: quadBuffer
        },
        uniforms: {
            color: () => color,
            numLines: () => 50,
            widthVariation: () => widthVariation,
            transparencyRange: () => transparencyRange,
            randomSeed: () => seededRandom.random() * 1000,
            model: () => {
                let model = mat4.create();
                mat4.translate(model, model, planePosition);
                mat4.multiply(model, model, rotationMatrix);
                mat4.scale(model, model, [3.75, 0.25, 1]); // Reduced width by half
                return model;
            },
            view: regl.prop('view'),
            projection: regl.prop('projection')
        },
        count: 6,
        primitive: 'triangles',
        blend: {
            enable: true,
            func: {
              srcRGB: 'src alpha',
              srcAlpha: 'src alpha',
              dstRGB: 'one minus src alpha',
              dstAlpha: 'one minus src alpha',
            },
          },
        depth: {enable: false}
    });

    return {
        draw: (uniforms) => {
            drawQuad(uniforms);
        }
    };
}

import { mat4 } from 'gl-matrix';

const glsl = v => v

export function createLineBatch(regl, planePosition, rotationMatrix, color, lengthVariation, widthVariation, transparencyRange, useSepia = true, useBurnOverlay = true, useDivideOverlay = false) {
    const quadVertices = [
        -1, -1,
        1, -1,
        1, 1,
        -1, 1
    ];

    const quadBuffer = regl.buffer(quadVertices);

    const drawQuad = regl({
        frag: glsl`
            precision mediump float;
            uniform vec3 color;
            uniform float numLines;
            uniform float lengthVariation;
            uniform vec2 transparencyRange;
            uniform bool useSepia;
            uniform bool useBurnOverlay;
            uniform bool useDivideOverlay;
            varying vec2 vUv;

            float rand(vec2 co) {
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            vec3 toSepia(vec3 color) {
                const mat3 mat = mat3(
                    0.493, 0.969, 0.189,  // Increased red component
                    0.349, 0.686, 0.168,  // Decreased green component
                    0.172, 0.534, 0.131);
                return clamp(color * mat * 1.2, 0.0, 1.0);
            }

            vec3 burnOverlay(vec3 base, vec3 blend) {
                return 1.0 - (1.0 - base) / (blend + 0.001);
            }

            void main() {
                float y = vUv.y * numLines;
                float lineIndex = floor(y);
                float t = fract(y);

                float lineLength = 0.5 + lengthVariation * rand(vec2(lineIndex, 0.0));
                float transparency = mix(transparencyRange.x, transparencyRange.y, rand(vec2(lineIndex, 1.0)));

                float sine = sin(vUv.x * 3.14159 * 2.0);
                float line = smoothstep(lineLength, 0.0, abs(sine));

                float fade = sin(vUv.x * 3.14159);
                
                vec3 finalColor = useSepia ? toSepia(color) : color;
                if (useBurnOverlay) {
                    finalColor = burnOverlay(finalColor, vec3(0.8, 0.5, 0.2));
                }
                gl_FragColor = vec4(finalColor, line * fade * transparency);
            }
        `,
        vert: glsl`
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
            numLines: () => 30,
            lengthVariation: () => lengthVariation,
            transparencyRange: () => transparencyRange,
            useSepia: () => useSepia,
            useBurnOverlay: () => useBurnOverlay,
            useDivideOverlay: () => useDivideOverlay,
            model: () => {
                let model = mat4.create();
                mat4.translate(model, model, planePosition);
                mat4.multiply(model, model, rotationMatrix);
                mat4.scale(model, model, [3.75, 0.25 * widthVariation, 1]); // Apply width variation (thinner lines)
                return model;
            },
            view: regl.prop('view'),
            projection: regl.prop('projection')
        },
        count: 4,
        primitive: 'triangle fan',
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

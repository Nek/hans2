import { mat4 } from 'gl-matrix';

const glsl = v => v

export function createLineBatch(regl, planePosition, rotationMatrix, color, lengthVariation, widthVariation, transparencyRange, useSepia = true, useBurnOverlay = true, useDivideOverlay = false, animationSpeed = 1.0) {
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
            uniform float time;
            uniform float animationSpeed;
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

                // Animate the phase of the sine wave based on time and line index
                float cycleTime = mod(time, 400.0); // Create a 400-second cycle
                float phaseOffset = (cycleTime * 0.025005 + lineIndex * 0.004995) * 2.0; // 2 times slower
                float sine = sin((vUv.y + phaseOffset) * 3.14159 * 2.0);
                float line = smoothstep(0.0, 0.1, abs(sine)); // Adjusted for sharper lines

                // New animation along the lines
                float alongLineAnim = sin((vUv.x - time * animationSpeed * 0.1) * 3.14159 * 4.0) * 0.5 + 0.5;
                line *= alongLineAnim;

                float fade = sin(vUv.x * 3.14159); // Keep fade based on vUv.x for horizontal fading
                
                vec3 finalColor = useSepia ? toSepia(color) : color;
                if (useBurnOverlay) {
                    finalColor = burnOverlay(finalColor, vec3(0.8, 0.5, 0.2));
                }
                gl_FragColor = vec4(toSepia(finalColor), line * fade * transparency);
            }
        `,
        vert: glsl`
            precision mediump float;
            attribute vec2 position;
            uniform mat4 projection, view, model;
            uniform float time;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                float widthAnimation = sin(time * 0.5) * 0.2 + 1.0; // Oscillate between 0.8 and 1.2
                vec4 pos = vec4(position.x * widthAnimation, position.y, 0, 1);
                gl_Position = projection * view * model * pos;
            }
        `,
        attributes: {
            position: quadBuffer
        },
        uniforms: {
            color: () => color,
            numLines: () => 45,
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
            projection: regl.prop('projection'),
            time: regl.prop('time'),
            animationSpeed: () => animationSpeed
        },
        count: 4,
        primitive: 'triangle fan',
        blend: {
            enable: true,
            func: {
              srcRGB: 'src alpha',
              srcAlpha: 1,
              dstRGB: 'one minus src alpha',
              dstAlpha: 1,
            },
            equation: {
                rgb: 'add',
                alpha: 'add'
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

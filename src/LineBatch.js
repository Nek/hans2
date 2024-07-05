import { mat4 } from 'gl-matrix';

export function createLineBatch(regl, planePosition, rotationMatrix, color, widthVariation, transparencyRange, useSepia) {
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
            uniform bool useSepia;
            varying vec2 vUv;

            float rand(vec2 co) {
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            vec3 toSepia(vec3 color) {
                float r = color.r;
                float g = color.g;
                float b = color.b;
                return vec3(
                    0.393 * r + 0.769 * g + 0.189 * b,
                    0.349 * r + 0.686 * g + 0.168 * b,
                    0.272 * r + 0.534 * g + 0.131 * b
                );
            }

            void main() {
                float y = vUv.y * numLines;
                float lineIndex = floor(y);
                float t = fract(y);

                float lineWidth = 0.5 + widthVariation * rand(vec2(lineIndex, 0.0));
                float transparency = mix(transparencyRange.x, transparencyRange.y, rand(vec2(lineIndex, 1.0)));

                float sine = sin(vUv.x * 3.14159 * 2.0);
                float line = smoothstep(lineWidth, 0.0, abs(sine));

                float fade = sin(vUv.x * 3.14159);
                
                vec3 finalColor = useSepia ? toSepia(color) : color;
                gl_FragColor = vec4(finalColor, line * fade * transparency);
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
            useSepia: () => useSepia,
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

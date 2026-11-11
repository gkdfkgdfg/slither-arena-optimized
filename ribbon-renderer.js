'use strict';
// A single continuous texture mesh per snake, drawn on the GPU, then composited
// into the 2D arena. The original Canvas renderer is retained as a fallback.
const SnakeRibbon = (() => {
  function create() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false, stencil: false,
      premultipliedAlpha: true, preserveDrawingBuffer: false });
    if (!gl) return null;
    const mesh = new RibbonMesh.Builder(), textures = new Map();
    const uploadCanvas = document.createElement('canvas'), uploadContext = uploadCanvas.getContext('2d');
    let anisotropy, anisotropyLevel = 1;
    const powerOfTwo = value => 2 ** Math.ceil(Math.log2(Math.max(1, value)));
    let program, buffer, position, uv, view, allocated = 0, ready = false, lastError = null;
    function initialize() {
      // Extensions must be acquired again after a restored WebGL context.
      anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
      anisotropyLevel = anisotropy ? Math.min(4, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 1;
      function shader(type, source) {
        const result = gl.createShader(type); gl.shaderSource(result, source); gl.compileShader(result);
        if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(result));
        return result;
      }
      const vertex = shader(gl.VERTEX_SHADER, `attribute vec2 a_position; attribute vec2 a_uv;
        uniform vec4 u_view; varying vec2 v_uv;
        void main(){vec2 p=(a_position-u_view.xy)/u_view.zw;gl_Position=vec4(p.x,-p.y,0.0,1.0);v_uv=a_uv;}`);
      const fragment = shader(gl.FRAGMENT_SHADER, `precision highp float; varying vec2 v_uv;
        uniform sampler2D u_skin;
        void main(){vec4 color=texture2D(u_skin,vec2(v_uv.x,clamp(v_uv.y,0.0,1.0)));
          gl_FragColor=vec4(color.rgb*color.a,color.a);}`);
      program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      gl.deleteShader(vertex); gl.deleteShader(fragment);
      buffer = gl.createBuffer(); position = gl.getAttribLocation(program, 'a_position'); uv = gl.getAttribLocation(program, 'a_uv');
      view = gl.getUniformLocation(program, 'u_view'); allocated = 0; textures.clear();
      gl.useProgram(program); gl.uniform1i(gl.getUniformLocation(program, 'u_skin'), 0);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      ready = true; lastError = null;
    }
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); ready = false; });
    canvas.addEventListener('webglcontextrestored', () => { try { initialize(); } catch (err) { lastError = err.message; } });
    try { initialize(); } catch { return null; }

    function draw(snakes, viewport) {
      if (!ready || gl.isContextLost()) return false;
      try {
        const width = Math.max(1, Math.round(viewport.width * viewport.dpr));
        const height = Math.max(1, Math.round(viewport.height * viewport.dpr));
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        gl.viewport(0, 0, width, height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(position); gl.enableVertexAttribArray(uv);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0); gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
        gl.uniform4f(view, viewport.x, viewport.y, viewport.width / (2 * viewport.zoom), viewport.height / (2 * viewport.zoom));
        for (const s of snakes) {
          if (s.points.length < 2) continue;
          const source = skinTexture(s.skin || 'neon', s.color), key = (s.skin || 'neon') + ':' + s.color;
          let entry = textures.get(key);
          if (!entry) { entry = { texture: gl.createTexture() }; textures.set(key, entry); }
          else { textures.delete(key); textures.set(key, entry); }
          while (textures.size > 24) {
            const oldest = textures.keys().next().value;
            gl.deleteTexture(textures.get(oldest).texture); textures.delete(oldest);
          }
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, entry.texture);
          if (entry.source !== source || entry.revision !== source.arenaRevision) {
            // WebGL 1 needs power-of-two textures for repeating mipmaps. Filtering
            // the smaller levels prevents fine patterns shimmering when zoomed out.
            let upload = source;
            const tw = powerOfTwo(source.width), th = powerOfTwo(source.height);
            if (source.width !== tw || source.height !== th) {
              uploadCanvas.width = tw; uploadCanvas.height = th;
              uploadContext.imageSmoothingEnabled = true; uploadContext.imageSmoothingQuality = 'high';
              uploadContext.drawImage(source, 0, 0, tw, th); upload = uploadCanvas;
            }
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, upload);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, anisotropyLevel);
            entry.source = source; entry.revision = source.arenaRevision;
          }
          const vertices = mesh.build(s.points, s.radius);
          if (allocated < vertices.byteLength) {
            allocated = Math.max(vertices.byteLength, allocated * 2, 32768);
            gl.bufferData(gl.ARRAY_BUFFER, allocated, gl.DYNAMIC_DRAW);
          }
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
          gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4);
        }
        return true;
      } catch (err) { lastError = err.message; ready = false; return false; }
    }
    return { canvas, draw, diagnostics: () => ({ ready, textures: textures.size, error: lastError }),
      context: gl };
  }
  return { create };
})();

/* Module 3 — small camera-geometry library for the visuals (window.G). Same conventions as the text:
   camera Z forward, Y down; world Z up; P_cam = R·P_world + t; C = −Rᵀ·t. */
(function () {
const G = {};
const V = window.V;
G.sub = (a, b) => a.map((x, i) => x - b[i]);
G.add = (a, b) => a.map((x, i) => x + b[i]);
G.mul = (a, s) => a.map(x => x * s);
G.dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
G.cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
G.norm = a => Math.hypot(...a);
G.unit = a => G.mul(a, 1 / (G.norm(a) || 1));
G.mv = (M, v) => M.map(r => r.reduce((s, x, i) => s + x * v[i], 0));
G.mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
G.T = A => A[0].map((_, j) => A.map(r => r[j]));
G.rad = d => d * Math.PI / 180; G.deg = r => r * 180 / Math.PI;
G.K = (fx, cx, cy, fy) => [[fx, 0, cx], [0, fy || fx, cy], [0, 0, 1]];
G.inv3 = m => { const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2]; const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g; const det = a * A + b * B + c * C;
  return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]]; };
G.det3 = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
/* look_at exactly as in section 3.2 (falls back to another up vector when looking straight down, the fix of exercise 3.3) */
G.lookAt = (C, target, up) => { up = up || [0, 0, 1]; const z = G.unit(G.sub(target, C)); let x = G.cross(z, up); if (G.norm(x) < 1e-6) x = G.cross(z, [0, 1, 0]); x = G.unit(x); const y = G.cross(z, x); const R = [x, y, z]; return { R, t: G.mul(G.mv(R, C), -1), C }; };
/* yaw (from north, clockwise) and pitch (negative = down), as R_from_attitude in section 12.3; world: x east, y north, z up */
G.attitude = (yaw, pitch, roll) => { const y = G.rad(yaw), p = G.rad(pitch), r = G.rad(roll || 0);
  const fwd = [Math.sin(y) * Math.cos(p), Math.cos(y) * Math.cos(p), Math.sin(p)]; const right = [Math.cos(y), -Math.sin(y), 0]; const down = G.cross(fwd, right);
  let R = [right, down, fwd]; if (r) { const cr = Math.cos(r), sr = Math.sin(r); R = G.mm([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]], R); } return R; };
G.toCam = (R, t, P) => G.add(G.mv(R, P), t);
G.project = (K, R, t, P, dist) => { const Pc = G.toCam(R, t, P); if (Pc[2] <= 1e-6) return null; let x = Pc[0] / Pc[2], y = Pc[1] / Pc[2]; if (dist) [x, y] = G.distort([x, y], dist); return [K[0][0] * x + K[0][2], K[1][1] * y + K[1][2], Pc[2]]; };
G.distort = ([x, y], d) => { const [k1, k2, p1, p2, k3] = [d[0] || 0, d[1] || 0, d[2] || 0, d[3] || 0, d[4] || 0]; const r2 = x * x + y * y; const rad = 1 + k1 * r2 + k2 * r2 * r2 + k3 * r2 * r2 * r2;
  return [x * rad + 2 * p1 * x * y + p2 * (r2 + 2 * x * x), y * rad + p1 * (r2 + 2 * y * y) + 2 * p2 * x * y]; };
G.undistortIter = (xyd, d, iters) => { let xy = xyd.slice(); const hist = [xy.slice()]; for (let i = 0; i < (iters || 10); i++) { const e = G.sub(G.distort(xy, d), xyd); xy = G.sub(xy, e); hist.push(xy.slice()); } return hist; };
/* pixel → point on the plane Z = gz (section 12.2), without distortion */
G.pixelToGround = (K, R, C, uv, gz) => { const Ki = G.inv3(K); const rc = G.mv(Ki, [uv[0], uv[1], 1]); const rw = G.mv(G.T(R), rc); const s = ((gz || 0) - C[2]) / rw[2]; if (!(s > 0)) return null; return G.add(C, G.mul(rw, s)); };
/* symmetric eigen-decomposition (cyclic Jacobi, relative tolerance) → ascending eigenvalues */
G.eigSym = M0 => { const n = M0.length; const S = M0.map(r => r.slice()); const Vm = S.map((_, i) => S.map((_, j) => +(i === j)));
  const scale = Math.max(1e-300, ...S.map((r, i) => Math.abs(r[i])));
  for (let sw = 0; sw < 60; sw++) { let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += S[p][q] * S[p][q]; if (Math.sqrt(off) < 1e-15 * scale) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { if (Math.abs(S[p][q]) < 1e-300) continue; const th = (S[q][q] - S[p][p]) / (2 * S[p][q]); const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)); const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const a = S[k][p], b = S[k][q]; S[k][p] = c * a - s * b; S[k][q] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = S[p][k], b = S[q][k]; S[p][k] = c * a - s * b; S[q][k] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = Vm[k][p], b = Vm[k][q]; Vm[k][p] = c * a - s * b; Vm[k][q] = s * a + c * b; } } }
  const idx = [...Array(n).keys()].sort((a, b) => S[a][a] - S[b][b]); return { vals: idx.map(i => S[i][i]), vecs: idx.map(i => Vm.map(r => r[i])) }; };
/* null vector of A (smallest singular vector) and the singular values, descending */
G.nullvec = A => { const n = A[0].length; const AtA = [...Array(n)].map((_, i) => [...Array(n)].map((_, j) => A.reduce((s, r) => s + r[i] * r[j], 0))); const e = G.eigSym(AtA);
  return { v: e.vecs[0], sv: e.vals.map(x => Math.sqrt(Math.max(0, x))).reverse() }; };
G.normT = pts => { const c = [0, 1].map(k => pts.reduce((s, p) => s + p[k], 0) / pts.length); const md = pts.reduce((s, p) => s + Math.hypot(p[0] - c[0], p[1] - c[1]), 0) / pts.length; const s = Math.SQRT2 / (md || 1); return [[s, 0, -s * c[0]], [0, s, -s * c[1]], [0, 0, 1]]; };
G.ap = (H, p) => { const v = G.mv(H, [p[0], p[1], 1]); return [v[0] / v[2], v[1] / v[2]]; };
/* DLT homography src → dst (section 6.2), optional normalisation */
G.dlt = (src, dst, noNorm) => { const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; const Ts = noNorm ? I : G.normT(src), Td = noNorm ? I : G.normT(dst); const A = [];
  src.forEach((p, i) => { const [x, y] = G.ap(Ts, p), [u, v] = G.ap(Td, dst[i]); A.push([-x, -y, -1, 0, 0, 0, u * x, u * y, u]); A.push([0, 0, 0, -x, -y, -1, v * x, v * y, v]); });
  const { v, sv } = G.nullvec(A); const Hn = [v.slice(0, 3), v.slice(3, 6), v.slice(6, 9)]; let H = G.mm(G.inv3(Td), G.mm(Hn, Ts)); H = H.map(r => r.map(x => x / H[2][2])); return { H, sv }; };
/* PnP for points on Z = 0 from a homography (exercise 7.4), with re-orthogonalisation via polar decomposition */
G.planarPose = (K, H) => { const M = G.mm(G.inv3(K), H); let lam = 1 / G.norm([M[0][0], M[1][0], M[2][0]]); if (M[2][2] < 0) lam = -lam;
  const r1 = [0, 1, 2].map(i => M[i][0] * lam), r2 = [0, 1, 2].map(i => M[i][1] * lam), t = [0, 1, 2].map(i => M[i][2] * lam);
  let R = G.T([r1, r2, G.cross(r1, r2)]); for (let k = 0; k < 20; k++) { const Ri = G.T(G.inv3(R)); R = R.map((r, i) => r.map((x, j) => (x + Ri[i][j]) / 2)); } return { R, t }; };
/* linear triangulation (section 9.2) */
G.Pmat = (K, R, t) => G.mm(K, R.map((r, i) => r.concat([t[i]])));
G.triangulate = (Ps, uvs) => { const A = []; Ps.forEach((P, i) => { const [u, v] = uvs[i]; A.push(P[2].map((x, k) => u * x - P[0][k])); A.push(P[2].map((x, k) => v * x - P[1][k])); }); const X = G.nullvec(A).v; return [X[0] / X[3], X[1] / X[3], X[2] / X[3]]; };
G.skew = t => [[0, -t[2], t[1]], [t[2], 0, -t[0]], [-t[1], t[0], 0]];
G.rng = seed => { let s = seed || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
G.randn = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
G.median = a => { const s = a.filter(x => isFinite(x)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
G.f = (x, d) => V.fmt(x, d === undefined ? 2 : d);
G.svg = (box, w, h) => { const svg = V.s('svg', { viewBox: `0 0 ${w} ${h}`, width: w, style: { maxWidth: '100%', direction: 'ltr', display: 'block', margin: '0 auto' } }); box.appendChild(svg); return svg; };
G.line = (svg, a, b, st) => V.s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: Object.assign({ stroke: 'var(--ink3)', strokeWidth: 1.5 }, st || {}) }, svg);
G.dot2 = (svg, p, r, fill) => V.s('circle', { cx: p[0], cy: p[1], r: r || 4, style: { fill: fill || 'var(--c1)' } }, svg);
G.txt = (svg, p, t, st, a) => V.s('text', Object.assign({ x: p[0], y: p[1], 'font-size': 12, text: t, style: Object.assign({ fill: 'var(--ink2)' }, st || {}) }, a || {}), svg);
G.poly = (svg, pts, st) => V.s('polygon', { points: pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '), style: Object.assign({ fill: 'none', stroke: 'var(--ink3)' }, st || {}) }, svg);
/* draws an "image" frame of W×H pixels scaled into an svg rect; returns mapping */
G.frame = (svg, x0, y0, w, W, H, label) => { const s = w / W; V.s('rect', { x: x0, y: y0, width: W * s, height: H * s, style: { fill: 'var(--surface2, #f6f6f4)', stroke: 'var(--line2)' } }, svg); if (label) G.txt(svg, [x0, y0 - 5], label, { fontSize: '11px' });
  return { s, map: p => [x0 + p[0] * s, y0 + p[1] * s], inside: p => p && p[0] >= 0 && p[1] >= 0 && p[0] <= W && p[1] <= H, unmap: q => [(q[0] - x0) / s, (q[1] - y0) / s] }; };
/* clip a 3D segment to Z_cam > zmin before projecting (exercise 3.4) */
G.segProj = (K, R, t, A, B, dist, zmin) => { zmin = zmin || 0.05; let a = G.toCam(R, t, A), b = G.toCam(R, t, B); if (a[2] < zmin && b[2] < zmin) return null;
  if (a[2] < zmin) a = G.add(a, G.mul(G.sub(b, a), (zmin - a[2]) / (b[2] - a[2]))); if (b[2] < zmin) b = G.add(b, G.mul(G.sub(a, b), (zmin - b[2]) / (a[2] - b[2])));
  const pr = p => { let x = p[0] / p[2], y = p[1] / p[2]; if (dist) [x, y] = G.distort([x, y], dist); return [K[0][0] * x + K[0][2], K[1][1] * y + K[1][2]]; }; return [pr(a), pr(b)]; };
G.rodrigues = w => { const th = G.norm(w); if (th < 1e-12) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; const k = G.mul(w, 1 / th), Kx = G.skew(k), c = Math.cos(th), s = Math.sin(th); const K2 = G.mm(Kx, Kx); return [0, 1, 2].map(i => [0, 1, 2].map(j => +(i === j) + s * Kx[i][j] + (1 - c) * K2[i][j])); };
/* Levenberg–Marquardt refinement of a pose on the reprojection error (what solvePnP does after its first guess) */
G.refinePose = (K, P3, uv, R0, t0, iters) => { let w = [0, 0, 0], t = t0.slice(); const res = (w, t) => { const R = G.mm(G.rodrigues(w), R0); const r = []; P3.forEach((P, i) => { const q = G.project(K, R, t, P); if (!q) { r.push(1e3, 1e3); return; } r.push(q[0] - uv[i][0], q[1] - uv[i][1]); }); return r; };
  let lam = 1e-3; let r = res(w, t); let cost = r.reduce((a, x) => a + x * x, 0);
  for (let it = 0; it < (iters || 30); it++) { const p = w.concat(t); const J = r.map(() => []); for (let k = 0; k < 6; k++) { const d = k < 3 ? 1e-6 : 1e-6 * Math.max(1, Math.abs(p[k])); const q = p.slice(); q[k] += d; const r2 = res(q.slice(0, 3), q.slice(3)); r2.forEach((x, i) => { J[i][k] = (x - r[i]) / d; }); }
    const A = [...Array(6)].map((_, i) => [...Array(6)].map((_, j) => J.reduce((s, row) => s + row[i] * row[j], 0) + (i === j ? lam * (1 + J.reduce((s, row) => s + row[i] * row[i], 0)) : 0))); const g = [...Array(6)].map((_, i) => -J.reduce((s, row, k) => s + row[i] * r[k], 0));
    const dx = V.solve(A, g); if (!dx) break; const q = p.map((x, i) => x + dx[i]); const rn = res(q.slice(0, 3), q.slice(3)); const cn = rn.reduce((a, x) => a + x * x, 0);
    if (cn < cost) { w = q.slice(0, 3); t = q.slice(3); r = rn; const imp = cost - cn; cost = cn; lam /= 10; if (imp < 1e-12) break; } else lam *= 10; }
  return { R: G.mm(G.rodrigues(w), R0), t }; };
window.G = G;
})();

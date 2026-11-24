/* Module 2 — small helpers for the visuals: a tiny neural network, polynomial fitting, float16 rounding, SHA-1. */
(function () {
const NN = window.NN = {};
const rng = s => { let x = (s || 1) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const randn = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
NN.rng = rng; NN.randn = randn;

/* the spiral of chapter 1 */
NN.spiral = (n = 100, k = 3, seed = 0) => { const r = rng(seed + 1), X = [], y = [];
  for (let c = 0; c < k; c++) for (let i = 0; i < n; i++) { const rad = i / (n - 1), t = c * 4 + 4 * i / (n - 1) + randn(r) * 0.2; X.push([rad * Math.sin(t), rad * Math.cos(t)]); y.push(c); }
  return { X, y }; };

/* a 2-layer network: d -> h -> k, ReLU (or identity), softmax + cross-entropy */
NN.init = (d, h, k, seed = 0, scale = 0.01, b1 = 0.0) => { const r = rng(seed + 7); const M = (a, b, s) => [...Array(a)].map(() => [...Array(b)].map(() => randn(r) * s));
  return { W1: M(d, h, Math.sqrt(2 / d)), b1: Array(h).fill(b1), W2: M(h, k, scale > 0 ? Math.sqrt(2 / h) * scale * 100 / 100 : 0), b2: Array(k).fill(0) }; };
NN.zeros = (d, h, k) => ({ W1: [...Array(d)].map(() => Array(h).fill(0)), b1: Array(h).fill(0), W2: [...Array(h)].map(() => Array(k).fill(0)), b2: Array(k).fill(0) });
NN.forward1 = (p, x, act = 'relu') => { const H = p.b1.length, K = p.b2.length; const z = [...Array(H)].map((_, j) => p.b1[j] + x.reduce((s, xi, i) => s + xi * p.W1[i][j], 0)); const h = z.map(v => act === 'relu' ? Math.max(0, v) : v);
  const s = [...Array(K)].map((_, c) => p.b2[c] + h.reduce((t, hj, j) => t + hj * p.W2[j][c], 0)); const m = Math.max(...s); const e = s.map(v => Math.exp(v - m)); const S = e.reduce((a, b) => a + b); return { z, h, s, pr: e.map(v => v / S) }; };
NN.lossGrad = (p, X, y, act = 'relu', noDiv = false) => { const H = p.b1.length, K = p.b2.length, D = X[0].length, n = X.length;
  const g = { W1: [...Array(D)].map(() => Array(H).fill(0)), b1: Array(H).fill(0), W2: [...Array(H)].map(() => Array(K).fill(0)), b2: Array(K).fill(0) }; let loss = 0, acc = 0;
  for (let i = 0; i < n; i++) { const f = NN.forward1(p, X[i], act); loss -= Math.log(Math.max(f.pr[y[i]], 1e-300)); if (f.pr.indexOf(Math.max(...f.pr)) === y[i]) acc++;
    const ds = f.pr.map((v, c) => (v - (c === y[i] ? 1 : 0)) / (noDiv ? 1 : n));
    for (let c = 0; c < K; c++) { g.b2[c] += ds[c]; for (let j = 0; j < H; j++) g.W2[j][c] += f.h[j] * ds[c]; }
    for (let j = 0; j < H; j++) { let dh = 0; for (let c = 0; c < K; c++) dh += ds[c] * p.W2[j][c]; const dz = act === 'relu' ? (f.z[j] > 0 ? dh : 0) : dh; g.b1[j] += dz; for (let d = 0; d < D; d++) g.W1[d][j] += X[i][d] * dz; } }
  return { loss: loss / n, acc: acc / n, g }; };
NN.step = (p, g, lr, sign = 1) => { ['W1', 'W2'].forEach(k => p[k].forEach((r, i) => r.forEach((_, j) => r[j] -= sign * lr * g[k][i][j]))); ['b1', 'b2'].forEach(k => p[k].forEach((_, i) => p[k][i] -= sign * lr * g[k][i])); };
NN.clone = p => JSON.parse(JSON.stringify(p));
/* softmax regression (no hidden layer) */
NN.linInit = (d, k) => ({ W: [...Array(d)].map(() => Array(k).fill(0)), b: Array(k).fill(0) });
NN.linTrain = (q, X, y, lr, steps) => { const K = q.b.length; for (let s = 0; s < steps; s++) { const gW = q.W.map(r => r.map(() => 0)), gb = q.b.map(() => 0);
  X.forEach((x, i) => { const sc = q.b.map((b, c) => b + x.reduce((t, xi, d) => t + xi * q.W[d][c], 0)); const m = Math.max(...sc); const e = sc.map(v => Math.exp(v - m)); const S = e.reduce((a, b) => a + b); e.forEach((v, c) => { const dd = (v / S - (c === y[i] ? 1 : 0)) / X.length; gb[c] += dd; x.forEach((xi, d) => gW[d][c] += xi * dd); }); });
  q.W.forEach((r, d) => r.forEach((_, c) => r[c] -= lr * gW[d][c])); q.b.forEach((_, c) => q.b[c] -= lr * gb[c]); } return q; };
NN.linPred = (q, x) => { const sc = q.b.map((b, c) => b + x.reduce((t, xi, d) => t + xi * q.W[d][c], 0)); return sc.indexOf(Math.max(...sc)); };
NN.COL = [[66, 99, 235], [232, 89, 12], [47, 158, 68], [174, 62, 201]];
/* paint decision regions of predict(x) on a canvas (data range [-1.1, 1.1]) */
NN.paint = (cv, predict, X, y, res = 70) => { const W = cv.width, H = cv.height, ctx = cv.getContext('2d'); const cw = W / res, ch = H / res;
  for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) { const x = -1.1 + 2.2 * (j + 0.5) / res, yy = 1.1 - 2.2 * (i + 0.5) / res; const c = NN.COL[predict([x, yy])]; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.22)`; ctx.fillRect(j * cw, i * ch, cw + 0.5, ch + 0.5); }
  X.forEach((p, k) => { const c = NN.COL[y[k]]; ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.beginPath(); ctx.arc((p[0] + 1.1) / 2.2 * W, (1.1 - p[1]) / 2.2 * H, 2.6, 0, 7); ctx.fill(); }); };

/* least squares polynomial fit with optional ridge, on x in [-1, 1] */
NN.polyfit = (xs, ys, deg, lam = 0) => { const n = deg + 1; const A = [...Array(n)].map(() => Array(n).fill(0)), b = Array(n).fill(0);
  xs.forEach((x, i) => { const v = [...Array(n)].map((_, k) => x ** (deg - k)); for (let a = 0; a < n; a++) { b[a] += v[a] * ys[i]; for (let c = 0; c < n; c++) A[a][c] += v[a] * v[c]; } });
  for (let a = 0; a < n; a++) A[a][a] += lam;
  // gaussian elimination with partial pivoting
  const M = A.map((r, i) => r.concat([b[i]])); for (let c = 0; c < n; c++) { let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r; [M[c], M[piv]] = [M[piv], M[c]]; const d = M[c][c] || 1e-300; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[n] / (r[i] || 1e-300)); };
NN.polyval = (c, x) => c.reduce((s, a) => s * x + a, 0);

/* round a number to IEEE half precision (returns the float16 value as a JS number) */
NN.f16 = v => { if (!isFinite(v) || isNaN(v)) return v; const s = v < 0 ? -1 : 1; let a = Math.abs(v); if (a >= 65520) return s * Infinity; if (a < 2 ** -25) return 0;
  if (a < 2 ** -14) { const q = 2 ** -24; return s * Math.round(a / q) * q; } const e = Math.floor(Math.log2(a)); const q = 2 ** (e - 10); let r = Math.round(a / q) * q; if (r >= 65520) return s * Infinity; return s * r; };
NN.bf16 = v => { if (!isFinite(v) || v === 0) return v; const e = Math.floor(Math.log2(Math.abs(v))); const q = 2 ** (e - 7); return Math.round(v / q) * q; };

/* SHA-1 of a UTF-8 string, hex */
NN.sha1 = str => { const msg = unescape(encodeURIComponent(str)); const l = msg.length; const words = []; for (let i = 0; i < l; i++) words[i >> 2] |= msg.charCodeAt(i) << (24 - (i % 4) * 8); words[l >> 2] |= 0x80 << (24 - (l % 4) * 8); words[(((l + 8) >> 6) + 1) * 16 - 1] = l * 8;
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0; const rol = (x, n) => (x << n) | (x >>> (32 - n));
  for (let i = 0; i < words.length; i += 16) { const w = []; for (let t = 0; t < 80; t++) w[t] = t < 16 ? (words[i + t] | 0) : rol(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1); let [a, b, c, d, e] = [h0, h1, h2, h3, h4];
    for (let t = 0; t < 80; t++) { const f = t < 20 ? (b & c) | (~b & d) : t < 40 ? b ^ c ^ d : t < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d; const k = t < 20 ? 0x5a827999 : t < 40 ? 0x6ed9eba1 : t < 60 ? 0x8f1bbcdc : 0xca62c1d6; const tmp = (rol(a, 5) + f + e + k + w[t]) | 0; e = d; d = c; c = rol(b, 30); b = a; a = tmp; }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0; }
  return [h0, h1, h2, h3, h4].map(x => (x >>> 0).toString(16).padStart(8, '0')).join(''); };
/* json.dumps(cfg, sort_keys=True) for flat dicts, like Python's default separators */
NN.pyjson = o => '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ': ' + (typeof o[k] === 'number' ? (Number.isInteger(o[k]) && !String(o[k]).includes('e') && o.__float && o.__float.includes(k) ? o[k].toFixed(1) : String(o[k])) : JSON.stringify(o[k]))).join(', ') + '}';
})();

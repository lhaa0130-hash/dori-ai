/*
 * Flat-Form Core
 * ----------------------------------------------------------------------------
 * 순수 기하/위상(topology) 로직만 담는 "베이스" 모듈.
 * 렌더링/입력과 완전히 분리되어 있어 Node 테스트로도 검증 가능하고,
 * 추후 평면도 외에 입면/3D/AI 사진 레이어가 모두 이 모듈의 model 하나만
 * 바라보도록(=베이스 수정 시 자동 반영) 설계되어 있다.
 *
 * 좌표 단위: meter (m). y축은 화면과 동일하게 아래로 증가.
 *
 * model = {
 *   points:  [{ id, x, y }],            // 꼭지점
 *   edges:   [{ id, a, b, bulge }],     // 벽(선). a,b = point id. bulge = 원호 sagitta(m, 부호有)
 *   circles: [{ id, cx, cy, r }],       // 독립 원 = 그 자체로 하나의 실
 * }
 */
(function (global) {
  'use strict';

  const PYEONG = 3.305785; // 1평 = 3.305785 m²
  const EPS = 1e-9;

  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function angleOf(fx, fy, tx, ty) { return Math.atan2(ty - fy, tx - fx); }

  // 다각형 부호 면적 (shoelace). poly = [{x,y}]
  function signedArea(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      s += a.x * b.y - b.x * a.y;
    }
    return s / 2;
  }

  // 다각형 무게중심 (라벨 배치용). 면적 0이면 정점 평균으로 폴백.
  function polygonCentroid(poly) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const cross = p.x * q.y - q.x * p.y;
      a += cross; cx += (p.x + q.x) * cross; cy += (p.y + q.y) * cross;
    }
    a *= 0.5;
    if (Math.abs(a) < EPS) {
      let sx = 0, sy = 0;
      for (const p of poly) { sx += p.x; sy += p.y; }
      return { x: sx / poly.length, y: sy / poly.length };
    }
    return { x: cx / (6 * a), y: cy / (6 * a) };
  }

  // 점 P에서 선분 AB까지 거리. {dist,t,cx,cy} 반환 (t는 0~1로 클램프)
  function pointSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const L2 = dx * dx + dy * dy;
    let t = L2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / L2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx, cy = ay + t * dy;
    return { dist: Math.hypot(px - cx, py - cy), t, cx, cy };
  }

  /*
   * 원호(arc)의 "내부 샘플 점"들을 반환 (양 끝점 A, B는 제외, 길이 = segs-1).
   * bulge = 현(chord) 중점에서 호 정점까지의 수직 높이(sagitta), 부호有.
   *   부호 + : A→B 진행방향 기준 왼쪽으로 볼록
   * 렌더링과 면적 계산이 동일 함수를 쓰므로 "보이는 모양 = 계산된 면적"이 항상 일치.
   */
  function sampleArc(ax, ay, bx, by, bulge, segs) {
    const dx = bx - ax, dy = by - ay;
    const c = Math.hypot(dx, dy);
    if (c < EPS || Math.abs(bulge) < EPS) return [];
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const px = -dy / c, py = dx / c;            // A→B 왼쪽 단위 수직벡터
    const h = bulge;
    const sign = h > 0 ? 1 : -1;
    const R = (c * c / 4 + h * h) / (2 * Math.abs(h));
    // 중심: 중점에서 정점 반대쪽으로 (R - |h|)
    const cx = mx - px * sign * (R - Math.abs(h));
    const cy = my - py * sign * (R - Math.abs(h));
    // 호의 정점(apex). sweep 방향은 "apex를 지나가는 쪽"으로 결정해야 단호/장호가
    // 부호·크기에 관계없이 항상 올바르게 선택된다.
    const apexX = mx + px * h, apexY = my + py * h;
    const a0 = Math.atan2(ay - cy, ax - cx);
    const a1 = Math.atan2(by - cy, bx - cx);
    const aApex = Math.atan2(apexY - cy, apexX - cx);
    const norm = (t) => { while (t < 0) t += 2 * Math.PI; while (t >= 2 * Math.PI) t -= 2 * Math.PI; return t; };
    const sFull = norm(a1 - a0);
    const sApex = norm(aApex - a0);
    const sweep = (sApex <= sFull) ? sFull : sFull - 2 * Math.PI;
    const out = [];
    for (let i = 1; i < segs; i++) {
      const a = a0 + sweep * (i / segs);
      out.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    return out;
  }

  /*
   * 평면 그래프의 면(face) 검출 = "닫힌 실" 검출.
   * 알고리즘: 각 무방향 간선을 양방향 half-edge로 보고, 도착 정점에서
   * 시계방향으로 다음 간선을 골라 면을 순회한다(planar face traversal).
   * 내부(유한) 면은 부호면적 > 0, 외곽(무한) 면은 < 0 으로 나오므로
   * 양수 면만 "실"로 채택한다. (좌표계/규칙은 Node 테스트로 검증됨)
   */
  function detectRooms(model, opts) {
    opts = opts || {};
    const arcSegs = opts.arcSegs || 16;
    const minArea = opts.minArea != null ? opts.minArea : 1e-4;

    const pts = new Map();
    for (const p of model.points) pts.set(p.id, p);

    const adj = new Map();
    for (const p of model.points) adj.set(p.id, []);
    const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
    const edgeByPair = new Map();

    for (const e of model.edges) {
      if (e.a === e.b || !pts.has(e.a) || !pts.has(e.b)) continue;
      adj.get(e.a).push({ to: e.b });
      adj.get(e.b).push({ to: e.a });
      edgeByPair.set(pairKey(e.a, e.b), e);
    }
    // 각 정점 둘레의 이웃을 각도순(반시계) 정렬
    for (const [id, nbrs] of adj) {
      const p = pts.get(id);
      nbrs.sort((u, v) =>
        angleOf(p.x, p.y, pts.get(u.to).x, pts.get(u.to).y) -
        angleOf(p.x, p.y, pts.get(v.to).x, pts.get(v.to).y));
    }

    const visited = new Set();
    const rawFaces = [];
    for (const e of model.edges) {
      if (e.a === e.b || !pts.has(e.a) || !pts.has(e.b)) continue;
      for (const dir of [[e.a, e.b], [e.b, e.a]]) {
        let cu = dir[0], cv = dir[1];
        if (visited.has(cu + '>' + cv)) continue;
        const face = [];
        let guard = 0;
        while (true) {
          const k = cu + '>' + cv;
          if (visited.has(k)) break;
          visited.add(k);
          face.push(cu);
          const nbrs = adj.get(cv);
          let idx = -1;
          for (let i = 0; i < nbrs.length; i++) if (nbrs[i].to === cu) { idx = i; break; }
          if (idx < 0) break;
          const next = nbrs[(idx - 1 + nbrs.length) % nbrs.length]; // 시계방향 다음
          cu = cv; cv = next.to;
          if (cu === dir[0] && cv === dir[1]) break;
          if (++guard > 200000) break;
        }
        if (face.length >= 3) rawFaces.push(face);
      }
    }

    const rooms = [];
    for (const face of rawFaces) {
      const poly = [];
      for (let i = 0; i < face.length; i++) {
        const aId = face[i], bId = face[(i + 1) % face.length];
        const a = pts.get(aId), b = pts.get(bId);
        poly.push({ x: a.x, y: a.y });
        const e = edgeByPair.get(pairKey(aId, bId));
        if (e && e.bulge) {
          let bl = e.bulge;
          if (e.a !== aId) bl = -bl; // 저장방향과 반대로 순회하면 볼록방향도 반전
          for (const s of sampleArc(a.x, a.y, b.x, b.y, bl, arcSegs)) poly.push(s);
        }
      }
      const sa = signedArea(poly);
      if (sa > minArea) { // 내부 면만 채택 (외곽 면은 음수)
        rooms.push({
          type: 'poly', face, poly,
          area: sa,
          centroid: polygonCentroid(poly),
        });
      }
    }

    // 독립 원 = 자체로 하나의 실
    for (const cir of (model.circles || [])) {
      rooms.push({
        type: 'circle', circle: cir,
        area: Math.PI * cir.r * cir.r,
        centroid: { x: cir.cx, y: cir.cy },
      });
    }

    let total = 0;
    for (const r of rooms) total += r.area;
    return { rooms, totalArea: total };
  }

  const FlatForm = {
    PYEONG, EPS,
    dist, angleOf, signedArea, polygonCentroid, pointSeg, sampleArc, detectRooms,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = FlatForm;
  if (typeof window !== 'undefined') window.FlatForm = FlatForm;
})(typeof globalThis !== 'undefined' ? globalThis : this);

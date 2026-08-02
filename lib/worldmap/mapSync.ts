// 평면 지도 ↔ 지구본 실시간 카메라 연동 (명세서 §6.3).
//
// 이 파일에는 MapLibre 를 import 하지 않는다. 지도 객체는 MapAdapter 로만 다루므로
// 재진입·떨림 방지 로직을 브라우저 없이 단위 테스트할 수 있다.
//
// 떨림이 생기는 원리:
//   A 를 움직이면 A 가 move 를 쏜다 → B 를 옮긴다 → B 도 move 를 쏜다 → 다시 A 를 옮긴다 → …
// 그래서 "지금 입력을 받고 있는 쪽(activeSource)" 하나만 발신자로 인정하고,
// 우리가 프로그램으로 옮기는 동안(applying)에는 어떤 move 도 되돌려 보내지 않는다.

export type MapSide = "flat" | "globe";

export interface Camera {
  center: [number, number];
  zoom: number;
  bearing: number;
}

export interface MapAdapter {
  getCamera(): Camera;
  /** 애니메이션 없이 즉시 이동. 실시간 연동은 큐가 쌓이면 안 되므로 이것만 쓴다. */
  jumpTo(camera: Camera): void;
  /** 명시적 이동(검색·국가 클릭)용. 양쪽에 같은 duration 을 준다. */
  easeTo(camera: Camera, durationMs: number): void;
  /** 진행 중인 자동 이동 취소. */
  stop(): void;
}

/** MapLibre 가 그리지 못하는 극단 위도를 잘라낸다. */
export const MAX_LATITUDE = 85;
export function clampLatitude(lat: number): number {
  return Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
}

/** 경도를 -180~180 으로 되돌린다. 지구본을 여러 바퀴 돌려도 평면지도가 튀지 않게 한다. */
export function wrapLongitude(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function normalizeCamera(camera: Camera, zoomRange: [number, number]): Camera {
  return {
    center: [wrapLongitude(camera.center[0]), clampLatitude(camera.center[1])],
    zoom: Math.max(zoomRange[0], Math.min(zoomRange[1], camera.zoom)),
    bearing: camera.bearing,
  };
}

export interface SyncOptions {
  /** 두 지도가 공유할 zoom 범위 (명세서 §6.4). */
  zoomRange?: [number, number];
  /** 프레임 스케줄러. 테스트에서는 즉시 실행 함수를 넣는다. */
  scheduleFrame?: (cb: () => void) => number;
  cancelFrame?: (id: number) => void;
  /** 명시적 이동 애니메이션 길이. 양쪽 지도에 동일하게 적용된다. */
  easeDurationMs?: number;
}

/** 프레임 예약 직후 아직 실제 id 를 못 받은 상태를 나타내는 표식. */
const SCHEDULED = -1;

export class MapSyncController {
  /** 지금 사용자의 입력을 받고 있는 지도. 이 지도만 발신자가 될 수 있다. */
  activeSource: MapSide | null = null;
  /** 우리가 상대 지도를 옮기는 중. 이 동안 들어온 move 는 메아리이므로 무시한다. */
  private applying = false;
  private frameId: number | null = null;
  private pending: { from: MapSide; camera: Camera } | null = null;
  private maps = new Map<MapSide, MapAdapter>();

  private readonly zoomRange: [number, number];
  private readonly scheduleFrame: (cb: () => void) => number;
  private readonly cancelFrame: (id: number) => void;
  readonly easeDurationMs: number;

  constructor(options: SyncOptions = {}) {
    this.zoomRange = options.zoomRange ?? [0.6, 7];
    this.scheduleFrame =
      options.scheduleFrame ??
      ((cb) => (typeof requestAnimationFrame === "function" ? requestAnimationFrame(cb) : (setTimeout(cb, 16) as unknown as number)));
    this.cancelFrame =
      options.cancelFrame ??
      ((id) => (typeof cancelAnimationFrame === "function" ? cancelAnimationFrame(id) : clearTimeout(id)));
    this.easeDurationMs = options.easeDurationMs ?? 700;
  }

  register(side: MapSide, adapter: MapAdapter): void {
    this.maps.set(side, adapter);
  }

  unregister(side: MapSide): void {
    this.maps.delete(side);
    if (this.activeSource === side) this.activeSource = null;
  }

  /**
   * 사용자가 어떤 지도를 만지기 시작했다. 그 지도를 발신자로 삼고,
   * 진행 중이던 자동 이동은 취소한다(명세서 §6.3-8).
   */
  beginInteraction(side: MapSide): void {
    this.activeSource = side;
    for (const [other, adapter] of this.maps) {
      if (other !== side) adapter.stop();
    }
  }

  endInteraction(side: MapSide): void {
    if (this.activeSource === side) this.activeSource = null;
  }

  /**
   * 지도가 움직였다고 알려올 때 호출한다.
   * 발신 자격이 없으면(메아리이거나 다른 쪽이 발신 중) 조용히 버린다.
   */
  handleMove(from: MapSide, camera: Camera): void {
    if (this.applying) return;                          // 우리가 옮기는 중 → 메아리
    if (this.activeSource !== null && this.activeSource !== from) return;  // 발신자는 하나뿐

    // 한 프레임에 한 번만 반영한다(명세서 §6.3-5).
    this.pending = { from, camera };
    if (this.frameId !== null) return;

    // ⚠️ 예약 표시를 먼저 세운다.
    //    scheduleFrame 이 콜백을 동기로 실행하면(테스트용 스케줄러가 그렇다)
    //    콜백이 frameId 를 null 로 되돌린 뒤에 반환값이 덮어써져서
    //    '영원히 예약 중' 상태로 굳고 그 뒤 연동이 전부 막힌다.
    this.frameId = SCHEDULED;
    const id = this.scheduleFrame(() => {
      this.frameId = null;
      const job = this.pending;
      this.pending = null;
      if (job) this.applyTo(job.from, job.camera);
    });
    // 콜백이 이미 동기로 끝났으면(frameId === null) 다시 채우지 않는다.
    if (this.frameId === SCHEDULED) this.frameId = id;
  }

  private applyTo(from: MapSide, camera: Camera): void {
    const target = normalizeCamera(camera, this.zoomRange);
    this.applying = true;
    try {
      for (const [side, adapter] of this.maps) {
        if (side === from) continue;
        adapter.jumpTo(target);                          // 실시간 연동은 큐가 쌓이지 않게 즉시 이동
      }
    } finally {
      this.applying = false;
    }
  }

  /**
   * 검색·국가 클릭 같은 명시적 이동. 양쪽 지도에 같은 duration 으로 적용한다(명세서 §6.3-7).
   * 이동하는 동안은 발신자를 비워 서로 메아리를 만들지 않는다.
   */
  moveAll(camera: Camera, durationMs = this.easeDurationMs): void {
    const target = normalizeCamera(camera, this.zoomRange);
    this.activeSource = null;
    this.applying = true;
    try {
      for (const adapter of this.maps.values()) adapter.easeTo(target, durationMs);
    } finally {
      this.applying = false;
    }
  }

  /** 대기 중인 프레임을 버린다. 언마운트 때 호출. */
  dispose(): void {
    if (this.frameId !== null && this.frameId !== SCHEDULED) this.cancelFrame(this.frameId);
    this.frameId = null;
    this.pending = null;
    this.maps.clear();
    this.activeSource = null;
  }

  /** 테스트·디버깅용 내부 상태. */
  get debugState() {
    return { activeSource: this.activeSource, applying: this.applying, hasPendingFrame: this.frameId !== null };
  }
}

/**
 * 경계 상자를 담을 수 있는 카메라를 구한다.
 * MapLibre 의 fitBounds 는 지구본에서 동작이 달라, 양쪽에 같은 값을 주려고 직접 계산한다.
 */
export function cameraForBounds(
  bbox: [number, number, number, number],
  zoomRange: [number, number] = [0.6, 7],
): Camera {
  const [minLon, minLat, maxLon, maxLat] = bbox;

  // 날짜변경선을 걸친 나라(러시아·피지 등)는 경도 폭이 360 에 가깝게 잡힌다.
  // 그럴 땐 확대하지 말고 전체가 보이게 둔다.
  let lonSpan = maxLon - minLon;
  let centerLon = (minLon + maxLon) / 2;
  if (lonSpan > 180) {
    lonSpan = 360 - lonSpan;
    centerLon = wrapLongitude(centerLon + 180);
  }
  const latSpan = Math.max(maxLat - minLat, 0.5);
  const span = Math.max(lonSpan, latSpan, 0.5);

  // span 이 360 이면 zoom 0, 절반이 될 때마다 1 씩 올라가는 표준 관계.
  const zoom = Math.log2(360 / span) - 0.4;   // -0.4 = 여백

  return {
    center: [wrapLongitude(centerLon), clampLatitude((minLat + maxLat) / 2)],
    zoom: Math.max(zoomRange[0], Math.min(zoomRange[1], zoom)),
    bearing: 0,
  };
}

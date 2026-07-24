// My World Emulator 통합 테스트 하네스 (05-06C).
// ⚠️ fail-closed: 에뮬레이터 환경이 아니거나 demo 프로젝트가 아니면 즉시 throw 한다.
//    → 실수로 프로덕션 Firebase 에 붙은 채 테스트가 "통과"하는 일을 원천 차단.

export const DEMO_PROJECT_ID = "demo-illo-myworld";

/** firebase emulators:exec 이 주입하는 환경변수를 검증하고 host/port 를 돌려준다. */
export function assertEmulatorEnv(): { firestoreHost: string; firestorePort: number; authHost: string; authPort: number } {
  const fs = process.env.FIRESTORE_EMULATOR_HOST;
  const auth = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!fs) throw new Error("FIRESTORE_EMULATOR_HOST 가 없습니다. `npm run test:my-world:emulator` 로 실행하세요.");
  if (!auth) throw new Error("FIREBASE_AUTH_EMULATOR_HOST 가 없습니다. `npm run test:my-world:emulator` 로 실행하세요.");

  const [firestoreHost, firestorePortRaw] = fs.split(":");
  const [authHost, authPortRaw] = auth.replace(/^https?:\/\//, "").split(":");
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || DEMO_PROJECT_ID;
  if (!projectId.startsWith("demo-")) {
    throw new Error(`데모 프로젝트가 아닙니다(projectId=${projectId}). 프로덕션 연결 위험으로 중단합니다.`);
  }
  return { firestoreHost, firestorePort: Number(firestorePortRaw), authHost, authPort: Number(authPortRaw) };
}

/**
 * 앱 Firebase 싱글톤이 에뮬레이터를 보도록 환경변수를 세팅한다.
 * 반드시 lib/firebase 를 import 하기 **전에** 호출해야 한다(동적 import 사용).
 */
export function prepareEmulatorEnv(): void {
  const { firestoreHost, firestorePort, authPort } = assertEmulatorEnv();
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = "true";
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = DEMO_PROJECT_ID;
  process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST = firestoreHost;
  process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_FIRESTORE_PORT = String(firestorePort);
  process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_AUTH_PORT = String(authPort);
  if (process.env.NODE_ENV === "production") {
    throw new Error("NODE_ENV=production 에서는 에뮬레이터 테스트를 실행할 수 없습니다.");
  }
}

/** 에뮬레이터 Firestore 데이터를 모두 지운다(테스트 간 격리). */
export async function clearFirestore(): Promise<void> {
  const { firestoreHost, firestorePort } = assertEmulatorEnv();
  const url = `http://${firestoreHost}:${firestorePort}/emulator/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`Firestore 초기화 실패: ${res.status}`);
}

/** 브라우저 전용 API 를 쓰는 앱 모듈(cottonCandy 등)을 Node 에서 구동하기 위한 최소 shim. */
export function installBrowserShim(): { storage: Map<string, string>; events: string[] } {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  const events: string[] = [];
  const target = new EventTarget();
  const win = {
    localStorage,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: (e: Event) => { events.push(e.type); return target.dispatchEvent(e); },
    location: { href: "http://localhost/" },
    navigator: { onLine: true },
  };
  Object.assign(globalThis, { window: win, localStorage, self: win });
  return { storage: store, events };
}

/** Firebase 연결을 정리해 테스트 프로세스가 끝나면 바로 종료되도록 한다. */
export async function shutdownFirebase(): Promise<void> {
  try {
    const { getApps, deleteApp } = await import("firebase/app");
    const { getAuth, signOut } = await import("firebase/auth");
    const { getFirestore, terminate } = await import("firebase/firestore");
    for (const app of getApps()) {
      try { await signOut(getAuth(app)); } catch { /* 이미 로그아웃 */ }
      try { await terminate(getFirestore(app)); } catch { /* 이미 종료 */ }
      try { await deleteApp(app); } catch { /* 이미 삭제 */ }
    }
  } catch { /* 정리 실패는 테스트 결과에 영향 주지 않는다 */ }
}

export function uninstallBrowserShim(): void {
  for (const key of ["window", "localStorage", "self"]) {
    delete (globalThis as Record<string, unknown>)[key];
  }
}

/** 조건이 만족될 때까지 짧게 폴링(임의의 긴 sleep 금지). */
export async function waitFor<T>(
  probe: () => Promise<T | null | undefined> | T | null | undefined,
  { timeoutMs = 5_000, intervalMs = 50, label = "condition" } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value as T;
      last = value;
    } catch (error) { last = error; }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timeout: ${label} (last=${String(last)})`);
}

let userSeq = 0;
/** 에뮬레이터 Auth 에 테스트 사용자를 만들고 로그인한다. 실제 이메일을 쓰지 않는다. */
export async function signInTestUser(auth: import("firebase/auth").Auth, label = "user"): Promise<{ uid: string; email: string }> {
  const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import("firebase/auth");
  userSeq += 1;
  const email = `myworld-${label}-${userSeq}@emulator.test`;
  const password = "emulator-only-password";
  try {
    const created = await createUserWithEmailAndPassword(auth, email, password);
    return { uid: created.user.uid, email };
  } catch {
    const signed = await signInWithEmailAndPassword(auth, email, password);
    return { uid: signed.user.uid, email };
  }
}

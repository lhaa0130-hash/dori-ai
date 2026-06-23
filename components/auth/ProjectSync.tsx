"use client";

// 프로젝트 개인 저장 — 지정한 localStorage 키들을 계정(Firebase)과 양방향 동기화.
// 같은 출처라 부모/앱이 같은 localStorage를 공유 → 앱 수정 없이 계정 저장이 붙는다.
// (워크일로 결과 보관함 등. flat-form은 iframe 부팅 타이밍 때문에 전용 FlatFormClient 사용)

import { useEffect, useRef } from "react";
import { saveProject, loadProject } from "@/lib/projectSave";

export default function ProjectSync({ project, keys }: { project: string; keys: string[] }) {
  const last = useRef("");
  const loaded = useRef(false);
  const keyStr = keys.join("|");

  // 1) Firebase → localStorage 복원
  useEffect(() => {
    let cancelled = false;
    const ks = keyStr.split("|").filter(Boolean);
    (async () => {
      try {
        const remote = await loadProject(project);
        if (!cancelled && remote) {
          const obj = JSON.parse(remote) as Record<string, string>;
          for (const k of ks) if (typeof obj[k] === "string") localStorage.setItem(k, obj[k]);
          last.current = remote;
          window.dispatchEvent(new Event("dori-project-synced"));
        }
      } catch { /* noop */ }
      loaded.current = true;
    })();
    return () => { cancelled = true; };
  }, [project, keyStr]);

  // 2) localStorage → Firebase (변경 시·이탈 시)
  useEffect(() => {
    const ks = keyStr.split("|").filter(Boolean);
    const snap = () => {
      const o: Record<string, string> = {};
      for (const k of ks) { const v = localStorage.getItem(k); if (v != null) o[k] = v; }
      return JSON.stringify(o);
    };
    const sync = () => {
      if (!loaded.current) return;
      const c = snap();
      if (c && c !== "{}" && c !== last.current) { last.current = c; void saveProject(project, c); }
    };
    const iv = setInterval(sync, 5000);
    const onHide = () => { if (document.visibilityState === "hidden") sync(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", sync);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", sync);
      sync();
    };
  }, [project, keyStr]);

  return null;
}

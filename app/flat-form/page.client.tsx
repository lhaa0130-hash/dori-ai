"use client";

// 아크일로(flat-form) — 로그인 후 계정별 저장.
// flat-form 앱(public/flatform-app)은 같은 출처 iframe이라 부모와 localStorage를 공유한다.
// 그래서 바닐라 앱을 건드리지 않고, 부모에서 Firebase ↔ localStorage 동기화만 해주면
// 설계 도면/지적도/개인 키가 계정에 저장돼 다른 기기에서도 이어진다.

import { useEffect, useRef, useState } from "react";
import BottomAd from "@/components/ads/BottomAd";
import { saveProject, loadProject } from "@/lib/projectSave";
import ProjectTopBar from "@/components/layout/ProjectTopBar";

const AD_H = 56; // 하단 소형 광고 높이(px)
const KEYS = ["ff_model", "ff_cad", "vw_key"]; // 설계/지적도/개인 VWorld 키

export default function FlatFormClient() {
  const [ready, setReady] = useState(false);
  const lastSaved = useRef<string>("");

  // 1) Firebase → localStorage 복원 후 iframe 로드 (앱이 부팅 시 복원된 데이터를 읽도록)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadProject("flatform");
        if (!cancelled && remote) {
          const obj = JSON.parse(remote) as Record<string, string>;
          for (const k of KEYS) {
            if (typeof obj[k] === "string") localStorage.setItem(k, obj[k]);
          }
          lastSaved.current = remote;
        }
      } catch { /* noop */ }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // 2) localStorage → Firebase 주기 저장(변경 시에만) + 이탈 시 저장
  useEffect(() => {
    if (!ready) return;
    const snapshot = () => {
      const obj: Record<string, string> = {};
      for (const k of KEYS) {
        const v = localStorage.getItem(k);
        if (v != null) obj[k] = v;
      }
      return JSON.stringify(obj);
    };
    const sync = () => {
      const cur = snapshot();
      if (cur && cur !== "{}" && cur !== lastSaved.current) {
        lastSaved.current = cur;
        void saveProject("flatform", cur);
      }
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
  }, [ready]);

  if (!ready) {
    return (
      <>
        <ProjectTopBar name="건축일로" emoji="📐" />
        <div className="fixed left-0 right-0 bottom-0 top-12 z-[9999] flex flex-col items-center justify-center gap-3 bg-white dark:bg-black">
          <div className="w-7 h-7 rounded-full border-2 border-neutral-200 dark:border-zinc-700 border-t-[#F9954E] animate-spin" />
          <p className="text-[13px] text-neutral-400">내 설계 불러오는 중…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ProjectTopBar name="건축일로" emoji="📐" />
      <iframe
        src="/flatform-app/index.html"
        title="건축일로 (Flat-Form)"
        style={{ position: "fixed", top: 48, left: 0, right: 0, bottom: 0, width: "100vw", height: "calc(100vh - 48px)", border: "none", zIndex: 9999 }}
      />
      <BottomAd height={AD_H} />
    </>
  );
}

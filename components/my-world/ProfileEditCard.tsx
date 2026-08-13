"use client";

// 마이월드 — 프로필 편집(표시 이름 · 아이디 · 소개).
//
// 2026-08-14: 코지홈(/profile, 1,580줄 단일 컴포넌트)을 폐지하고 마이월드로 옮기면서,
// 그 안에 흩어져 있던 편집 UI 를 **다시 짜서** 세 가지만 남겼다.
// 옛 코지홈에는 테마색·배경 스킨·프레임·이름 효과·배너 효과·스티커·관심사·펫이 있었는데,
// 그건 프로필을 꾸미는 기능이고 마이월드에서는 **방 꾸미기가 그 역할**을 한다. 중복이라 뺐다.
//
// ⚠️ 아이디(핸들)는 그냥 설정값이 아니다 — 이게 있어야 illo.im/@아이디 공개 홈이 생긴다.
//    실측(2026-08-13) 회원 7명 중 핸들을 정한 사람이 0명이라 아무도 공개 주소가 없었다.
//    그래서 여기서 가장 눈에 띄는 자리에 두고, 저장 전에 실시간으로 사용 가능 여부를 보여준다.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  currentUid, getProfile, saveMyProfile, checkHandle, setMyHandle, normalizeHandle,
  type Profile,
} from "@/lib/social";

const POINT = "#F9954E";
const BIO_MAX = 300;
const NAME_MAX = 20;

type HandleState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "bad"; reason: string };

export default function ProfileEditCard() {
  const { status } = useAuth();
  const loggedIn = status === "authenticated";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [handle, setHandle] = useState("");
  const [hState, setHState] = useState<HandleState>({ kind: "idle" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    const uid = currentUid();
    if (!uid) return;
    let alive = true;
    getProfile(uid).then((p) => {
      if (!alive) return;
      setProfile(p);
      setName(p.name || "");
      setBio(p.bio || "");
      setHandle(p.handle || "");
    });
    return () => { alive = false; };
  }, [loggedIn]);

  // 아이디 입력 → 400ms 뒤 형식·예약어·중복 확인. 저장 버튼을 누르기 전에 결과를 보여준다.
  const onHandleChange = useCallback((raw: string) => {
    const v = normalizeHandle(raw);
    setHandle(v);
    setMsg(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (!v) { setHState({ kind: "idle" }); return; }
    if (v === (profile?.handle || "")) { setHState({ kind: "idle" }); return; }  // 안 바꾼 상태
    setHState({ kind: "checking" });
    debounce.current = setTimeout(async () => {
      const r = await checkHandle(v);
      setHState(r.ok ? { kind: "ok" } : { kind: "bad", reason: r.reason || "사용할 수 없어요" });
    }, 400);
  }, [profile?.handle]);

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    try {
      const changedHandle = handle && handle !== (profile?.handle || "");
      if (changedHandle) {
        const r = await setMyHandle(handle);
        if (!r.ok) { setMsg(r.error || "아이디를 저장하지 못했어요"); setSaving(false); return; }
        if (r.warn) setMsg(r.warn);
      }
      const ok = await saveMyProfile({
        name: name.trim().slice(0, NAME_MAX) || "사용자",
        bio: bio.trim().slice(0, BIO_MAX),
      });
      if (!ok) { setMsg("저장하지 못했어요. 잠시 후 다시 시도해 주세요."); setSaving(false); return; }

      const uid = currentUid();
      if (uid) setProfile(await getProfile(uid));
      setHState({ kind: "idle" });
      setMsg((m) => m || "저장했어요.");
    } finally {
      setSaving(false);
    }
  }, [saving, handle, name, bio, profile?.handle]);

  if (!loggedIn) {
    return (
      <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-2 text-[15px] font-extrabold text-stone-900 dark:text-white">프로필</h2>
        <p className="text-[13px] text-stone-400">로그인하면 이름·아이디·소개를 설정할 수 있어요.</p>
      </section>
    );
  }

  const savedHandle = profile?.handle || "";

  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-4 text-[15px] font-extrabold text-stone-900 dark:text-white">프로필</h2>

      {/* 표시 이름 — users/{uid}.name 단일 원본. 헤더·피드·공개 홈에 전부 이 값이 쓰인다. */}
      <label className="mb-1.5 block text-[12px] font-bold text-stone-500 dark:text-stone-400">표시 이름</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
        placeholder="다른 사람에게 보이는 이름"
        className="mb-4 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-[14px] text-stone-900 outline-none focus:border-[#F9954E] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      />

      {/* 아이디 — 공개 주소를 만드는 값. 여기가 이 카드의 핵심이다. */}
      <label className="mb-1.5 block text-[12px] font-bold text-stone-500 dark:text-stone-400">
        아이디 <span className="font-normal text-stone-400">— 내 세계의 공개 주소가 돼요</span>
      </label>
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-[13px] text-stone-400">illo.im/@</span>
        <input
          value={handle}
          onChange={(e) => onHandleChange(e.target.value)}
          placeholder="myname"
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 font-mono text-[14px] text-stone-900 outline-none focus:border-[#F9954E] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>
      <p className="mt-1.5 text-[11.5px] text-stone-400">영문 소문자·숫자·밑줄(_) 3~20자</p>
      {hState.kind === "checking" && <p className="mt-1 text-[12px] text-stone-400">확인 중…</p>}
      {hState.kind === "ok" && <p className="mt-1 text-[12px] font-bold text-emerald-600">사용할 수 있어요 ✓</p>}
      {hState.kind === "bad" && <p className="mt-1 text-[12px] font-bold text-rose-500">{hState.reason}</p>}
      {savedHandle && (
        <p className="mt-1.5 text-[12px] text-stone-500 dark:text-stone-400">
          현재 주소{" "}
          <Link href={`/@${savedHandle}`} className="font-mono font-bold text-[#E8832E] hover:underline dark:text-[#FBAA60]">
            illo.im/@{savedHandle}
          </Link>
        </p>
      )}
      {savedHandle && handle !== savedHandle && handle && (
        // 주소가 바뀌면 기존 링크가 끊긴다 — 저장 전에 알려 준다.
        <p className="mt-1 text-[11.5px] text-amber-600">아이디를 바꾸면 예전 주소(@{savedHandle})는 더 이상 열리지 않아요.</p>
      )}

      {/* 소개 */}
      <label className="mb-1.5 mt-4 block text-[12px] font-bold text-stone-500 dark:text-stone-400">소개</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
        rows={4}
        placeholder="어떤 걸 만들고 있는지, 무엇에 관심이 있는지 적어보세요."
        className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-stone-900 outline-none focus:border-[#F9954E] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      />
      <p className="mt-1 text-right text-[11.5px] text-stone-400">{bio.length} / {BIO_MAX}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || hState.kind === "checking" || hState.kind === "bad"}
          className="rounded-xl px-4 py-2.5 text-[13px] font-black text-white transition active:scale-95 disabled:opacity-40"
          style={{ background: POINT }}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-[12.5px] text-stone-500 dark:text-stone-400">{msg}</span>}
      </div>
    </section>
  );
}

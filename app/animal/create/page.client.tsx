"use client";
import { useState, useEffect, useRef } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { generateAnimal, persistImage, removePersistedImage, registerCreation, shareCreationToFeed, getRemainingQuota, type GenAnimal, type PersistedImage } from "@/lib/userAnimals";

const EXAMPLES = [
  "구름 위에 사는 솜사탕 여우",
  "밤에 별빛을 먹는 심해 해파리",
  "책을 좋아하는 안경 쓴 거북이",
  "얼음 동굴에 사는 수정 사슴",
];

function Card({ a, img }: { a: GenAnimal; img: string }) {
  return (
    <div className="rounded-3xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
      <div className="relative aspect-[4/5] bg-stone-100 dark:bg-zinc-900">
        {img ? <img src={img} alt={a.animal_name} className="w-full h-full object-cover" /> : <div className="w-full h-full animate-pulse" />}
        <span className="absolute top-3 left-3 rounded-full bg-black/45 text-white text-[11px] font-bold px-2.5 py-1 backdrop-blur">🐣 나만의 동물</span>
        {a.status?.label && <span className="absolute top-3 right-3 rounded-full text-white text-[11px] font-bold px-2.5 py-1" style={{ background: a.status.color }}>{a.status.label}</span>}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-stone-900 dark:text-white break-keep">{a.animal_name}</h3>
          <span className="text-[11px] font-bold text-amber-500">{"★".repeat(Math.max(0, Math.min(5, a.rarity)))}{"☆".repeat(5 - Math.max(0, Math.min(5, a.rarity)))}</span>
        </div>
        {a.search_nickname && <p className="text-[13px] text-[#E8832E] dark:text-[#FBAA60] font-bold mt-0.5">&ldquo;{a.search_nickname}&rdquo;</p>}
        {a.kid_friendly_desc && <p className="text-[13px] text-stone-600 dark:text-stone-300 mt-2 leading-relaxed break-keep">{a.kid_friendly_desc}</p>}
        <div className="mt-3 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 p-3 space-y-1.5">
          {a.info?.map(([ic, k, v], i) => (
            <div key={i} className="flex items-start gap-2 text-[12.5px]">
              <span className="w-5 text-center flex-shrink-0">{ic}</span>
              <span className="font-bold text-stone-500 dark:text-stone-400 w-12 flex-shrink-0">{k}</span>
              <span className="text-stone-700 dark:text-stone-300 break-keep">{v}</span>
            </div>
          ))}
        </div>
        {a.facts?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {a.facts.map((f, i) => <li key={i} className="text-[12px] text-stone-500 dark:text-stone-400 pl-3 relative break-keep before:content-['•'] before:absolute before:left-0 before:text-[#F9954E]">{f}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

function Inner() {
  const { session } = useAuth();
  const authorName = session?.user?.name || "익명";
  const [prompt, setPrompt] = useState("");
  const [gen, setGen] = useState(false);
  const [result, setResult] = useState<{ animal: GenAnimal; falUrl: string } | null>(null);
  const [permUrl, setPermUrl] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState<{ profile: boolean; feed: boolean }>({ profile: false, feed: false });
  // ⚠️ busy(state)만으로는 같은 렌더 사이클의 연속 클릭을 못 막는다(04-11에서 실측).
  //    등록/공유는 addDoc·addPost 로 새 문서를 만들어 중복 제출 시 문서가 여러 개 생긴다 → ref 로 동기 차단.
  const submittingRef = useRef(false);
  // 04-13 이미지 소유권 추적:
  //  persistedRef  = 이번에 업로드한 이미지(url·storagePath). 등록/공유가 재사용(중복 업로드 방지).
  //  claimedRef    = 등록 또는 공유가 성공해 이 파일을 참조하게 됐는가. true 면 절대 삭제하지 않는다
  //                  (문서/피드가 소유권을 확정 — 잘못된 교차 cleanup 방지).
  const persistedRef = useRef<PersistedImage | null>(null);
  const claimedRef = useRef(false);

  useEffect(() => { getRemainingQuota().then(setRemaining); }, []);

  async function onGenerate() {
    if (!prompt.trim() || gen) return;
    setGen(true); setError(""); setResult(null); setPermUrl(null); setDone({ profile: false, feed: false });
    persistedRef.current = null; claimedRef.current = false; // 새 동물 = 새 이미지
    const r = await generateAnimal(prompt.trim());
    setGen(false);
    if (!r.ok) { setError(r.error); if (typeof r.remaining === "number") setRemaining(r.remaining); return; }
    setResult({ animal: r.animal, falUrl: r.imageUrl }); setRemaining(r.remaining);
  }
  // 이미지 영구 저장(1회만) — 실패 사유를 함께 돌려줌. 성공하면 persistedRef 에 보관해 재사용.
  async function ensurePerm(): Promise<{ image: PersistedImage | null; error?: string }> {
    if (persistedRef.current) return { image: persistedRef.current };
    if (!result) return { image: null, error: "먼저 동물을 만들어 주세요." };
    const r = await persistImage(result.falUrl);
    if (r.image) { persistedRef.current = r.image; setPermUrl(r.image.url); }
    return r;
  }
  // 04-13 보상: 아직 아무 성공도 참조하지 않은 '이번 요청 신규 업로드'만 삭제.
  //  삭제 실패는 내부 기록만 하고 삼킨다(원래 등록/공유 오류를 덮지 않기 위해).
  async function cleanupUnclaimedUpload() {
    const img = persistedRef.current;
    if (!img?.createdByThisRequest || claimedRef.current) return;
    try { await removePersistedImage(img); }
    catch { if (process.env.NODE_ENV !== "production") console.warn("[create-animal] uploaded image cleanup failed"); }
    persistedRef.current = null; setPermUrl(null); // 삭제된 URL 을 화면·다음 등록에 재사용하지 않음 → 재시도 시 재업로드
  }
  // ⚠️finally로 busy를 반드시 해제 — 예외/지연 시 버튼이 "저장 중…"에 갇히던 버그
  async function onRegister() {
    if (!result || submittingRef.current) return; // 동기 중복 제출 차단
    submittingRef.current = true;
    setBusy("profile"); setError("");
    try {
      const r = await ensurePerm();
      if (!r.image) { setError(r.error || "이미지 저장에 실패했어요."); return; }
      // 04-12: registerCreation 은 성공 시 문서 ID 를 돌려주고 실패하면 throw 한다(가짜 성공 금지).
      await registerCreation(result.animal, r.image.url, prompt.trim(), authorName, r.image.storagePath); // 04-14: 삭제용 경로 저장
      claimedRef.current = true; // 문서 생성 성공 → 파일 소유권 확정(이후 삭제 금지)
      setDone((d) => ({ ...d, profile: true }));
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.warn("[create-animal] animal creation registration failed");
      // 04-13 보상: 이번에 새로 올린 이미지가 고아로 남지 않게 삭제(cleanup 실패는 삼켜 원래 오류 유지)
      await cleanupUnclaimedUpload();
      setError("등록에 실패했어요. 잠시 후 다시 시도해 주세요."); // 입력·결과 유지, 가짜 성공 없음
    } finally {
      submittingRef.current = false;
      setBusy("");
    }
  }
  async function onShare() {
    if (!result || submittingRef.current) return; // 동기 중복 제출 차단(피드 중복 게시 방지)
    submittingRef.current = true;
    setBusy("feed"); setError("");
    try {
      const r = await ensurePerm();
      if (!r.image) { setError(r.error || "이미지 저장에 실패했어요."); return; }
      const ok = await shareCreationToFeed(result.animal, r.image.url, authorName);
      if (ok) { claimedRef.current = true; setDone((d) => ({ ...d, feed: true })); } // 피드가 이미지 참조 → 소유권 확정
      else {
        await cleanupUnclaimedUpload(); // 아직 아무 성공도 참조 안 했으면 신규 업로드 정리(claimed 면 no-op)
        setError("피드 공유에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.warn("[create-animal] feed share failed");
      await cleanupUnclaimedUpload();
      setError("문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      submittingRef.current = false;
      setBusy("");
    }
  }

  const noQuota = remaining !== null && remaining <= 0 && !result;

  return (
    <main className="w-full min-h-screen max-w-2xl mx-auto px-4 pt-8 pb-20">
      <a href="/animal" className="text-[13px] font-bold text-stone-400 hover:text-[#F9954E]">← 동물도감</a>
      <h1 className="text-[26px] sm:text-[32px] font-extrabold text-stone-950 dark:text-white mt-3 mb-1 break-keep">🐣 나만의 동물 만들기</h1>
      <p className="text-[14px] text-stone-400 dark:text-stone-500 break-keep">상상한 동물을 적으면 AI가 서식지·먹이·크기·수명까지 어울리게 지어줘요.</p>
      <p className="mt-1 text-[12px] font-bold text-[#F9954E]">오늘 남은 횟수: {remaining === null ? "…" : `${remaining} / 3`}</p>

      <div className="mt-5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="예: 구름 위에 사는 솜사탕 여우"
          className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[14px] text-foreground placeholder:text-stone-400 focus:outline-none focus:border-[#F9954E] resize-y break-keep"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setPrompt(ex)} className="rounded-full border border-stone-200 dark:border-zinc-800 px-2.5 py-1 text-[11px] text-stone-500 dark:text-stone-400 hover:border-[#F9954E]/50 transition">{ex}</button>
          ))}
        </div>
        <button
          onClick={onGenerate}
          disabled={gen || !prompt.trim() || noQuota}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#F9954E] to-[#f97e6d] py-3 text-[15px] font-extrabold text-white shadow-sm hover:brightness-105 transition disabled:opacity-40"
        >
          {gen ? "🎨 만드는 중… (5~10초)" : noQuota ? "오늘 횟수를 다 썼어요" : "✨ 동물 만들기"}
        </button>
        {error && <p role="alert" className="mt-2 text-[13px] font-bold text-red-500 break-keep">{error}</p>}
      </div>

      {gen && <div className="mt-6 rounded-3xl aspect-[4/5] max-w-xs mx-auto bg-stone-100 dark:bg-zinc-900 animate-pulse" />}

      {result && (
        <div className="mt-7">
          <div className="max-w-xs mx-auto">
            <Card a={result.animal} img={permUrl || result.falUrl} />
          </div>
          <div className="mt-4 max-w-xs mx-auto grid grid-cols-2 gap-2">
            <button onClick={onRegister} disabled={!!busy || done.profile} className="rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-black py-2.5 text-[13px] font-bold hover:opacity-90 transition disabled:opacity-50">
              {busy === "profile" ? "저장 중…" : done.profile ? "✓ 프로필에 등록됨" : "⭐ 프로필에 등록"}
            </button>
            <button onClick={onShare} disabled={!!busy || done.feed} className="rounded-2xl bg-[#F9954E] text-white py-2.5 text-[13px] font-bold hover:brightness-105 transition disabled:opacity-50">
              {busy === "feed" ? "올리는 중…" : done.feed ? "✓ 피드에 자랑함" : "📣 피드에 자랑하기"}
            </button>
          </div>
          {(done.profile || done.feed) && (
            <p role="status" className="mt-3 text-center text-[12px] text-stone-500">
              {done.profile && <a href="/profile" className="font-bold text-[#F9954E] hover:underline">내 프로필 보기</a>}
              {done.profile && done.feed && " · "}
              {done.feed && <a href="/feed" className="font-bold text-[#F9954E] hover:underline">피드 보기</a>}
            </p>
          )}
          <p className="mt-4 text-center text-[12px] text-stone-400">다른 동물을 만들고 싶으면 위에 새로 적어주세요.</p>
        </div>
      )}
    </main>
  );
}

export default function CreateAnimalClient() {
  return <RequireAuth><Inner /></RequireAuth>;
}

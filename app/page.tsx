// app/page.tsx — illo 메인 (SNS 피드 × AI 인사이트 하이브리드 랜딩, 라이트/다크 대응)
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getInsightFeed } from "@/lib/insightFeed";
import { getOrLists, getAnimalCount } from "@/lib/homeStats";

// 영어 홈(/en)과 hreflang 상호링크
export const metadata = {
  alternates: {
    canonical: "https://illo.im/",
    languages: {
      "ko-KR": "https://illo.im/",
      en: "https://illo.im/en",
      "x-default": "https://illo.im/",
    },
  },
};

const CAT_META: Record<string, { emoji: string; color: string }> = {
  트렌드: { emoji: "🔥", color: "#F9954E" },
  가이드: { emoji: "📖", color: "#3FA97A" },
  리포트: { emoji: "📊", color: "#5B7FE0" },
  분석: { emoji: "🔬", color: "#9C6BD0" },
  큐레이션: { emoji: "✨", color: "#E0679E" },
  영상: { emoji: "🎬", color: "#F9954E" },
};
const CATS = ["트렌드", "가이드", "리포트", "분석", "큐레이션", "영상"];

function fmtDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// SNS 피드 미리보기 — 랜딩 티저(실제 피드는 /feed). 예시 활동.
const FEED_TEASER = [
  { name: "라이", handle: "@lhaa0130", time: "2시간", text: "클로드코드로 주식 대시보드를 하루 만에 완성했어요. 프롬프트 3개면 충분하더라고요.", likes: 128 },
  { name: "도리", handle: "@doriillo", time: "5시간", text: "이번 주 AI 리포트 올렸습니다. 자금이 모델보다 인프라로 더 깊게 흐른 한 주였어요.", likes: 96 },
  { name: "몽글러", handle: "@mongglo", time: "6시간", text: "몽글로 1,205번째 동물이 추가됐어요. 오늘의 친구는 수달 🦦", likes: 342 },
  { name: "준", handle: "@jun_ai", time: "8시간", text: "Cursor랑 Genspark 실사용 비교 정리했어요. 결론은 상황별로 갈립니다.", likes: 74 },
];

const KIDS_ANIMALS = [
  { emoji: "🦉", name: "올빼미" },
  { emoji: "🐢", name: "거북이" },
  { emoji: "🦔", name: "고슴도치" },
  { emoji: "🦦", name: "수달" },
];

export default async function Home() {
  const feed = getInsightFeed(12, "ko");
  const orLists = getOrLists(5);
  const animalCount = getAnimalCount();

  const featured = feed[0];
  const rest = feed.slice(1, 7);
  const fmtM = (n: number) => (n >= 100 ? `${(n / 100).toFixed(n >= 1000 ? 0 : 1)}억` : `${n.toLocaleString()}만`);

  return (
    <main className="bg-[#FAFAF8] text-neutral-900 dark:bg-[#08080A] dark:text-[#F4F3F1]">

      {/* ① 히어로 */}
      <section className="max-w-[1240px] mx-auto px-6 sm:px-10 pt-14 sm:pt-20 pb-12 text-center">
        <span className="inline-block text-[13px] font-bold text-[#E8832E] dark:text-[#FF9D72] bg-[#F9954E]/10 border border-[#F9954E]/20 rounded-full px-3.5 py-1.5 mb-6">
          매일 만나는 AI 피드
        </span>
        <h1 className="text-[38px] sm:text-[54px] font-extrabold leading-[1.12] tracking-tight break-keep">
          흩어진 AI를,<br className="sm:hidden" /> 한 곳에서.
        </h1>
        <p className="mt-5 text-[15px] sm:text-[18px] text-neutral-500 dark:text-[#9C9B97] break-keep">
          AI 인사이트와 SNS 피드를 매일 한 곳에서.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/insight" className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-2xl bg-[#F9954E] text-white text-[15px] font-bold hover:brightness-105 active:scale-[0.98] transition">
            인사이트 보러가기 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/feed" className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-2xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-200 text-[15px] font-bold hover:border-[#F9954E]/50 hover:text-[#F9954E] transition">
            피드 둘러보기
          </Link>
        </div>
      </section>

      {/* ② 오늘 꼭 봐야 할 인사이트 */}
      <section className="max-w-[1240px] mx-auto px-6 sm:px-10 py-12">
        <div className="mb-1">
          <span className="text-[12px] font-extrabold tracking-widest text-[#F9954E]">TODAY</span>
        </div>
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-tight break-keep">오늘 꼭 봐야 할 인사이트</h2>
          <Link href="/insight" className="text-[14px] font-bold text-neutral-500 dark:text-[#9C9B97] hover:text-[#F9954E] transition whitespace-nowrap">인사이트 전체 →</Link>
        </div>
        {/* 카테고리 칩 */}
        <div className="-mx-6 px-6 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide mb-6">
          <div className="flex gap-2 w-max">
            {CATS.map((c) => (
              <Link key={c} href="/insight" className="text-[13.5px] font-semibold text-neutral-500 dark:text-[#9C9B97] border border-neutral-200 dark:border-white/10 rounded-full px-3.5 py-2 hover:border-[#F9954E]/50 hover:text-[#F9954E] transition whitespace-nowrap">
                {CAT_META[c]?.emoji} {c}
              </Link>
            ))}
          </div>
        </div>

        {feed.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {featured && <InsightCard item={featured} featured />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {rest.slice(0, 3).map((it) => <InsightCard key={it.slug} item={it} />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {rest.slice(3, 6).map((it) => <InsightCard key={it.slug} item={it} />)}
            </div>
          </div>
        )}
      </section>

      {/* ③ SNS 피드 */}
      <section className="max-w-[1240px] mx-auto px-6 sm:px-10 py-12">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-tight">SNS 피드</h2>
          <Link href="/feed" className="text-[14px] font-bold text-neutral-500 dark:text-[#9C9B97] hover:text-[#F9954E] transition whitespace-nowrap">피드 전체 →</Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 피드 리스트 */}
          <div className="lg:col-span-2 rounded-3xl border border-neutral-200/70 dark:border-white/[0.07] bg-white dark:bg-[#111114] divide-y divide-neutral-100 dark:divide-white/[0.06] px-5 sm:px-6">
            {FEED_TEASER.map((p) => (
              <div key={p.handle} className="flex gap-3 py-5">
                <div className="w-10 h-10 rounded-full bg-[#F9954E]/15 text-[#E8832E] dark:text-[#FF9D72] flex items-center justify-center font-extrabold text-[15px] flex-shrink-0">{p.name.slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <b className="text-neutral-900 dark:text-white">{p.name}</b>
                    <span className="text-neutral-400 dark:text-[#6f6e6b]">{p.handle} · {p.time}</span>
                  </div>
                  <p className="mt-1.5 text-[14px] text-neutral-700 dark:text-neutral-200 leading-relaxed break-keep">{p.text}</p>
                  <div className="mt-2.5 flex items-center gap-4 text-[12.5px] text-neutral-400 dark:text-[#6f6e6b]">
                    <span>♡ {p.likes}</span><span>댓글</span><span>공유</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* 커뮤니티 + 지표 */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="rounded-3xl border border-neutral-200/70 dark:border-white/[0.07] bg-white dark:bg-[#111114] p-6">
              <span className="text-[12px] font-extrabold tracking-widest text-[#F9954E]">커뮤니티</span>
              <h3 className="mt-2 text-[19px] font-extrabold break-keep">같이 연구하는 사람들</h3>
              <p className="mt-1.5 text-[13.5px] text-neutral-500 dark:text-[#9C9B97] break-keep">질문하고, 공유하고, 같이 실험해요.</p>
              <Link href="/community" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[13.5px] font-bold hover:brightness-105 transition">커뮤니티 가기 <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatChip label="몽글로 도감" value={`${animalCount.toLocaleString()}종`} href="/animal" />
              <StatChip label="오늘 인사이트" value={`${feed.length}편`} href="/insight" />
            </div>
          </div>
        </div>
      </section>

      {/* ④ AI 모델 랭킹 */}
      <section className="max-w-[1240px] mx-auto px-6 sm:px-10 py-12">
        <div className="mb-1">
          <span className="text-[12px] font-extrabold tracking-widest text-[#F9954E]">AI 모델 랭킹</span>
        </div>
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-tight break-keep">지금 뜨는 모델, 한눈에</h2>
          <Link href="/ai-models" className="text-[14px] font-bold text-neutral-500 dark:text-[#9C9B97] hover:text-[#F9954E] transition whitespace-nowrap">전체 비교 →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModelCol title="많이 쓰는" rows={orLists.usage.map((m) => ({ name: m.name, v: fmtM(m.reqM) }))} accent="#F9954E" />
          <ModelCol title="똑똑한" rows={orLists.intel.map((m) => ({ name: m.name, v: `${m.score}점` }))} accent="#5B7FE0" />
          <ModelCol title="빠른" rows={orLists.speed.map((m) => ({ name: m.name, v: `${m.tps}tps` }))} accent="#3FA97A" />
        </div>
      </section>

      {/* ⑤ 키즈 · 몽글로 */}
      <section className="max-w-[1240px] mx-auto px-6 sm:px-10 py-12">
        <div className="rounded-3xl border border-neutral-200/70 dark:border-white/[0.07] bg-gradient-to-br from-[#FFF3EA] to-white dark:from-[#F9954E]/[0.07] dark:to-[#111114] p-7 sm:p-10 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <span className="text-[12px] font-extrabold tracking-widest text-[#F9954E]">🐾 키즈 · 몽글로</span>
            <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold leading-tight break-keep">아이와 함께 보는<br />AI 동물도감</h2>
            <p className="mt-3 text-[14px] sm:text-[15px] text-neutral-500 dark:text-[#9C9B97] break-keep">
              {animalCount.toLocaleString()}종의 동물을 AI가 이야기로 들려줘요. 궁금한 동물을 찾아 나만의 도감을 채워보세요.
            </p>
            <Link href="/animal" className="mt-5 inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-[#F9954E] text-white text-[14px] font-bold hover:brightness-105 transition">몽글로 열기 <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            {KIDS_ANIMALS.map((a) => (
              <div key={a.name} className="w-[84px] h-[84px] rounded-2xl bg-white dark:bg-[#08080A]/60 border border-neutral-200/70 dark:border-white/10 flex flex-col items-center justify-center gap-1">
                <span className="text-[28px] leading-none">{a.emoji}</span>
                <span className="text-[11.5px] font-bold text-neutral-500 dark:text-neutral-300">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑥ 최종 CTA */}
      <section className="max-w-[1240px] mx-auto px-6 sm:px-10 pt-8 pb-24 text-center">
        <h2 className="text-[30px] sm:text-[40px] font-extrabold tracking-tight">
          모든 일을, <span className="text-[#F9954E]">일로.</span>
        </h2>
        <p className="mt-3 text-[15px] sm:text-[17px] text-neutral-500 dark:text-[#9C9B97] break-keep">흩어진 AI를 한 곳에 모아, 매일 읽어보세요.</p>
        <Link href="/login" className="mt-7 inline-flex items-center gap-1.5 px-8 py-4 rounded-2xl bg-[#F9954E] text-[#3A1E10] font-extrabold text-[15px] hover:brightness-105 active:scale-[0.98] transition">
          무료로 시작하기
        </Link>
      </section>
    </main>
  );
}

// ── 서브 컴포넌트 ──
function InsightCard({ item, featured = false }: { item: any; featured?: boolean }) {
  const meta = CAT_META[item.category] || { emoji: "📝", color: "#F9954E" };
  const isVideo = item.category === "영상";
  const source = isVideo ? item.channel : item.author || item.channel || "DORI-AI";
  const date = isVideo ? item.videoDate : item.date;
  return (
    <Link
      href={`/insight/article/${item.slug}`}
      className="group block rounded-[22px] overflow-hidden border border-neutral-200/70 dark:border-white/[0.07] bg-white dark:bg-[#111114] hover:border-[#F9954E]/40 transition"
    >
      <div className={`relative w-full ${featured ? "aspect-[16/10]" : "aspect-[16/9]"} bg-neutral-100 dark:bg-[#08080A] overflow-hidden`}>
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">{meta.emoji}</div>
        )}
        <span className="absolute top-3 left-3 text-[11px] font-bold text-white px-2 py-1 rounded-lg" style={{ backgroundColor: meta.color }}>
          {meta.emoji} {item.category}
        </span>
      </div>
      <div className={featured ? "p-5" : "p-4"}>
        <h3 className={`font-extrabold leading-snug break-keep line-clamp-2 group-hover:text-[#F9954E] transition ${featured ? "text-[19px]" : "text-[15px]"}`}>{item.title}</h3>
        {featured && item.summary && <p className="mt-2 text-[13.5px] text-neutral-500 dark:text-[#9C9B97] line-clamp-2 break-keep">{item.summary}</p>}
        <p className="mt-2.5 text-[12px] text-neutral-400 dark:text-[#6f6e6b]">{isVideo ? "📺 " : ""}{source} · {fmtDate(date)}</p>
      </div>
    </Link>
  );
}

function StatChip({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-neutral-200/70 dark:border-white/[0.07] bg-white dark:bg-[#111114] p-4 hover:border-[#F9954E]/40 transition">
      <div className="text-[20px] font-extrabold tracking-tight">{value}</div>
      <div className="mt-0.5 text-[12px] text-neutral-400 dark:text-[#6f6e6b]">{label}</div>
    </Link>
  );
}

function ModelCol({ title, rows, accent }: { title: string; rows: { name: string; v: string }[]; accent: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 dark:border-white/[0.07] bg-white dark:bg-[#111114] p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-[13.5px] font-extrabold">{title}</span>
      </div>
      <div>
        {rows.length === 0 ? (
          <p className="text-[13px] text-neutral-400 py-2">불러오는 중…</p>
        ) : rows.map((r, i) => (
          <div key={r.name + i} className="flex items-center gap-3 py-2.5 border-t border-neutral-100 dark:border-white/[0.05] first:border-0">
            <span className="w-4 text-center text-[13px] font-extrabold" style={{ color: i < 3 ? accent : undefined }}>{i + 1}</span>
            <span className="flex-1 min-w-0 truncate text-[13.5px] font-semibold text-neutral-800 dark:text-neutral-100">{r.name}</span>
            <span className="text-[12.5px] font-bold text-neutral-400 dark:text-[#9C9B97] tabular-nums flex-shrink-0">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

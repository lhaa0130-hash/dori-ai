// 게임 페이지 하단에 붙는 정적 안내. **서버 컴포넌트**여야 의미가 있다.
// 게임 본체는 전부 "use client" 라 정적 HTML 에 본문이 남지 않는데, 이 조각은
// 빌드 시점에 그대로 HTML 로 찍혀서 크롤러·심사원이 자바스크립트 없이도 읽을 수 있다.
// ("use client" 를 붙이는 순간 존재 이유가 사라지니 절대 붙이지 말 것)
import Link from "next/link";
import { getMiniGameGuide } from "@/lib/minigame-guides";

export default function GameGuide({ slug }: { slug: string }) {
  const g = getMiniGameGuide(slug);
  if (!g) return null;

  return (
    <section className="px-6 xl:px-[260px] pb-20 pt-4">
      <div className="max-w-[720px] mx-auto border-t border-stone-100 dark:border-zinc-900 pt-8">
        <h2 className="text-[20px] font-extrabold text-stone-950 dark:text-white mb-3 break-keep">
          {g.name} 게임 방법
        </h2>
        <p className="text-[14px] leading-[1.85] text-stone-600 dark:text-stone-300 break-keep mb-7">
          {g.intro}
        </p>

        <h3 className="text-[15px] font-bold text-stone-950 dark:text-white mb-2.5">조작 방법</h3>
        <ul className="mb-7 space-y-1.5">
          {g.controls.map((c) => (
            <li
              key={c}
              className="text-[13.5px] leading-[1.8] text-stone-600 dark:text-stone-300 break-keep pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-1 before:h-1 before:rounded-full before:bg-[#F9954E]"
            >
              {c}
            </li>
          ))}
        </ul>

        <h3 className="text-[15px] font-bold text-stone-950 dark:text-white mb-2.5">점수 기준</h3>
        <p className="text-[13.5px] leading-[1.8] text-stone-600 dark:text-stone-300 break-keep mb-7">
          {g.scoring}
        </p>

        <h3 className="text-[15px] font-bold text-stone-950 dark:text-white mb-2.5">공략 팁</h3>
        <ul className="mb-7 space-y-1.5">
          {g.tips.map((t) => (
            <li
              key={t}
              className="text-[13.5px] leading-[1.8] text-stone-600 dark:text-stone-300 break-keep pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-1 before:h-1 before:rounded-full before:bg-[#F9954E]"
            >
              {t}
            </li>
          ))}
        </ul>

        {g.engine === "unity" && (
          <p className="text-[12.5px] leading-[1.8] text-stone-400 dark:text-stone-500 break-keep mb-7">
            이 게임은 유니티(Unity) WebGL 빌드로, 브라우저에서 바로 실행됩니다. 설치나 별도 플러그인은
            필요 없지만 처음 실행할 때 파일을 내려받는 시간이 조금 걸립니다.
          </p>
        )}

        <Link
          href="/minigame"
          className="inline-block text-[13px] font-semibold text-[#F9954E] hover:underline"
        >
          ← 미니게임 전체 목록 보기
        </Link>
      </div>
    </section>
  );
}

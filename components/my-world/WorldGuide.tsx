"use client";

// My World — 조작 안내.
//
// 무대 부제("터치하거나 길게 눌러 반응을 만나보세요") 한 줄로는 이 공간에서 무엇을 할 수 있는지
// 알기 어려웠다. 실제로 구현돼 있는 조작만 적는다 — 없는 기능을 안내하지 않는다.
//  · 한 번 터치 / 두 번 터치 / 길게 누르기 → InteractionContext 의 touch·double_tap·long_press
//  · 가구 터치 → room_item
//  · 방 꾸미기 → RoomEditorModal
import WorldPanel from "@/components/my-world/WorldPanel";

const GUIDE = [
  { keys: "한 번 터치", body: "가볍게 반응해요." },
  { keys: "두 번 터치", body: "더 크게 기뻐해요." },
  { keys: "길게 누르기", body: "가장 반가운 반응이에요." },
  { keys: "가구 터치", body: "그 가구에 맞는 반응을 보여줘요." },
];

export default function WorldGuide() {
  return (
    <WorldPanel title="이렇게 놀아요" tone="glass" labelledById="guide-heading">
      <ul className="space-y-2">
        {GUIDE.map((g) => (
          <li key={g.keys} className="flex items-start gap-2">
            {/* 폭을 고정해 설명 문구의 왼쪽 정렬을 맞춘다(배지 길이가 달라 들쭉날쭉해 보였다). */}
            <span className="mt-0.5 w-[72px] flex-none rounded-lg bg-white py-0.5 text-center text-[11px] font-black text-[#9A4E14] shadow-sm dark:bg-zinc-800">
              {g.keys}
            </span>
            <span className="min-w-0 break-keep text-[11px] font-medium leading-relaxed text-stone-500 dark:text-zinc-400">
              {g.body}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 break-keep text-[11px] font-medium leading-relaxed text-stone-500 dark:text-zinc-400">
        키보드로도 할 수 있어요 — Tab 으로 캐릭터에 이동한 뒤 Enter.
      </p>
    </WorldPanel>
  );
}

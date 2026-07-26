"use client";

// My World — 게스트 초대(체험 뒤에 만나는 단 하나의 CTA).
//
// 이전 게스트 화면은 상단을 혜택 카드 3장 + 큰 CTA 로 채워 "회원가입 광고" 처럼 읽혔다.
// 여기서는 순서를 뒤집는다 — 위에서 캐릭터를 만지고 방을 본 **뒤** 이 초대를 만난다.
// 잠금 카드를 반복하지 않고, 로그인하면 열리는 것을 한 줄씩 조용히 적는다.
import Link from "next/link";

const OPENS = [
  { emoji: "💗", text: "친밀도와 EXP가 저장돼요" },
  { emoji: "🛋️", text: "꾸민 방이 기기와 상관없이 남아요" },
  { emoji: "📖", text: "함께한 순간이 일기로 쌓여요" },
];

export default function GuestInvite() {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#F2D9C6] bg-gradient-to-br from-[#FFF3E7] via-[#FDE9E0] to-[#FBEEE7] p-4 dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 sm:p-5"
      aria-labelledby="guest-invite-heading"
    >
      <h2 id="guest-invite-heading" className="break-keep text-[15px] font-extrabold text-stone-800 dark:text-zinc-100">
        마음에 들면, 이 세계를 내 것으로
      </h2>
      <p className="mt-1 break-keep text-[12px] font-medium leading-relaxed text-stone-500 dark:text-zinc-400">
        지금까지의 체험은 저장되지 않았어요. 로그인하면 여기서부터 계속 쌓여요.
      </p>

      <ul className="mt-3 space-y-1.5">
        {OPENS.map((o) => (
          <li key={o.text} className="flex items-start gap-2 text-[12px] font-semibold text-stone-600 dark:text-zinc-300">
            <span className="flex-none" aria-hidden>{o.emoji}</span>
            <span className="min-w-0 break-keep">{o.text}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/login?next=/my-world"
        className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-[#F9954E] px-5 text-[14px] font-black text-white shadow-[0_6px_16px_rgba(249,149,78,0.32)] transition hover:bg-[#E8832E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] sm:w-auto"
      >
        로그인하고 이어서 키우기
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}

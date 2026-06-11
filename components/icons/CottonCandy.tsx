// 솜사탕 아이콘 — 유니코드에 '솜사탕' 이모지가 없어 브랜드용 SVG로 제작.
// 크기는 className(w-/h-)으로 조절. 텍스트 옆 인라인 정렬 기본 포함.
export default function CottonCandy({ className = "w-4 h-4 inline-block align-[-0.15em]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="솜사탕">
      {/* 막대 */}
      <rect x="11.1" y="11.5" width="1.8" height="10.5" rx="0.9" fill="#C68A5E" />
      {/* 솜 (뭉게뭉게) */}
      <circle cx="8.4" cy="8.4" r="4.3" fill="#AEE0F5" />
      <circle cx="15.6" cy="8.4" r="4.3" fill="#FBC4D6" />
      <circle cx="12" cy="6" r="4.9" fill="#F79EC4" />
      <circle cx="12" cy="10.2" r="4.5" fill="#F7B3D2" />
      <circle cx="9.7" cy="6.7" r="1.7" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

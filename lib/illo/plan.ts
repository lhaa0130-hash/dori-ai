// 일로(Illo) 요금제 정의
// page.client.tsx: PLANS.map(p => p.id/label/price/limit/model/highlight/perks)
// id는 "free" | "pro" 두 가지 (현재 사용 여부 판정에 사용)

export type IlloPlan = {
  id: "free" | "pro";
  label: string;
  price: string;
  limit: string;
  model: string;
  highlight?: boolean;
  perks: string[];
};

export const PLANS: IlloPlan[] = [
  {
    id: "free",
    label: "무료",
    price: "₩0",
    limit: "기본 사용량",
    model: "기본 제공 모델",
    perks: [
      "비서실 · 글쓰기 기본 기능",
      "결과물 보관함(최근 기록)",
      "워크플로우 직접 설계",
    ],
  },
  {
    id: "pro",
    label: "프로 (내 키)",
    price: "내 API 키 연결",
    limit: "키 한도까지 무제한",
    model: "최신 고성능 모델",
    highlight: true,
    perks: [
      "내 API 키로 모든 도구 사용",
      "이미지 · 영상 등 미디어 생성",
      "도구별 말투(톤) 저장",
      "더 빠르고 강력한 최신 모델",
    ],
  },
];

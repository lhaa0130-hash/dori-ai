"use client";

// 기사 제목/태그에서 회사를 자동 감지해, 있으면 실제 로고 배지를 썸네일 위에 오버레이.
// 회사가 명확히 잡히는 글에만 표시(없으면 null). 로고는 Google s2 favicon(무료·키 불필요, 실제 브랜드 마크).
// 부모 컨테이너는 position:relative 여야 함.

const COMPANY_MAP: [RegExp, string][] = [
  [/\bopenai\b|오픈ai|chatgpt|챗gpt|gpt-?\d|gpt ?image|소라|\bsora\b|샘 ?알트만|sam ?altman/i, "openai.com"],
  [/anthropic|앤트로픽|\bclaude\b|클로드/i, "anthropic.com"],
  [/deepmind|딥마인드|gemini|제미나이|제미니|\bgoogle\b|구글|알파벳|alphabet/i, "google.com"],
  [/microsoft|마이크로소프트|\bms\b|코파일럿|copilot|\bbing\b|빙\b|애저|azure/i, "microsoft.com"],
  [/엔비디아|nvidia/i, "nvidia.com"],
  [/\bmeta\b|메타\b|\bllama\b|라마\b|facebook|페이스북|instagram|인스타그램|쓰레드|threads/i, "meta.com"],
  [/\bapple\b|애플|아이폰|iphone|\bsiri\b|시리\b/i, "apple.com"],
  [/\bamazon\b|아마존|\baws\b/i, "amazon.com"],
  [/\bx\.?ai\b|\bgrok\b|그록|일론 ?머스크|elon ?musk/i, "x.ai"],
  [/deepseek|딥시크/i, "deepseek.com"],
  [/mistral|미스트랄/i, "mistral.ai"],
  [/perplexity|퍼플렉시티/i, "perplexity.ai"],
  [/midjourney|미드저니/i, "midjourney.com"],
  [/stability ?ai|스테이빌리티|스테빌리티|stable ?diffusion/i, "stability.ai"],
  [/runway|런웨이/i, "runwayml.com"],
  [/\beleven ?labs\b|일레븐랩스/i, "elevenlabs.io"],
  [/figma|피그마/i, "figma.com"],
  [/adobe|어도비/i, "adobe.com"],
  [/canva|캔바/i, "canva.com"],
  [/notion|노션/i, "notion.so"],
  [/삼성|samsung/i, "samsung.com"],
  [/sk ?하이닉스|sk ?hynix|하이닉스/i, "skhynix.com"],
  [/네이버|naver|하이퍼클로바|hyperclova/i, "naver.com"],
  [/카카오|kakao/i, "kakao.com"],
  [/\bintel\b|인텔/i, "intel.com"],
  [/\bamd\b/i, "amd.com"],
  [/tsmc/i, "tsmc.com"],
  [/qualcomm|퀄컴/i, "qualcomm.com"],
  [/\bibm\b/i, "ibm.com"],
  [/oracle|오라클/i, "oracle.com"],
  [/salesforce|세일즈포스/i, "salesforce.com"],
  [/소프트뱅크|softbank/i, "softbank.jp"],
  [/알리바바|alibaba|\bqwen\b|큐원/i, "alibaba.com"],
  [/바이두|baidu|어니|ernie/i, "baidu.com"],
  [/텐센트|tencent/i, "tencent.com"],
  [/tesla|테슬라/i, "tesla.com"],
  [/스포티파이|spotify/i, "spotify.com"],
  [/유튜브|youtube/i, "youtube.com"],
  [/틱톡|tiktok|바이트댄스|bytedance/i, "tiktok.com"],
  [/cohere|코히어/i, "cohere.com"],
  [/hugging ?face|허깅페이스/i, "huggingface.co"],
];

export function detectCompanyDomain(text: string): string | null {
  if (!text) return null;
  for (const [re, domain] of COMPANY_MAP) {
    if (re.test(text)) return domain;
  }
  return null;
}

export default function CompanyLogoBadge({
  text,
  size = 22,
}: {
  text: string;
  size?: number;
}) {
  const domain = detectCompanyDomain(text);
  if (!domain) return null;
  const logo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  return (
    <span
      className="absolute z-10 inline-flex items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/10"
      style={{ width: size, height: size, padding: Math.round(size * 0.16), right: 4, bottom: 4 }}
      title={domain}
    >
      <img
        src={logo}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain"
        onError={(e) => {
          const p = e.currentTarget.parentElement as HTMLElement | null;
          if (p) p.style.display = "none";
        }}
      />
    </span>
  );
}

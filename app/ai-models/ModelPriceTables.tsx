// /ai-models 의 **서버 렌더링** 콘텐츠. 클라이언트 계산기(AiModelsClient)와 별개다.
//
// ── 왜 필요한가 ───────────────────────────────────────────────────────────────
// 2026-08-13 Search Console 실측: "ai 모델 비용"·"ai 모델 견적"·"model cost" 로 이 페이지가
// 잡히긴 하는데 **75위**였다. 원인은 명확했다 — 정적 HTML 본문이 374자뿐이고 그 안에
// **모델 이름도 가격 숫자도 하나 없었다**(표 내용이 "불러오는 중…" 이었다).
// 계산기가 클라이언트에서 데이터를 받아 그리니, 구글이 읽는 HTML 에는 매칭할 게 없었다.
//
// 그래서 같은 데이터를 **빌드 타임에 읽어 표로 서버 렌더링**한다(lib/homeStats.ts 와 같은 패턴).
// 계산기는 그대로 두고, 검색엔진과 "계산기 만지기 전에 답부터 보고 싶은 사람" 둘 다에게
// 실제 숫자를 먼저 보여준다.
//
// ⚠️ 여기 숫자는 전부 public/openrouter-stats.json 에서 온다. 하나도 지어내지 않는다.
//    원천이 비면 그 행을 건너뛴다(빈 값을 0 이나 추정치로 채우지 말 것).
import fs from "node:fs";
import path from "node:path";

type Model = {
  name: string; provider?: string;
  req?: number; reqM?: number; tps?: number;
  pin?: number; pout?: number; intel?: number;
};
type Stats = { updatedAt?: string; total?: number; usageTop?: Model[]; priceTop?: Model[]; speedTop?: Model[] };

function readStats(): Stats {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/openrouter-stats.json"), "utf-8"));
  } catch {
    return {};
  }
}

// 표준 시나리오 — 숫자 하나만 놓고 "얼마 드냐"에 바로 답하기 위한 기준.
// 월 1만 회 호출 · 회당 입력 1,000 토큰 · 출력 500 토큰 = 입력 1,000만 · 출력 500만 토큰.
// 가격은 100만 토큰당 USD 이므로 곱하는 계수는 아래와 같다.
const CALLS = 10_000;
const IN_TOK = 1_000;
const OUT_TOK = 500;
const IN_M = (CALLS * IN_TOK) / 1_000_000;   // 10
const OUT_M = (CALLS * OUT_TOK) / 1_000_000; // 5

const monthly = (m: Model) =>
  typeof m.pin === "number" && typeof m.pout === "number" ? m.pin * IN_M + m.pout * OUT_M : null;

const usd = (n: number) =>
  n >= 100 ? `$${n.toFixed(0)}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`;

type Locale = "ko" | "en";

function PriceTable({ rows, caption, locale }: { rows: Model[]; caption: string; locale: Locale }) {
  const priced = rows.filter((m) => monthly(m) !== null);
  if (!priced.length) return null;
  const th = locale === "en"
    ? ["Model", "Input / 1M tokens", "Output / 1M tokens", "Est. monthly cost"]
    : ["모델", "입력 100만 토큰", "출력 100만 토큰", "월 예상 비용"];
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-[13px] border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-zinc-800">
            <th scope="col" className="py-2 pr-3 font-semibold">{th[0]}</th>
            <th scope="col" className="py-2 pr-3 font-semibold text-right whitespace-nowrap">{th[1]}</th>
            <th scope="col" className="py-2 pr-3 font-semibold text-right whitespace-nowrap">{th[2]}</th>
            <th scope="col" className="py-2 font-semibold text-right whitespace-nowrap">{th[3]}</th>
          </tr>
        </thead>
        <tbody>
          {priced.map((m) => (
            <tr key={m.name} className="border-b border-stone-100 dark:border-zinc-900">
              <td className="py-2 pr-3 text-stone-900 dark:text-stone-100 font-medium">{m.name}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-stone-600 dark:text-stone-300">${m.pin}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-stone-600 dark:text-stone-300">${m.pout}</td>
              <td className="py-2 text-right tabular-nums font-bold text-stone-900 dark:text-white">
                {usd(monthly(m) as number)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ModelPriceTables({ locale = "ko" }: { locale?: Locale }) {
  if (locale === "en") return <EnTables />;
  const s = readStats();
  const usage = (s.usageTop || []).slice(0, 10);
  const cheap = (s.priceTop || []).slice(0, 10);
  if (!usage.length && !cheap.length) return null;

  const topUsed = usage[0];
  const cheapest = cheap.find((m) => monthly(m) !== null);
  const updated = s.updatedAt ? new Date(s.updatedAt).toISOString().slice(0, 10) : null;

  const h2 = "text-[17px] font-extrabold text-stone-950 dark:text-white mt-10 mb-3 break-keep";
  const p = "text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed break-keep";

  return (
    <section className="mt-12 pt-10 border-t border-stone-200 dark:border-zinc-800">
      <h2 className={h2.replace("mt-10 ", "")}>AI 모델 가격, 실제로 얼마나 드나</h2>
      <p className={p}>
        AI 모델 요금은 <strong>토큰 100만 개당 달러</strong>로 매겨지고, 입력(내가 보낸 글)과
        출력(모델이 쓴 글)의 단가가 다릅니다. 출력이 입력보다 보통 2~10배 비쌉니다. 그래서
        같은 &ldquo;호출 1만 번&rdquo;이라도 답변을 길게 받는 서비스일수록 요금이 가파르게 오릅니다.
      </p>
      <p className={`${p} mt-3`}>
        아래 표의 <strong>월 예상 비용</strong>은 하나의 기준을 잡아 계산한 값입니다 —{" "}
        <strong>월 {CALLS.toLocaleString()}회 호출, 회당 입력 {IN_TOK.toLocaleString()}토큰 · 출력{" "}
        {OUT_TOK.toLocaleString()}토큰</strong>(= 월 입력 1,000만 · 출력 500만 토큰). 챗봇이나 요약
        기능을 붙인 소규모 서비스의 한 달치에 해당합니다. 내 조건으로 바꿔 계산하려면 위쪽 계산기에
        토큰 수를 넣으면 됩니다.
      </p>

      {topUsed && cheapest && (
        <p className={`${p} mt-3`}>
          지금 가장 많이 쓰이는 모델은 <strong>{topUsed.name}</strong>
          {typeof topUsed.reqM === "number" && <> (하루 약 {topUsed.reqM}백만 요청)</>}
          {monthly(topUsed) !== null && <>이고, 위 기준으로 월 <strong>{usd(monthly(topUsed) as number)}</strong> 수준입니다</>}.
          가격만 보면 <strong>{cheapest.name}</strong>이 월{" "}
          <strong>{usd(monthly(cheapest) as number)}</strong>로 가장 낮은 축입니다. 다만 싼 모델은
          대체로 추론 능력이나 긴 문맥 처리에서 밀리므로, 요금표만 보고 고르면 결과 품질에서 비용을
          다시 치르게 됩니다.
        </p>
      )}

      <h3 className="text-[15px] font-bold text-stone-900 dark:text-white mt-8 mb-2">
        많이 쓰는 AI 모델 가격 비교
      </h3>
      <PriceTable rows={usage} caption="사용량 상위 AI 모델의 입력·출력 단가와 월 예상 비용" locale="ko" />

      <h3 className="text-[15px] font-bold text-stone-900 dark:text-white mt-8 mb-2">
        가장 저렴한 AI 모델
      </h3>
      <PriceTable rows={cheap} caption="입력·출력 단가가 가장 낮은 AI 모델과 월 예상 비용" locale="ko" />

      <h3 className="text-[15px] font-bold text-stone-900 dark:text-white mt-8 mb-2">
        비용을 줄이는 실전 방법
      </h3>
      <ul className={`${p} list-disc pl-5 space-y-1.5`}>
        <li>
          <strong>출력 길이를 먼저 줄이세요.</strong> 출력 단가가 입력보다 비싸므로, 답변 길이 제한
          한 줄이 프롬프트를 다듬는 것보다 요금에 더 크게 작용합니다.
        </li>
        <li>
          <strong>작업별로 모델을 나누세요.</strong> 분류·추출처럼 정답이 뻔한 일은 싼 모델로,
          판단이 필요한 일만 비싼 모델로 보내면 대부분의 호출이 저가 구간에서 처리됩니다.
        </li>
        <li>
          <strong>같은 앞부분을 반복해 보낸다면 캐싱을 확인하세요.</strong> 시스템 프롬프트나 문서를
          매 호출 재전송하면 입력 토큰이 그만큼 곱해집니다.
        </li>
        <li>
          <strong>월 요금은 호출 수보다 토큰 수에 좌우됩니다.</strong> 호출을 절반으로 줄여도 한 번에
          두 배를 보내면 그대로입니다.
        </li>
      </ul>

      <p className="text-[12.5px] text-stone-500 dark:text-stone-400 mt-6 leading-relaxed break-keep">
        가격·사용량 데이터 출처는 <strong>OpenRouter</strong> 실사용 통계입니다
        {typeof s.total === "number" && <> (집계 대상 {s.total}개 모델)</>}
        {updated && <>. 이 표의 기준일은 {updated}이며 자동 갱신됩니다</>}. 단가는 100만 토큰당 USD
        기준이고, 공급자·지역·계약에 따라 실제 청구액은 달라질 수 있습니다. 정확한 금액은 각 공급자의
        공식 요금표를 확인하세요.
      </p>
    </section>
  );
}

// 영문판. /en/ai-models 도 같은 클라이언트 계산기를 쓰기 때문에 정적 HTML 이 186단어뿐이었다
// ("model cost"·"ai models pricing comparison" 쿼리가 실제로 잡히는데 60~70위였다).
// 한글판을 기계번역하지 않고, 같은 데이터를 영어 독자 기준으로 다시 썼다.
function EnTables() {
  const s = readStats();
  const usage = (s.usageTop || []).slice(0, 10);
  const cheap = (s.priceTop || []).slice(0, 10);
  if (!usage.length && !cheap.length) return null;

  const topUsed = usage[0];
  const cheapest = cheap.find((m) => monthly(m) !== null);
  const updated = s.updatedAt ? new Date(s.updatedAt).toISOString().slice(0, 10) : null;
  const p = "text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed break-keep";
  const h3 = "text-[15px] font-bold text-stone-900 dark:text-white mt-8 mb-2";

  return (
    <section className="mt-12 pt-10 border-t border-stone-200 dark:border-zinc-800">
      <h2 className="text-[17px] font-extrabold text-stone-950 dark:text-white mb-3 break-keep">
        What AI models actually cost
      </h2>
      <p className={p}>
        AI models are billed <strong>per million tokens</strong>, and input (what you send) and output
        (what the model writes) are priced separately. Output typically costs two to ten times more
        than input, so two products making the same number of calls can land in very different places
        depending on how long the answers are.
      </p>
      <p className={`${p} mt-3`}>
        The <strong>estimated monthly cost</strong> below uses one fixed scenario so the numbers are
        comparable — <strong>{CALLS.toLocaleString()} calls a month, {IN_TOK.toLocaleString()} input
        and {OUT_TOK} output tokens per call</strong> (10M input, 5M output tokens a month). That is
        roughly a small product with a chat or summarisation feature attached. Use the calculator
        above to put in your own numbers.
      </p>

      {topUsed && cheapest && (
        <p className={`${p} mt-3`}>
          The most used model right now is <strong>{topUsed.name}</strong>
          {typeof topUsed.reqM === "number" && <> (about {topUsed.reqM}M requests a day)</>}
          {monthly(topUsed) !== null && <>, which comes to <strong>{usd(monthly(topUsed) as number)}</strong> a month under this scenario</>}.
          On price alone <strong>{cheapest.name}</strong> is among the lowest at{" "}
          <strong>{usd(monthly(cheapest) as number)}</strong>. Cheaper models generally give up
          reasoning quality and long-context handling, so picking from the price column alone tends to
          cost you again in results.
        </p>
      )}

      <h3 className={h3}>Most used AI models, by price</h3>
      <PriceTable rows={usage} caption="Input and output pricing and estimated monthly cost for the most used AI models" locale="en" />

      <h3 className={h3}>Cheapest AI models</h3>
      <PriceTable rows={cheap} caption="AI models with the lowest input and output pricing, with estimated monthly cost" locale="en" />

      <h3 className={h3}>Practical ways to cut the bill</h3>
      <ul className={`${p} list-disc pl-5 space-y-1.5`}>
        <li>
          <strong>Cap output length first.</strong> Output costs more than input, so one line limiting
          response length moves the bill more than rewriting the prompt.
        </li>
        <li>
          <strong>Route by task.</strong> Send classification and extraction to a cheap model and keep
          the expensive one for work that needs judgement — most calls then run in the low tier.
        </li>
        <li>
          <strong>Check caching if you resend the same prefix.</strong> Re-sending a system prompt or
          document on every call multiplies your input tokens by the number of calls.
        </li>
        <li>
          <strong>Tokens drive the bill, not call count.</strong> Halving calls changes nothing if each
          one carries twice the payload.
        </li>
      </ul>

      <p className="text-[12.5px] text-stone-500 dark:text-stone-400 mt-6 leading-relaxed break-keep">
        Pricing and usage data comes from <strong>OpenRouter</strong> real-usage statistics
        {typeof s.total === "number" && <> ({s.total} models tracked)</>}
        {updated && <>, as of {updated}, updated automatically</>}. Prices are USD per million tokens;
        your actual bill can differ by provider, region and contract. Check the provider&rsquo;s official
        pricing page for exact figures.
      </p>
    </section>
  );
}

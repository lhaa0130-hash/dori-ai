import { InsightItem } from "@/types/content";

export const INSIGHT_DATA: InsightItem[] = [
  // 👇 [신규 추가] 가이드 01편
  {
    id: 101, // 겹치지 않는 숫자
    title: "📘 GUIDE 01 — AI 기본 기능 완전 정복하기",
    summary: "검색, 이미지, 영상, 음성, 텍스트 변환까지! 초보자가 가장 먼저 익혀야 할 5가지 핵심 AI 기능을 실전 예시와 함께 정리했습니다.",
    category: "가이드",
    tags: ["AI기초", "가이드", "초보자", "Tip"],
    likes: 0,
    date: new Date().toISOString(), // 오늘 날짜
    aiMeta: { creationType: "human_only" },
    image: "/images/insight/guide/guide-01-cover.jpg", // (없으면 생략 가능)
    
    // 👇 여기가 본문입니다 (HTML로 변환됨)
    // ⚠️ 중요: 이미지 경로를 '/images/insight/guide/...' 로 수정했습니다.
    // ⚠️ 중요: 실제 파일이 public/images/insight/guide/ 폴더 안에 있어야 합니다.
    content: `
      <h2># AI를 처음 배우는 사람을 위한 ‘핵심 5대 기능’ 안내서</h2>
      <p>AI를 처음 접하는 많은 사람들은 “무엇부터 해야 할지”에서 막힙니다. 하지만 AI의 본질은 어렵지 않습니다. 딱 5가지 기능만 이해하면 <strong>AI 활용의 70% 이상</strong>을 이미 몸에 익히게 됩니다.</p>
      <p>이 가이드는 AI 입문자가 가장 먼저 익혀야 하는 <strong>검색 · 이미지 생성 · 영상 생성 · 음성 생성 · 음성 → 텍스트 변환</strong>을 실제 예시와 함께 안내합니다.</p>
      <hr class="my-8" />

      <h3>1. 검색 AI — “인터넷 자료를 대신 읽고 정리해주는 비서”</h3>
      <p>검색 AI는 단순 검색 도구가 아닙니다. 인터넷 전체를 대신 읽고, 비교하고, 요약해주는 개인 리서처입니다.</p>
      
      <img src="/images/insight/guide/guide-01-search.jpg" alt="검색 AI 일러스트" class="w-full rounded-xl my-4 shadow-md" />
      
      <div class="bg-gray-50 dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-gray-800 my-4">
        <h4 class="font-bold mb-2">🔍 검색 AI가 잘하는 일</h4>
        <ul class="list-disc pl-5 space-y-1 text-sm">
          <li>긴 문서를 대신 읽고 핵심 요약</li>
          <li>최신 정보 기반의 정확한 답변</li>
          <li>출처(URL)를 자동으로 제공</li>
          <li>복잡한 비교·정리·분석까지 자동 처리</li>
        </ul>
      </div>

      <p><strong>대표 검색 AI:</strong> Perplexity, Genspark, You.com</p>
      
      <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl my-4">
        <span class="text-blue-600 dark:text-blue-300 font-bold">🧪 실전 예시</span>
        <p class="mt-1 text-sm">"아이폰 16 vs 갤럭시 S25 차이점 10가지를 표로 정리하고, 각 제품을 추천하는 대상도 구분해줘."</p>
      </div>

      <br/>

      <h3>2. 이미지 생성 AI — “문장 한 줄이 그림이 되는 기술”</h3>
      <p>이미지 AI를 사용하면 누구나 일러스트·사진·로고·캐릭터까지 만들 수 있습니다.</p>

      <img src="/images/insight/guide/guide-01-image.jpg" alt="이미지 생성 AI 일러스트" class="w-full rounded-xl my-4 shadow-md" />

      <div class="bg-gray-50 dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-gray-800 my-4">
        <h4 class="font-bold mb-2">🖼 이미지 AI가 할 수 있는 일</h4>
        <ul class="list-disc pl-5 space-y-1 text-sm">
          <li>캐릭터, 사진, 로고, 배너 등 다양한 스타일 생성</li>
          <li>배경 제거, 업스케일 등 후처리</li>
          <li>사람의 그림 실력을 완전히 대체</li>
        </ul>
      </div>

      <p><strong>대표 이미지 AI:</strong> Midjourney, Stable Diffusion, DALL·E 3</p>

      <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl my-4">
        <span class="text-blue-600 dark:text-blue-300 font-bold">🧪 실전 예시</span>
        <p class="mt-1 text-sm">"숲 속에서 노트를 들고 공부하는 귀여운 프레리독 캐릭터, 디즈니 스타일, 따뜻한 색감, 고해상도."</p>
      </div>

      <br/>

      <h3>3. 영상 생성 AI — “문장을 움직이는 영상으로 바꾸는 기술”</h3>
      <p>비디오 AI는 단순 재미를 넘어 콘텐츠 제작 구조 자체를 바꾼 기술입니다.</p>

      <img src="/images/insight/guide/guide-01-video.jpg" alt="영상 생성 AI 일러스트" class="w-full rounded-xl my-4 shadow-md" />

      <div class="bg-gray-50 dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-gray-800 my-4">
        <h4 class="font-bold mb-2">🎬 영상 AI가 제공하는 기능</h4>
        <ul class="list-disc pl-5 space-y-1 text-sm">
          <li>문장 기반 5~30초 영상 제작</li>
          <li>이미지 → 움직이는 영상 변환</li>
          <li>카메라 무빙·색감·스타일 지정 가능</li>
        </ul>
      </div>

      <p><strong>대표 비디오 AI:</strong> Runway, Pika, Sora(예정)</p>

      <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl my-4">
        <span class="text-blue-600 dark:text-blue-300 font-bold">🧪 실전 예시</span>
        <p class="mt-1 text-sm">"카메라가 잔잔한 바다를 따라 이동하며 노을이 반사되는 장면을 5초 영상으로 만들어줘."</p>
      </div>

      <br/>

      <h3>4. 음성 생성 AI(TTS) — “텍스트를 자연스러운 목소리로”</h3>
      <p>사람이 직접 녹음하지 않아도 내레이션·광고·오디오북을 만들 수 있습니다.</p>

      <img src="/images/insight/guide/guide-01-voice.jpg" alt="음성 생성 AI 일러스트" class="w-full rounded-xl my-4 shadow-md" />

      <div class="bg-gray-50 dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-gray-800 my-4">
        <h4 class="font-bold mb-2">🔊 음성 AI가 할 수 있는 일</h4>
        <ul class="list-disc pl-5 space-y-1 text-sm">
          <li>감정 표현 가능한 음성 생성</li>
          <li>여러 목소리 톤 선택 및 음악 생성(Suno)</li>
          <li>콘텐츠·강의·영상 내레이션 활용</li>
        </ul>
      </div>

      <p><strong>대표 AI:</strong> ElevenLabs, Suno, PlayHT</p>

      <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl my-4">
        <span class="text-blue-600 dark:text-blue-300 font-bold">🧪 실전 예시</span>
        <p class="mt-1 text-sm">"안녕하세요. DORI-AI 가이드 1단계입니다. 오늘은 AI 기본 기능을 함께 배워보겠습니다."</p>
      </div>

      <br/>

      <h3>5. 음성 → 텍스트(STT) — “녹음 파일을 자동으로 문서로”</h3>
      <p>녹음 파일을 업로드하면 자동으로 텍스트로 변환하고 요약까지 가능합니다.</p>

      <img src="/images/insight/guide/guide-01-stt.jpg" alt="STT AI 일러스트" class="w-full rounded-xl my-4 shadow-md" />

      <div class="bg-gray-50 dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-gray-800 my-4">
        <h4 class="font-bold mb-2">🎙 STT의 강점</h4>
        <ul class="list-disc pl-5 space-y-1 text-sm">
          <li>회의록 자동 생성</li>
          <li>수업 녹음 → 요약</li>
          <li>인터뷰 정리 및 다국어 인식</li>
        </ul>
      </div>

      <p><strong>대표 AI:</strong> Whisper, Google Speech-to-Text, AssemblyAI</p>

      <hr class="my-8" />

      <h3>📌 1단계 핵심 요약</h3>
      <p>AI의 기초는 간단합니다. <strong>검색 → 이미지 → 영상 → 음성 → 텍스트 변환</strong>. 이 다섯 가지를 자유롭게 다룰 수 있으면 이미 AI 전체를 70% 이상 활용하는 단계에 도달한 것입니다.</p>
    `
  },

  // ... (기존 데이터들: 1~9번 등은 아래에 그대로 유지) ...
  { 
    id: 1, title: "AI 시대에 반드시 알아야 할 핵심 개념 10가지", 
    summary: "LLM, RAG, Fine-tuning 등 쏟아지는 AI 용어 정리.", 
    content: "...", // 기존 내용 생략
    category: "개념", tags: ["기초", "용어"], likes: 120, date: "2024-03-20",
    aiMeta: { creationType: "ai_assisted", tools: ["Claude 3"] } 
  },
  // ...
];
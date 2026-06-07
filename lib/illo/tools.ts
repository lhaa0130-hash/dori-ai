// 일로 웹(라이트) AI 도구 정의 — 브라우저에서 바로 실행되는 클라우드 텍스트 도구.
// 데스크톱 일로의 'AI 작업 도구'와 동일 라인업. 각 도구는 입력 + 선택칩(aspects) → 프롬프트 생성.

export interface IlloTool {
  id: string;
  title: string;
  icon: string;
  desc: string;
  inputLabel: string;
  placeholder: string;
  multiline: boolean;
  aspects?: string[];        // 선택 칩(말투/플랫폼/길이 등)
  defaultAspects?: string[];
  cta: string;
  buildPrompt: (input: string, picked: string[]) => string;
}

const joinPicked = (picked: string[]) => (picked.length ? `\n\n[옵션]\n- ${picked.join('\n- ')}` : '');

export const ILLO_TOOLS: IlloTool[] = [
  {
    id: 'docs',
    title: '문서 작성',
    icon: '📝',
    desc: '보고서·제안서·공지 초안을 AI로',
    inputLabel: '무슨 문서가 필요하세요?',
    placeholder: '예) 신제품 출시 사내 공지, 협업 제안서',
    multiline: true,
    aspects: ['보고서', '제안서', '공지문', '격식 있게', '간결하게', '표 포함'],
    defaultAspects: ['간결하게'],
    cta: '문서 생성',
    buildPrompt: (input, picked) =>
      `당신은 비즈니스 문서 작성 전문가입니다. 아래 요청에 맞는 한국어 문서 초안을 작성하세요.\n` +
      `제목 → 목적 한 줄 → 본문(소제목 구분) → 마무리/다음 단계 순으로, 바로 사용 가능하게 써주세요.${joinPicked(picked)}\n\n[요청]\n${input}`,
  },
  {
    id: 'mail',
    title: '메일·메시지',
    icon: '✉️',
    desc: '상황만 입력하면 메일/답장 작성',
    inputLabel: '어떤 메일/메시지인가요?',
    placeholder: '예) 미팅 일정 조율 요청, 결제 지연 정중한 독촉',
    multiline: true,
    aspects: ['정중하게', '친근하게', '간결하게', '사과', '요청', '거절', '영문'],
    defaultAspects: ['정중하게'],
    cta: '메일 생성',
    buildPrompt: (input, picked) =>
      `당신은 비즈니스 커뮤니케이션 전문가입니다. 아래 상황에 맞는 메일/메시지를 작성하세요.\n` +
      `제목(메일인 경우) + 본문을 자연스럽고 목적에 맞게 작성하고, 너무 길지 않게 해주세요.${joinPicked(picked)}\n\n[상황]\n${input}`,
  },
  {
    id: 'translate',
    title: '번역·교정',
    icon: '🌐',
    desc: '번역 + 문장 다듬기',
    inputLabel: '번역/교정할 문장',
    placeholder: '번역하거나 다듬고 싶은 문장을 붙여넣으세요',
    multiline: true,
    aspects: ['한→영', '영→한', '한→일', '일→한', '자연스럽게', '격식체', '맞춤법 교정'],
    defaultAspects: ['자연스럽게'],
    cta: '번역·교정',
    buildPrompt: (input, picked) =>
      `당신은 번역·교정 전문가입니다. 아래 문장을 요청 옵션에 맞춰 처리하세요.\n` +
      `번역이면 자연스러운 결과를, 교정이면 다듬은 문장과 함께 바뀐 이유를 짧게 덧붙여주세요.${joinPicked(picked)}\n\n[문장]\n${input}`,
  },
  {
    id: 'meeting',
    title: '회의록 요약',
    icon: '📋',
    desc: '긴 회의 내용을 핵심·할 일로 요약',
    inputLabel: '회의 내용 / 메모 붙여넣기',
    placeholder: '회의에서 오간 내용, 녹취, 메모 등을 붙여넣으세요',
    multiline: true,
    aspects: ['핵심 요약', '결정사항', '할 일(담당자)', '다음 안건', '간결하게'],
    defaultAspects: ['핵심 요약', '할 일(담당자)'],
    cta: '회의록 정리',
    buildPrompt: (input, picked) =>
      `당신은 회의록 정리 전문가입니다. 아래 회의 내용을 한국어로 정리하세요.\n` +
      `① 핵심 요약(3~5줄) ② 결정사항 ③ 할 일(가능하면 담당자/기한) ④ 다음 안건 순으로 구조화해주세요.${joinPicked(picked)}\n\n[회의 내용]\n${input}`,
  },
  {
    id: 'blog',
    title: '블로그 글쓰기',
    icon: '✍️',
    desc: '주제만 주면 SEO 블로그 글 초안을 써드려요',
    inputLabel: '글 주제 / 키워드',
    placeholder: '예) 1인 창업자를 위한 AI 활용법',
    multiline: true,
    aspects: ['정보형', '후기형', '친근한 말투', '전문적 말투', '짧게(800자)', '길게(2000자)', 'SEO 최적화'],
    defaultAspects: ['정보형', 'SEO 최적화'],
    cta: '블로그 글 생성',
    buildPrompt: (input, picked) =>
      `당신은 한국어 블로그 작가입니다. 아래 주제로 바로 발행 가능한 블로그 글을 작성하세요.\n` +
      `제목(후보 1개) + 도입 + 소제목(H2) 3~5개 + 마무리 + 해시태그 5개 구조로, 자연스럽고 가독성 좋게 써주세요.${joinPicked(picked)}\n\n[주제]\n${input}`,
  },
  {
    id: 'sns',
    title: 'SNS 게시물',
    icon: '📱',
    desc: '인스타·페북·X용 게시물 + 해시태그',
    inputLabel: '무엇을 알리고 싶나요?',
    placeholder: '예) 신메뉴 출시, 주말 할인 이벤트',
    multiline: true,
    aspects: ['인스타그램', '페이스북', 'X(트위터)', '스레드', '감성적', '재치있게', '이모지 많이'],
    defaultAspects: ['인스타그램', '감성적'],
    cta: 'SNS 글 생성',
    buildPrompt: (input, picked) =>
      `당신은 SNS 마케터입니다. 아래 내용을 매력적인 SNS 게시물로 만들어주세요.\n` +
      `짧고 임팩트 있게, 줄바꿈을 활용하고, 마지막에 어울리는 해시태그 8~12개를 붙여주세요.${joinPicked(picked)}\n\n[내용]\n${input}`,
  },
  {
    id: 'copy',
    title: '광고 카피',
    icon: '🎯',
    desc: '광고 문구·슬로건을 여러 개 뽑아드려요',
    inputLabel: '제품/서비스 + 강조점',
    placeholder: '예) 1인용 AI 사무실 "일로", 혼자서도 일이 된다',
    multiline: true,
    aspects: ['헤드라인', '슬로건', '짧고 강하게', '신뢰감', '위트', '배너용', '키워드 광고용'],
    defaultAspects: ['헤드라인', '짧고 강하게'],
    cta: '카피 생성',
    buildPrompt: (input, picked) =>
      `당신은 카피라이터입니다. 아래 제품/서비스의 광고 카피를 작성하세요.\n` +
      `서로 톤이 다른 후보 7개를 번호 매겨 제시하고, 각 카피 아래 한 줄로 사용 맥락을 덧붙여주세요.${joinPicked(picked)}\n\n[제품/서비스]\n${input}`,
  },
  {
    id: 'product',
    title: '상품 상세',
    icon: '🛍️',
    desc: '쇼핑몰 상품 상세설명을 작성해요',
    inputLabel: '상품 정보 (이름/특징/스펙)',
    placeholder: '예) 무선 핸디 선풍기 / 3단 풍속 / 5000mAh / USB-C',
    multiline: true,
    aspects: ['감성형', '스펙강조형', '신뢰/안심', '구매전환 강조', '표 포함', '짧게'],
    defaultAspects: ['구매전환 강조'],
    cta: '상세설명 생성',
    buildPrompt: (input, picked) =>
      `당신은 이커머스 상세페이지 작가입니다. 아래 상품의 상세설명을 작성하세요.\n` +
      `한 줄 캐치프레이즈 → 핵심 이점 3~5개(불릿) → 사용 시나리오 → 스펙 요약 → 구매를 부르는 마무리 순으로 써주세요.${joinPicked(picked)}\n\n[상품 정보]\n${input}`,
  },
  {
    id: 'reply',
    title: '리뷰·댓글 답변',
    icon: '🗨️',
    desc: '고객 리뷰/문의에 정중한 답변',
    inputLabel: '고객이 남긴 리뷰/문의',
    placeholder: '예) 배송이 너무 늦어요. 실망했습니다.',
    multiline: true,
    aspects: ['정중하게', '진심 사과', '긍정 강화', '재방문 유도', '짧게', '사장님 톤'],
    defaultAspects: ['정중하게', '재방문 유도'],
    cta: '답변 생성',
    buildPrompt: (input, picked) =>
      `당신은 고객 응대 담당자입니다. 아래 고객 글에 대한 답변을 작성하세요.\n` +
      `공감 → (필요 시) 사과/해명 → 해결/안내 → 따뜻한 마무리 순으로, 진심이 느껴지되 과하지 않게 써주세요. 답변 2가지 버전(짧은/자세한)을 제시해주세요.${joinPicked(picked)}\n\n[고객 글]\n${input}`,
  },
  {
    id: 'summary',
    title: '문서 요약',
    icon: '📑',
    desc: '긴 글·자료를 핵심만 요약해요',
    inputLabel: '요약할 내용 붙여넣기',
    placeholder: '긴 글, 회의록, 기사 등을 붙여넣으세요',
    multiline: true,
    aspects: ['핵심 3줄', '불릿 정리', '할 일 추출', '쉽게 풀어서', '표로 정리'],
    defaultAspects: ['핵심 3줄', '불릿 정리'],
    cta: '요약하기',
    buildPrompt: (input, picked) =>
      `당신은 요약 전문가입니다. 아래 내용을 한국어로 요약하세요.\n` +
      `먼저 핵심을 3줄로, 그다음 주요 포인트를 불릿으로 정리하고, 실행해야 할 일이 있으면 마지막에 '할 일'로 뽑아주세요.${joinPicked(picked)}\n\n[내용]\n${input}`,
  },
];

export const ILLO_TOOL_BY_ID: Record<string, IlloTool> =
  Object.fromEntries(ILLO_TOOLS.map((t) => [t.id, t]));

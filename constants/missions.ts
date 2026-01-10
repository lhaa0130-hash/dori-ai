export interface MissionDefinition {
  code: string;
  title: string;
  description: string;
  points: number;
  type: "auto" | "timer" | "visit" | "quiz" | "action";
  meta?: {
    secondsRequired?: number;
    pathPrefix?: string;
    path?: string;
    questions?: number;
    action?: string;
    count?: number;
  };
}

export const DAILY_MISSIONS: MissionDefinition[] = [
  {
    code: "DAILY_CHECKIN",
    title: "출석 체크",
    description: "오늘 첫 접속 시 자동 완료",
    points: 10,
    type: "auto",
  },
  {
    code: "WRITE_POST_1",
    title: "글 쓰기 1회",
    description: "게시글 1개 작성 시 완료",
    points: 15,
    type: "action",
    meta: { action: "write_post", count: 1 },
  },
  {
    code: "WRITE_POST_3",
    title: "글 쓰기 3회",
    description: "게시글 3개 작성 시 완료",
    points: 30,
    type: "action",
    meta: { action: "write_post", count: 3 },
  },
  {
    code: "WRITE_COMMENT_3",
    title: "댓글 쓰기 3회",
    description: "댓글 3개 작성 시 완료",
    points: 15,
    type: "action",
    meta: { action: "write_comment", count: 3 },
  },
  {
    code: "WRITE_COMMENT_5",
    title: "댓글 쓰기 5회",
    description: "댓글 5개 작성 시 완료",
    points: 25,
    type: "action",
    meta: { action: "write_comment", count: 5 },
  },
  {
    code: "LIKE_5",
    title: "좋아요 5개",
    description: "좋아요 5개 누르기",
    points: 10,
    type: "action",
    meta: { action: "like", count: 5 },
  },
  {
    code: "LIKE_10",
    title: "좋아요 10개",
    description: "좋아요 10개 누르기",
    points: 20,
    type: "action",
    meta: { action: "like", count: 10 },
  },
  {
    code: "BOOKMARK_3",
    title: "북마크 3개",
    description: "북마크 3개 추가하기",
    points: 15,
    type: "action",
    meta: { action: "bookmark", count: 3 },
  },
  {
    code: "VISIT_AI_TOOLS",
    title: "AI 도구 페이지 방문",
    description: "AI 도구 페이지 방문하기",
    points: 10,
    type: "visit",
    meta: { path: "/ai-tools" },
  },
  {
    code: "VISIT_COMMUNITY",
    title: "커뮤니티 페이지 방문",
    description: "커뮤니티 페이지 방문하기",
    points: 10,
    type: "visit",
    meta: { path: "/community" },
  },
  {
    code: "VISIT_STUDIO",
    title: "스튜디오 페이지 방문",
    description: "스튜디오 페이지 방문하기",
    points: 10,
    type: "visit",
    meta: { path: "/studio" },
  },
  {
    code: "SHARE_POST",
    title: "게시글 공유하기",
    description: "게시글 1개 공유하기",
    points: 20,
    type: "action",
    meta: { action: "share", count: 1 },
  },
];


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
    title: "출석체크",
    description: "오늘 첫 접속 시 자동 완료",
    points: 10,
    type: "auto",
  },
  {
    code: "WRITE_POST_3",
    title: "글 3개 작성",
    description: "게시글 3개 작성 시 완료",
    points: 20,
    type: "action",
    meta: { action: "write_post", count: 3 },
  },
  {
    code: "WRITE_COMMENT_5",
    title: "댓글 5개 작성",
    description: "댓글 5개 작성 시 완료",
    points: 15,
    type: "action",
    meta: { action: "write_comment", count: 5 },
  },
  {
    code: "LIKE_10",
    title: "좋아요 10개",
    description: "좋아요 10개 누르기",
    points: 15,
    type: "action",
    meta: { action: "like", count: 10 },
  },
  {
    code: "SHARE_1",
    title: "공유하기",
    description: "콘텐츠 1개 공유하기",
    points: 20,
    type: "action",
    meta: { action: "share", count: 1 },
  },
];


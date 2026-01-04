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
    points: 10,
    type: "action",
    meta: { action: "write_post", count: 1 },
  },
  {
    code: "WRITE_COMMENT_3",
    title: "댓글 쓰기 3회",
    description: "댓글 3개 작성 시 완료",
    points: 10,
    type: "action",
    meta: { action: "write_comment", count: 3 },
  },
];


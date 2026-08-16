// 주제별 댓글 — 프로젝트·기사 등 아무 페이지에나 붙일 수 있는 공개 댓글.
//
// 왜 새로 만들었나 (2026-08-15)
//   · lib/social.ts 의 addComment 는 **피드 글 전용**이다(feed/{postId}/comments 에 쓰고
//     그 글의 commentCount 를 올린다). 프로젝트 페이지에는 postId 가 없다.
//   · 프로젝트 상세에 있던 ProjectSuggestion 은 **localStorage 전용**이라, 사용자가 건의사항을
//     써도 자기 브라우저에만 남고 운영자에게 가지 않았다(서버 전송 코드가 아예 없다).
//     "사람들의 생각을 들어본다"는 목적에 정면으로 어긋나서 이걸로 대체한다.
//
// 데이터: topicComments/{topicId}/items/{commentId}
//   topicId 예:  project_palhyup · article_report-13
//   ⚠️ topicId 는 문서 경로에 들어가므로 [a-z0-9_-] 로만 만든다(슬래시가 들어가면 경로가 깨진다).
//
// ⚠️ Firestore 규칙(firestore.rules)이 함께 배포되어야 쓰기가 된다. 규칙만 빠지면
//    목록은 보이는데 등록에서 permission-denied 가 난다.
import {
  addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp,
} from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { currentUid } from "@/lib/social";

export interface TopicComment {
  id: string;
  uid: string;
  name: string;
  text: string;
  at: number;
}

export const COMMENT_MAX = 500;

/** 임의 문자열을 안전한 topicId 로. 경로 구분자·공백을 없앤다. */
export function topicIdOf(kind: "project" | "article", slug: string): string {
  const s = String(slug).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 60);
  return `${kind}_${s}`;
}

function tsToMillis(v: unknown): number {
  const t = v as { toMillis?: () => number; seconds?: number } | null;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return 0;
}

/** 댓글 목록(최신순). 실패해도 화면이 깨지지 않게 빈 배열을 준다. */
export async function listTopicComments(topicId: string, n = 100): Promise<TopicComment[]> {
  try {
    const q = query(
      collection(getFirebaseFirestore(), "topicComments", topicId, "items"),
      orderBy("createdAt", "desc"),
      limit(n)
    );
    const snap = await getDocs(q);
    const arr: TopicComment[] = [];
    snap.forEach((d) => {
      const x = d.data() as Record<string, unknown>;
      arr.push({
        id: d.id,
        uid: String(x.uid || ""),
        name: String(x.name || "익명"),
        text: String(x.text || ""),
        at: tsToMillis(x.createdAt),
      });
    });
    return arr;
  } catch {
    return [];
  }
}

/** 댓글 등록. 로그인 필요. 성공하면 새 id 를 준다. */
export async function addTopicComment(topicId: string, name: string, text: string): Promise<string | null> {
  const uid = currentUid();
  if (!uid) return null;
  const body = text.trim().slice(0, COMMENT_MAX);
  if (!body) return null;
  try {
    const ref = await addDoc(collection(getFirebaseFirestore(), "topicComments", topicId, "items"), {
      uid,                                  // 규칙이 uid == auth.uid 를 확인한다(남의 이름으로 못 쓴다)
      name: (name || "익명").slice(0, 20),
      text: body,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch {
    return null;
  }
}

/** 내 댓글 삭제(관리자는 규칙에서 전체 삭제 허용). */
export async function deleteTopicComment(topicId: string, commentId: string): Promise<boolean> {
  if (!currentUid()) return false;
  try {
    await deleteDoc(doc(getFirebaseFirestore(), "topicComments", topicId, "items", commentId));
    return true;
  } catch {
    return false;
  }
}

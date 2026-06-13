// illo 봇 — 클라이언트측 메시지 읽기/읽음처리 + 봇 신원
// 봇은 로그인하지 않는 시스템 계정. 메시지는 'bot_messages' 컬렉션에 쌓이고,
// 받는 사람(uid) 또는 'broadcast'(전체 공지)로 구분된다. 쓰기는 /api/bot/send (Bearer 보안) 경유.
import { getFirebaseFirestore } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export const ILLO_BOT = { id: "illo-bot", name: "illo 봇", emoji: "🤖" };

export type BotMsgKind = "notice" | "dm" | "info";

export interface BotMessage {
  id: string;
  to: string;          // 받는 사람 uid 또는 "broadcast"
  kind: BotMsgKind;    // notice(알림) | dm(개인) | info(정보)
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;   // ISO
}

export const KIND_LABEL: Record<BotMsgKind, { label: string; emoji: string }> = {
  notice: { label: "알림", emoji: "🔔" },
  dm: { label: "메시지", emoji: "💬" },
  info: { label: "정보", emoji: "ℹ️" },
};

// 내게 온 메시지(uid) + 전체 공지(broadcast) 실시간 구독.
// 단일 equality 쿼리 2개라 복합 인덱스 불필요. 정렬은 클라이언트에서.
export function subscribeBotMessages(uid: string, cb: (msgs: BotMessage[]) => void): () => void {
  const db = getFirebaseFirestore();
  const col = collection(db, "bot_messages");
  const store: Record<string, BotMessage> = {};
  const emit = () => cb(Object.values(store).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
  const handle = (snap: any) => {
    snap.docChanges().forEach((c: any) => {
      if (c.type === "removed") delete store[c.doc.id];
      else store[c.doc.id] = { id: c.doc.id, ...(c.doc.data() as any) };
    });
    emit();
  };
  const unsubs = [
    onSnapshot(query(col, where("to", "==", uid)), handle, () => {}),
    onSnapshot(query(col, where("to", "==", "broadcast")), handle, () => {}),
  ];
  return () => unsubs.forEach((u) => u());
}

export async function markBotMessageRead(id: string): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    await updateDoc(doc(db, "bot_messages", id), { read: true });
  } catch (e) {
    /* 규칙상 실패해도 UI는 진행 */
  }
}

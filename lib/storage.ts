// 미디어 업로드 — Firebase Storage (피드 이미지/영상)
// ─────────────────────────────────────────────────────────────
// ⚠️ Firebase 콘솔에서 Storage 활성화 + 규칙 게시 필요(미설정 시 업로드 실패).
//   storage.rules:
//     match /feed/{uid}/{file} {
//       allow read: if true;
//       allow write: if request.auth != null && request.auth.uid == uid
//                    && request.resource.size < 50 * 1024 * 1024;  // 50MB
//     }
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage, getFirebaseAuth } from "@/lib/firebase";

export type MediaType = "image" | "video";
export interface UploadResult { url: string; type: MediaType; }

const MAX_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO = 50 * 1024 * 1024; // 50MB

export function mediaTypeOf(file: File): MediaType | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

/** 피드 미디어 업로드 → 다운로드 URL 반환. 실패 시 {ok:false, error} */
export async function uploadFeedMedia(
  file: File
): Promise<{ ok: true; result: UploadResult } | { ok: false; error: string }> {
  const type = mediaTypeOf(file);
  if (!type) return { ok: false, error: "이미지 또는 영상 파일만 올릴 수 있어요." };
  const max = type === "image" ? MAX_IMAGE : MAX_VIDEO;
  if (file.size > max) {
    return { ok: false, error: `파일이 너무 큽니다. (최대 ${type === "image" ? "10MB" : "50MB"})` };
  }
  let uid: string | null = null;
  try { uid = getFirebaseAuth().currentUser?.uid || null; } catch { uid = null; }
  if (!uid) return { ok: false, error: "로그인이 필요합니다." };

  try {
    const safe = file.name.replace(/[^\w.\-]/g, "_").slice(-40);
    const path = `feed/${uid}/${Date.now()}_${safe}`;
    const r = ref(getFirebaseStorage(), path);
    await uploadBytes(r, file, { contentType: file.type });
    const url = await getDownloadURL(r);
    return { ok: true, result: { url, type } };
  } catch (e) {
    const msg = (e as { code?: string })?.code === "storage/unauthorized"
      ? "업로드 권한이 없어요. (콘솔에서 Storage 활성화/규칙 게시 필요)"
      : "업로드에 실패했어요. 잠시 후 다시 시도해 주세요.";
    return { ok: false, error: msg };
  }
}

/** 프로필 사진(아바타) 업로드 → 다운로드 URL */
export async function uploadAvatar(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/")) return { ok: false, error: "이미지 파일만 올릴 수 있어요." };
  if (file.size > MAX_IMAGE) return { ok: false, error: "이미지가 너무 큽니다. (최대 10MB)" };
  let uid: string | null = null;
  try { uid = getFirebaseAuth().currentUser?.uid || null; } catch { uid = null; }
  if (!uid) return { ok: false, error: "로그인이 필요합니다." };
  try {
    const path = `avatars/${uid}/profile_${Date.now()}`;
    const r = ref(getFirebaseStorage(), path);
    await uploadBytes(r, file, { contentType: file.type });
    const url = await getDownloadURL(r);
    return { ok: true, url };
  } catch (e) {
    const msg = (e as { code?: string })?.code === "storage/unauthorized"
      ? "업로드 권한이 없어요. (콘솔에서 Storage 활성화/규칙 게시 필요)"
      : "업로드에 실패했어요. 잠시 후 다시 시도해 주세요.";
    return { ok: false, error: msg };
  }
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AiToolComment } from "@/types/content";

interface AiToolsCommentsProps {
  toolId: string;
  compact?: boolean; // 👈 카드용 컴팩트 모드
  onCommentUpdate?: () => void; // 댓글 업데이트 콜백
}

export default function AiToolsComments({ toolId, compact = false, onCommentUpdate }: AiToolsCommentsProps) {
  const { session } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState<AiToolComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem("dori_tool_comments") || "{}");
    if (savedData[toolId]) {
      setComments(savedData[toolId]);
    }
  }, [toolId]);

  // localStorage에서 설정된 닉네임 가져오기 (일관된 이름 사용)
  useEffect(() => {
    if (session?.user?.email) {
      // localStorage에 저장된 이름을 우선 사용
      let savedName = localStorage.getItem(`dori_user_name_${session.user.email}`);

      if (!savedName && session.user?.name) {
        // localStorage에 없으면 세션 이름을 저장하고 사용
        savedName = session.user.name;
        localStorage.setItem(`dori_user_name_${session.user.email}`, session.user.name);
      } else if (!savedName) {
        // 세션 이름도 없으면 이메일 앞부분 사용
        savedName = session.user.email.split("@")[0];
        localStorage.setItem(`dori_user_name_${session.user.email}`, savedName);
      }

      setUserName(savedName || "User");
    } else {
      setUserName("");
    }
  }, [session?.user?.email, session?.user?.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { router.push('/login'); return; }
    if (!newComment.trim()) return;

    const commentObj: AiToolComment = {
      id: Date.now().toString(),
      userId: session.user?.email || "anonymous",
      userName: userName || "User",
      content: newComment,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [commentObj, ...comments];
    setComments(updatedComments);
    setNewComment("");

    const savedData = JSON.parse(localStorage.getItem("dori_tool_comments") || "{}");
    savedData[toolId] = updatedComments;
    localStorage.setItem("dori_tool_comments", JSON.stringify(savedData));

    // 댓글 작성 미션 진행도 업데이트
    if (session?.user?.email) {
      import('@/lib/missionProgress').then(({ handleCommentMission }) => {
        handleCommentMission().catch(err => console.error('미션 진행도 업데이트 오류:', err));
      });
    }

    // 부모 컴포넌트에 업데이트 알림
    if (onCommentUpdate) {
      onCommentUpdate();
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const updatedComments = comments.filter(c => c.id !== id);
    setComments(updatedComments);

    const savedData = JSON.parse(localStorage.getItem("dori_tool_comments") || "{}");
    savedData[toolId] = updatedComments;
    localStorage.setItem("dori_tool_comments", JSON.stringify(savedData));

    // 부모 컴포넌트에 업데이트 알림
    if (onCommentUpdate) {
      onCommentUpdate();
    }
  };

  return (
    <div className={`w-full ${compact ? 'mt-4' : 'mt-10'}`}>
      <h3 className={`font-bold flex items-center gap-2 text-[var(--text-main)] ${compact ? 'text-sm mb-3' : 'text-xl mb-6'}`}>
        💬 리뷰 <span className="text-blue-500 text-xs bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">{comments.length}</span>
      </h3>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="mb-4 relative">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={session ? "의견을 남겨주세요." : "로그인 필요"}
          className={`w-full rounded-xl bg-[var(--bg-soft)] border border-[var(--card-border)] focus:border-blue-500 outline-none resize-none text-[var(--text-main)] placeholder-gray-400 transition-all ${compact ? 'p-3 min-h-[80px] text-sm' : 'p-5 min-h-[120px]'}`}
          disabled={!session}
        />
        <button
          type="submit"
          disabled={!session || !newComment.trim()}
          className={`absolute bottom-3 right-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 hover:opacity-80 transition-opacity ${compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2 text-sm'}`}
        >
          등록
        </button>
      </form>

      {/* 댓글 목록 */}
      <div className="flex flex-col gap-3">
        {comments.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-[var(--card-border)] rounded-xl">
            <p className="text-xs text-gray-400">첫 리뷰를 남겨주세요!</p>
          </div>
        ) : (
          comments.slice(0, compact ? 3 : undefined).map((comment) => ( // 카드에서는 최근 3개만
            <div key={comment.id} className={`rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] ${compact ? 'p-3' : 'p-5'}`}>
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-main)]">{comment.userName}</span>
                  <span className="text-[10px] opacity-50 text-[var(--text-sub)]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                {session?.user?.email === comment.userId && (
                  <button onClick={() => handleDelete(comment.id)} className="text-[10px] text-red-400 hover:text-red-600">삭제</button>
                )}
              </div>
              <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap text-[var(--text-main)]">{comment.content}</p>
            </div>
          ))
        )}
        {compact && comments.length > 3 && (
          <p className="text-center text-xs text-gray-400 mt-1">... 외 {comments.length - 3}개 더보기</p>
        )}
      </div>
    </div>
  );
}
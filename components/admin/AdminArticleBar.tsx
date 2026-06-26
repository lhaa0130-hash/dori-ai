'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'lhaa0130@gmail.com';
const REPO = 'lhaa0130-hash/dori-ai';
const BRANCH = 'main';
const CONTENT_DIRS = ['trend', 'analysis', 'curation', 'reports', 'studio', 'market', 'guides'];

interface Props {
  slug: string;
  title: string;
}

export default function AdminArticleBar({ slug, title }: Props) {
  const { session } = useAuth();
  const user = session?.user || null;
  const router = useRouter();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (!isAdmin) return null;

  const showMsg = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const getIdToken = async (): Promise<string> => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('로그인 상태가 아닙니다');
    return await currentUser.getIdToken();
  };

  const handleOpenEdit = async () => {
    setLoadingContent(true);
    setShowEditModal(true);
    let found = '';
    for (const dir of CONTENT_DIRS) {
      try {
        const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/content/${dir}/${slug}.md`;
        const res = await fetch(url);
        if (res.ok) { found = await res.text(); break; }
      } catch { /* try next */ }
    }
    setEditContent(found);
    setLoadingContent(false);
  };

  const handleDelete = async () => {
    if (!confirm(`"${title}"\n\n이 글을 삭제하시겠습니까?\nGitHub에서 파일이 제거되고 사이트가 재빌드됩니다.`)) return;
    setLoading(true);
    try {
      const idToken = await getIdToken();
      const res = await fetch('/api/admin/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', slug, idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');
      showMsg('success', '삭제 완료. 사이트 재빌드 중... (약 5분 소요)');
      setTimeout(() => router.push('/insight'), 2000);
    } catch (err: any) {
      showMsg('error', err.message || '삭제 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editContent.trim()) { showMsg('error', '내용을 입력해주세요'); return; }
    setLoading(true);
    try {
      const idToken = await getIdToken();
      const res = await fetch('/api/admin/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', slug, content: editContent, idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '수정 실패');
      setShowEditModal(false);
      showMsg('success', '수정 완료. 사이트 재빌드 중... (약 5분 소요)');
    } catch (err: any) {
      showMsg('error', err.message || '수정 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl shadow-2xl font-medium text-white text-sm transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <div className="flex items-center justify-end">
          <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">🔑 관리자</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenEdit}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            ✏️ 수정
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? '⏳' : '🗑️'} 삭제
          </button>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h2 className="text-foreground font-bold text-lg">✏️ 글 수정</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5 truncate max-w-md">{title}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-foreground text-2xl leading-none px-2 transition-colors">×</button>
            </div>

            <div className="flex-1 overflow-hidden p-4">
              <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-2">
                마크다운 형식으로 편집하세요. 저장 시 GitHub에 커밋되고 사이트가 재빌드됩니다. (약 5분 소요)
              </p>
              {loadingContent ? (
                <div className="flex items-center justify-center h-[55vh] text-neutral-400">불러오는 중...</div>
              ) : (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[55vh] bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-mono p-4 rounded-xl border border-neutral-200 dark:border-neutral-600 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                  placeholder="마크다운 내용을 입력하세요..."
                  spellCheck={false}
                />
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-400 dark:text-neutral-500 text-xs">{editContent.length.toLocaleString()}자</span>
              <div className="flex gap-3">
                <button onClick={() => setShowEditModal(false)} disabled={loading} className="px-5 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-foreground text-sm rounded-xl transition-all">취소</button>
                <button onClick={handleSave} disabled={loading || loadingContent} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                  {loading ? '⏳ 저장 중...' : '💾 저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

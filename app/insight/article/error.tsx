'use client';

import { useEffect } from 'react';

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ArticleError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-bold text-red-500">기사 페이지 오류</h2>
      <pre className="text-xs bg-stone-100 dark:bg-zinc-900 rounded p-4 max-w-xl w-full text-left overflow-auto text-red-700 dark:text-red-400">
        {error?.message || String(error)}
        {'\n\n'}
        {error?.stack}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-[#F9954E] text-white text-sm font-semibold"
      >
        다시 시도
      </button>
    </div>
  );
}

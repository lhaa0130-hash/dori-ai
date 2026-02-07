import dynamic from 'next/dynamic';
import { createMetadata } from '@/lib/seo';

const WriteClient = dynamic(() => import('./page.client'), {
    ssr: false,
    loading: () => <div className="min-h-screen bg-white dark:bg-black" />
});

export const metadata = createMetadata({
    title: '글쓰기 - 커뮤니티',
    description: '새로운 글을 작성합니다.',
    path: '/community/write',
});

export default function WritePage() {
    return <WriteClient />;
}

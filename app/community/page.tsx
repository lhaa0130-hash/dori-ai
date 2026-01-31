import CommunityClient from './page.client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: '커뮤니티',
  description: 'DORI-AI 커뮤니티에서 자유롭게 의견을 나누고 정보를 공유하세요.',
  path: '/community',
});

// Dummy function to simulate fetching posts
async function getCommunityPosts() {
  // In the future, this could fetch data from a database.
  // For now, return an empty array to show the "no posts" state.
  return [];
}

export default async function CommunityPage() {
  const initialPosts = await getCommunityPosts();
  return <CommunityClient initialPosts={initialPosts} />;
}

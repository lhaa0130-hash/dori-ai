import CommunityCard, { CommunityPost } from "./CommunityCard";
import { TEXTS } from "@/constants/texts";

interface CommunityListProps {
  posts: CommunityPost[];
  onLike: (id: number) => void;
}

export default function CommunityList({ posts, onLike }: CommunityListProps) {
  const t = TEXTS.home.sectionTitles;

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 opacity-60">
        <div className="text-4xl mb-4">💬</div>
        <p>{t.empty.ko}</p>
        <p className="text-sm mt-2">{t.writeFirst.ko}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        {posts.map((post) => (
          <CommunityCard 
            key={post.id} 
            post={post} 
            onLike={onLike} 
          />
        ))}
      </div>
    </div>
  );
}
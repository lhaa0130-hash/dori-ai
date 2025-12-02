import SuggestionCard, { SuggestionItem } from "./SuggestionCard";

interface SuggestionListProps {
  suggestions: SuggestionItem[];
}

export default function SuggestionList({ suggestions }: SuggestionListProps) {
  
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-20 opacity-60">
        <div className="text-4xl mb-4">📫</div>
        <p>아직 등록된 건의가 없습니다.</p>
        <p className="text-sm mt-2">첫 번째 의견을 남겨주세요!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {suggestions.map((item) => (
        <SuggestionCard key={item.id} item={item} />
      ))}
    </div>
  );
}
export type SuggestionType = "버그 제보" | "기능 요청" | "UI/디자인" | "기타";
export type SuggestionPriority = "낮음" | "보통" | "높음";

export type SuggestionItem = {
  id: string;
  name: string;
  email?: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  message: string;
  needsReply: boolean;
  createdAt: string; // ISO String
  authorId?: string; // 작성자 식별자 (선택적, 기존 데이터 호환성)
};

interface SuggestionCardProps {
  item: SuggestionItem;
  isOwner?: boolean; // 본인 글인지 여부
  onEdit?: (item: SuggestionItem) => void;
  onDelete?: (id: string) => void;
}

export default function SuggestionCard({ item, isOwner = false, onEdit, onDelete }: SuggestionCardProps) {
  // 카드 스타일 (CSS 변수 활용)
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  // 뱃지 색상 로직
  const getTypeBadge = (type: SuggestionType) => {
    switch (type) {
      case "버그 제보": return "bg-[#FFF5EB] text-[#E8832E] dark:bg-[#8F4B10]/20 dark:text-[#FBAA60]";
      case "기능 요청": return "bg-[#FEEBD0] text-[#D4711A] dark:bg-[#8F4B10]/30 dark:text-[#FCC07A]";
      case "UI/디자인": return "bg-[#FFF5EB] text-[#B35E15] dark:bg-[#8F4B10]/20 dark:text-[#FBAA60]";
      default: return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
    }
  };

  const getPriorityBadge = (priority: SuggestionPriority) => {
    switch (priority) {
      case "높음": return "text-[#E8832E] border-[#FEEBD0] dark:border-[#8F4B10]";
      case "보통": return "text-[#F9954E] border-[#FDD5A5] dark:border-[#B35E15]";
      case "낮음": return "text-[#FBAA60] border-[#FFF5EB] dark:border-[#8F4B10]/50";
    }
  };

  return (
    <div
      className="relative flex flex-col p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
      style={cardStyle}
    >
      {/* 상단 뱃지 영역 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${getTypeBadge(item.type)}`}>
            {item.type}
          </span>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getPriorityBadge(item.priority)}`}>
            {item.priority}
          </span>
        </div>
        {item.needsReply && (
          <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 border border-gray-200 dark:border-gray-700">
            답변 필요
          </span>
        )}
      </div>

      {/* 내용 */}
      <p className="text-sm opacity-80 mb-6 line-clamp-3 h-[4.5em] leading-relaxed break-words whitespace-pre-wrap" style={{ color: 'var(--text-main)' }}>
        {item.message}
      </p>

      {/* 하단 정보 */}
      <div className="mt-auto pt-4 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/20 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
              {item.name[0]}
            </div>
            <span className="text-xs opacity-70 font-medium">{item.name}</span>
          </div>
          <span className="text-xs opacity-50">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* 본인 글인 경우 수정/삭제 버튼 */}
        {isOwner && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-2 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
              >
                ✏️ 수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('정말 삭제하시겠습니까?')) {
                    onDelete(item.id);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(249, 149, 78, 0.1)',
                  color: '#E8832E',
                }}
              >
                🗑️ 삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
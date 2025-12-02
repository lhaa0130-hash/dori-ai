import { TEXTS } from "@/constants/texts";

export default function AdminSystemNotes() {
  const t = TEXTS.admin.sections;

  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  return (
    <div className="p-6 rounded-[1.5rem] border shadow-sm h-full" style={cardStyle}>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        ⚙️ {t.systemNotes.ko}
      </h3>
      
      <div className="flex flex-col gap-4 text-sm opacity-80">
        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30">
          <strong className="block mb-1 text-yellow-700 dark:text-yellow-500">🚫 욕설 필터링 시스템</strong>
          현재 클라이언트 단에서 1차적인 욕설 및 비방 단어를 필터링하고 있습니다. (시발, 병신 등)
        </div>
        
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
          <strong className="block mb-1 text-blue-700 dark:text-blue-500">📊 데이터 연동 계획</strong>
          현재 모든 데이터는 LocalStorage에 저장됩니다. 추후 Firebase/Supabase 연동 시 실시간 데이터베이스로 이관 예정입니다.
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
          <strong className="block mb-1 opacity-100">🔒 관리자 기능 (TODO)</strong>
          <ul className="list-disc pl-4 mt-1 space-y-1 opacity-80">
            <li>게시글/건의사항 삭제 및 숨김 처리</li>
            <li>악성 유저 IP 차단 기능</li>
            <li>답변 완료 상태 변경 기능</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
import { TEXTS } from "@/constants/texts";

interface AcademySearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function AcademySearch({ searchTerm, setSearchTerm }: AcademySearchProps) {
  const t = TEXTS.academy;

  return (
    <div className="mb-8 max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.searchPlaceholder.ko}
          className="w-full px-6 py-4 rounded-[2rem] border outline-none text-base transition-all bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] focus:border-green-500 dark:focus:border-green-400 shadow-sm focus:shadow-md"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl opacity-50 pointer-events-none">
          🔍
        </div>
      </div>
    </div>
  );
}
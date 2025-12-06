"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

interface AiToolsRatingProps {
  toolId: string;
  initialRating: number;
  initialCount: number;
  onRatingUpdate: (newRating: number, newCount: number) => void;
  compact?: boolean; // 👈 카드 내부용 컴팩트 모드 추가
}

export default function AiToolsRating({ toolId, initialRating, initialCount, onRatingUpdate, compact = false }: AiToolsRatingProps) {
  const { data: session } = useSession();
  const [myScore, setMyScore] = useState<number | null>(null);
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    const savedData = JSON.parse(localStorage.getItem("dori_tool_ratings") || "{}");
    const toolData = savedData[toolId];
    if (toolData?.users?.[session.user.email]) {
      setMyScore(toolData.users[session.user.email]);
    }
  }, [toolId, session]);

  const handleRate = (score: number) => {
    if (!session) {
      if (confirm("로그인이 필요한 서비스입니다. 로그인하시겠습니까?")) signIn();
      return;
    }

    const savedData = JSON.parse(localStorage.getItem("dori_tool_ratings") || "{}");
    const toolData = savedData[toolId] || { totalScore: initialRating * initialCount, count: initialCount, users: {} };
    
    const prevScore = toolData.users[session.user.email!] || 0;
    let newTotalScore = toolData.totalScore;
    let newCount = toolData.count;

    if (prevScore === 0) {
      newTotalScore += score;
      newCount += 1;
    } else {
      newTotalScore = newTotalScore - prevScore + score;
    }

    const newAverage = newCount === 0 ? 0 : Number((newTotalScore / newCount).toFixed(1));

    toolData.users[session.user.email!] = score;
    toolData.totalScore = newTotalScore;
    toolData.count = newCount;
    savedData[toolId] = toolData;

    localStorage.setItem("dori_tool_ratings", JSON.stringify(savedData));
    setMyScore(score);
    onRatingUpdate(newAverage, newCount);
  };

  return (
    <div className={`flex flex-col items-start gap-2 w-full ${compact ? 'p-3 bg-gray-50 dark:bg-white/5' : 'p-5 bg-[var(--bg-soft)]'} rounded-2xl border border-[var(--card-border)] transition-colors`}>
      <div className="flex items-center justify-between w-full border-b border-dashed border-[var(--card-border)] pb-2 mb-1">
        <span className="font-bold text-xs text-[var(--text-main)]">내 점수 평가</span>
        {myScore ? (
          <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{myScore}점</span>
        ) : (
          <span className="text-[10px] text-gray-400">미참여</span>
        )}
      </div>
      
      <div className="flex justify-center w-full gap-1.5">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onMouseEnter={() => setHoverScore(score)}
            onMouseLeave={() => setHoverScore(null)}
            onClick={() => handleRate(score)}
            className={`text-2xl transition-transform hover:scale-110 ${
              score <= (hoverScore || myScore || 0) ? "text-yellow-400" : "text-gray-300 dark:text-gray-700"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
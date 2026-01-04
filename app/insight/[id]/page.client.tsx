"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import MissionTimer from "@/components/mission/MissionTimer";

export default function InsightDetailClient() {
  const { data: session } = useSession();
  
  // 30초 읽기 미션 타이머 시작
  useEffect(() => {
    if (session?.user) {
      // 타이머는 MissionTimer 컴포넌트에서 처리
    }
  }, [session]);

  return <MissionTimer missionCode="READ_ARTICLE_30S" secondsRequired={30} />;
}


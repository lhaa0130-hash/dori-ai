"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useMissionTimer } from "@/hooks/useMissionAutoComplete";

interface MissionTimerProps {
  missionCode: string;
  secondsRequired: number;
}

export default function MissionTimer({ missionCode, secondsRequired }: MissionTimerProps) {
  const { completed } = useMissionTimer(missionCode, secondsRequired);
  
  // 완료되면 아무것도 표시하지 않음 (백그라운드 처리)
  return null;
}


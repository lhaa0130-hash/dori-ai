// lib/gameData.ts
// 회원 게임 데이터(솜사탕·경험치·출석)를 Firestore users/{uid} 문서에 통합 저장.
// localStorage 기반이던 기존 cottonCandy/프로필을 서버로 이관 → 기기 무관 + 정확한 집계.
import {
    doc,
    getDoc,
    updateDoc,
    increment,
    serverTimestamp,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";
import { calculateTier, calculateLevel, ACTIVITY_SCORES } from "@/lib/userProfile";

function currentUid(): string | null {
    try {
        return getFirebaseAuth().currentUser?.uid || null;
    } catch {
        return null;
    }
}

export interface GameData {
    cottonCandy: number;
    doriExp: number;
    tier: number;
    level: number;
    attendance: {
        lastChecked: string;
        streak: number;
        totalDays: number;
        weekDays: string[];
    };
}

// 게임 데이터 읽기 (없으면 기본값)
export async function getGameData(): Promise<GameData | null> {
    const uid = currentUid();
    if (!uid) return null;
    try {
        const db = getFirebaseFirestore();
        const snap = await getDoc(doc(db, "users", uid));
        const d = snap.exists() ? snap.data() : {};
        const exp = d.doriExp || 0;
        return {
            cottonCandy: d.cottonCandy || 0,
            doriExp: exp,
            tier: d.tier || calculateTier(exp),
            level: d.level || calculateLevel(exp),
            attendance: d.attendance || { lastChecked: "", streak: 0, totalDays: 0, weekDays: [] },
        };
    } catch (e) {
        console.warn("[gameData] read fail:", e);
        return null;
    }
}

export async function getCottonCandyBalance(): Promise<number> {
    const g = await getGameData();
    return g?.cottonCandy || 0;
}

// 솜사탕 적립
export async function addCottonCandy(amount: number, _reason?: string): Promise<number> {
    const uid = currentUid();
    if (!uid || amount <= 0) return await getCottonCandyBalance();
    try {
        const db = getFirebaseFirestore();
        await updateDoc(doc(db, "users", uid), { cottonCandy: increment(amount) });
    } catch (e) {
        console.warn("[gameData] addCandy fail:", e);
    }
    return await getCottonCandyBalance();
}

// 솜사탕 소비 (잔액 부족 시 false)
export async function spendCottonCandy(amount: number, _reason?: string): Promise<boolean> {
    const uid = currentUid();
    if (!uid || amount <= 0) return false;
    try {
        const db = getFirebaseFirestore();
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        const cur = snap.data()?.cottonCandy || 0;
        if (cur < amount) return false;
        await updateDoc(ref, { cottonCandy: increment(-amount) });
        return true;
    } catch (e) {
        console.warn("[gameData] spend fail:", e);
        return false;
    }
}

// 경험치 적립 (+ 티어/레벨 자동 재계산)
export async function addExp(amount: number): Promise<void> {
    const uid = currentUid();
    if (!uid || amount === 0) return;
    try {
        const db = getFirebaseFirestore();
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        const newExp = Math.max(0, (snap.data()?.doriExp || 0) + amount);
        await updateDoc(ref, {
            doriExp: newExp,
            tier: calculateTier(newExp),
            level: calculateLevel(newExp),
        });
    } catch (e) {
        console.warn("[gameData] addExp fail:", e);
    }
}

// 활동 보상 (글/댓글/가이드 등) — 경험치 적립 헬퍼
export async function rewardActivity(type: keyof typeof ACTIVITY_SCORES): Promise<void> {
    const score = ACTIVITY_SCORES[type];
    if (score) await addExp(score);
}

// 출석 체크 (하루 1회) — 솜사탕 50 + 경험치 5, 7일 연속 보너스 200
export async function checkAttendance(): Promise<{ success: boolean; earned: number; bonus: boolean; message: string }> {
    const uid = currentUid();
    if (!uid) return { success: false, earned: 0, bonus: false, message: "로그인이 필요합니다." };
    try {
        const db = getFirebaseFirestore();
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        const data = snap.data() || {};
        const att = data.attendance || { lastChecked: "", streak: 0, totalDays: 0, weekDays: [] };

        const today = new Date().toISOString().split("T")[0];
        if (att.lastChecked === today) {
            return { success: false, earned: 0, bonus: false, message: "오늘 이미 출석했습니다." };
        }

        // 연속 출석 계산
        let newStreak = 1;
        if (att.lastChecked) {
            const diff = Math.round((new Date(today).getTime() - new Date(att.lastChecked).getTime()) / 86400000);
            newStreak = diff === 1 ? (att.streak || 0) + 1 : 1;
        }

        // 이번 주 출석 (월요일 기준)
        const now = new Date();
        const dow = now.getDay();
        const monOffset = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(now); monday.setDate(now.getDate() + monOffset);
        const mondayStr = monday.toISOString().split("T")[0];
        const weekDays = (att.weekDays || []).filter((d: string) => d >= mondayStr);
        if (!weekDays.includes(today)) weekDays.push(today);

        let earned = 50;
        let bonus = false;
        if (newStreak > 0 && newStreak % 7 === 0) { earned += 200; bonus = true; }

        const newExp = (data.doriExp || 0) + (ACTIVITY_SCORES.attendance || 5);
        await updateDoc(ref, {
            cottonCandy: increment(earned),
            doriExp: newExp,
            tier: calculateTier(newExp),
            level: calculateLevel(newExp),
            attendance: {
                lastChecked: today,
                streak: newStreak,
                totalDays: (att.totalDays || 0) + 1,
                weekDays,
            },
            lastActiveAt: serverTimestamp(),
        });

        return { success: true, earned, bonus, message: bonus ? `${newStreak}일 연속 출석! 보너스 획득` : "출석 완료!" };
    } catch (e) {
        console.warn("[gameData] attendance fail:", e);
        return { success: false, earned: 0, bonus: false, message: "출석 처리 중 오류가 발생했습니다." };
    }
}

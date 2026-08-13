"use client";

// /@<핸들> 공개 홈에 뜨는 "이 사람의 세계" 카드 — My World 를 남에게 보여주는 유일한 창구.
//
// 왜 이렇게 붙였나 (2026-08-13)
//   My World(캐릭터·방·일기)는 알맹이는 다 있는데 **공개면이 없었고**, /@핸들 은 공개 URL 을
//   가질 수 있는 유일한 개인 공간인데 **보여줄 알맹이가 없었다**(소스 주석에 "골격"이라고 적혀 있다).
//   둘의 결핍이 정확히 맞물려서, 새로 만드는 것 없이 배관만 이어 붙였다.
//
// 재사용 원칙 — 새 렌더러를 만들지 않는다
//   · 방 그림     : components/my-world/room/RoomCanvas (compact = 편집 불가 축소 렌더)
//   · 방 데이터   : lib/myWorld/room/state.loadRoomState(uid)   ← 임의 uid 를 받는다
//   · 캐릭터      : CharacterProvider viewUid={uid}             ← 2026-08-13 에 추가한 읽기 전용 모드
//   RoomCanvas 는 room 을 prop 으로 받고 캐릭터만 Context 에서 꺼내므로, Provider 만 바꿔 끼우면
//   캔버스 코드를 한 줄도 건드리지 않고 남의 방이 그려진다.
//
// ⚠️ 방 데이터는 users/{uid}.myWorld.room 이고 이 문서는 공개 읽기다(social.ts 규칙 주석 참고).
//    따라서 별도 권한 작업이 필요 없다. 반대로 **일기는 절대 여기 넣지 마라** — 본인 전용이다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CharacterProvider, useCharacter } from "@/contexts/CharacterContext";
import RoomCanvas from "@/components/my-world/room/RoomCanvas";
// 배럴로 일괄 import — lib/myWorld/room/index.ts 의 안내를 따른다.
import { loadRoomState, createDefaultRoomState, type RoomState } from "@/lib/myWorld/room";

function WorldBody({ uid, isOwner }: { uid: string; isOwner: boolean }) {
  const { character, loading: charLoading } = useCharacter();
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    let alive = true;
    loadRoomState(uid)
      .then((r) => { if (alive) setRoom(r); })
      .catch(() => { if (alive) setRoom(createDefaultRoomState()); });
    return () => { alive = false; };
  }, [uid]);

  const loading = room === null || charLoading;
  const count = room?.placedItems.length ?? 0;
  // ⚠️ "가구 0개"로는 안 꾸민 방을 판별할 수 없다 — createDefaultRoomState() 가 러그·침대·책상·화분
  //    **4개를 기본으로 주기 때문**이다(실측: 한 번도 저장한 적 없는 계정도 '가구 4개'로 보였다).
  //    저장을 거친 방만 updatedAt(serverTimestamp)을 갖는다. 그래서 그걸로 구분한다.
  const decorated = !!room?.updatedAt;

  return (
    <>
      <div className="overflow-hidden rounded-2xl ring-1 ring-stone-100 dark:ring-zinc-800">
        {loading ? (
          <div className="flex aspect-[4/3] w-full animate-pulse items-center justify-center bg-stone-100 dark:bg-zinc-800">
            <span className="text-3xl" aria-hidden="true">🏠</span>
          </div>
        ) : (
          <RoomCanvas room={room!} compact />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[12px]">
        <span className="font-semibold text-stone-500 dark:text-stone-400 truncate">
          {loading
            ? "불러오는 중…"
            : `${character.emoji} ${character.name}${decorated ? ` · 가구 ${count}개` : ""}`}
        </span>
        {isOwner && (
          <Link href="/my-world" className="shrink-0 font-bold text-[#F9954E] hover:underline">
            내 세계 꾸미기 →
          </Link>
        )}
      </div>

      {!loading && !decorated && (
        // 기본 방을 "꾸민 방"인 척 보여주지 않는다. 사실만 적고, 본인에게만 다음 행동을 준다.
        <p className="mt-2 text-[12.5px] text-stone-400 break-keep">
          {isOwner
            ? "아직 꾸미지 않은 기본 방이에요. 가구를 옮기거나 더 놓으면 여기에 반영됩니다."
            : "아직 꾸미지 않은 기본 방이에요."}
        </p>
      )}
    </>
  );
}

export default function PublicWorldCard({ uid, isOwner }: { uid: string; isOwner: boolean }) {
  if (!uid) return null;
  // viewUid 를 주면 그 사람의 캐릭터를 읽고, 선택(저장)은 막힌다.
  return (
    <CharacterProvider viewUid={uid}>
      <WorldBody uid={uid} isOwner={isOwner} />
    </CharacterProvider>
  );
}

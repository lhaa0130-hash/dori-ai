"use client";

// My World — 캐릭터 그림(무대·방 공용).
//
// 왜 필요한가: 무대(CharacterInteractionStage)와 방(RoomCanvas)이 각각 `<img>` 를 직접
// 렌더하면서 **onError 폴백이 없었다.** ASSETS_READY 플래그를 켠 뒤 파일 하나가 없으면
// 브라우저 기본 "깨진 이미지" 아이콘이 그대로 노출된다.
//
// 계약
//  · 플래그가 꺼져 있으면 이미지를 요청하지 않는다(404 방지).
//  · 로드 실패 시 이모지 placeholder 로 조용히 되돌린다(깨진 아이콘 금지).
//  · 정사각 비율을 미리 확보해 이미지 도착 전후로 레이아웃이 흔들리지 않는다.
//  · 장식으로 쓰일 때는 alt="" — 의미는 부모의 aria-label/텍스트가 전달한다.
import { useEffect, useState } from "react";
import { CHARACTER_ASSETS_READY } from "@/lib/myWorld/character/utils";
import type { Character } from "@/lib/myWorld/character/types";

export default function CharacterImage({
  character,
  /** 이모지 폴백 크기(CSS font-size). 무대처럼 유동 크기면 clamp 문자열을 넣는다. */
  emojiSize,
  /** 스크린리더에 읽힐 이름. 장식이면 생략(alt="") */
  alt,
  className = "",
}: {
  character: Character;
  emojiSize: string;
  alt?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  // 캐릭터가 바뀌면 실패 기록을 초기화한다(다른 캐릭터는 파일이 있을 수 있다).
  useEffect(() => { setFailed(false); }, [character.id]);

  const useImage = CHARACTER_ASSETS_READY && !failed && !!character.image;

  return (
    <span className={`relative block h-full w-full ${className}`} style={{ aspectRatio: "1 / 1" }}>
      {useImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={character.image}
          alt={alt ?? ""}
          draggable={false}
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {alt ? <span className="sr-only">{alt}</span> : null}
          <span aria-hidden style={{ fontSize: emojiSize, lineHeight: 1 }}>{character.emoji}</span>
        </span>
      )}
    </span>
  );
}

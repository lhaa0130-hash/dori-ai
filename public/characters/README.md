# My World 캐릭터 에셋 (05-03 구조 준비)

각 캐릭터 폴더 `public/characters/{id}/` 에 아래 webp 를 넣는다(향후):
- `thumbnail.webp`  — 목록 썸네일
- `portrait.webp`   — 대표 이미지(Hero)
- `idle.webp`       — 기본 포즈(향후 애니메이션)
- `avatar.webp`     — 작은 아바타

⚠️ 현재는 실제 이미지 없음(placeholder). `lib/myWorld/character/utils.ts` 의
`CHARACTER_ASSETS_READY=false` 동안은 이모지 placeholder 사용. 이미지를 채운 뒤
`true` 로 바꾸면 `CharacterAvatar` 가 이미지를 자동 사용한다.

id: dori bomi nabi haru pengs gomi simba buhu mango koya uni ari

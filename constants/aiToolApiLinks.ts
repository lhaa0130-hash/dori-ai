/**
 * AI 도구 API / 개발자 문서 링크 (id 기준 매핑)
 *
 * 거대 데이터 파일(aiToolsData.ts)을 건드리지 않고 API 링크만 따로 관리합니다.
 * AiToolsList에서 `tool.apiUrl || AI_TOOL_API_LINKS[tool.id]` 형태로 병합합니다.
 * 공식 API/개발자 문서가 확인된 도구만 등록 (없는 도구는 '사이트 방문' 버튼만 노출).
 */
export const AI_TOOL_API_LINKS: Record<string, string> = {
  // 3D
  "3d-meshy": "https://docs.meshy.ai",
  "3d-tripo": "https://platform.tripo3d.ai",
  "3d-spline": "https://docs.spline.design",

  // Agent
  "agent-autogpt": "https://docs.agpt.co",

  // Automation
  "auto-zapier": "https://docs.zapier.com",
  "auto-n8n": "https://docs.n8n.io/api/",
  "auto-make": "https://www.make.com/en/api-documentation",
  "auto-powerauto": "https://learn.microsoft.com/en-us/connectors/",

  // Avatar
  "avatar-heygen": "https://docs.heygen.com",
  "avatar-synthesia": "https://docs.synthesia.io",
  "avatar-did": "https://docs.d-id.com",
  "avatar-akool": "https://docs.akool.com",

  // Chatbot
  "chat-chatbase": "https://www.chatbase.co/docs",
  "chat-poe": "https://creator.poe.com/docs",
  "chat-botsonic": "https://docs.writesonic.com",

  // Coding
  "code-github": "https://docs.github.com/en/copilot",

  // etc / 생산성
  "etc-deepl": "https://developers.deepl.com",
  "etc-notion": "https://developers.notion.com",
  "etc-grammarly": "https://developer.grammarly.com",
  "etc-chatpdf": "https://www.chatpdf.com/docs/api/backend",

  // Game
  "game-scenario": "https://docs.scenario.com",
  "game-inworld": "https://docs.inworld.ai",
  "game-leonardo": "https://docs.leonardo.ai",

  // Image generation
  "img-firefly": "https://developer.adobe.com/firefly-services/",
  "img-ideogram": "https://developer.ideogram.ai",

  // LLM
  "llm-grok": "https://docs.x.ai",

  // Marketing
  "mkt-jasper": "https://developers.jasper.ai",
  "mkt-semrush": "https://developer.semrush.com",

  // Meeting notes
  "meet-fireflies": "https://docs.fireflies.ai",

  // Music
  "music-mubert": "https://mubert.com/render/docs",

  // Presentation
  "ppt-gamma": "https://developers.gamma.app",

  // Video generation
  "vid-runway-gen3": "https://docs.dev.runwayml.com",
  "vid-luma": "https://lumalabs.ai/dream-machine/api",

  // Voice / TTS
  "voice-elevenlabs": "https://elevenlabs.io/docs/api-reference",
  "voice-murf": "https://murf.ai/api",
  "voice-playht": "https://docs.play.ht",
  "voice-lovo": "https://docs.genny.lovo.ai",
  "voice-typecast": "https://docs.typecast.ai",

  // Writing
  "write-writesonic": "https://docs.writesonic.com",
  "write-novelai": "https://docs.novelai.net",
};

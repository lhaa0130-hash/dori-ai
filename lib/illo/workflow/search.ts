// 검색 Adapter — Web Search 노드는 LLM이 아니다.
// Tavily/Exa를 붙이기 전까지 Mock으로 전체 흐름이 돌아가게 한다.

export type SearchOptions = { maxResults?: number; signal?: AbortSignal };

export type SearchResult = {
  title: string;
  url: string;
  domain: string;
  summary: string;
  excerpt: string;      // 본문 일부
  publishedAt?: string;
  fetchedAt: string;
  sourceType: "official" | "government" | "manufacturer" | "news" | "blog" | "community" | "unknown";
};

export interface SearchProvider {
  id: string;
  /** 실제 API가 붙었는가 (false면 Mock) */
  live: boolean;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

/** 실제 검색 API 연결 전까지 쓰는 Mock. 흐름 검증 + 데모용. */
export function mockSearchProvider(): SearchProvider {
  return {
    id: "mock-search",
    live: false,
    async search(query, options) {
      await new Promise((r) => setTimeout(r, 60));
      const now = new Date().toISOString();
      const n = options?.maxResults ?? 3;
      return Array.from({ length: n }, (_, i) => ({
        title: `${query} 관련 자료 ${i + 1}`,
        url: `https://example${i + 1}.org/${encodeURIComponent(query)}`,
        domain: `example${i + 1}.org`,
        summary: `${query}에 대한 요약 정보 ${i + 1} (모의 데이터)`,
        excerpt: `${query}에 관한 본문 일부입니다. 실제 검색 API를 연결하면 실제 문서가 들어옵니다.`,
        publishedAt: undefined,
        fetchedAt: now,
        sourceType: (i === 0 ? "government" : i === 1 ? "manufacturer" : "blog") as SearchResult["sourceType"],
      }));
    },
  };
}

/**
 * Tavily 어댑터 자리 — 키를 서버(Cloudflare Function)에 두고 프록시해야 한다.
 * ⚠️ 브라우저에 검색 API 키를 내리면 안 되므로, 실제 연결은 서버 경로가 생긴 뒤에 한다.
 */
export function tavilyProvider(proxyUrl: string): SearchProvider {
  return {
    id: "tavily",
    live: true,
    async search(query, options) {
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, maxResults: options?.maxResults ?? 5 }),
        signal: options?.signal,
      });
      if (!res.ok) throw new Error(`검색 실패 (${res.status})`);
      const data = await res.json();
      const now = new Date().toISOString();
      return (data.results || []).map((r: Record<string, unknown>) => ({
        title: String(r.title || ""),
        url: String(r.url || ""),
        domain: (() => { try { return new URL(String(r.url)).hostname; } catch { return ""; } })(),
        summary: String(r.content || r.summary || ""),
        excerpt: String(r.raw_content || r.content || "").slice(0, 1200),
        publishedAt: r.published_date ? String(r.published_date) : undefined,
        fetchedAt: now,
        sourceType: "unknown" as const,
      }));
    },
  };
}

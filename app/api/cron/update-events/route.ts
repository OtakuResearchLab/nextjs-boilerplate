import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const SOURCES = [
  {
    name: "Santora",
    type: "website",
    region: "台灣",
    url: "https://santora.tw/information-of-live-concert/",
  },
  {
    name: "Anime Maps",
    type: "website",
    region: "台灣 / 日本",
    url: "https://animemaps.com/zh-hant/event/",
  },
  {
    name: "Bilibili 會員購票務",
    type: "ticket-platform",
    region: "中國大陸",
    url: "https://mall.bilibili.com/neul-next/ticket/home.html?noTitleBar=1",
  },
];

const EVENT_KEYWORDS = [
  "演唱會",
  "音樂會",
  "交響",
  "Concert",
  "concert",
  "LIVE",
  "Live",
  "live",
  "活動",
  "展覽",
  "快閃",
  "期間限定",
  "聯名",
  "主題店",
  "主題咖啡",
  "コンサート",
  "ライブ",
  "イベント",
  "コラボ",
];

type TrackedIp = {
  id: number;
  name: string;
  aliases: string[];
  enabled: boolean;
  sort_order: number;
};

type LinkItem = {
  title: string;
  url: string;
};

type MatchedCandidate = {
  title: string;
  url: string;
  matchedIp: string;
  matchedAlias: string;
};

function decodeHtml(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function toAbsoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractLinks(html: string, baseUrl: string): LinkItem[] {
  const results: LinkItem[] = [];

  const anchorRegex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const innerHtml = match[2];

    const title = stripTags(innerHtml);
    const absoluteUrl = toAbsoluteUrl(href, baseUrl);

    if (!title || !absoluteUrl) {
      continue;
    }

    results.push({
      title,
      url: absoluteUrl,
    });
  }

  return results;
}

function looksLikeEvent(title: string) {
  const lowerTitle = title.toLowerCase();

  return EVENT_KEYWORDS.some((keyword) =>
    lowerTitle.includes(keyword.toLowerCase())
  );
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * 短縮寫不能直接 includes。
 *
 * 例如：
 * FF
 * EVA
 * ZZZ
 * NTE
 * WOW
 *
 * 需要完整單字邊界，避免：
 * OFFICIAL → FF
 * SHOWCASE → WOW
 * 之類的誤判。
 */
function isShortLatinAlias(alias: string) {
  return /^[a-z0-9]+$/i.test(alias) && alias.length <= 4;
}

function aliasMatches(text: string, alias: string) {
  const normalizedText = normalizeText(text);
  const normalizedAlias = normalizeText(alias);

  if (!normalizedAlias) {
    return false;
  }

  if (isShortLatinAlias(normalizedAlias)) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(normalizedAlias)}([^a-z0-9]|$)`,
      "i"
    );

    return pattern.test(normalizedText);
  }

  return normalizedText.includes(normalizedAlias);
}

function findTrackedIpMatch(
  text: string,
  trackedIps: TrackedIp[]
): {
  matchedIp: string;
  matchedAlias: string;
} | null {
  /*
   * 優先比對較長 alias。
   * 避免短名稱先命中造成分類不精確。
   */
  for (const ip of trackedIps) {
    const aliases = Array.from(
      new Set([ip.name, ...(ip.aliases ?? [])])
    ).sort((a, b) => b.length - a.length);

    for (const alias of aliases) {
      if (aliasMatches(text, alias)) {
        return {
          matchedIp: ip.name,
          matchedAlias: alias,
        };
      }
    }
  }

  return null;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; OtakuLabEventBot/1.0)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  const html = await response.text();

  return {
    response,
    html,
  };
}

export async function GET() {
  try {
    /*
     * STEP 1
     * 從 Supabase 讀取啟用中的監測 IP。
     *
     * 目前只 SELECT，不會寫資料。
     */
    const {
      data: trackedIpRows,
      error: trackedIpError,
    } = await supabase
      .from("tracked_ips")
      .select(`
        id,
        name,
        aliases,
        enabled,
        sort_order
      `)
      .eq("enabled", true)
      .order("sort_order", { ascending: true });

    if (trackedIpError) {
      return NextResponse.json(
        {
          ok: false,
          stage: "load_tracked_ips",
          error: trackedIpError.message,
        },
        {
          status: 500,
        }
      );
    }

    const trackedIps = (trackedIpRows ?? []) as TrackedIp[];

    /*
     * STEP 2
     * 確認目前三個來源能否正常取得。
     */
    const sourceChecks = await Promise.all(
      SOURCES.map(async (source) => {
        try {
          const { response, html } = await fetchHtml(source.url);

          return {
            name: source.name,
            type: source.type,
            region: source.region,
            ok: response.ok,
            status: response.status,
            htmlLength: html.length,
          };
        } catch (error) {
          return {
            name: source.name,
            type: source.type,
            region: source.region,
            ok: false,
            status: null,
            htmlLength: 0,
            error:
              error instanceof Error
                ? error.message
                : "Unknown fetch error",
          };
        }
      })
    );

    /*
     * STEP 3
     * 目前只正式分析 Santora。
     *
     * 流程：
     * HTML
     * ↓
     * 所有連結
     * ↓
     * 活動關鍵字
     * ↓
     * tracked_ips aliases
     * ↓
     * 只留下有命中 IP 的候選
     */
    const santora = SOURCES[0];

    const {
      response: santoraResponse,
      html: santoraHtml,
    } = await fetchHtml(santora.url);

    let rawEventCandidates: LinkItem[] = [];
    let matchedCandidates: MatchedCandidate[] = [];

    if (santoraResponse.ok) {
      const allLinks = extractLinks(
        santoraHtml,
        santora.url
      );

      const rawUniqueMap = new Map<
        string,
        LinkItem
      >();

      for (const item of allLinks) {
        if (!looksLikeEvent(item.title)) {
          continue;
        }

        const key = `${item.title}|${item.url}`;

        if (!rawUniqueMap.has(key)) {
          rawUniqueMap.set(key, item);
        }
      }

      rawEventCandidates = Array.from(
        rawUniqueMap.values()
      );

      const matchedUniqueMap = new Map<
        string,
        MatchedCandidate
      >();

      for (const item of rawEventCandidates) {
        const match = findTrackedIpMatch(
          item.title,
          trackedIps
        );

        if (!match) {
          continue;
        }

        const candidate: MatchedCandidate = {
          title: item.title,
          url: item.url,
          matchedIp: match.matchedIp,
          matchedAlias: match.matchedAlias,
        };

        const key =
          `${candidate.matchedIp}|` +
          `${candidate.title}|` +
          `${candidate.url}`;

        if (!matchedUniqueMap.has(key)) {
          matchedUniqueMap.set(
            key,
            candidate
          );
        }
      }

      matchedCandidates = Array.from(
        matchedUniqueMap.values()
      ).slice(0, 50);
    }

    return NextResponse.json({
      ok: true,

      message:
        "OTAKU LAB tracked IP parser preview completed. No database writes were performed.",

      checkedAt: new Date().toISOString(),

      trackedIps: {
        count: trackedIps.length,
        items: trackedIps.map((ip) => ({
          name: ip.name,
          aliases: ip.aliases,
        })),
      },

      sourceChecks,

      parserPreview: {
        source: "Santora",

        rawEventCandidateCount:
          rawEventCandidates.length,

        matchedCandidateCount:
          matchedCandidates.length,

        matchedCandidates,
      },
    });
  } catch (error) {
    console.error(
      "update-events error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      {
        status: 500,
      }
    );
  }
}

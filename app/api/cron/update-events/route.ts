import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

function extractLinks(html: string, baseUrl: string) {
  const results: {
    title: string;
    url: string;
  }[] = [];

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
  return EVENT_KEYWORDS.some((keyword) =>
    title.toLowerCase().includes(keyword.toLowerCase())
  );
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
     * 先確認三個來源依然能正常取得。
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
     * STEP 2
     * 第一階段只解析 Santora。
     * 目前只是預覽，不會寫入 Supabase。
     */
    const santora = SOURCES[0];

    const { response: santoraResponse, html: santoraHtml } =
      await fetchHtml(santora.url);

    let santoraCandidates: {
      title: string;
      url: string;
    }[] = [];

    if (santoraResponse.ok) {
      const allLinks = extractLinks(
        santoraHtml,
        santora.url
      );

      const uniqueMap = new Map<
        string,
        {
          title: string;
          url: string;
        }
      >();

      for (const item of allLinks) {
        if (!looksLikeEvent(item.title)) {
          continue;
        }

        const key = `${item.title}|${item.url}`;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      }

      santoraCandidates = Array.from(
        uniqueMap.values()
      ).slice(0, 30);
    }

    return NextResponse.json({
      ok: true,
      message:
        "OTAKU LAB event parser preview completed. No database writes were performed.",
      checkedAt: new Date().toISOString(),

      sourceChecks,

      parserPreview: {
        source: "Santora",
        candidateCount: santoraCandidates.length,
        candidates: santoraCandidates,
      },
    });
  } catch (error) {
    console.error("update-events error:", error);

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

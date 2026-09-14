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

type TrackedIp = {
  id: number;
  name: string;
  aliases: string[];
  enabled: boolean;
  sort_order: number;
};

type EventCandidate = {
  ip: string;
  matchedAlias: string;
  eventDate: string;
  titlePreview: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  regionHint: string;
};

function decodeHtml(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#8211;/gi, "–")
    .replace(/&#8212;/gi, "—")
    .replace(/&#8216;/gi, "‘")
    .replace(/&#8217;/gi, "’")
    .replace(/&#8220;/gi, "“")
    .replace(/&#8221;/gi, "”")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, number) =>
      String.fromCharCode(Number(number))
    );
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(
        /<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr|section|article)>/gi,
        "\n"
      )
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function normalizeText(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

function findIpMatch(
  text: string,
  trackedIps: TrackedIp[]
): {
  ip: string;
  alias: string;
} | null {
  for (const ip of trackedIps) {
    const aliases = Array.from(
      new Set([ip.name, ...(ip.aliases ?? [])])
    ).sort((a, b) => b.length - a.length);

    for (const alias of aliases) {
      if (aliasMatches(text, alias)) {
        return {
          ip: ip.name,
          alias,
        };
      }
    }
  }

  return null;
}

function normalizeDate(
  year: string,
  month: string,
  day: string
) {
  const mm = month.padStart(2, "0");
  const dd = day.padStart(2, "0");

  return `${year}-${mm}-${dd}`;
}

function extractCandidates(
  text: string,
  trackedIps: TrackedIp[]
): EventCandidate[] {
  /*
   * Santora 正文目前觀察到大量：
   *
   * 2026/02/01 活動名稱 ...
   *
   * 所以先以 YYYY/MM/DD 作為切割錨點。
   *
   * 這一版只產生候選，不寫資料庫。
   */
  const dateRegex =
    /(20\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})/g;

  const dateMatches = Array.from(
    text.matchAll(dateRegex)
  );

  const candidates: EventCandidate[] = [];
  const unique = new Set<string>();

  for (let i = 0; i < dateMatches.length; i++) {
    const match = dateMatches[i];

    if (match.index === undefined) {
      continue;
    }

    const year = match[1];
    const month = match[2];
    const day = match[3];

    const eventDate = normalizeDate(
      year,
      month,
      day
    );

    const currentStart = match.index;

    /*
     * 取這個日期到下一個日期之間的文字。
     *
     * 如果兩個日期相隔太遠，
     * 最多只取 500 字，避免吃到下一大段內容。
     */
    const nextStart =
      i + 1 < dateMatches.length &&
      dateMatches[i + 1].index !== undefined
        ? dateMatches[i + 1].index!
        : text.length;

    const end = Math.min(
      nextStart,
      currentStart + 500
    );

    const block = text
      .slice(currentStart, end)
      .replace(/\s+/g, " ")
      .trim();

    if (!block) {
      continue;
    }

    const ipMatch = findIpMatch(
      block,
      trackedIps
    );

    if (!ipMatch) {
      continue;
    }

    /*
     * 目前 titlePreview 暫時保留日期後的整個文字片段。
     * 下一版再根據實際輸出切成正式 title / venue / city。
     */
    const titlePreview = block
      .replace(dateRegex, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 260);

    if (!titlePreview) {
      continue;
    }

    const key =
      `${ipMatch.ip}|${eventDate}|${titlePreview}`;

    if (unique.has(key)) {
      continue;
    }

    unique.add(key);

    candidates.push({
      ip: ipMatch.ip,
      matchedAlias: ipMatch.alias,
      eventDate,
      titlePreview,
      sourceName: "Santora",
      sourceUrl:
        "https://santora.tw/information-of-live-concert/",
      sourceType: "website",
      regionHint: "待解析",
    });
  }

  return candidates.slice(0, 100);
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
     * 讀取 tracked_ips。
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
      .order("sort_order", {
        ascending: true,
      });

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

    const trackedIps =
      (trackedIpRows ?? []) as TrackedIp[];

    /*
     * STEP 2
     * 三個來源健康檢查。
     */
    const sourceChecks = await Promise.all(
      SOURCES.map(async (source) => {
        try {
          const { response, html } =
            await fetchHtml(source.url);

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
     * Santora 正文。
     */
    const santora = SOURCES[0];

    const {
      response: santoraResponse,
      html: santoraHtml,
    } = await fetchHtml(santora.url);

    if (!santoraResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          stage: "fetch_santora",
          status: santoraResponse.status,
        },
        {
          status: 502,
        }
      );
    }

    const santoraText =
      htmlToText(santoraHtml);

    /*
     * STEP 4
     * 產生 EventCandidate 預覽。
     */
    const candidates =
      extractCandidates(
        santoraText,
        trackedIps
      );

    const matchedIps = Array.from(
      new Set(
        candidates.map(
          (candidate) => candidate.ip
        )
      )
    );

    return NextResponse.json({
      ok: true,

      message:
        "OTAKU LAB EventCandidate preview completed. No database writes were performed.",

      checkedAt:
        new Date().toISOString(),

      trackedIps: {
        count: trackedIps.length,
      },

      sourceChecks,

      eventCandidatePreview: {
        source: "Santora",

        candidateCount:
          candidates.length,

        matchedIpCount:
          matchedIps.length,

        matchedIps,

        candidates,
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

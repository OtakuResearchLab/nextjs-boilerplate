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

  title: string;

  regionHint: string | null;
  cityHint: string | null;
  sessionHint: string | null;

  fingerprintPreview: string;

  sourceName: string;
  sourceUrl: string;
  sourceType: string;
};

const CITY_RULES = [
  // 日本
  { keywords: ["東京"], city: "東京", region: "日本" },
  { keywords: ["大阪"], city: "大阪", region: "日本" },
  { keywords: ["兵庫", "神戶", "神戸"], city: "兵庫", region: "日本" },
  { keywords: ["福岡"], city: "福岡", region: "日本" },
  { keywords: ["横浜", "橫濱"], city: "橫濱", region: "日本" },
  { keywords: ["神奈川"], city: "神奈川", region: "日本" },
  { keywords: ["札幌", "北海道"], city: "札幌", region: "日本" },
  { keywords: ["名古屋", "愛知"], city: "名古屋", region: "日本" },
  { keywords: ["京都"], city: "京都", region: "日本" },
  { keywords: ["広島", "廣島"], city: "廣島", region: "日本" },
  { keywords: ["仙台", "宮城"], city: "仙台", region: "日本" },
  { keywords: ["千葉"], city: "千葉", region: "日本" },
  { keywords: ["埼玉"], city: "埼玉", region: "日本" },
  { keywords: ["鳥取"], city: "鳥取", region: "日本" },

  // 台灣
  { keywords: ["台北", "臺北"], city: "台北", region: "台灣" },
  { keywords: ["新北"], city: "新北", region: "台灣" },
  { keywords: ["桃園"], city: "桃園", region: "台灣" },
  { keywords: ["台中", "臺中"], city: "台中", region: "台灣" },
  { keywords: ["台南", "臺南"], city: "台南", region: "台灣" },
  { keywords: ["高雄"], city: "高雄", region: "台灣" },
];

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
      `(^|[^a-z0-9])${escapeRegExp(
        normalizedAlias
      )}([^a-z0-9]|$)`,
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
  return `${year}-${month.padStart(2, "0")}-${day.padStart(
    2,
    "0"
  )}`;
}

function getTaipeiToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year =
    parts.find((part) => part.type === "year")?.value ?? "";

  const month =
    parts.find((part) => part.type === "month")?.value ?? "";

  const day =
    parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function detectLocation(text: string) {
  for (const rule of CITY_RULES) {
    if (
      rule.keywords.some((keyword) =>
        text.includes(keyword)
      )
    ) {
      return {
        region: rule.region,
        city: rule.city,
      };
    }
  }

  return {
    region: null,
    city: null,
  };
}

function extractSessionHint(text: string) {
  /*
   * 優先找：
   * （東京場）
   * (大阪場)
   * （兵庫場 DAY1）
   * 等資訊。
   */
  const parentheses =
    text.match(/[（(]([^（）()]{1,40})[）)]/g) ?? [];

  for (const item of parentheses) {
    const inner = item
      .replace(/^[（(]/, "")
      .replace(/[）)]$/, "")
      .trim();

    const hasLocation = CITY_RULES.some((rule) =>
      rule.keywords.some((keyword) =>
        inner.includes(keyword)
      )
    );

    if (hasLocation) {
      return inner;
    }
  }

  return null;
}

function cleanEventTitle(
  rawBlock: string,
  originalDate: string
) {
  let title = rawBlock;

  /*
   * 移除最前面的完整日期。
   */
  title = title.replace(originalDate, "");

  /*
   * 移除常見來源／售票標記以及後面的雜訊。
   */
  title = title
    .replace(
      /\s*[（(](?:官網|官方|售票網|購票|公式)[^）)]*[）)].*$/i,
      ""
    )
    .replace(/\s+UPCOMING.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  /*
   * 安全上限。
   */
  return title.slice(0, 180).trim();
}

function createFingerprintPreview(
  ip: string,
  title: string,
  eventDate: string,
  city: string | null
) {
  const normalizedTitle = normalizeText(title)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return [
    normalizeText(ip),
    normalizedTitle,
    eventDate,
    city ? normalizeText(city) : "unknown",
  ].join("|");
}

function extractCandidates(
  text: string,
  trackedIps: TrackedIp[],
  today: string
): EventCandidate[] {
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

    /*
     * 排除過期活動。
     */
    if (eventDate < today) {
      continue;
    }

    const currentStart = match.index;

    const nextMatch = dateMatches[i + 1];

    const nextStart =
      nextMatch && nextMatch.index !== undefined
        ? nextMatch.index
        : text.length;

    /*
     * 關鍵修正：
     *
     * 不再往後抓 500 字。
     * 最多只取 240 字，而且遇到下一個日期立刻停止。
     *
     * 避免一個舊日期誤吃到後面其他作品。
     */
    const end = Math.min(
      nextStart,
      currentStart + 240
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

    const rawDate = match[0];

    const title = cleanEventTitle(
      block,
      rawDate
    );

    /*
     * 太短通常不是有效活動標題。
     */
    if (title.length < 6) {
      continue;
    }

    const location =
      detectLocation(title);

    const sessionHint =
      extractSessionHint(title);

    const fingerprintPreview =
      createFingerprintPreview(
        ipMatch.ip,
        title,
        eventDate,
        location.city
      );

    const key = fingerprintPreview;

    if (unique.has(key)) {
      continue;
    }

    unique.add(key);

    candidates.push({
      ip: ipMatch.ip,
      matchedAlias: ipMatch.alias,

      eventDate,

      title,

      regionHint: location.region,
      cityHint: location.city,
      sessionHint,

      fingerprintPreview,

      sourceName: "Santora",
      sourceUrl:
        "https://santora.tw/information-of-live-concert/",
      sourceType: "website",
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
     * 來源健康檢查。
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
     * 使用台灣日期排除過期活動。
     */
    const today =
      getTaipeiToday();

    /*
     * STEP 5
     * 產生更乾淨的 EventCandidate。
     */
    const candidates =
      extractCandidates(
        santoraText,
        trackedIps,
        today
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
        "OTAKU LAB refined EventCandidate preview completed. No database writes were performed.",

      checkedAt:
        new Date().toISOString(),

      today,

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

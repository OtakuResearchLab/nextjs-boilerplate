import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const SANTORA_URL =
  "https://santora.tw/information-of-live-concert/";

const SOURCES = [
  {
    name: "Santora",
    type: "website",
    region: "台灣 / 日本",
    url: SANTORA_URL,
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

type ParsedSantoraItem = {
  ip: string;
  matchedAlias: string;

  title: string;
  canonicalTitle: string;

  eventDate: string;
  endDate: string | null;

  region: string | null;
  city: string | null;
  sessionHint: string | null;

  directSourceLabel: string | null;
  directSourceUrl: string | null;

  primarySourceUrl: string;
  primarySourceType: string;

  santoraUrl: string;

  fingerprintPreview: string;
};

const CITY_RULES = [
  { keywords: ["東京"], city: "東京", region: "日本" },
  { keywords: ["大阪"], city: "大阪", region: "日本" },
  { keywords: ["兵庫", "神戶", "神戸"], city: "兵庫", region: "日本" },
  { keywords: ["福岡"], city: "福岡", region: "日本" },
  { keywords: ["橫濱", "横浜"], city: "橫濱", region: "日本" },
  { keywords: ["神奈川"], city: "神奈川", region: "日本" },
  { keywords: ["札幌", "北海道"], city: "札幌", region: "日本" },
  { keywords: ["名古屋", "愛知"], city: "名古屋", region: "日本" },
  { keywords: ["京都"], city: "京都", region: "日本" },
  { keywords: ["廣島", "広島"], city: "廣島", region: "日本" },
  { keywords: ["仙台", "宮城"], city: "仙台", region: "日本" },
  { keywords: ["千葉"], city: "千葉", region: "日本" },
  { keywords: ["埼玉"], city: "埼玉", region: "日本" },
  { keywords: ["鳥取"], city: "鳥取", region: "日本" },

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
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, number) =>
      String.fromCharCode(Number(number))
    );
}

function stripTags(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
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

function parseDateAtStart(text: string) {
  /*
   * 支援：
   * 2026/09/22
   * 2026/06/05-07
   * 2026/07/18~20
   */
  const match = text.match(
    /^\s*(20\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})(?:\s*[-~～]\s*(\d{1,2}))?/
  );

  if (!match) {
    return null;
  }

  const year = match[1];
  const month = match[2];
  const startDay = match[3];
  const endDay = match[4] ?? null;

  return {
    raw: match[0],
    eventDate: normalizeDate(
      year,
      month,
      startDay
    ),
    endDate: endDay
      ? normalizeDate(year, month, endDay)
      : null,
  };
}

function detectLocation(
  text: string,
  sectionRegion: string | null
) {
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
    region: sectionRegion,
    city: null,
  };
}

function extractSessionHint(text: string) {
  const parentheses =
    text.match(/[（(]([^（）()]{1,50})[）)]/g) ?? [];

  for (const item of parentheses) {
    const inner = item
      .replace(/^[（(]/, "")
      .replace(/[）)]$/, "")
      .trim();

    const containsPlace =
      CITY_RULES.some((rule) =>
        rule.keywords.some((keyword) =>
          inner.includes(keyword)
        )
      );

    if (containsPlace) {
      return inner;
    }
  }

  const dayMatch = text.match(/\bDAY\s*\d+\b/i);

  if (dayMatch) {
    return dayMatch[0].toUpperCase();
  }

  return null;
}

function extractLinks(html: string) {
  const links: {
    label: string;
    url: string;
  }[] = [];

  const regex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const label = stripTags(match[2]);

    if (!href || !label) {
      continue;
    }

    try {
      const url = new URL(
        href,
        SANTORA_URL
      ).toString();

      links.push({
        label,
        url,
      });
    } catch {
      // ignore invalid URL
    }
  }

  return links;
}

function chooseBestDirectSource(
  links: {
    label: string;
    url: string;
  }[]
) {
  const external = links.filter(
    (link) =>
      !link.url.startsWith("https://santora.tw/")
  );

  if (external.length === 0) {
    return null;
  }

  const score = (label: string) => {
    if (/官網|官方|公式/i.test(label)) {
      return 100;
    }

    if (/網頁公告|公告/i.test(label)) {
      return 80;
    }

    if (/售票|購票|抽選|登記/i.test(label)) {
      return 60;
    }

    return 20;
  };

  return external
    .slice()
    .sort(
      (a, b) =>
        score(b.label) - score(a.label)
    )[0];
}

function cleanTitle(
  text: string,
  rawDate: string
) {
  return text
    .replace(rawDate, "")
    /*
     * 移除 Santora 自己附在尾端的：
     * （官網）
     * （售票網）
     * （網頁公告）
     * （登記抽選）
     *
     * 但保留：
     * （東京場）
     * （兵庫場）
     */
    .replace(
      /[（(]\s*(?:官網|官方|公式|售票網|購票|網頁公告|公告|登記抽選|抽選)\s*[）)]/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function createCanonicalTitle(title: string) {
  return normalizeText(title)
    /*
     * 去掉城市場次，方便同巡演繼承來源 URL。
     */
    .replace(
      /[（(][^（）()]*(?:東京|大阪|兵庫|神戶|神戸|福岡|橫濱|横浜|札幌|北海道|名古屋|愛知|京都|廣島|広島|仙台|宮城|鳥取|台北|臺北|台中|臺中|台南|臺南|高雄)[^（）()]*[）)]/g,
      " "
    )
    .replace(/\bday\s*\d+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createFingerprint(
  ip: string,
  canonicalTitle: string,
  eventDate: string,
  city: string | null
) {
  const normalizedTitle = canonicalTitle
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return [
    normalizeText(ip),
    normalizedTitle,
    eventDate,
    city ? normalizeText(city) : "unknown",
  ].join("|");
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

function parseSantoraItems(
  html: string,
  trackedIps: TrackedIp[],
  today: string
): ParsedSantoraItem[] {
  /*
   * 用 heading + li 順序掃描。
   *
   * 目的：
   * 1. 知道目前處於「台灣」還是「日本」
   * 2. 每個 <li> 就是一筆活動，不再用固定字數切割
   */
  const tokenRegex =
    /<(h4|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  let currentRegion: string | null = null;

  type TempItem = {
    ip: string;
    matchedAlias: string;

    title: string;
    canonicalTitle: string;

    eventDate: string;
    endDate: string | null;

    region: string | null;
    city: string | null;
    sessionHint: string | null;

    directSourceLabel: string | null;
    directSourceUrl: string | null;
  };

  const allMatchedItems: TempItem[] = [];

  let tokenMatch;

  while (
    (tokenMatch = tokenRegex.exec(html)) !== null
  ) {
    const tag = tokenMatch[1].toLowerCase();
    const innerHtml = tokenMatch[2];

    if (tag === "h4") {
      const heading = stripTags(innerHtml);

      if (heading.includes("台灣")) {
        currentRegion = "台灣";
      } else if (heading.includes("日本")) {
        currentRegion = "日本";
      } else if (
        heading.includes("轉播") ||
        heading.includes("其他")
      ) {
        /*
         * 不處理「轉播&其他」，
         * 避免把公告或尚未確定場次當正式活動。
         */
        currentRegion = null;
      }

      continue;
    }

    if (tag !== "li") {
      continue;
    }

    /*
     * 只有台灣 / 日本正式活動區塊才解析。
     */
    if (!currentRegion) {
      continue;
    }

    const fullText = stripTags(innerHtml);

    const dateInfo =
      parseDateAtStart(fullText);

    if (!dateInfo) {
      continue;
    }

    /*
     * 已完全結束的活動不要進候選。
     */
    const effectiveEnd =
      dateInfo.endDate ??
      dateInfo.eventDate;

    if (effectiveEnd < today) {
      continue;
    }

    const ipMatch =
      findIpMatch(
        fullText,
        trackedIps
      );

    if (!ipMatch) {
      continue;
    }

    const title = cleanTitle(
      fullText,
      dateInfo.raw
    );

    if (title.length < 5) {
      continue;
    }

    const canonicalTitle =
      createCanonicalTitle(title);

    const location =
      detectLocation(
        title,
        currentRegion
      );

    const sessionHint =
      extractSessionHint(title);

    const links =
      extractLinks(innerHtml);

    const bestSource =
      chooseBestDirectSource(links);

    allMatchedItems.push({
      ip: ipMatch.ip,
      matchedAlias:
        ipMatch.alias,

      title,
      canonicalTitle,

      eventDate:
        dateInfo.eventDate,
      endDate:
        dateInfo.endDate,

      region:
        location.region,
      city:
        location.city,
      sessionHint,

      directSourceLabel:
        bestSource?.label ?? null,

      directSourceUrl:
        bestSource?.url ?? null,
    });
  }

  /*
   * 第一輪：
   * 收集「同一巡演」曾出現過的官方 / 售票 URL。
   *
   * key = IP + canonicalTitle
   */
  const inheritedSources =
    new Map<
      string,
      {
        label: string | null;
        url: string;
      }
    >();

  for (const item of allMatchedItems) {
    if (!item.directSourceUrl) {
      continue;
    }

    const key =
      `${item.ip}|${item.canonicalTitle}`;

    if (!inheritedSources.has(key)) {
      inheritedSources.set(key, {
        label:
          item.directSourceLabel,
        url:
          item.directSourceUrl,
      });
    }
  }

  /*
   * 第二輪：
   * 沒直接 URL 的場次，嘗試繼承同系列來源。
   */
  const result: ParsedSantoraItem[] = [];

  const unique = new Set<string>();

  for (const item of allMatchedItems) {
    const inheritKey =
      `${item.ip}|${item.canonicalTitle}`;

    const inherited =
      inheritedSources.get(inheritKey);

    const primarySourceUrl =
      item.directSourceUrl ??
      inherited?.url ??
      SANTORA_URL;

    const primarySourceType =
      item.directSourceUrl
        ? item.directSourceLabel ?? "external"
        : inherited
          ? `inherited:${inherited.label ?? "external"}`
          : "Santora";

    const fingerprintPreview =
      createFingerprint(
        item.ip,
        item.canonicalTitle,
        item.eventDate,
        item.city
      );

    if (
      unique.has(fingerprintPreview)
    ) {
      continue;
    }

    unique.add(
      fingerprintPreview
    );

    result.push({
      ...item,

      primarySourceUrl,
      primarySourceType,

      santoraUrl:
        SANTORA_URL,

      fingerprintPreview,
    });
  }

  return result;
}

export async function GET() {
  try {
    /*
     * STEP 1
     * tracked_ips
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
          stage:
            "load_tracked_ips",
          error:
            trackedIpError.message,
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
     * 三來源健康檢查。
     */
    const sourceChecks =
      await Promise.all(
        SOURCES.map(
          async (source) => {
            try {
              const {
                response,
                html,
              } =
                await fetchHtml(
                  source.url
                );

              return {
                name:
                  source.name,
                type:
                  source.type,
                region:
                  source.region,
                ok:
                  response.ok,
                status:
                  response.status,
                htmlLength:
                  html.length,
              };
            } catch (error) {
              return {
                name:
                  source.name,
                type:
                  source.type,
                region:
                  source.region,
                ok: false,
                status: null,
                htmlLength: 0,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown fetch error",
              };
            }
          }
        )
      );

    /*
     * STEP 3
     * Santora
     */
    const {
      response:
        santoraResponse,
      html:
        santoraHtml,
    } =
      await fetchHtml(
        SANTORA_URL
      );

    if (
      !santoraResponse.ok
    ) {
      return NextResponse.json(
        {
          ok: false,
          stage:
            "fetch_santora",
          status:
            santoraResponse.status,
        },
        {
          status: 502,
        }
      );
    }

    const today =
      getTaipeiToday();

    const candidates =
      parseSantoraItems(
        santoraHtml,
        trackedIps,
        today
      );

    const matchedIps =
      Array.from(
        new Set(
          candidates.map(
            (item) =>
              item.ip
          )
        )
      );

    return NextResponse.json({
      ok: true,

      message:
        "OTAKU LAB structured Santora parser completed. No database writes were performed.",

      checkedAt:
        new Date().toISOString(),

      today,

      trackedIps: {
        count:
          trackedIps.length,
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

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

type ContextMatch = {
  matchedIp: string;
  matchedAlias: string;
  context: string;
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
      .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr|section|article)>/gi, "\n")
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

function findAliasPositions(text: string, alias: string) {
  const positions: number[] = [];

  const normalizedText = normalizeText(text);
  const normalizedAlias = normalizeText(alias);

  if (!normalizedAlias) {
    return positions;
  }

  if (isShortLatinAlias(normalizedAlias)) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])(${escapeRegExp(normalizedAlias)})(?=[^a-z0-9]|$)`,
      "gi"
    );

    let match;

    while ((match = pattern.exec(normalizedText)) !== null) {
      const prefixLength = match[1]?.length ?? 0;
      positions.push(match.index + prefixLength);

      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
    }

    return positions;
  }

  let startIndex = 0;

  while (true) {
    const index = normalizedText.indexOf(
      normalizedAlias,
      startIndex
    );

    if (index === -1) {
      break;
    }

    positions.push(index);
    startIndex = index + normalizedAlias.length;
  }

  return positions;
}

function createContext(
  text: string,
  position: number,
  aliasLength: number
) {
  const radius = 350;

  const start = Math.max(0, position - radius);
  const end = Math.min(
    text.length,
    position + aliasLength + radius
  );

  return text
    .slice(start, end)
    .replace(/\s+/g, " ")
    .trim();
}

function scanTrackedIps(
  text: string,
  trackedIps: TrackedIp[]
): ContextMatch[] {
  const normalizedFullText = normalizeText(text);

  const matches: ContextMatch[] = [];
  const unique = new Set<string>();

  for (const ip of trackedIps) {
    const aliases = Array.from(
      new Set([ip.name, ...(ip.aliases ?? [])])
    ).sort((a, b) => b.length - a.length);

    for (const alias of aliases) {
      const positions = findAliasPositions(
        normalizedFullText,
        alias
      );

      for (const position of positions.slice(0, 5)) {
        const context = createContext(
          normalizedFullText,
          position,
          normalizeText(alias).length
        );

        const key =
          `${ip.name}|${alias}|${context}`;

        if (unique.has(key)) {
          continue;
        }

        unique.add(key);

        matches.push({
          matchedIp: ip.name,
          matchedAlias: alias,
          context,
        });
      }
    }
  }

  return matches.slice(0, 100);
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
     * 讀取目前啟用中的監測 IP。
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

    const trackedIps =
      (trackedIpRows ?? []) as TrackedIp[];

    /*
     * STEP 2
     * 確認三個來源目前仍可連線。
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
     * 把 Santora HTML 轉成正文文字。
     *
     * 目前目的不是建立活動，
     * 而是觀察監測 IP 在正文附近的資料結構。
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
     * 掃描正文中所有 tracked_ips aliases。
     */
    const contextMatches =
      scanTrackedIps(
        santoraText,
        trackedIps
      );

    /*
     * STEP 5
     * 統計哪些 IP 有被 Santora 正文提到。
     */
    const matchedIpSummary = Array.from(
      new Set(
        contextMatches.map(
          (item) => item.matchedIp
        )
      )
    );

    return NextResponse.json({
      ok: true,

      message:
        "OTAKU LAB Santora body scan completed. No database writes were performed.",

      checkedAt: new Date().toISOString(),

      trackedIps: {
        count: trackedIps.length,
      },

      sourceChecks,

      santoraBodyScan: {
        textLength: santoraText.length,

        matchedIpCount:
          matchedIpSummary.length,

        matchedIps:
          matchedIpSummary,

        contextMatchCount:
          contextMatches.length,

        matches:
          contextMatches,
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

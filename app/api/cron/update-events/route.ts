import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY!;

const CRON_SECRET =
  process.env.CRON_SECRET!;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const SANTORA_URL =
  "https://santora.tw/information-of-live-concert/";

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

  fingerprint: string;
};

type SourcePayload = {
  source_type: string;
  source_name: string;
  source_url: string;
  source_title: string;
  raw_data: Record<string, unknown>;
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

const URL_REGION_RULES = [
  {
    region: "台灣",
    domains: [
      "ibon.com.tw",
      "ticket.ibon.com.tw",
      "tixcraft.com",
      "opentix.life",
      "kktix.com",
      "famiticket.com.tw",
    ],
  },
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

function aliasMatches(
  text: string,
  alias: string
) {
  const normalizedText =
    normalizeText(text);

  const normalizedAlias =
    normalizeText(alias);

  if (!normalizedAlias) {
    return false;
  }

  if (
    isShortLatinAlias(
      normalizedAlias
    )
  ) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(
        normalizedAlias
      )}([^a-z0-9]|$)`,
      "i"
    );

    return pattern.test(
      normalizedText
    );
  }

  return normalizedText.includes(
    normalizedAlias
  );
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
      new Set([
        ip.name,
        ...(ip.aliases ?? []),
      ])
    ).sort(
      (a, b) =>
        b.length - a.length
    );

    for (const alias of aliases) {
      if (
        aliasMatches(
          text,
          alias
        )
      ) {
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
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value ?? "";

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value ?? "";

  return `${year}-${month}-${day}`;
}

function normalizeDate(
  year: string,
  month: string,
  day: string
) {
  return `${year}-${month.padStart(
    2,
    "0"
  )}-${day.padStart(2, "0")}`;
}

function parseDateAtStart(
  text: string
) {
  const match = text.match(
    /^\s*(20\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})(?:\s*[-~～]\s*(\d{1,2}))?/
  );

  if (!match) {
    return null;
  }

  const year = match[1];
  const month = match[2];
  const startDay = match[3];
  const endDay =
    match[4] ?? null;

  return {
    raw: match[0],

    eventDate:
      normalizeDate(
        year,
        month,
        startDay
      ),

    endDate: endDay
      ? normalizeDate(
          year,
          month,
          endDay
        )
      : null,
  };
}

function detectCityAndRegionFromText(
  text: string
) {
  for (const rule of CITY_RULES) {
    if (
      rule.keywords.some(
        (keyword) =>
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

function detectRegionFromUrl(
  url: string | null
) {
  if (!url) {
    return null;
  }

  try {
    const hostname =
      new URL(url)
        .hostname
        .toLowerCase();

    for (
      const rule
      of URL_REGION_RULES
    ) {
      if (
        rule.domains.some(
          (domain) =>
            hostname === domain ||
            hostname.endsWith(
              `.${domain}`
            )
        )
      ) {
        return rule.region;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function resolveLocation(
  text: string,
  directSourceUrl:
    string | null,
  sectionRegion:
    string | null
) {
  const fromText =
    detectCityAndRegionFromText(
      text
    );

  if (
    fromText.city ||
    fromText.region
  ) {
    return fromText;
  }

  const fromUrl =
    detectRegionFromUrl(
      directSourceUrl
    );

  if (fromUrl) {
    return {
      region: fromUrl,
      city: null,
    };
  }

  return {
    region: sectionRegion,
    city: null,
  };
}

function extractSessionHint(
  text: string
) {
  const parentheses =
    text.match(
      /[（(]([^（）()]{1,50})[）)]/g
    ) ?? [];

  for (
    const item
    of parentheses
  ) {
    const inner = item
      .replace(
        /^[（(]/,
        ""
      )
      .replace(
        /[）)]$/,
        ""
      )
      .trim();

    const containsPlace =
      CITY_RULES.some(
        (rule) =>
          rule.keywords.some(
            (keyword) =>
              inner.includes(
                keyword
              )
          )
      );

    if (containsPlace) {
      return inner;
    }
  }

  const dayMatch =
    text.match(
      /\bDAY\s*\d+\b/i
    );

  if (dayMatch) {
    return dayMatch[0]
      .toUpperCase();
  }

  return null;
}

function extractLinks(
  html: string
) {
  const links: {
    label: string;
    url: string;
  }[] = [];

  const regex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match =
      regex.exec(html)) !==
    null
  ) {
    const href = match[1];

    const label =
      stripTags(
        match[2]
      );

    if (
      !href ||
      !label
    ) {
      continue;
    }

    try {
      const url =
        new URL(
          href,
          SANTORA_URL
        ).toString();

      links.push({
        label,
        url,
      });
    } catch {
      // invalid URL
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
  const external =
    links.filter(
      (link) =>
        !link.url.startsWith(
          "https://santora.tw/"
        )
    );

  if (
    external.length === 0
  ) {
    return null;
  }

  const score = (
    label: string
  ) => {
    if (
      /官網|官方|公式/i.test(
        label
      )
    ) {
      return 100;
    }

    if (
      /網頁公告|公告/i.test(
        label
      )
    ) {
      return 80;
    }

    if (
      /售票|購票|抽選|登記/i.test(
        label
      )
    ) {
      return 60;
    }

    return 20;
  };

  return external
    .slice()
    .sort(
      (a, b) =>
        score(b.label) -
        score(a.label)
    )[0];
}

function cleanTitle(
  text: string,
  rawDate: string
) {
  return text
    .replace(
      rawDate,
      ""
    )
    .replace(
      /[（(]\s*(?:官網|官方|公式|售票網|購票|網頁公告|公告|登記抽選|抽選)\s*[）)]/gi,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function createCanonicalTitle(
  title: string
) {
  return normalizeText(
    title
  )
    .replace(
      /[（(][^（）()]*(?:東京|大阪|兵庫|神戶|神戸|福岡|橫濱|横浜|札幌|北海道|名古屋|愛知|京都|廣島|広島|仙台|宮城|鳥取|台北|臺北|台中|臺中|台南|臺南|高雄)[^（）()]*[）)]/g,
      " "
    )
    .replace(
      /\bday\s*\d+\b/gi,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function createFingerprint(
  ip: string,
  canonicalTitle: string,
  eventDate: string,
  city: string | null
) {
  const normalizedTitle =
    canonicalTitle
      .replace(
        /[^\p{L}\p{N}]+/gu,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return [
    normalizeText(ip),
    normalizedTitle,
    eventDate,
    city
      ? normalizeText(city)
      : "unknown",
  ].join("|");
}

function sourceTypeFromLabel(
  label: string | null
) {
  if (!label) {
    return "external";
  }

  if (
    /官網|官方|公式/i.test(
      label
    )
  ) {
    return "official";
  }

  if (
    /售票|購票/i.test(
      label
    )
  ) {
    return "ticket";
  }

  if (
    /公告/i.test(
      label
    )
  ) {
    return "announcement";
  }

  return "external";
}

async function fetchHtml(
  url: string
) {
  const response =
    await fetch(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; OtakuLabEventBot/1.0)",

          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },

        cache:
          "no-store",
      }
    );

  const html =
    await response.text();

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
  const tokenRegex =
    /<(h4|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  let currentRegion:
    string | null =
    null;

  type TempItem = {
    ip: string;
    matchedAlias: string;

    title: string;
    canonicalTitle: string;

    eventDate: string;
    endDate: string | null;

    region: string | null;
    city: string | null;

    sessionHint:
      string | null;

    directSourceLabel:
      string | null;

    directSourceUrl:
      string | null;
  };

  const allMatchedItems:
    TempItem[] = [];

  let tokenMatch;

  while (
    (tokenMatch =
      tokenRegex.exec(html)) !==
    null
  ) {
    const tag =
      tokenMatch[1]
        .toLowerCase();

    const innerHtml =
      tokenMatch[2];

    if (tag === "h4") {
      const heading =
        stripTags(
          innerHtml
        );

      if (
        heading.includes(
          "台灣"
        )
      ) {
        currentRegion =
          "台灣";
      } else if (
        heading.includes(
          "日本"
        )
      ) {
        currentRegion =
          "日本";
      } else if (
        heading.includes(
          "轉播"
        ) ||
        heading.includes(
          "其他"
        )
      ) {
        currentRegion =
          null;
      }

      continue;
    }

    if (
      tag !== "li" ||
      !currentRegion
    ) {
      continue;
    }

    const fullText =
      stripTags(
        innerHtml
      );

    const dateInfo =
      parseDateAtStart(
        fullText
      );

    if (!dateInfo) {
      continue;
    }

    const effectiveEnd =
      dateInfo.endDate ??
      dateInfo.eventDate;

    if (
      effectiveEnd <
      today
    ) {
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

    const title =
      cleanTitle(
        fullText,
        dateInfo.raw
      );

    if (
      title.length <
      5
    ) {
      continue;
    }

    const canonicalTitle =
      createCanonicalTitle(
        title
      );

    const links =
      extractLinks(
        innerHtml
      );

    const bestSource =
      chooseBestDirectSource(
        links
      );

    const location =
      resolveLocation(
        title,
        bestSource?.url ??
          null,
        currentRegion
      );

    const sessionHint =
      extractSessionHint(
        title
      );

    allMatchedItems.push({
      ip:
        ipMatch.ip,

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
        bestSource?.label ??
        null,

      directSourceUrl:
        bestSource?.url ??
        null,
    });
  }

  const inheritedSources =
    new Map<
      string,
      {
        label:
          string | null;
        url:
          string;
      }
    >();

  for (
    const item
    of allMatchedItems
  ) {
    if (
      !item.directSourceUrl
    ) {
      continue;
    }

    const key =
      `${item.ip}|${item.canonicalTitle}`;

    if (
      !inheritedSources.has(
        key
      )
    ) {
      inheritedSources.set(
        key,
        {
          label:
            item.directSourceLabel,

          url:
            item.directSourceUrl,
        }
      );
    }
  }

  const result:
    ParsedSantoraItem[] =
    [];

  const unique =
    new Set<string>();

  for (
    const item
    of allMatchedItems
  ) {
    const inheritKey =
      `${item.ip}|${item.canonicalTitle}`;

    const inherited =
      inheritedSources.get(
        inheritKey
      );

    const primarySourceUrl =
      item.directSourceUrl ??
      inherited?.url ??
      SANTORA_URL;

    const primarySourceType =
      item.directSourceUrl
        ? sourceTypeFromLabel(
            item.directSourceLabel
          )
        : inherited
          ? sourceTypeFromLabel(
              inherited.label
            )
          : "website";

    let finalRegion =
      item.region;

    const finalCity =
      item.city;

    if (!finalCity) {
      const regionFromPrimary =
        detectRegionFromUrl(
          primarySourceUrl
        );

      if (
        regionFromPrimary
      ) {
        finalRegion =
          regionFromPrimary;
      }
    }

    const fingerprint =
      createFingerprint(
        item.ip,
        item.canonicalTitle,
        item.eventDate,
        finalCity
      );

    if (
      unique.has(
        fingerprint
      )
    ) {
      continue;
    }

    unique.add(
      fingerprint
    );

    result.push({
      ip:
        item.ip,

      matchedAlias:
        item.matchedAlias,

      title:
        item.title,

      canonicalTitle:
        item.canonicalTitle,

      eventDate:
        item.eventDate,

      endDate:
        item.endDate,

      region:
        finalRegion,

      city:
        finalCity,

      sessionHint:
        item.sessionHint,

      directSourceLabel:
        item.directSourceLabel,

      directSourceUrl:
        item.directSourceUrl,

      primarySourceUrl,
      primarySourceType,

      santoraUrl:
        SANTORA_URL,

      fingerprint,
    });
  }

  return result;
}

async function ensureEventSource(
  eventId: number,
  source: SourcePayload
) {
  const {
    data: existing,
    error: lookupError,
  } = await supabase
    .from(
      "event_sources"
    )
    .select("id")
    .eq(
      "event_id",
      eventId
    )
    .eq(
      "source_url",
      source.source_url
    )
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `event_sources lookup failed: ${lookupError.message}`
    );
  }

  if (existing) {
    return {
      inserted: false,
    };
  }

  const {
    error: insertError,
  } = await supabase
    .from(
      "event_sources"
    )
    .insert({
      event_id:
        eventId,

      source_type:
        source.source_type,

      source_name:
        source.source_name,

      source_account:
        null,

      source_url:
        source.source_url,

      source_title:
        source.source_title,

      published_at:
        null,

      raw_data:
        source.raw_data,
    });

  if (insertError) {
    throw new Error(
      `event_sources insert failed: ${insertError.message}`
    );
  }

  return {
    inserted: true,
  };
}

export async function GET(
  request: Request
) {
  try {
    /*
     * 1. Security
     */
    if (
      !CRON_SECRET ||
      !SUPABASE_SECRET_KEY
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing server environment variables.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      authorization !==
      `Bearer ${CRON_SECRET}`
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 2. Load tracked IPs
     */
    const {
      data:
        trackedIpRows,

      error:
        trackedIpError,
    } = await supabase
      .from(
        "tracked_ips"
      )
      .select(`
        id,
        name,
        aliases,
        enabled,
        sort_order
      `)
      .eq(
        "enabled",
        true
      )
      .order(
        "sort_order",
        {
          ascending:
            true,
        }
      );

    if (
      trackedIpError
    ) {
      throw new Error(
        `tracked_ips: ${trackedIpError.message}`
      );
    }

    const trackedIps =
      (trackedIpRows ??
        []) as TrackedIp[];

    /*
     * 3. Fetch Santora
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

    /*
     * 4. Parse
     */
    const today =
      getTaipeiToday();

    const candidates =
      parseSantoraItems(
        santoraHtml,
        trackedIps,
        today
      );

    /*
     * 5. Insert pending events
     */
    let insertedEvents = 0;
    let existingEvents = 0;
    let insertedSources = 0;

    const errors: {
      fingerprint: string;
      title: string;
      error: string;
    }[] = [];

    const results: {
      eventId:
        number | null;

      title:
        string;

      ip:
        string;

      eventDate:
        string;

      status:
        "inserted" |
        "existing" |
        "error";
    }[] = [];

    for (
      const candidate
      of candidates
    ) {
      try {
        let eventId:
          number | null =
          null;

        /*
         * fingerprint duplicate check
         */
        const {
          data:
            existingEvent,

          error:
            existingError,
        } = await supabase
          .from(
            "events"
          )
          .select(
            "id"
          )
          .eq(
            "fingerprint",
            candidate.fingerprint
          )
          .maybeSingle();

        if (
          existingError
        ) {
          throw new Error(
            `event lookup: ${existingError.message}`
          );
        }

        if (
          existingEvent
        ) {
          eventId =
            existingEvent.id;

          existingEvents++;

          results.push({
            eventId,

            title:
              candidate.title,

            ip:
              candidate.ip,

            eventDate:
              candidate.eventDate,

            status:
              "existing",
          });
        } else {
          const {
            data:
              insertedEvent,

            error:
              insertEventError,
          } = await supabase
            .from(
              "events"
            )
            .insert({
              title:
                candidate.title,

              canonical_title:
                candidate.canonicalTitle,

              ip:
                candidate.ip,

              category:
                "CONCERT",

              region:
                candidate.region,

              city:
                candidate.city,

              venue:
                null,

              event_date:
                candidate.eventDate,

              end_date:
                candidate.endDate,

              fingerprint:
                candidate.fingerprint,

              status:
                "pending",

              featured:
                false,

              primary_source_url:
                candidate.primarySourceUrl,

              primary_source_type:
                candidate.primarySourceType,

              auto_detected:
                true,

              reviewed_at:
                null,

              description:
                candidate.sessionHint
                  ? `場次：${candidate.sessionHint}`
                  : null,
            })
            .select(
              "id"
            )
            .single();

          if (
            insertEventError
          ) {
            throw new Error(
              `event insert: ${insertEventError.message}`
            );
          }

          eventId =
            insertedEvent.id;

          insertedEvents++;

          results.push({
            eventId,

            title:
              candidate.title,

            ip:
              candidate.ip,

            eventDate:
              candidate.eventDate,

            status:
              "inserted",
          });
        }

        if (!eventId) {
          throw new Error(
            "No event ID returned."
          );
        }

        /*
         * 6. Santora source
         */
        const santoraResult =
          await ensureEventSource(
            eventId,
            {
              source_type:
                "website",

              source_name:
                "Santora",

              source_url:
                SANTORA_URL,

              source_title:
                candidate.title,

              raw_data: {
                parser:
                  "santora-v1",

                ip:
                  candidate.ip,

                matchedAlias:
                  candidate.matchedAlias,

                eventDate:
                  candidate.eventDate,

                endDate:
                  candidate.endDate,

                region:
                  candidate.region,

                city:
                  candidate.city,

                sessionHint:
                  candidate.sessionHint,

                fingerprint:
                  candidate.fingerprint,
              },
            }
          );

        if (
          santoraResult.inserted
        ) {
          insertedSources++;
        }

        /*
         * 7. Official / ticket / external source
         *
         * 如果 primary URL 不是 Santora，
         * 就另外掛進 event_sources。
         */
        if (
          candidate.primarySourceUrl !==
          SANTORA_URL
        ) {
          const externalResult =
            await ensureEventSource(
              eventId,
              {
                source_type:
                  candidate.primarySourceType,

                source_name:
                  candidate.directSourceLabel ??
                  "外部活動來源",

                source_url:
                  candidate.primarySourceUrl,

                source_title:
                  candidate.title,

                raw_data: {
                  inherited:
                    !candidate.directSourceUrl,

                  directSourceLabel:
                    candidate.directSourceLabel,

                  directSourceUrl:
                    candidate.directSourceUrl,

                  source:
                    "Santora parser",
                },
              }
            );

          if (
            externalResult.inserted
          ) {
            insertedSources++;
          }
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        errors.push({
          fingerprint:
            candidate.fingerprint,

          title:
            candidate.title,

          error:
            message,
        });

        results.push({
          eventId:
            null,

          title:
            candidate.title,

          ip:
            candidate.ip,

          eventDate:
            candidate.eventDate,

          status:
            "error",
        });
      }
    }

    /*
     * 8. Report
     */
    return NextResponse.json({
      ok:
        errors.length === 0,

      message:
        "OTAKU LAB event ingestion completed.",

      checkedAt:
        new Date().toISOString(),

      today,

      source:
        "Santora",

      parsedCandidates:
        candidates.length,

      insertedEvents,

      existingEvents,

      insertedSources,

      errorCount:
        errors.length,

      errors,

      results,
    });
  } catch (error) {
    console.error(
      "update-events fatal error:",
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

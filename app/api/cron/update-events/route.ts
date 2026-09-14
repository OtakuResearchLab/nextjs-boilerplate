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

export async function GET() {
  try {
    const results = await Promise.all(
      SOURCES.map(async (source) => {
        try {
          const response = await fetch(source.url, {
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
            name: source.name,
            type: source.type,
            region: source.region,
            url: source.url,
            ok: response.ok,
            status: response.status,
            htmlLength: html.length,
          };
        } catch (error) {
          return {
            name: source.name,
            type: source.type,
            region: source.region,
            url: source.url,
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

    return NextResponse.json({
      ok: true,
      message: "OTAKU LAB event source check completed.",
      checkedAt: new Date().toISOString(),
      sources: results,
    });
  } catch (error) {
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

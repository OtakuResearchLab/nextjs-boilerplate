import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import SiteHeader from "../SiteHeader";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type EventSource = {
  id: number;
  source_name: string | null;
  source_url: string;
};

type EventItem = {
  id: number;
  title: string;
  ip: string | null;
  category: string | null;
  region: string | null;
  city: string | null;
  venue: string | null;
  event_date: string | null;
  end_date: string | null;
  description: string | null;
  primary_source_url: string | null;
  event_sources: EventSource[] | null;
};

export default async function EventsPage() {
  const today = new Date().toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      ip,
      category,
      region,
      city,
      venue,
      event_date,
      end_date,
      description,
      primary_source_url,
      event_sources (
        id,
        source_name,
        source_url
      )
    `)
    .eq("status", "published")
    .or(`end_date.gte.${today},and(end_date.is.null,event_date.gte.${today})`)
    .order("event_date", { ascending: true });

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f5f1] text-[#263746]">
      <SiteHeader />

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 md:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
              EVENTS
            </p>

            <h1 className="mt-1 text-3xl font-black">
              活動資訊
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f818d]">
              整理近期 ACG 活動、音樂會、快閃、聯名與海外相關活動資訊。
            </p>
          </div>

          <Link
            href="/"
            className="text-sm font-bold text-[#52799a] hover:underline"
          >
            ← 返回首頁
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <p className="font-bold text-red-700">
              活動資料讀取失敗
            </p>

            <p className="mt-2 text-sm text-red-600">
              {error.message}
            </p>
          </div>
        )}

        {!error && (!events || events.length === 0) && (
          <div className="rounded-[24px] border border-[#dedbd5] bg-white p-10 text-center">
            <p className="text-lg font-black">
              目前沒有即將舉行的活動
            </p>

            <p className="mt-2 text-sm text-[#8797a2]">
              新活動整理後會顯示在這裡。
            </p>
          </div>
        )}

        {!error && events && events.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {(events as EventItem[]).map((event) => {
              const sourceUrl =
                event.primary_source_url ||
                event.event_sources?.[0]?.source_url ||
                null;

              const location = [event.region, event.city]
                .filter(Boolean)
                .join(" / ");

              const card = (
                <article className="h-full rounded-[22px] border border-[#dedbd5] bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {event.ip && (
                      <span className="rounded-full bg-[#edf2f5] px-3 py-1 text-[11px] font-bold text-[#60798c]">
                        {event.ip}
                      </span>
                    )}

                    {event.category && (
                      <span className="rounded-full bg-[#edf2f5] px-3 py-1 text-[11px] font-bold text-[#60798c]">
                        {event.category}
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-black leading-7">
                    {event.title}
                  </h2>

                  <div className="mt-4 space-y-1.5 text-sm text-[#6f818d]">
                    {event.event_date && (
                      <p>
                        日期：
                        {event.event_date}
                        {event.end_date &&
                          event.end_date !== event.event_date &&
                          ` ～ ${event.end_date}`}
                      </p>
                    )}

                    {location && <p>地區：{location}</p>}

                    {event.venue && <p>場地：{event.venue}</p>}
                  </div>

                  {event.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#7b8992]">
                      {event.description}
                    </p>
                  )}

                  {sourceUrl && (
                    <p className="mt-5 text-sm font-bold text-[#52799a]">
                      查看活動來源 →
                    </p>
                  )}
                </article>
              );

              return sourceUrl ? (
                <a
                  key={event.id}
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {card}
                </a>
              ) : (
                <div key={event.id}>
                  {card}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="mt-auto bg-[#263746] px-5 py-3 text-center text-[11px] tracking-wider text-[#aebac3]">
        © 2026 OTAKU LAB · 宅研所
      </footer>
    </main>
  );
}

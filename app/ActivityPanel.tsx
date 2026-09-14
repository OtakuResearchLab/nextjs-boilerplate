import { createClient } from "@supabase/supabase-js";

export default async function ActivityPanel() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

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
      event_date,
      end_date,
      primary_source_url,
      event_sources (
        source_url
      )
    `)
    .eq("status", "published")
    .or(`end_date.gte.${today},and(end_date.is.null,event_date.gte.${today})`)
    .order("event_date", { ascending: true })
    .limit(4);

  if (error) {
    console.error("ActivityPanel error:", error.message);
  }

  return (
    <section className="rounded-[22px] border border-[#dedbd5] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.22em] text-[#7890a3]">
            EVENTS
          </p>
          <h2 className="mt-1 text-lg font-black text-[#263746]">
            相關活動資訊
          </h2>
        </div>

        <span className="text-xs font-bold text-[#7890a3]">
          MORE →
        </span>
      </div>

      {!error && events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => {
            const sourceUrl =
              event.primary_source_url ||
              event.event_sources?.[0]?.source_url ||
              null;

            const location = [event.region, event.city]
              .filter(Boolean)
              .join(" / ");

            const content = (
              <>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {event.ip && (
                    <span className="rounded-full bg-[#edf1f3] px-2.5 py-1 text-[10px] font-bold text-[#60798c]">
                      {event.ip}
                    </span>
                  )}

                  {event.category && (
                    <span className="rounded-full bg-[#edf1f3] px-2.5 py-1 text-[10px] font-bold text-[#60798c]">
                      {event.category}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-black leading-6 text-[#263746]">
                  {event.title}
                </h3>

                <div className="mt-2 space-y-1 text-xs text-[#7890a3]">
                  {event.event_date && (
                    <p>
                      {event.event_date}
                      {event.end_date &&
                        event.end_date !== event.event_date &&
                        ` ～ ${event.end_date}`}
                    </p>
                  )}

                  {location && <p>{location}</p>}
                </div>
              </>
            );

            return sourceUrl ? (
              <a
                key={event.id}
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-[#e4e1dc] p-4 transition hover:border-[#aebdc7] hover:bg-[#f8fafb]"
              >
                {content}
              </a>
            ) : (
              <div
                key={event.id}
                className="rounded-xl border border-[#e4e1dc] p-4"
              >
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-[#f7f5f1] p-4">
          <p className="text-sm font-bold text-[#60798c]">
            目前沒有即將舉行的活動
          </p>
        </div>
      )}
    </section>
  );
}

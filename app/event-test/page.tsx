import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function EventTestPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

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
      status,
      event_sources (
        id,
        source_name,
        source_url
      )
    `)
    .order("event_date", { ascending: true });

  return (
    <main className="min-h-screen bg-[#f7f5f1] p-8 text-[#263746]">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-black">
          活動系統測試
        </h1>

        <p className="mb-8 text-sm text-[#6f818d]">
          此頁面用來測試 Supabase Events RLS。
        </p>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-5">
            <p className="font-bold">Supabase 讀取錯誤</p>
            <p className="mt-2 text-sm">{error.message}</p>
          </div>
        )}

        {!error && (!events || events.length === 0) && (
          <div className="rounded-2xl border border-[#dedbd5] bg-white p-8">
            <p className="text-xl font-bold">
              目前沒有可公開讀取的活動
            </p>

            <p className="mt-3 text-sm text-[#6f818d]">
              如果測試活動目前是 pending，看到這個結果就是正確的。
            </p>
          </div>
        )}

        {!error &&
          events?.map((event) => (
            <article
              key={event.id}
              className="mb-5 rounded-2xl border border-[#dedbd5] bg-white p-6"
            >
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                {event.ip && (
                  <span className="rounded-full bg-[#e9eef1] px-3 py-1">
                    {event.ip}
                  </span>
                )}

                {event.category && (
                  <span className="rounded-full bg-[#e9eef1] px-3 py-1">
                    {event.category}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black">{event.title}</h2>

              <div className="mt-4 space-y-1 text-sm text-[#6f818d]">
                <p>日期：{event.event_date ?? "未設定"}</p>
                <p>
                  地區：
                  {[event.region, event.city]
                    .filter(Boolean)
                    .join(" / ") || "未設定"}
                </p>
                <p>場地：{event.venue ?? "未設定"}</p>
              </div>

              {event.event_sources?.length > 0 && (
                <div className="mt-5 border-t border-[#dedbd5] pt-4">
                  <p className="mb-2 text-sm font-bold">情報來源</p>

                  {event.event_sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-[#5f8ba8] underline"
                    >
                      {source.source_name ?? "來源連結"}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
      </div>
    </main>
  );
}

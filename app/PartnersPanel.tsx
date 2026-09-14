import { createClient } from "@supabase/supabase-js";

export default async function PartnersPanel() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: partners, error } = await supabase
    .from("partners")
    .select(`
      id,
      name,
      description,
      facebook_url,
      instagram_url,
      x_url,
      website_url,
      avatar_url,
      featured,
      sort_order
    `)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .limit(4);

  if (error) {
    console.error("PartnersPanel error:", error.message);
  }

  return (
    <section className="rounded-[22px] border border-[#dedbd5] bg-white p-5">
      <div className="mb-4">
        <p className="text-[10px] font-bold tracking-[0.22em] text-[#7890a3]">
          PARTNERS
        </p>

        <h2 className="mt-1 text-lg font-black text-[#263746]">
          合作繪師
        </h2>
      </div>

      {!error && partners && partners.length > 0 ? (
        <div className="space-y-3">
          {partners.map((partner) => {
            const primaryUrl =
              partner.facebook_url ||
              partner.instagram_url ||
              partner.x_url ||
              partner.website_url ||
              null;

            const content = (
              <div className="flex items-center gap-3">
                {/* Partner Avatar */}
                {partner.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={`${partner.name} 頭像`}
                    className="h-11 w-11 shrink-0 rounded-full border border-[#dedbd5] object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf1f3] text-sm font-black text-[#7890a3]">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Partner Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#263746]">
                    {partner.name}
                  </p>

                  {partner.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7890a3]">
                      {partner.description}
                    </p>
                  )}
                </div>

                {/* Link */}
                {primaryUrl && (
                  <span className="shrink-0 text-xs font-bold text-[#7890a3]">
                    前往 →
                  </span>
                )}
              </div>
            );

            return primaryUrl ? (
              <a
                key={partner.id}
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-[#e4e1dc] p-3 transition hover:border-[#aebdc7] hover:bg-[#f8fafb]"
              >
                {content}
              </a>
            ) : (
              <div
                key={partner.id}
                className="rounded-xl border border-[#e4e1dc] p-3"
              >
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-[#f7f5f1] p-4">
          <p className="text-sm font-bold text-[#60798c]">
            合作繪師資訊準備中
          </p>
        </div>
      )}
    </section>
  );
}

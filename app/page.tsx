import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default async function Home() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 p-10 text-white">
        <h1 className="text-2xl font-bold">宅研所</h1>
        <p className="mt-6 text-red-400">
          商品讀取失敗：{error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">宅研所</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Otaku Research Lab
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-xl font-semibold">商品一覽</h2>

        {!products || products.length === 0 ? (
          <p className="text-zinc-400">目前沒有上架商品。</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
              >
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name ?? "商品圖片"}
                    className="h-72 w-full object-cover"
                  />
                )}

                <div className="p-5">
                  <h3 className="text-lg font-bold">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="mt-2 text-sm text-zinc-400">
                      {product.description}
                    </p>
                  )}

                  {product.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {product.myship_url && (
                    <a
                      href={product.myship_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 block rounded-xl bg-white px-4 py-3 text-center font-semibold text-black"
                    >
                      前往購買
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Product = {
  id: number;
  name: string | null;
  ip: string | null;
  category: string | null;
  price: number | null;
  status: string | null;
  source_type: string | null;
  region: string | null;
  tags: string[] | null;
  description: string | null;
  images: string[] | null;
  myship_url: string | null;
  featured: boolean | null;
  published: boolean | null;
};

function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-[20px] border border-[#dedbd5] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#60798c]/10">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e9edf0]">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name ?? "商品圖片"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#9aa9b3]">
              No Image
            </div>
          )}

          {product.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-[#d68674] px-3 py-1 text-[11px] font-bold text-white">
              PICK
            </span>
          )}
        </div>
      </Link>

      <div className={compact ? "p-3" : "p-4"}>
        <div className="mb-2 flex flex-wrap gap-1.5 text-[10px]">
          {product.ip && (
            <span className="rounded-full bg-[#edf2f5] px-2.5 py-1 text-[#60798c]">
              {product.ip}
            </span>
          )}

          {product.status && (
            <span
              className={`rounded-full px-2.5 py-1 ${
                product.status === "現貨"
                  ? "bg-[#e8f3ec] text-[#568066]"
                  : product.status === "預購"
                    ? "bg-[#fff0df] text-[#b4763e]"
                    : "bg-[#eeeeee] text-[#888888]"
              }`}
            >
              {product.status}
            </span>
          )}
        </div>

        <Link href={`/products/${product.id}`}>
          <h3
            className={`line-clamp-2 font-bold transition hover:text-[#52799a] ${
              compact
                ? "min-h-[42px] text-sm leading-5"
                : "min-h-[48px] leading-6"
            }`}
          >
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="mt-1 text-xs text-[#8b989f]">
            {product.category}
          </p>
        )}

        <p
          className={`font-black text-[#52799a] ${
            compact ? "mt-3 text-lg" : "mt-4 text-xl"
          }`}
        >
          NT$ {Number(product.price ?? 0).toLocaleString("zh-TW")}
        </p>
      </div>
    </article>
  );
}

export default async function Home() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("id", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f5f1] p-8 text-[#263746]">
        <h1 className="text-2xl font-bold">宅研所</h1>
        <p className="mt-4 text-red-500">
          商品讀取失敗：{error.message}
        </p>
      </main>
    );
  }

  const allProducts = (products ?? []) as Product[];

  const latestProducts = allProducts.slice(0, 5);

  const featuredProducts = allProducts
    .filter((product) => product.featured)
    .slice(0, 8);

  const ipList = Array.from(
    new Set(
      allProducts
        .map((product) => product.ip)
        .filter((value): value is string => Boolean(value))
    )
  );

  const categoryList = Array.from(
    new Set(
      allProducts
        .map((product) => product.category)
        .filter((value): value is string => Boolean(value))
    )
  );

  const typeList = Array.from(
    new Set(
      allProducts
        .map((product) => product.source_type)
        .filter((value): value is string => Boolean(value))
    )
  );

  const regionList = Array.from(
    new Set(
      allProducts
        .map((product) => product.region)
        .filter((value): value is string => Boolean(value))
    )
  );

  return (
    <main className="min-h-screen bg-[#f7f5f1] text-[#263746]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#dedbd5] bg-[#f7f5f1]/95 backdrop-blur">
        <div className="flex w-full items-center gap-5 px-5 py-4 md:px-8 xl:px-10 2xl:px-12">
          {/* Menu */}
          <button
            type="button"
            aria-label="開啟選單"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-[#60798c] transition hover:bg-[#ebeef0]"
          >
            ☰
          </button>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <h1 className="text-[28px] font-black leading-none tracking-wider md:text-[32px]">
              宅研所
            </h1>
            <p className="mt-1 text-[11px] tracking-[0.3em] text-[#7890a3]">
              OTAKU LAB
            </p>
          </Link>

          {/* Brand sentence */}
          <div className="hidden border-l border-[#d8d8d5] pl-5 lg:block">
            <p className="text-sm font-medium text-[#6f818d]">
              研究你的熱愛，整理值得收藏的 ACG 周邊。
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Products */}
            <Link
              href="/products"
              className="hidden shrink-0 rounded-full bg-[#344b5e] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#263746] md:block"
            >
              商品一覽
            </Link>

            {/* Search */}
            <div className="flex w-[260px] items-center rounded-full border border-[#ccd4da] bg-white px-5 py-2.5 md:w-[340px] xl:w-[440px]">
              <span className="mr-3 text-[#9aa9b3]">⌕</span>
              <span className="truncate text-sm text-[#9aa9b3]">
                搜尋商品、作品或關鍵字
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <section className="w-full px-5 py-7 md:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_250px]">
          {/* LEFT */}
          <aside className="space-y-6">
            {/* Filters */}
            <div className="rounded-[22px] border border-[#dedbd5] bg-white p-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                FILTER
              </p>

              <h2 className="mt-1 text-xl font-black">
                商品篩選
              </h2>

              {/* Category select */}
              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold text-[#7890a3]">
                  商品種類
                </label>

                <div className="relative">
                  <select
                    defaultValue=""
                    className="w-full appearance-none rounded-xl border border-[#d7dfe4] bg-[#f7f8f8] px-4 py-3 pr-10 text-sm font-medium text-[#526b7d] outline-none"
                  >
                    <option value="">全部</option>

                    {categoryList.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#7890a3]">
                    ▼
                  </span>
                </div>
              </div>

              {/* Type select */}
              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold text-[#7890a3]">
                  商品類型
                </label>

                <div className="relative">
                  <select
                    defaultValue=""
                    className="w-full appearance-none rounded-xl border border-[#d7dfe4] bg-[#f7f8f8] px-4 py-3 pr-10 text-sm font-medium text-[#526b7d] outline-none"
                  >
                    <option value="">全部</option>

                    {typeList.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#7890a3]">
                    ▼
                  </span>
                </div>
              </div>

              {/* Region */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold text-[#7890a3]">
                  來源產地
                </p>

                <div className="flex flex-wrap gap-2">
                  {regionList.map((region) => (
                    <Link
                      key={region}
                      href={`/products?region=${encodeURIComponent(
                        region
                      )}#products`}
                      className="rounded-full bg-[#f1f3f4] px-3 py-2 text-xs text-[#61727e] transition hover:bg-[#60798c] hover:text-white"
                    >
                      {region}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/products"
                className="mt-6 block rounded-xl border border-[#ccd4da] px-4 py-3 text-center text-sm font-bold text-[#526b7d] transition hover:bg-[#eef3f6]"
              >
                查看完整篩選
              </Link>
            </div>

            {/* IP */}
            <div className="rounded-[22px] border border-[#dedbd5] bg-white p-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                IP / SERIES
              </p>

              <h2 className="mt-1 text-xl font-black">
                作品選單
              </h2>

              <div className="mt-4 space-y-1">
                <Link
                  href="/products"
                  className="block rounded-xl bg-[#344b5e] px-3 py-2.5 text-sm font-bold text-white"
                >
                  全部商品
                </Link>

                {ipList.map((ip) => (
                  <Link
                    key={ip}
                    href={`/products?ip=${encodeURIComponent(ip)}#products`}
                    className="block rounded-xl px-3 py-2.5 text-sm text-[#526b7d] transition hover:bg-[#eef3f6] hover:text-[#344b5e]"
                  >
                    {ip}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER */}
          <div className="min-w-0 space-y-8">
            {/* Latest */}
            <section className="rounded-[24px] border border-[#dedbd5] bg-white p-5 md:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                    NEW ARRIVALS
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    新品上架
                  </h2>
                </div>

                <Link
                  href="/products"
                  className="text-sm font-semibold text-[#52799a] hover:underline"
                >
                  查看全部 →
                </Link>
              </div>

              {latestProducts.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-[#f7f5f1] p-8 text-center text-sm text-[#8797a2]">
                  目前尚無商品。
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-5">
                  {latestProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      compact
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Popular */}
            <section className="rounded-[24px] border border-[#dedbd5] bg-white p-5 md:p-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                  POPULAR
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  熱門商品
                </h2>
              </div>

              {featuredProducts.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-[#f7f5f1] p-8 text-center text-sm text-[#8797a2]">
                  熱門商品準備中。
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">
            {/* Otaku Lab */}
            <div className="rounded-[22px] border border-[#dedbd5] bg-white p-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                OTAKU LAB
              </p>

              <h2 className="mt-1 text-xl font-black">
                宅研所
              </h2>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl bg-[#f1f3f4] px-4 py-3 text-sm text-[#61727e]">
                  宅研所 FB
                  <span className="ml-2 text-xs text-[#9aa9b3]">
                    待設定
                  </span>
                </div>

                <div className="rounded-xl bg-[#f1f3f4] px-4 py-3 text-sm text-[#61727e]">
                  宅研所社團
                  <span className="ml-2 text-xs text-[#9aa9b3]">
                    待設定
                  </span>
                </div>

                <div className="rounded-xl bg-[#f1f3f4] px-4 py-3 text-sm text-[#61727e]">
                  宅研所賣貨便
                  <span className="ml-2 text-xs text-[#9aa9b3]">
                    待設定
                  </span>
                </div>
              </div>
            </div>

            {/* Events */}
            <div className="rounded-[22px] border border-[#dedbd5] bg-white p-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                EVENTS
              </p>

              <div className="flex items-center justify-between">
                <h2 className="mt-1 text-xl font-black">
                  相關活動資訊
                </h2>

                <span className="text-xs text-[#88a1b4]">
                  MORE →
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl border border-[#e3e1dc] bg-[#faf9f6] p-3">
                  <span className="text-[10px] font-bold tracking-wider text-[#88a1b4]">
                    EVENT
                  </span>
                  <p className="mt-1 text-sm font-bold text-[#526b7d]">
                    國內 ACG 活動
                  </p>
                </div>

                <div className="rounded-xl border border-[#e3e1dc] bg-[#faf9f6] p-3">
                  <span className="text-[10px] font-bold tracking-wider text-[#88a1b4]">
                    OVERSEAS
                  </span>
                  <p className="mt-1 text-sm font-bold text-[#526b7d]">
                    海外相關活動
                  </p>
                </div>

                <div className="rounded-xl border border-[#e3e1dc] bg-[#faf9f6] p-3">
                  <span className="text-[10px] font-bold tracking-wider text-[#88a1b4]">
                    CONCERT
                  </span>
                  <p className="mt-1 text-sm font-bold text-[#526b7d]">
                    ACG 音樂會
                  </p>
                </div>
              </div>
            </div>

            {/* Partners */}
            <div className="rounded-[22px] border border-[#dedbd5] bg-white p-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                PARTNERS
              </p>

              <h2 className="mt-1 text-xl font-black">
                合作繪師
              </h2>

              <div className="mt-4 rounded-xl bg-[#f7f5f1] p-5 text-sm leading-7 text-[#8797a2]">
                合作繪師與社團連結之後會顯示在這裡。
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="w-full px-5 pb-12 md:px-8 xl:px-10 2xl:px-12">
        <div className="rounded-[24px] border border-[#dedbd5] bg-white p-5 md:p-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
            RECENTLY VIEWED
          </p>

          <h2 className="mt-1 text-2xl font-black">
            你曾瀏覽過
          </h2>

          <div className="mt-5 flex min-h-[110px] items-center justify-center rounded-2xl bg-[#f7f5f1] text-sm text-[#8797a2]">
            瀏覽紀錄功能將於下一階段加入。
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="border-t border-[#dedbd5] bg-[#ebe8e1]"
      >
        <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
          <h2 className="text-xl font-black">
            宅研所 OTAKU LAB
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#647785]">
            ACG 商品展示與選品平台。商品資訊於宅研所展示，
            實際訂購將導向賣貨便完成交易。
          </p>
        </div>
      </section>

      <footer className="bg-[#263746] px-5 py-7 text-center text-xs tracking-wider text-[#aebac3]">
        © 2026 OTAKU LAB · 宅研所
      </footer>
    </main>
  );
}

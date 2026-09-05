import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "./ProductGallery";
import SiteHeader from "../../SiteHeader";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Product = {
  id: number;
  created_at: string | null;
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

function RelatedProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <article className="group overflow-hidden rounded-[18px] border border-[#dedbd5] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#60798c]/10">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e9edf0]">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name ?? "商品圖片"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[#9aa9b3]">
              No Image
            </div>
          )}

          {product.featured && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-[#d68674] px-2.5 py-1 text-[10px] font-bold text-white">
              PICK
            </span>
          )}
        </div>
      </Link>

      <div className="p-3">
        <div className="mb-2 flex flex-wrap gap-1.5 text-[10px]">
          {product.status && (
            <span
              className={`rounded-full px-2 py-1 ${
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
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 transition hover:text-[#52799a]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-3 text-lg font-black text-[#52799a]">
          NT$ {Number(product.price ?? 0).toLocaleString("zh-TW")}
        </p>
      </div>
    </article>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: productData, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (error || !productData) {
    notFound();
  }

  const product = productData as Product;

  const { data: allProductsData } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const allProducts = (allProductsData ?? []) as Product[];

  const ipList = Array.from(
    new Set(
      allProducts
        .map((item) => item.ip)
        .filter((value): value is string => Boolean(value))
    )
  );

  const relatedProducts = product.ip
    ? allProducts
        .filter(
          (item) =>
            item.ip === product.ip &&
            item.id !== product.id
        )
        .slice(0, 5)
    : [];

  return (
    <main className="min-h-screen bg-[#f7f5f1] text-[#263746]">
      <SiteHeader />

      <section className="w-full px-5 py-7 md:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_250px]">
          {/* LEFT */}
          <aside>
            <div className="xl:sticky xl:top-24">
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
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#526b7d] transition hover:bg-[#eef3f6]"
                  >
                    全部商品
                  </Link>

                  {ipList.map((ip) => {
                    const selected = product.ip === ip;

                    return (
                      <Link
                        key={ip}
                        href={`/products?ip=${encodeURIComponent(
                          ip
                        )}#products`}
                        className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                          selected
                            ? "bg-[#344b5e] font-bold text-white"
                            : "text-[#526b7d] hover:bg-[#eef3f6] hover:text-[#344b5e]"
                        }`}
                      >
                        {ip}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER */}
          <div className="min-w-0 space-y-8">
            <section className="rounded-[24px] border border-[#dedbd5] bg-white p-5 md:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/"
                  className="text-sm font-semibold text-[#6688a3] transition hover:opacity-60"
                >
                  ← 返回首頁
                </Link>

                {product.ip && (
                  <span className="rounded-full bg-[#edf2f5] px-3 py-1.5 text-xs font-semibold text-[#60798c]">
                    {product.ip}
                  </span>
                )}
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <ProductGallery
                  images={product.images ?? []}
                  productName={product.name ?? "商品"}
                />

                <div className="flex min-w-0 flex-col justify-center">
                  {product.featured && (
                    <span className="mb-4 w-fit rounded-full bg-[#dd7968] px-4 py-2 text-xs font-bold text-white">
                      PICK
                    </span>
                  )}

                  <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#7d9bb2]">
                    OTAKU LAB SELECT
                  </p>

                  <h1 className="text-2xl font-black leading-tight md:text-3xl">
                    {product.name}
                  </h1>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {product.status && (
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
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

                    {product.category && (
                      <span className="rounded-full border border-[#d6d1ca] bg-white px-3 py-1.5 text-xs">
                        {product.category}
                      </span>
                    )}

                    {product.source_type && (
                      <span className="rounded-full border border-[#d6d1ca] bg-white px-3 py-1.5 text-xs">
                        {product.source_type}
                      </span>
                    )}

                    {product.region && (
                      <span className="rounded-full border border-[#d6d1ca] bg-white px-3 py-1.5 text-xs">
                        {product.region}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#65717b]">
                      {product.description}
                    </p>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-[#8797a2]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {product.price != null && (
                    <div className="mt-7 text-3xl font-black text-[#52799a]">
                      NT${" "}
                      {Number(product.price).toLocaleString(
                        "zh-TW"
                      )}
                    </div>
                  )}

                  {product.myship_url && (
                    <a
                      href={product.myship_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-[#314f63] px-6 text-base font-bold text-white transition hover:opacity-85"
                    >
                      前往賣貨便購買
                    </a>
                  )}

          {/* 商品說明 + 買家發問 */}
          <div className="mt-7 border-t border-[#dedbd5] pt-5">
            {/* 商品說明 */}
            <div className="text-xs leading-6 text-[#7a7a7a]">
              商品資訊及實際庫存、售價以購買頁面顯示為準。
              <br />
              宅研所整理與展示 ACG 相關商品資訊。
            </div>

            {/* 商品問題按鈕 */}
            <div className="mt-8 flex justify-end">
              <a
                href="https://www.facebook.com/OtakuResearchLab"
                target="_blank"
                rel="noopener noreferrer"
                title="商品相關問題｜前往宅研所粉專"
                aria-label="商品相關問題，前往宅研所 Facebook 粉專"
                className="group relative inline-flex items-center gap-2 rounded-2xl bg-[#314f63] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-85 hover:shadow-md"
                >
                  {/* 問字對話氣泡 */}
                  <span className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-[#52799a] text-xs font-black text-white">
                    問

                    {/* 氣泡小尾巴 */}
                    <span className="absolute -bottom-1 left-1.5 h-2 w-2 rotate-45 bg-[#52799a]" />
                  </span>

                  {/* 按鈕文字 */}
                  <span>商品有問題？</span>

                  {/* 箭頭 */}
                  <span className="text-xs font-medium text-white/70 transition-transform group-hover:translate-x-0.5">
                   →
                    </span>
                   </a>
                  </div>
                 </div>
                </div>
              </div>
            </section>

            {/* Same IP */}
            {relatedProducts.length > 0 && (
              <section className="rounded-[24px] border border-[#dedbd5] bg-white p-5 md:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                      MORE FROM THIS SERIES
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      更多
                      {product.ip
                        ? `《${product.ip}》`
                        : "相關"}
                      商品
                    </h2>
                  </div>

                  {product.ip && (
                    <Link
                      href={`/products?ip=${encodeURIComponent(
                        product.ip
                      )}#products`}
                      className="shrink-0 text-sm font-semibold text-[#52799a] hover:underline"
                    >
                      查看全部 →
                    </Link>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-5">
                  {relatedProducts.map((item) => (
                    <RelatedProductCard
                      key={item.id}
                      product={item}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Recently Viewed */}
            <section className="rounded-[24px] border border-[#dedbd5] bg-white p-5 md:p-6">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                RECENTLY VIEWED
              </p>

              <h2 className="mt-1 text-2xl font-black">
                你曾瀏覽過
              </h2>

              <div className="mt-5 flex min-h-[110px] items-center justify-center rounded-2xl bg-[#f7f5f1] text-sm text-[#8797a2]">
                瀏覽紀錄功能將於下一階段加入。
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">
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

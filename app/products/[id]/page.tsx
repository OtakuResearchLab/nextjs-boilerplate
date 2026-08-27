import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (error || !product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f5f1] text-[#263746]">
      {/* Header */}
      <header className="border-b border-[#dedbd5] bg-[#faf9f6]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="block">
            <div className="text-2xl font-black tracking-tight">宅研所</div>
            <div className="mt-1 text-[11px] tracking-[0.28em] text-[#6f91ad]">
              OTAKU LAB
            </div>
          </Link>

          <nav className="flex gap-8 text-sm font-medium">
            <Link href="/#products" className="hover:opacity-60">
              商品
            </Link>
            <Link href="/#categories" className="hover:opacity-60">
              分類
            </Link>
            <Link href="/#about" className="hover:opacity-60">
              關於宅研所
            </Link>
          </nav>
        </div>
      </header>

      {/* 商品內容 */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-semibold text-[#6688a3] hover:opacity-60"
        >
          ← 返回商品一覽
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          {/* 商品圖片 */}
          <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name ?? "商品圖片"}
                className="h-auto w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-[#e9e6df] text-[#8c8c8c]">
                暫無商品圖片
              </div>
            )}
          </div>

          {/* 商品資訊 */}
          <div className="flex flex-col justify-center">
            {product.featured && (
              <span className="mb-5 w-fit rounded-full bg-[#dd7968] px-4 py-2 text-xs font-bold text-white">
                PICK
              </span>
            )}

            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#7d9bb2]">
              OTAKU LAB SELECT
            </p>

            <h1 className="text-3xl font-black leading-tight md:text-4xl">
              {product.name}
            </h1>

            {product.description && (
              <p className="mt-6 whitespace-pre-line text-base leading-8 text-[#65717b]">
                {product.description}
              </p>
            )}

            {product.category && (
              <div className="mt-7">
                <span className="rounded-full border border-[#d6d1ca] bg-white px-4 py-2 text-sm">
                  {product.category}
                </span>
              </div>
            )}

            {product.price != null && (
              <div className="mt-8 text-2xl font-black">
                NT$ {Number(product.price).toLocaleString()}
              </div>
            )}

            {product.myship_url && (
              <a
                href={product.myship_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-[#314f63] px-6 text-base font-bold text-white transition hover:opacity-85"
              >
                前往購買
              </a>
            )}

            <div className="mt-8 border-t border-[#dedbd5] pt-6 text-sm leading-7 text-[#7a7a7a]">
              商品資訊及實際庫存、售價以購買頁面顯示為準。
              <br />
              宅研所整理與展示 ACG 相關商品資訊。
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

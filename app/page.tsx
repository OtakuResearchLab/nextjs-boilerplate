import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import FilterSelect from "./FilterSelect";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type SearchParams = {
  ip?: string | string[];
  region?: string | string[];
  category?: string | string[];
  type?: string | string[];
};

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : "全部";
}

function createFilterHref(
  current: {
    ip: string;
    region: string;
    category: string;
    type: string;
  },
  key: "ip" | "region" | "category" | "type",
  value: string
) {
  const next = {
    ...current,
    [key]: value,
  };

  const query = new URLSearchParams();

  if (next.ip !== "全部") {
    query.set("ip", next.ip);
  }

  if (next.region !== "全部") {
    query.set("region", next.region);
  }

  if (next.category !== "全部") {
    query.set("category", next.category);
  }

  if (next.type !== "全部") {
    query.set("type", next.type);
  }

  const queryString = query.toString();

  return queryString ? `/?${queryString}#products` : "/#products";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("featured", { ascending: false })
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

  const allProducts = products ?? [];
  const params = await searchParams;

  const ipList = [
    "全部",
    ...Array.from(
      new Set(
        allProducts
          .map((product) => product.ip)
          .filter((value): value is string => Boolean(value))
      )
    ),
  ];

  const regionList = [
    "全部",
    ...Array.from(
      new Set(
        allProducts
          .map((product) => product.region)
          .filter((value): value is string => Boolean(value))
      )
    ),
  ];

  const categoryList = [
    "全部",
    ...Array.from(
      new Set(
        allProducts
          .map((product) => product.category)
          .filter((value): value is string => Boolean(value))
      )
    ),
  ];

  const typeList = [
    "全部",
    ...Array.from(
      new Set(
        allProducts
          .map((product) => product.source_type)
          .filter((value): value is string => Boolean(value))
      )
    ),
  ];

  const requestedIp = getParam(params.ip);
  const requestedRegion = getParam(params.region);
  const requestedCategory = getParam(params.category);
  const requestedType = getParam(params.type);

  const selectedIp = ipList.includes(requestedIp)
    ? requestedIp
    : "全部";

  const selectedRegion = regionList.includes(requestedRegion)
    ? requestedRegion
    : "全部";

  const selectedCategory = categoryList.includes(requestedCategory)
    ? requestedCategory
    : "全部";

  const selectedType = typeList.includes(requestedType)
    ? requestedType
    : "全部";

  const currentFilters = {
    ip: selectedIp,
    region: selectedRegion,
    category: selectedCategory,
    type: selectedType,
  };

  const filteredProducts = allProducts.filter((product) => {
    const matchesIp =
      selectedIp === "全部" || product.ip === selectedIp;

    const matchesRegion =
      selectedRegion === "全部" || product.region === selectedRegion;

    const matchesCategory =
      selectedCategory === "全部" ||
      product.category === selectedCategory;

    const matchesType =
      selectedType === "全部" ||
      product.source_type === selectedType;

    return (
      matchesIp &&
      matchesRegion &&
      matchesCategory &&
      matchesType
    );
  });

  const hasActiveFilters =
    selectedIp !== "全部" ||
    selectedRegion !== "全部" ||
    selectedCategory !== "全部" ||
    selectedType !== "全部";

  return (
    <main className="min-h-screen bg-[#f7f5f1] text-[#263746]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#dedbd5] bg-[#f7f5f1]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="block">
            <h1 className="text-2xl font-black tracking-wider">
              宅研所
            </h1>
            <p className="text-[11px] tracking-[0.28em] text-[#7890a3]">
              OTAKU LAB
            </p>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#products" className="hover:text-[#6e91ad]">
              商品
            </a>
            <a href="#categories" className="hover:text-[#6e91ad]">
              分類
            </a>
            <a href="#about" className="hover:text-[#6e91ad]">
              關於宅研所
            </a>
          </nav>

          <button className="rounded-full border border-[#ccd4da] bg-white px-4 py-2 text-sm">
            搜尋
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 pt-6 md:px-8 md:pt-10">
        <div className="relative overflow-hidden rounded-[28px] bg-[#dce7ee] px-7 py-10 md:px-14 md:py-16">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#c6d8e5]" />
          <div className="absolute bottom-[-70px] right-24 h-44 w-44 rounded-full bg-[#ead8c2]" />

          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold tracking-wider text-[#68849b]">
              ACG GOODS SELECT SHOP
            </span>

            <h2 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
              研究你的熱愛，
              <br />
              發現更多美好。
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-[#526b7d]">
              收藏、限定商品、官方授權周邊與活動商品，
              由宅研所整理與展示。
            </p>

            <a
              href="#products"
              className="mt-7 inline-flex rounded-full bg-[#344b5e] px-7 py-3 font-semibold text-white transition hover:bg-[#263746]"
            >
              查看最新商品 ↓
            </a>
          </div>
        </div>
      </section>

      {/* IP Categories */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-5 pb-5 pt-10 md:px-8"
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
            IP / SERIES
          </p>
          <h2 className="mt-1 text-2xl font-black">
            作品分類
          </h2>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {ipList.map((ip) => {
            const isSelected = selectedIp === ip;

            return (
              <Link
                key={ip}
                href={createFilterHref(
                  currentFilters,
                  "ip",
                  ip
                )}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                  isSelected
                    ? "border-[#344b5e] bg-[#344b5e] text-white"
                    : "border-[#d7d6d1] bg-white hover:border-[#92aabd] hover:bg-[#eef3f6]"
                }`}
              >
                {ip}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-7xl px-5 pb-10 md:px-8">
        <div className="rounded-[24px] border border-[#dedbd5] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                FILTER
              </p>
              <h2 className="mt-1 text-lg font-black">
                篩選商品
              </h2>
            </div>

            {hasActiveFilters && (
              <Link
                href="/#products"
                className="rounded-full border border-[#d7d6d1] px-4 py-2 text-xs font-semibold text-[#60798c] transition hover:bg-[#eef3f6]"
              >
                清除篩選
              </Link>
            )}
          </div>

          <div className="mt-6">
            {/* Category */}
            <div>
              <p className="mb-2 text-xs font-bold text-[#7890a3]">
                商品種類
              </p>

              <div className="flex flex-wrap gap-2">
                {categoryList.map((category) => (
                  <Link
                    key={category}
                    href={createFilterHref(
                      currentFilters,
                      "category",
                      category
                    )}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                      selectedCategory === category
                        ? "bg-[#60798c] text-white"
                        : "bg-[#f1f3f4] text-[#61727e] hover:bg-[#e3eaee]"
                    }`}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>

            {/* Type + Region */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-8">
              <FilterSelect
                label="商品類型"
                paramName="type"
                value={selectedType}
                options={typeList}
              />

              <FilterSelect
                label="來源產地"
                paramName="region"
                value={selectedRegion}
                options={regionList}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-5 pb-16 md:px-8"
      >
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
              NEW ARRIVALS
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {selectedIp === "全部"
                ? "最新商品"
                : selectedIp}
            </h2>
          </div>

          <span className="shrink-0 text-sm text-[#7890a3]">
            共 {filteredProducts.length} 件
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-[#8797a2]">
            沒有符合目前篩選條件的商品。
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[22px] border border-[#dedbd5] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#60798c]/10"
              >
                <Link
                  href={`/products/${product.id}`}
                  className="block"
                >
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

                <div className="p-4 md:p-5">
                  <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
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
                    <h3 className="line-clamp-2 min-h-[48px] font-bold leading-6 transition hover:text-[#52799a]">
                      {product.name}
                    </h3>
                  </Link>

                  {product.category && (
                    <p className="mt-1 text-xs text-[#8b989f]">
                      {product.category}
                    </p>
                  )}

                  <p className="mt-4 text-xl font-black text-[#52799a]">
                    NT${" "}
                    {Number(
                      product.price ?? 0
                    ).toLocaleString("zh-TW")}
                  </p>

                  {product.tags?.length > 0 && (
                    <div className="mt-3 hidden flex-wrap gap-1.5 md:flex">
                      {product.tags
                        .slice(0, 3)
                        .map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[11px] text-[#8797a2]"
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
                      className="mt-5 block rounded-xl bg-[#344b5e] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#263746]"
                    >
                      前往賣貨便購買
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
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

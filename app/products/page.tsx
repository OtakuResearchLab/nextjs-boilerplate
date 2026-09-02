import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import FilterSelect from "../FilterSelect";

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

  return queryString
    ? `/products?${queryString}#products`
    : "/products#products";
}

export default async function ProductsPage({
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
            <Link href="/" className="hover:text-[#6e91ad]">
              首頁
            </Link>

            <Link
              href="/products"
              className="font-bold text-[#52799a]"
            >
              商品
            </Link>

            <Link href="/#about" className="hover:text-[#6e91ad]">
              關於宅研所
            </Link>
          </nav>

          <div className="rounded-full border border-[#ccd4da] bg-white px-4 py-2 text-sm text-[#7890a3]">
            PRODUCTS
          </div>
        </div>
      </header>

      {/* Page Heading */}
      <section className="w-full px-5 pb-7 pt-8 md:px-8 md:pt-12 xl:px-10 2xl:px-12">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#88a1b4]">
          OTAKU LAB GOODS
        </p>

        <h1 className="mt-2 text-3xl font-black md:text-4xl">
          商品一覽
        </h1>

        <p className="mt-3 text-sm leading-7 text-[#647785]">
          依作品、商品種類、商品類型與來源產地尋找宅研所整理的 ACG 商品。
        </p>
      </section>

      {/* Shop Layout */}
      <section
        id="products"
        className="w-full px-5 pb-16 md:px-8 xl:px-10 2xl:px-12"
      >
        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-8">
          {/* IP Sidebar */}
          <aside>
            <div className="lg:sticky lg:top-24">
              <div className="rounded-[22px] border border-[#dedbd5] bg-white p-4 md:p-5">
                <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                  IP / SERIES
                </p>

                <h2 className="mt-1 text-lg font-black">
                  作品分類
                </h2>

                {/* Desktop */}
                <div className="mt-4 hidden space-y-1 lg:block">
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
                        className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                          isSelected
                            ? "bg-[#344b5e] font-bold text-white"
                            : "text-[#526b7d] hover:bg-[#eef3f6] hover:text-[#344b5e]"
                        }`}
                      >
                        {ip === "全部" ? "全部商品" : ip}
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile */}
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
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
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
                          isSelected
                            ? "bg-[#344b5e] text-white"
                            : "bg-[#f1f3f4] text-[#61727e]"
                        }`}
                      >
                        {ip === "全部" ? "全部商品" : ip}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Area */}
          <div className="min-w-0">
            {/* Filters */}
            <div className="rounded-[22px] border border-[#dedbd5] bg-white p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                    FILTER
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {selectedIp === "全部"
                      ? "全部商品"
                      : selectedIp}
                  </h2>
                </div>

                {hasActiveFilters && (
                  <Link
                    href={
                      selectedIp === "全部"
                        ? "/products#products"
                        : `/products?ip=${encodeURIComponent(
                            selectedIp
                          )}#products`
                    }
                    className="rounded-full border border-[#d7d6d1] px-4 py-2 text-xs font-semibold text-[#60798c] transition hover:bg-[#eef3f6]"
                  >
                    清除篩選
                  </Link>
                )}
              </div>

              {/* Category */}
              <div className="mt-6">
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
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-8">
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

            {/* Results Heading */}
            <div className="mb-5 mt-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
                  GOODS
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  商品列表
                </h2>
              </div>

              <span className="shrink-0 text-sm text-[#7890a3]">
                共 {filteredProducts.length} 件
              </span>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center text-[#8797a2]">
                沒有符合目前篩選條件的商品。
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
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

                    <div className="p-4">
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
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-t border-[#dedbd5] bg-[#ebe8e1]">
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

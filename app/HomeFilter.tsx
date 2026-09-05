"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HomeFilterProps = {
  categories: string[];
  types: string[];
  regions: string[];
};

export default function HomeFilter({
  categories,
  types,
  regions,
}: HomeFilterProps) {
  const router = useRouter();

  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [region, setRegion] = useState("");

  const handleSubmit = () => {
    const params = new URLSearchParams();

    if (category) {
      params.set("category", category);
    }

    if (type) {
      params.set("type", type);
    }

    if (region) {
      params.set("region", region);
    }

    const query = params.toString();

    router.push(
      query
        ? `/products?${query}#products`
        : "/products#products"
    );
  };

  return (
    <div className="rounded-[22px] border border-[#dedbd5] bg-white p-5">
      <p className="text-xs font-semibold tracking-[0.2em] text-[#88a1b4]">
        FILTER
      </p>

      <h2 className="mt-1 text-xl font-black">
        商品篩選
      </h2>

      <div className="mt-5">
        <label className="mb-2 block text-xs font-bold text-[#7890a3]">
          商品種類
        </label>

        <div className="relative">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[#d7dfe4] bg-[#f7f8f8] px-4 py-3 pr-10 text-sm font-medium text-[#526b7d] outline-none"
          >
            <option value="">全部</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#7890a3]">
            ▼
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs font-bold text-[#7890a3]">
          商品類型
        </label>

        <div className="relative">
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[#d7dfe4] bg-[#f7f8f8] px-4 py-3 pr-10 text-sm font-medium text-[#526b7d] outline-none"
          >
            <option value="">全部</option>

            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#7890a3]">
            ▼
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-bold text-[#7890a3]">
          來源產地
        </p>

        <div className="flex flex-wrap gap-2">
          {regions.map((item) => {
            const selected = region === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setRegion(selected ? "" : item)
                }
                className={`rounded-full px-3 py-2 text-xs transition ${
                  selected
                    ? "bg-[#60798c] font-bold text-white"
                    : "bg-[#f1f3f4] text-[#61727e] hover:bg-[#60798c] hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-6 block w-full rounded-xl border border-[#ccd4da] px-4 py-3 text-center text-sm font-bold text-[#526b7d] transition hover:bg-[#eef3f6]"
      >
        查看篩選結果
      </button>
    </div>
  );
}

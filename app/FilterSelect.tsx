"use client";

import { usePathname, useRouter } from "next/navigation";

type FilterSelectProps = {
  label: string;
  paramName: "type" | "region";
  value: string;
  options: string[];
};

export default function FilterSelect({
  label,
  paramName,
  value,
  options,
}: FilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValue = event.target.value;

    const params = new URLSearchParams(window.location.search);

    if (selectedValue === "全部") {
      params.delete(paramName);
    } else {
      params.set(paramName, selectedValue);
    }

    const queryString = params.toString();

    const basePath =
      pathname === "/products" ? "/products" : "/";

    router.push(
      queryString
        ? `${basePath}?${queryString}#products`
        : `${basePath}#products`
    );
  };

  return (
    <div className="w-full sm:w-[220px]">
      <label className="mb-2 block text-xs font-bold text-[#7890a3]">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          className="w-full appearance-none rounded-xl border border-[#d7dfe4] bg-[#f7f8f8] px-4 py-3 pr-10 text-sm font-medium text-[#526b7d] outline-none transition hover:border-[#92aabd] focus:border-[#60798c]"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#7890a3]">
          ▼
        </span>
      </div>
    </div>
  );
}

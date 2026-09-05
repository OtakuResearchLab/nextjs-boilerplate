import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dedbd5] bg-[#f7f5f1]/95 backdrop-blur">
      <div className="w-full px-4 py-3 md:px-8 md:py-4 xl:px-10 2xl:px-12">
        
        {/* 第一排 */}
        <div className="flex items-center gap-3 md:gap-5">
          <button
            type="button"
            aria-label="開啟選單"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-[#60798c] transition hover:bg-[#ebeef0] md:h-11 md:w-11"
          >
            ☰
          </button>

          <Link href="/" className="min-w-0 shrink-0">
            <h1 className="text-[24px] font-black leading-none tracking-wider sm:text-[26px] md:text-[32px]">
              宅研所
            </h1>

            <p className="mt-1 text-[9px] tracking-[0.28em] text-[#7890a3] sm:text-[10px] md:text-[11px]">
              OTAKU LAB
            </p>
          </Link>

          <div className="hidden border-l border-[#d8d8d5] pl-5 lg:block">
            <p className="text-sm font-medium text-[#6f818d]">
              研究你的熱愛，整理值得收藏的 ACG 周邊。
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <Link
              href="/products"
              className="hidden shrink-0 rounded-full bg-[#344b5e] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#263746] md:block"
            >
              商品一覽
            </Link>

            {/* 桌機搜尋框 */}
            <div className="hidden items-center rounded-full border border-[#ccd4da] bg-white px-5 py-2.5 md:flex md:w-[300px] lg:w-[340px] xl:w-[440px]">
              <span className="mr-3 text-[#9aa9b3]">⌕</span>

              <span className="truncate text-sm text-[#9aa9b3]">
                搜尋商品、作品或關鍵字
              </span>
            </div>

            <ThemeToggle />
          </div>
        </div>

        {/* 手機版第二排搜尋框 */}
        <div className="mt-3 flex w-full items-center rounded-full border border-[#ccd4da] bg-white px-4 py-2.5 md:hidden">
          <span className="mr-3 shrink-0 text-[#9aa9b3]">⌕</span>

          <span className="truncate text-sm text-[#9aa9b3]">
            搜尋商品、作品或關鍵字
          </span>
        </div>
      </div>
    </header>
  );
}

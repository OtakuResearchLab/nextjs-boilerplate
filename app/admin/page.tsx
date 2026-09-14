import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  // 1. 確認目前登入者
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // 沒登入 → 回登入頁
  if (userError || !user) {
    redirect("/admin/login");
  }

  // 2. 確認這個帳號是不是 admin_users 成員
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // 有登入，但不是管理員 → 拒絕進入
  if (!adminUser || adminUser.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f1] px-5 text-[#263746]">
        <div className="w-full max-w-md rounded-[28px] border border-[#dedbd5] bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold tracking-[0.2em] text-[#88a1b4]">
            OTAKU LAB ADMIN
          </p>

          <h1 className="mt-3 text-2xl font-black">
            無管理員權限
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#71828e]">
            此帳號已登入，但未被授權使用宅研所管理後台。
          </p>

          <Link
            href="/"
            className="mt-6 inline-block text-sm font-bold text-[#52799a] hover:underline"
          >
            ← 返回宅研所首頁
          </Link>
        </div>
      </main>
    );
  }

  // 3. 通過 Auth + admin_users 驗證
  return (
    <main className="min-h-screen bg-[#f7f5f1] text-[#263746]">
      <header className="border-b border-[#dedbd5] bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-[#88a1b4]">
              OTAKU LAB ADMIN
            </p>

            <h1 className="mt-1 text-xl font-black">
              宅研所管理後台
            </h1>
          </div>

          <Link
            href="/"
            className="text-sm font-bold text-[#52799a] hover:underline"
          >
            查看網站 →
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
        <div className="mb-8">
          <p className="text-sm text-[#71828e]">
            已登入管理員
          </p>

          <p className="mt-1 font-bold">
            {user.email}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[22px] border border-[#dedbd5] bg-white p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-[#88a1b4]">
              PRODUCTS
            </p>

            <h2 className="mt-2 text-xl font-black">
              商品管理
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#71828e]">
              新增、修改及管理宅研所商品。
            </p>

            <p className="mt-5 text-sm font-bold text-[#a1abb2]">
              即將開放
            </p>
          </div>

          <div className="rounded-[22px] border border-[#dedbd5] bg-white p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-[#88a1b4]">
              EVENTS
            </p>

            <h2 className="mt-2 text-xl font-black">
              活動審核
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#71828e]">
              審核自動偵測到的 ACG 活動資訊。
            </p>

            <p className="mt-5 text-sm font-bold text-[#a1abb2]">
              即將開放
            </p>
          </div>

          <div className="rounded-[22px] border border-[#dedbd5] bg-white p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-[#88a1b4]">
              PARTNERS
            </p>

            <h2 className="mt-2 text-xl font-black">
              合作繪師
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#71828e]">
              管理合作繪師及相關連結。
            </p>

            <p className="mt-5 text-sm font-bold text-[#a1abb2]">
              即將開放
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminHeader from "./AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const { data: adminUser } =
    await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    !adminUser ||
    adminUser.role !== "admin"
  ) {
    return (
      <main className="admin-shell flex items-center justify-center px-5">
        <div className="admin-card w-full max-w-md rounded-[28px] p-8 text-center shadow-sm">
          <p className="admin-eyebrow">
            OTAKU LAB ADMIN
          </p>

          <h1 className="mt-3 text-2xl font-black">
            無管理員權限
          </h1>

          <p className="admin-muted mt-3 text-sm leading-6">
            此帳號已登入，但未被授權使用宅研所管理後台。
          </p>

          <Link
            href="/"
            className="admin-link mt-6 inline-block text-sm font-bold hover:underline"
          >
            ← 返回宅研所首頁
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <AdminHeader email={user.email} />

      <section className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
        <div className="mb-8">
          <p className="admin-muted text-sm">
            歡迎回來
          </p>

          <p className="mt-1 text-xl font-black">
            管理控制台
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="admin-card rounded-[22px] p-6">
            <p className="admin-eyebrow">
              PRODUCTS
            </p>

            <h2 className="mt-2 text-xl font-black">
              商品管理
            </h2>

            <p className="admin-muted mt-2 text-sm leading-6">
              新增、修改及管理宅研所商品。
            </p>

            <p className="admin-disabled mt-5 text-sm font-bold">
              即將開放
            </p>
          </div>

          <div className="admin-card rounded-[22px] p-6">
            <p className="admin-eyebrow">
              EVENTS
            </p>

            <h2 className="mt-2 text-xl font-black">
              活動審核
            </h2>

            <p className="admin-muted mt-2 text-sm leading-6">
              審核自動偵測到的 ACG 活動資訊。
            </p>

            <p className="admin-disabled mt-5 text-sm font-bold">
              即將開放
            </p>
          </div>

          <div className="admin-card rounded-[22px] p-6">
            <p className="admin-eyebrow">
              PARTNERS
            </p>

            <h2 className="mt-2 text-xl font-black">
              合作繪師
            </h2>

            <p className="admin-muted mt-2 text-sm leading-6">
              管理合作繪師及相關連結。
            </p>

            <p className="admin-disabled mt-5 text-sm font-bold">
              即將開放
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import ThemeToggle from "../../ThemeToggle";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "宅研所後台登入",
};

export default function AdminLoginPage() {
  return (
    <main className="admin-shell relative">
      <div className="absolute right-5 top-5 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-5 py-10 md:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <p className="admin-eyebrow">
              OTAKU LAB ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-black">
              宅研所管理後台
            </h1>

            <p className="admin-muted mt-3 text-sm leading-6">
              僅限授權管理人員登入
            </p>
          </div>

          <div className="admin-card rounded-[28px] p-6 shadow-sm md:p-8">
            <LoginForm />
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="admin-link text-sm font-bold hover:underline"
            >
              ← 返回宅研所首頁
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

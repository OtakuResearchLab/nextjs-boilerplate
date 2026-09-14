import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "宅研所後台登入",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f1] text-[#263746]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-5 py-10 md:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-[#88a1b4]">
              OTAKU LAB ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-black">
              宅研所管理後台
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#71828e]">
              僅限授權管理人員登入
            </p>
          </div>

          <div className="rounded-[28px] border border-[#dedbd5] bg-white p-6 shadow-sm md:p-8">
            <LoginForm />
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm font-bold text-[#52799a] hover:underline"
            >
              ← 返回宅研所首頁
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

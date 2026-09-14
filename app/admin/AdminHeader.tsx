import Link from "next/link";
import ThemeToggle from "../ThemeToggle";

type AdminHeaderProps = {
  email?: string | null;
};

export default function AdminHeader({
  email,
}: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
        <div>
          <p className="admin-eyebrow">
            OTAKU LAB ADMIN
          </p>

          <h1 className="mt-1 text-xl font-black">
            宅研所管理後台
          </h1>

          {email && (
            <p className="admin-muted mt-1 text-xs">
              {email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/"
            className="admin-link text-sm font-bold"
          >
            查看網站 →
          </Link>
        </div>
      </div>
    </header>
  );
}

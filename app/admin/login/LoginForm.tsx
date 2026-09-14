"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();

  const supabase =
    createSupabaseBrowserClient();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setLoading(false);

      setErrorMessage(
        "登入失敗，請確認 Email 或密碼是否正確。"
      );

      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-bold"
        >
          管理員 Email
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
          required
          placeholder="admin@example.com"
          className="admin-input rounded-2xl px-4 py-3 text-sm transition"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-bold"
        >
          密碼
        </label>

        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
          required
          placeholder="請輸入密碼"
          className="admin-input rounded-2xl px-4 py-3 text-sm transition"
        />
      </div>

      {errorMessage && (
        <div className="admin-login-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="admin-button w-full rounded-2xl px-4 py-3.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "登入中..."
          : "登入管理後台"}
      </button>
    </form>
  );
}

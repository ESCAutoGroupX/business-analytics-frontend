import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await client.post("/auth/signin", { email, password });
      localStorage.setItem("access_token", data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response: { data?: { detail?: string } } }).response;
        setError(res.data?.detail ?? "Sign in failed. Please try again.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <span className="text-xl font-bold tracking-wide text-slate-100">
            AUTOACCOUNT
          </span>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-8">
          <h1 className="mb-6 text-center text-xl font-bold text-slate-100">
            Sign In
          </h1>

          {error && (
            <div className="mb-4 rounded-md border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-center text-sm text-slate-400">
            <p>
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-blue-400 hover:underline">
                Sign Up
              </Link>
            </p>
            <p>
              Forgot password?{" "}
              <Link to="/reset-password" className="text-blue-400 hover:underline">
                Reset
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

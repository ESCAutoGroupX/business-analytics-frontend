import { useEffect, useState, type FormEvent } from "react";
import client from "../api/client";

interface Vendor {
  id: string;
  name: string;
}

interface GLCode {
  id: string;
  code: string;
  name: string | null;
  description: string;
}

interface Location {
  id: number;
  location_name: string;
}

interface RecentTransaction {
  id: string;
  date: string | null;
  amount: number | null;
  vendor: string | null;
  name: string | null;
  merchant_name: string | null;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v);
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-400" />
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500";

export default function EnterRevenuePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [glCodes, setGlCodes] = useState<GLCode[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [recent, setRecent] = useState<RecentTransaction[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const [form, setForm] = useState({
    date: "",
    vendor: "",
    amount: "",
    name: "",
    category: "",
    gl_code_id: "",
    location_id: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    client.get<Vendor[]>("/vendors/").then((r) => setVendors(r.data)).catch(() => {});
    client.get<GLCode[]>("/accounting/").then((r) => setGlCodes(r.data)).catch(() => {});
    client.get<Location[]>("/locations/").then((r) => setLocations(r.data)).catch(() => {});
    fetchRecent();
  }, []);

  function fetchRecent() {
    setRecentLoading(true);
    client
      .get<{ ledger: RecentTransaction[] }>("/dashboard/bank-ledger", {
        params: { page: 1, page_size: 20, sort_by: "date", sort_order: "desc" },
      })
      .then((r) => setRecent(r.data.ledger ?? []))
      .catch(() => {})
      .finally(() => setRecentLoading(false));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await client.post("/transactions/", {
        date: form.date,
        vendor: form.vendor,
        amount: parseFloat(form.amount),
        name: form.name,
        category: form.category || null,
        gl_code_id: form.gl_code_id || null,
        location: form.location_id ? { id: parseInt(form.location_id) } : null,
      });
      setSuccess("Transaction created successfully!");
      setForm({ date: "", vendor: "", amount: "", name: "", category: "", gl_code_id: "", location_id: "" });
      fetchRecent();
    } catch {
      setError("Failed to create transaction. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Enter Revenue</h1>

      <div className="mb-8 rounded-xl bg-[#1e293b] p-6">
        {success && (
          <div className="mb-4 rounded-md border border-emerald-800 bg-emerald-950 px-4 py-2.5 text-sm text-emerald-300">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Date</label>
            <input
              type="date"
              required
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Vendor</label>
            <select
              required
              className={inputClass}
              value={form.vendor}
              onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
            >
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              className={inputClass}
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="Transaction description"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Category</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Sales, Service Revenue"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">GL Code</label>
            <select
              className={inputClass}
              value={form.gl_code_id}
              onChange={(e) => setForm((f) => ({ ...f, gl_code_id: e.target.value }))}
            >
              <option value="">Select GL code...</option>
              {glCodes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} — {g.name || g.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Location</label>
            <select
              className={inputClass}
              value={form.location_id}
              onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}
            >
              <option value="">Select location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.location_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Create Transaction"}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Transactions */}
      <h2 className="mb-4 text-lg font-semibold text-white">
        Recent Transactions
      </h2>
      {recentLoading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[#1e293b]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recent.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-300">{t.date ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-200">{t.vendor || t.merchant_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-300">{t.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {t.amount != null ? formatCurrency(t.amount) : "—"}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

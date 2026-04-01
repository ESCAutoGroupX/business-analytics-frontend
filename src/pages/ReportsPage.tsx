import { useEffect, useState } from "react";
import client from "../api/client";

interface DayData {
  gross_sales: number;
  credit_card_total: number;
  cash_check_total: number;
  credit_card_breakdown: Record<string, number>;
}

type ProfitLossResponse = Record<string, DayData>;

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-400" />
    </div>
  );
}

const inputClass =
  "rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500";

export default function ReportsPage() {
  const [data, setData] = useState<ProfitLossResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  function fetchReport() {
    setLoading(true);
    setError("");
    client
      .get<ProfitLossResponse>("/reports/profit-loss", {
        params: { start_date: startDate, end_date: endDate },
      })
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load profit & loss report"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggregate by category
  const dates = data ? Object.keys(data).sort() : [];
  let totalGross = 0;
  let totalCC = 0;
  let totalCash = 0;
  const ccBreakdownTotals: Record<string, number> = {};

  for (const d of dates) {
    const day = data![d];
    totalGross += day.gross_sales;
    totalCC += day.credit_card_total;
    totalCash += day.cash_check_total;
    for (const [k, v] of Object.entries(day.credit_card_breakdown)) {
      ccBreakdownTotals[k] = (ccBreakdownTotals[k] ?? 0) + v;
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <button
          className="rounded-md bg-slate-700 px-4 py-1.5 text-sm text-slate-300 hover:bg-slate-600"
          onClick={() => alert("Export coming soon")}
        >
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-[#1e293b] p-4">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Start Date</label>
          <input
            type="date"
            className={inputClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">End Date</label>
          <input
            type="date"
            className={inputClass}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          onClick={fetchReport}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : data && dates.length > 0 ? (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-[#1e293b] p-5">
              <p className="text-sm text-slate-400">Gross Sales</p>
              <p className="mt-1 text-xl font-bold text-emerald-400">{formatCurrency(totalGross)}</p>
            </div>
            <div className="rounded-xl bg-[#1e293b] p-5">
              <p className="text-sm text-slate-400">Credit Card Total</p>
              <p className="mt-1 text-xl font-bold text-blue-400">{formatCurrency(totalCC)}</p>
            </div>
            <div className="rounded-xl bg-[#1e293b] p-5">
              <p className="text-sm text-slate-400">Cash / Check Total</p>
              <p className="mt-1 text-xl font-bold text-amber-400">{formatCurrency(totalCash)}</p>
            </div>
          </div>

          {/* Daily breakdown */}
          <div className="overflow-x-auto rounded-xl bg-[#1e293b]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Gross Sales</th>
                  <th className="px-4 py-3">Credit Card</th>
                  <th className="px-4 py-3">Cash / Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {dates.map((d) => (
                  <tr key={d} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-300">{d}</td>
                    <td className="px-4 py-3 text-slate-200">{formatCurrency(data[d].gross_sales)}</td>
                    <td className="px-4 py-3 text-slate-200">{formatCurrency(data[d].credit_card_total)}</td>
                    <td className="px-4 py-3 text-slate-200">{formatCurrency(data[d].cash_check_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CC Breakdown */}
          {Object.keys(ccBreakdownTotals).length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-white">Credit Card Breakdown</h2>
              <div className="overflow-x-auto rounded-xl bg-[#1e293b]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {Object.entries(ccBreakdownTotals)
                      .sort(([, a], [, b]) => b - a)
                      .map(([provider, total]) => (
                        <tr key={provider} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 text-slate-200">{provider}</td>
                          <td className="px-4 py-3 text-slate-200">{formatCurrency(total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-400">No report data for the selected date range.</p>
      )}
    </div>
  );
}

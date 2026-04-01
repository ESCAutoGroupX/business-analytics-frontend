import { useEffect, useState, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import client from "../api/client";

interface LedgerEntry {
  id: string;
  date: string;
  amount: number;
  vendor: string;
  name: string;
  transaction_type: string;
  merchant_name: string;
  account_name: string;
  account_id: string;
  running_balance: number;
}

interface BankLedgerResponse {
  initial_total_balance: number;
  final_overall_balance: number;
  total_transactions: number;
  page: number;
  page_size: number;
  total_pages: number;
  sort_by: string;
  sort_order: string;
  ledger: LedgerEntry[];
}

interface CreditCardEntry {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  vendor: string;
  name: string;
  transaction_type: string;
  merchant_name: string;
  account_name: string;
}

interface CreditCardResponse {
  data: CreditCardEntry[];
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    total_records: number;
  };
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
  "rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500";
const btnClass =
  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors";

export default function MatchBankTransactionsPage() {
  // ── Bank Ledger state ──
  const [ledgerData, setLedgerData] = useState<BankLedgerResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerSort, setLedgerSort] = useState({ by: "date", order: "desc" });
  const [ledgerFilters, setLedgerFilters] = useState({
    start_date: "",
    end_date: "",
    payment_type: "",
    vendor_name: "",
  });
  const [ledgerApplied, setLedgerApplied] = useState(ledgerFilters);

  const fetchLedger = useCallback(() => {
    setLedgerLoading(true);
    setLedgerError("");
    const params: Record<string, string | number> = {
      page: ledgerPage,
      page_size: 50,
      sort_by: ledgerSort.by,
      sort_order: ledgerSort.order,
    };
    if (ledgerApplied.start_date) params.start_date = ledgerApplied.start_date;
    if (ledgerApplied.end_date) params.end_date = ledgerApplied.end_date;
    if (ledgerApplied.payment_type) params.payment_type = ledgerApplied.payment_type;
    if (ledgerApplied.vendor_name) params.vendor_name = ledgerApplied.vendor_name;

    client
      .get<BankLedgerResponse>("/dashboard/bank-ledger", { params })
      .then((r) => setLedgerData(r.data))
      .catch(() => setLedgerError("Failed to load bank ledger"))
      .finally(() => setLedgerLoading(false));
  }, [ledgerPage, ledgerSort, ledgerApplied]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  function toggleLedgerSort(col: string) {
    setLedgerSort((s) =>
      s.by === col
        ? { by: col, order: s.order === "asc" ? "desc" : "asc" }
        : { by: col, order: "asc" },
    );
    setLedgerPage(1);
  }

  // ── Credit Card state ──
  const [ccData, setCcData] = useState<CreditCardResponse | null>(null);
  const [ccLoading, setCcLoading] = useState(true);
  const [ccError, setCcError] = useState("");
  const [ccPage, setCcPage] = useState(1);
  const [ccSort, setCcSort] = useState({ by: "date", order: "desc" });
  const [ccFilters, setCcFilters] = useState({
    start_date: "",
    end_date: "",
    payment_type: "",
    vendor_name: "",
    account_id: "",
  });
  const [ccApplied, setCcApplied] = useState(ccFilters);

  const fetchCC = useCallback(() => {
    setCcLoading(true);
    setCcError("");
    const params: Record<string, string | number> = {
      page: ccPage,
      page_size: 50,
      sort_by: ccSort.by,
      sort_order: ccSort.order,
    };
    if (ccApplied.start_date) params.start_date = ccApplied.start_date;
    if (ccApplied.end_date) params.end_date = ccApplied.end_date;
    if (ccApplied.payment_type) params.payment_type = ccApplied.payment_type;
    if (ccApplied.vendor_name) params.vendor_name = ccApplied.vendor_name;
    if (ccApplied.account_id) params.account_id = ccApplied.account_id;

    client
      .get<CreditCardResponse>("/dashboard/credit-card-Balance-list", { params })
      .then((r) => setCcData(r.data))
      .catch(() => setCcError("Failed to load credit card transactions"))
      .finally(() => setCcLoading(false));
  }, [ccPage, ccSort, ccApplied]);

  useEffect(() => {
    fetchCC();
  }, [fetchCC]);

  function toggleCcSort(col: string) {
    setCcSort((s) =>
      s.by === col
        ? { by: col, order: s.order === "asc" ? "desc" : "asc" }
        : { by: col, order: "asc" },
    );
    setCcPage(1);
  }

  // ── Unique vendors for dropdown ──
  const vendorOptions = Array.from(
    new Set([
      ...(ledgerData?.ledger.map((l) => l.vendor).filter(Boolean) ?? []),
      ...(ccData?.data.map((c) => c.vendor).filter(Boolean) ?? []),
    ]),
  ).sort();

  function SortIndicator({ col, active }: { col: string; active: { by: string; order: string } }) {
    if (active.by !== col) return null;
    return <span className="ml-1">{active.order === "asc" ? "▲" : "▼"}</span>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">
        Match Bank Transactions
      </h1>

      {/* ── Section A: Banking Ledger ── */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Banking Ledger
        </h2>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl bg-[#1e293b] p-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={ledgerFilters.start_date}
              onChange={(e) =>
                setLedgerFilters((f) => ({ ...f, start_date: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">End Date</label>
            <input
              type="date"
              className={inputClass}
              value={ledgerFilters.end_date}
              onChange={(e) =>
                setLedgerFilters((f) => ({ ...f, end_date: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Type</label>
            <select
              className={inputClass}
              value={ledgerFilters.payment_type}
              onChange={(e) =>
                setLedgerFilters((f) => ({ ...f, payment_type: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Vendor</label>
            <select
              className={inputClass}
              value={ledgerFilters.vendor_name}
              onChange={(e) =>
                setLedgerFilters((f) => ({ ...f, vendor_name: e.target.value }))
              }
            >
              <option value="">All</option>
              {vendorOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}
            onClick={() => {
              setLedgerApplied(ledgerFilters);
              setLedgerPage(1);
            }}
          >
            Apply
          </button>
          <button
            className={`${btnClass} bg-slate-700 text-slate-300 hover:bg-slate-600`}
            onClick={() => {
              const empty = { start_date: "", end_date: "", payment_type: "", vendor_name: "" };
              setLedgerFilters(empty);
              setLedgerApplied(empty);
              setLedgerPage(1);
            }}
          >
            Reset
          </button>
        </div>

        {ledgerLoading ? (
          <Spinner />
        ) : ledgerError ? (
          <p className="text-sm text-red-400">{ledgerError}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl bg-[#1e293b]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                  <tr>
                    {[
                      { key: "date", label: "Date" },
                      { key: "", label: "Card / Account" },
                      { key: "", label: "Check/Dep #" },
                      { key: "vendor", label: "Vendor" },
                      { key: "name", label: "Description" },
                      { key: "", label: "GL Code" },
                      { key: "transaction_type", label: "Account Type" },
                      { key: "amount", label: "Amount" },
                      { key: "", label: "Running Balance" },
                      { key: "", label: "Status" },
                      { key: "", label: "Attachment" },
                      { key: "", label: "Actions" },
                    ].map(({ key, label }) => (
                      <th
                        key={label}
                        className={`px-4 py-3 ${key ? "cursor-pointer hover:text-slate-200" : ""}`}
                        onClick={key ? () => toggleLedgerSort(key) : undefined}
                      >
                        {label}
                        {key && <SortIndicator col={key} active={ledgerSort} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {ledgerData?.ledger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-300">{row.date}</td>
                      <td className="px-4 py-3 text-slate-300">{row.account_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-200">{row.vendor || row.merchant_name}</td>
                      <td className="px-4 py-3 text-slate-300">{row.name}</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-400">{row.transaction_type}</td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          row.amount >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatCurrency(row.running_balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          Posted
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 w-20 rounded border border-dashed border-slate-600 flex items-center justify-center text-xs text-slate-500">
                          Drop file
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-slate-400 hover:text-blue-400">
                            <Pencil size={14} />
                          </button>
                          <button className="text-slate-400 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {ledgerData && ledgerData.total_pages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span>
                  Page {ledgerData.page} of {ledgerData.total_pages} ({ledgerData.total_transactions} transactions)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={ledgerPage <= 1}
                    onClick={() => setLedgerPage((p) => p - 1)}
                    className={`${btnClass} bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40`}
                  >
                    Previous
                  </button>
                  <button
                    disabled={ledgerPage >= ledgerData.total_pages}
                    onClick={() => setLedgerPage((p) => p + 1)}
                    className={`${btnClass} bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Section B: Credit Card Transactions ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Credit Card Transactions
        </h2>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl bg-[#1e293b] p-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={ccFilters.start_date}
              onChange={(e) =>
                setCcFilters((f) => ({ ...f, start_date: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">End Date</label>
            <input
              type="date"
              className={inputClass}
              value={ccFilters.end_date}
              onChange={(e) =>
                setCcFilters((f) => ({ ...f, end_date: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Type</label>
            <select
              className={inputClass}
              value={ccFilters.payment_type}
              onChange={(e) =>
                setCcFilters((f) => ({ ...f, payment_type: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Vendor</label>
            <select
              className={inputClass}
              value={ccFilters.vendor_name}
              onChange={(e) =>
                setCcFilters((f) => ({ ...f, vendor_name: e.target.value }))
              }
            >
              <option value="">All</option>
              {vendorOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}
            onClick={() => {
              setCcApplied(ccFilters);
              setCcPage(1);
            }}
          >
            Apply
          </button>
          <button
            className={`${btnClass} bg-slate-700 text-slate-300 hover:bg-slate-600`}
            onClick={() => {
              const empty = { start_date: "", end_date: "", payment_type: "", vendor_name: "", account_id: "" };
              setCcFilters(empty);
              setCcApplied(empty);
              setCcPage(1);
            }}
          >
            Reset
          </button>
        </div>

        {ccLoading ? (
          <Spinner />
        ) : ccError ? (
          <p className="text-sm text-red-400">{ccError}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl bg-[#1e293b]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                  <tr>
                    {[
                      { key: "date", label: "Date" },
                      { key: "", label: "Card / Account" },
                      { key: "", label: "Check/Dep #" },
                      { key: "vendor", label: "Vendor" },
                      { key: "name", label: "Description" },
                      { key: "", label: "GL Code" },
                      { key: "transaction_type", label: "Account Type" },
                      { key: "amount", label: "Amount" },
                      { key: "", label: "Balance" },
                      { key: "", label: "Status" },
                      { key: "", label: "Attachment" },
                      { key: "", label: "Actions" },
                    ].map(({ key, label }) => (
                      <th
                        key={label}
                        className={`px-4 py-3 ${key ? "cursor-pointer hover:text-slate-200" : ""}`}
                        onClick={key ? () => toggleCcSort(key) : undefined}
                      >
                        {label}
                        {key && <SortIndicator col={key} active={ccSort} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {ccData?.data.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-300">{row.date}</td>
                      <td className="px-4 py-3 text-slate-300">{row.account_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-200">{row.vendor || row.merchant_name}</td>
                      <td className="px-4 py-3 text-slate-300">{row.name}</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-400">{row.transaction_type}</td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          row.amount >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">—</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          Posted
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 w-20 rounded border border-dashed border-slate-600 flex items-center justify-center text-xs text-slate-500">
                          Drop file
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-slate-400 hover:text-blue-400">
                            <Pencil size={14} />
                          </button>
                          <button className="text-slate-400 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ccData && ccData.pagination.total_pages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span>
                  Page {ccData.pagination.page} of {ccData.pagination.total_pages} ({ccData.pagination.total_records} transactions)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={ccPage <= 1}
                    onClick={() => setCcPage((p) => p - 1)}
                    className={`${btnClass} bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40`}
                  >
                    Previous
                  </button>
                  <button
                    disabled={ccPage >= ccData.pagination.total_pages}
                    onClick={() => setCcPage((p) => p + 1)}
                    className={`${btnClass} bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

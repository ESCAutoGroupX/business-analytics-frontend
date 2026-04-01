import { useEffect, useState } from "react";
import client from "../api/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BankBalanceResponse {
  totals: { total_balance_available: number };
}

interface ItemsNeedAttentionResponse {
  data: {
    overdue_payables: {
      total_overdue: number;
      overdue_bill_count: number;
    };
    credit_card_overdue: {
      id: string;
      account_name: string;
      card_name: string;
      balance_current: number;
      next_payment_due_date?: string;
    }[];
    lowest_bank_account: {
      account_id: string;
      account_name: string;
      balance: number;
      minimum_balance: number;
      shortfall: number;
    };
    account_receivable: {
      total_receivable: number;
      total_repair_orders: number;
    };
  };
}

interface TrendAccount {
  account_id: string;
  account_name: string;
  weekly_start_balance: number;
  daily_bank_balance: Record<string, number>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const due = new Date(dateStr);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-400" />
    </div>
  );
}

export default function DashboardPage() {
  const [bankBalance, setBankBalance] = useState<number | null>(null);
  const [attention, setAttention] =
    useState<ItemsNeedAttentionResponse["data"] | null>(null);
  const [trends, setTrends] = useState<TrendAccount[] | null>(null);

  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingAttention, setLoadingAttention] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);

  const [errorBalance, setErrorBalance] = useState("");
  const [errorAttention, setErrorAttention] = useState("");
  const [errorTrends, setErrorTrends] = useState("");

  useEffect(() => {
    client
      .get<BankBalanceResponse>("/dashboard/bank-balance")
      .then((r) => setBankBalance(r.data.totals.total_balance_available))
      .catch(() => setErrorBalance("Failed to load bank balance"))
      .finally(() => setLoadingBalance(false));

    client
      .get<ItemsNeedAttentionResponse>("/dashboard/items-need-attention")
      .then((r) => setAttention(r.data.data))
      .catch(() => setErrorAttention("Failed to load items needing attention"))
      .finally(() => setLoadingAttention(false));

    client
      .get<TrendAccount[]>("/dashboard/api/bank-balance-trends")
      .then((r) => setTrends(r.data))
      .catch(() => setErrorTrends("Failed to load balance trends"))
      .finally(() => setLoadingTrends(false));
  }, []);

  // Build chart data from trends
  const chartData: Record<string, string | number>[] = [];
  const accountNames: string[] = [];
  if (trends && trends.length > 0) {
    const dateSet = new Set<string>();
    for (const acct of trends) {
      accountNames.push(acct.account_name);
      for (const d of Object.keys(acct.daily_bank_balance)) {
        dateSet.add(d);
      }
    }
    const sortedDates = Array.from(dateSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    for (const date of sortedDates) {
      const row: Record<string, string | number> = { date };
      for (const acct of trends) {
        row[acct.account_name] = acct.daily_bank_balance[date] ?? 0;
      }
      chartData.push(row);
    }
  }

  // Credit cards due soon
  const creditCardsDueSoon = attention
    ? attention.credit_card_overdue.filter(
        (c) => c.next_payment_due_date && daysUntil(c.next_payment_due_date) <= 30,
      )
    : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>

      {/* Top cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Bank Balance */}
        <div className="rounded-xl border-l-4 border-emerald-500 bg-[#1e293b] p-6">
          <p className="text-sm font-medium text-slate-400">Bank Balance</p>
          {loadingBalance ? (
            <Spinner />
          ) : errorBalance ? (
            <p className="mt-2 text-sm text-red-400">{errorBalance}</p>
          ) : (
            <p className="mt-2 text-2xl font-bold text-white">
              {formatCurrency(bankBalance ?? 0)}
            </p>
          )}
        </div>

        {/* Revenue */}
        <div className="rounded-xl border-l-4 border-blue-500 bg-[#1e293b] p-6">
          <p className="text-sm font-medium text-slate-400">Revenue</p>
          <p className="mt-2 text-2xl font-bold text-slate-500">Coming Soon</p>
        </div>

        {/* Expenses */}
        <div className="rounded-xl border-l-4 border-amber-500 bg-[#1e293b] p-6">
          <p className="text-sm font-medium text-slate-400">Expenses</p>
          <p className="mt-2 text-2xl font-bold text-slate-500">Coming Soon</p>
        </div>
      </div>

      {/* Items Need Attention */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Items Need Attention
        </h2>
        {loadingAttention ? (
          <Spinner />
        ) : errorAttention ? (
          <p className="text-sm text-red-400">{errorAttention}</p>
        ) : attention ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Overdue Payables */}
            <div className="rounded-xl bg-[#1e293b] p-5">
              <p className="text-sm font-medium text-slate-400">
                Overdue Payables
              </p>
              <p className="mt-2 text-xl font-bold text-red-400">
                {attention.overdue_payables.overdue_bill_count} bills
              </p>
              <p className="text-sm text-slate-400">
                {formatCurrency(attention.overdue_payables.total_overdue)} total
              </p>
            </div>

            {/* Aging Receivables */}
            <div className="rounded-xl bg-[#1e293b] p-5">
              <p className="text-sm font-medium text-slate-400">
                Aging Receivables
              </p>
              <p className="mt-2 text-xl font-bold text-amber-400">
                {attention.account_receivable.total_repair_orders} orders
              </p>
              <p className="text-sm text-slate-400">
                {formatCurrency(attention.account_receivable.total_receivable)}{" "}
                outstanding
              </p>
            </div>

            {/* Credit Card Due Soon */}
            <div className="rounded-xl bg-[#1e293b] p-5">
              <p className="text-sm font-medium text-slate-400">
                Credit Card Due Soon
              </p>
              <p className="mt-2 text-xl font-bold text-orange-400">
                {creditCardsDueSoon.length} cards
              </p>
              {creditCardsDueSoon.length > 0 && creditCardsDueSoon[0].next_payment_due_date && (
                <p className="text-sm text-slate-400">
                  next in {daysUntil(creditCardsDueSoon[0].next_payment_due_date)}{" "}
                  days
                </p>
              )}
            </div>

            {/* Low Bank Balance */}
            <div className="rounded-xl bg-[#1e293b] p-5">
              <p className="text-sm font-medium text-slate-400">
                Low Bank Balance
              </p>
              <p className="mt-2 text-xl font-bold text-red-400">
                {formatCurrency(attention.lowest_bank_account.balance)}
              </p>
              <p className="text-sm text-slate-400">
                {attention.lowest_bank_account.account_name}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bank Balance Trends */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Bank Balance Trends
        </h2>
        {loadingTrends ? (
          <Spinner />
        ) : errorTrends ? (
          <p className="text-sm text-red-400">{errorTrends}</p>
        ) : chartData.length > 0 ? (
          <div className="rounded-xl bg-[#1e293b] p-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend wrapperStyle={{ color: "#94a3b8" }} />
                {accountNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No trend data available</p>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePlaidLink } from "react-plaid-link";
import client from "../api/client";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  role: string;
  full_name: string;
}

interface PlaidAccount {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  mask: string;
  balances: {
    current: number | null;
    available: number | null;
  };
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

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pwForm, setPwForm] = useState({ current: "", new_password: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  // Plaid state
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccount[]>([]);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [plaidMsg, setPlaidMsg] = useState("");
  const [plaidError, setPlaidError] = useState("");

  useEffect(() => {
    client
      .get<UserProfile>("/users/me")
      .then((r) => setUser(r.data))
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch connected accounts
  function fetchAccounts() {
    setPlaidLoading(true);
    client
      .get("/plaid/sync_transactions")
      .then((r) => {
        const accounts = r.data?.accounts;
        if (Array.isArray(accounts)) {
          setPlaidAccounts(accounts);
        }
      })
      .catch(() => {})
      .finally(() => setPlaidLoading(false));
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Get link token for Plaid Link
  function handleConnectBank() {
    if (!user) return;
    setPlaidError("");
    setPlaidMsg("");
    client
      .post<{ link_token: string }>("/plaid/link-token", { user_id: user.id })
      .then((r) => setLinkToken(r.data.link_token))
      .catch(() => setPlaidError("Failed to initialize bank connection."));
  }

  const onPlaidSuccess = useCallback(
    (publicToken: string) => {
      if (!user) return;
      setPlaidMsg("");
      setPlaidError("");
      client
        .post("/plaid/exchange_public_token", {
          public_token: publicToken,
          user_id: user.id,
        })
        .then(() => {
          setPlaidMsg("Bank account connected successfully!");
          setLinkToken(null);
          fetchAccounts();
        })
        .catch(() => setPlaidError("Failed to link bank account."));
    },
    [user],
  );

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (linkToken && plaidReady) {
      openPlaid();
    }
  }, [linkToken, plaidReady, openPlaid]);

  function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwMsg("Password change is not yet implemented.");
    setPwForm({ current: "", new_password: "", confirm: "" });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Settings</h1>

      {/* User Profile */}
      <section className="mb-8 rounded-xl bg-[#1e293b] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Profile</h2>
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : user ? (
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Name</dt>
              <dd className="text-slate-200">{user.full_name}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="text-slate-200">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Role</dt>
              <dd className="text-slate-200 capitalize">{user.role}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Phone</dt>
              <dd className="text-slate-200">{user.mobile_number || "—"}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      {/* Change Password */}
      <section className="mb-8 rounded-xl bg-[#1e293b] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Change Password</h2>

        {pwMsg && (
          <div className="mb-4 rounded-md border border-emerald-800 bg-emerald-950 px-4 py-2.5 text-sm text-emerald-300">
            {pwMsg}
          </div>
        )}
        {pwError && (
          <div className="mb-4 rounded-md border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-300">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="max-w-sm space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Current Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">New Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={pwForm.new_password}
              onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Confirm New Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Update Password
          </button>
        </form>
      </section>

      {/* Placeholder sections */}
      <section className="mb-8 rounded-xl bg-[#1e293b] p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Notifications</h2>
        <p className="text-sm text-slate-400">Notification preferences coming soon.</p>
      </section>

      <section className="rounded-xl bg-[#1e293b] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Integrations</h2>

        {/* Connect Bank Account */}
        <div className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">
            Connect Bank Account
          </h3>

          {plaidMsg && (
            <div className="mb-3 rounded-md border border-emerald-800 bg-emerald-950 px-4 py-2.5 text-sm text-emerald-300">
              {plaidMsg}
            </div>
          )}
          {plaidError && (
            <div className="mb-3 rounded-md border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-300">
              {plaidError}
            </div>
          )}

          <button
            onClick={handleConnectBank}
            disabled={!user}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Connect Bank Account
          </button>
        </div>

        {/* Connected Accounts */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-300">
            Connected Accounts
          </h3>
          {plaidLoading ? (
            <Spinner />
          ) : plaidAccounts.length > 0 ? (
            <div className="space-y-2">
              {plaidAccounts.map((acct) => (
                <div
                  key={acct.account_id}
                  className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {acct.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {acct.type}
                      {acct.subtype ? ` / ${acct.subtype}` : ""}
                      {acct.mask ? ` ••••${acct.mask}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    {acct.balances?.current != null && (
                      <p className="text-sm font-medium text-emerald-400">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(acct.balances.current)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No connected accounts</p>
          )}
        </div>
      </section>
    </div>
  );
}

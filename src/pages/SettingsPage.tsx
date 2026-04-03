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

interface ManagedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  is_active: boolean;
  role: string;
  full_name: string;
  locations: { id: string; name: string }[];
}

interface LocationOption {
  id: number;
  location_name: string;
}

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password: string;
  confirm_password: string;
  role: string;
  is_active: boolean;
  location_ids: string[];
}

const emptyUserForm: UserFormData = {
  first_name: "",
  last_name: "",
  email: "",
  mobile_number: "",
  password: "",
  confirm_password: "",
  role: "User",
  is_active: true,
  location_ids: [],
};

const ROLES = ["Admin", "Manager", "Bookkeeper", "Viewer"];

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

  // User management state
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersMsg, setUsersMsg] = useState("");
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm);
  const [userFormError, setUserFormError] = useState("");
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    client
      .get<UserProfile>("/users/me")
      .then((r) => setUser(r.data))
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch users and locations for admin
  function fetchUsers() {
    setUsersLoading(true);
    setUsersError("");
    client
      .get<ManagedUser[]>("/users/")
      .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUsersError("Failed to load users"))
      .finally(() => setUsersLoading(false));
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      client
        .get<LocationOption[]>("/locations/")
        .then((r) => setLocations(Array.isArray(r.data) ? r.data : []))
        .catch(() => {});
    }
  }, [isAdmin]);

  function openAddUser() {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    setUserFormError("");
    setShowUserModal(true);
  }

  function openEditUser(u: ManagedUser) {
    setEditingUserId(u.id);
    setUserForm({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      mobile_number: u.mobile_number,
      password: "",
      confirm_password: "",
      role: u.role,
      is_active: u.is_active,
      location_ids: u.locations?.map((l) => l.id) ?? [],
    });
    setUserFormError("");
    setShowUserModal(true);
  }

  async function handleUserFormSubmit(e: FormEvent) {
    e.preventDefault();
    setUserFormError("");

    if (userForm.password && userForm.password !== userForm.confirm_password) {
      setUserFormError("Passwords do not match.");
      return;
    }

    setUserFormSubmitting(true);
    try {
      if (editingUserId) {
        const patch: Record<string, unknown> = {
          first_name: userForm.first_name,
          last_name: userForm.last_name,
          email: userForm.email,
          mobile_number: userForm.mobile_number,
          role: userForm.role,
          is_active: userForm.is_active,
          location_ids: userForm.location_ids,
        };
        if (userForm.password) patch.password = userForm.password;
        await client.patch(`/users/${editingUserId}`, patch);
        setUsersMsg("User updated successfully.");
      } else {
        await client.post("/users/", {
          first_name: userForm.first_name,
          last_name: userForm.last_name,
          email: userForm.email,
          mobile_number: userForm.mobile_number,
          password: userForm.password,
          role: userForm.role,
          location_ids: userForm.location_ids,
        });
        setUsersMsg("User created successfully.");
      }
      setShowUserModal(false);
      fetchUsers();
    } catch {
      setUserFormError(
        editingUserId ? "Failed to update user." : "Failed to create user.",
      );
    } finally {
      setUserFormSubmitting(false);
    }
  }

  async function handleDeleteUser(id: string) {
    setDeleteConfirmId(null);
    try {
      await client.delete(`/users/${id}`);
      setUsersMsg("User deleted.");
      fetchUsers();
    } catch {
      setUsersError("Failed to delete user.");
    }
  }

  function toggleLocation(locId: string) {
    setUserForm((f) => ({
      ...f,
      location_ids: f.location_ids.includes(locId)
        ? f.location_ids.filter((l) => l !== locId)
        : [...f.location_ids, locId],
    }));
  }

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

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    try {
      await client.patch("/users/me", { password: pwForm.new_password });
      setPwMsg("Password updated successfully.");
      setPwForm({ current: "", new_password: "", confirm: "" });
    } catch {
      setPwError("Failed to update password.");
    }
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

      {/* User Management — Admin only */}
      {isAdmin && (
        <section className="mb-8 rounded-xl bg-[#1e293b] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">User Management</h2>
            <button
              onClick={openAddUser}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add User
            </button>
          </div>

          {usersMsg && (
            <div className="mb-4 rounded-md border border-emerald-800 bg-emerald-950 px-4 py-2.5 text-sm text-emerald-300">
              {usersMsg}
            </div>
          )}
          {usersError && (
            <div className="mb-4 rounded-md border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-300">
              {usersError}
            </div>
          )}

          {usersLoading ? (
            <Spinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-200">
                        {u.full_name || `${u.first_name} ${u.last_name}`}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{u.email}</td>
                      <td className="px-4 py-3 text-slate-400 capitalize">{u.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.is_active
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditUser(u)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(u.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete confirmation */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="w-full max-w-sm rounded-xl bg-[#1e293b] p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Confirm Delete
                </h3>
                <p className="mb-6 text-sm text-slate-400">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="rounded-md bg-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(deleteConfirmId)}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit User Modal */}
          {showUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[#1e293b] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {editingUserId ? "Edit User" : "Add User"}
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    X
                  </button>
                </div>

                {userFormError && (
                  <div className="mb-4 rounded-md border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-300">
                    {userFormError}
                  </div>
                )}

                <form onSubmit={handleUserFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        className={inputClass}
                        value={userForm.first_name}
                        onChange={(e) =>
                          setUserForm((f) => ({ ...f, first_name: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        className={inputClass}
                        value={userForm.last_name}
                        onChange={(e) =>
                          setUserForm((f) => ({ ...f, last_name: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      className={inputClass}
                      value={userForm.email}
                      onChange={(e) =>
                        setUserForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      required={!editingUserId}
                      className={inputClass}
                      value={userForm.mobile_number}
                      onChange={(e) =>
                        setUserForm((f) => ({ ...f, mobile_number: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Password{editingUserId ? " (leave blank to keep)" : ""}
                      </label>
                      <input
                        type="password"
                        required={!editingUserId}
                        className={inputClass}
                        value={userForm.password}
                        onChange={(e) =>
                          setUserForm((f) => ({ ...f, password: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required={!editingUserId && !!userForm.password}
                        className={inputClass}
                        value={userForm.confirm_password}
                        onChange={(e) =>
                          setUserForm((f) => ({
                            ...f,
                            confirm_password: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Role
                      </label>
                      <select
                        className={inputClass}
                        value={userForm.role}
                        onChange={(e) =>
                          setUserForm((f) => ({ ...f, role: e.target.value }))
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={userForm.is_active}
                          onChange={(e) =>
                            setUserForm((f) => ({
                              ...f,
                              is_active: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  {/* Location assignment */}
                  {locations.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300">
                          Locations
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = locations.map((l) => String(l.id));
                            const allSelected =
                              allIds.every((id) => userForm.location_ids.includes(id));
                            setUserForm((f) => ({
                              ...f,
                              location_ids: allSelected ? [] : allIds,
                            }));
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          {locations
                            .map((l) => String(l.id))
                            .every((id) => userForm.location_ids.includes(id))
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {locations.map((loc) => (
                          <label
                            key={loc.id}
                            className="flex items-center gap-2 text-sm text-slate-400"
                          >
                            <input
                              type="checkbox"
                              checked={userForm.location_ids.includes(
                                String(loc.id),
                              )}
                              onChange={() => toggleLocation(String(loc.id))}
                              className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                            />
                            {loc.location_name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="rounded-md bg-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={userFormSubmitting}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {userFormSubmitting
                        ? "Saving..."
                        : editingUserId
                          ? "Update"
                          : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

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

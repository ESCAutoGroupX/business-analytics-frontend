import { useEffect, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import client from "../api/client";

interface PayrollEntry {
  id: number;
  date: string;
  employee_name: string;
  gl_code: string;
  description: string | null;
  gross_pay: number;
  taxes: number;
  net_pay: number;
  location_id: number;
  location_name: string | null;
}

interface Location {
  id: number;
  location_name: string;
}

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
  "w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500";

export default function PayrollPage() {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    date: "",
    employee_name: "",
    gl_code: "",
    description: "",
    gross_pay: "",
    taxes: "",
    net_pay: "",
    location_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchPayroll();
    client.get<Location[]>("/locations/").then((r) => setLocations(r.data)).catch(() => {});
  }, []);

  function fetchPayroll() {
    setLoading(true);
    setError("");
    client
      .get<PayrollEntry[]>("/payroll/")
      .then((r) => setEntries(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError("Failed to load payroll entries"))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await client.post("/payroll/", {
        date: form.date,
        employee_name: form.employee_name,
        gl_code: form.gl_code,
        description: form.description || null,
        gross_pay: parseFloat(form.gross_pay),
        taxes: parseFloat(form.taxes),
        net_pay: parseFloat(form.net_pay),
        location_id: parseInt(form.location_id),
      });
      setShowModal(false);
      setForm({ date: "", employee_name: "", gl_code: "", description: "", gross_pay: "", taxes: "", net_pay: "", location_id: "" });
      fetchPayroll();
    } catch {
      setFormError("Failed to create payroll entry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Enter Payroll & Adjustments</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[#1e293b]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Gross Pay</th>
                <th className="px-4 py-3">Taxes</th>
                <th className="px-4 py-3">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-300">{e.date}</td>
                  <td className="px-4 py-3 text-slate-200">{e.employee_name}</td>
                  <td className="px-4 py-3 text-slate-400">{e.location_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-200">{formatCurrency(e.gross_pay)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatCurrency(e.taxes)}</td>
                  <td className="px-4 py-3 text-emerald-400">{formatCurrency(e.net_pay)}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No payroll entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-xl bg-[#1e293b] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add Payroll Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-md border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Date</label>
                  <input type="date" required className={inputClass} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Employee Name</label>
                  <input type="text" required className={inputClass} value={form.employee_name} onChange={(e) => setForm((f) => ({ ...f, employee_name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">GL Code</label>
                  <input type="text" required className={inputClass} value={form.gl_code} onChange={(e) => setForm((f) => ({ ...f, gl_code: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Location</label>
                  <select required className={inputClass} value={form.location_id} onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}>
                    <option value="">Select...</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.location_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Gross Pay</label>
                  <input type="number" step="0.01" required className={inputClass} value={form.gross_pay} onChange={(e) => setForm((f) => ({ ...f, gross_pay: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Taxes</label>
                  <input type="number" step="0.01" required className={inputClass} value={form.taxes} onChange={(e) => setForm((f) => ({ ...f, taxes: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Net Pay</label>
                  <input type="number" step="0.01" required className={inputClass} value={form.net_pay} onChange={(e) => setForm((f) => ({ ...f, net_pay: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
                <input type="text" className={inputClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-md bg-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

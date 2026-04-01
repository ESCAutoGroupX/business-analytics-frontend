import { useEffect, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import client from "../api/client";

interface LineItem {
  item: string;
  description: string;
  qty: string;
  unit_price: string;
  total_amount: string;
  gl_code_id: string;
  location_id: string;
}

interface PayBill {
  id: number;
  vendor_id: string;
  amount: number;
  date: string | null;
  category: string | null;
  line_items: {
    id: number;
    item: string | null;
    description: string | null;
    qty: number | null;
    unit_price: number | null;
    total_amount: number | null;
    gl_code_id: string | null;
    location_id: number | null;
  }[];
}

interface Vendor {
  id: string;
  name: string;
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

function emptyLineItem(): LineItem {
  return { item: "", description: "", qty: "1", unit_price: "", total_amount: "", gl_code_id: "", location_id: "" };
}

export default function PayBillsPage() {
  const [bills, setBills] = useState<PayBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    vendor_id: "",
    amount: "",
    date: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchBills();
    client.get<Vendor[]>("/vendors/").then((r) => setVendors(r.data)).catch(() => {});
  }, []);

  function fetchBills() {
    setLoading(true);
    setError("");
    client
      .get<PayBill[]>("/paybills/")
      .then((r) => setBills(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError("Failed to load pay bills"))
      .finally(() => setLoading(false));
  }

  function vendorName(id: string): string {
    return vendors.find((v) => v.id === id)?.name ?? id;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await client.post("/paybills/", {
        vendor_id: form.vendor_id,
        amount: parseFloat(form.amount),
        date: form.date,
        line_items: lineItems.map((li) => ({
          item: li.item || null,
          description: li.description || null,
          qty: li.qty ? parseFloat(li.qty) : null,
          unit_price: li.unit_price ? parseFloat(li.unit_price) : null,
          total_amount: li.total_amount ? parseFloat(li.total_amount) : null,
          gl_code_id: li.gl_code_id || null,
          location_id: li.location_id ? parseInt(li.location_id) : null,
        })),
      });
      setShowModal(false);
      setForm({ vendor_id: "", amount: "", date: "" });
      setLineItems([emptyLineItem()]);
      fetchBills();
    } catch {
      setFormError("Failed to create pay bill.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pay Bills</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Create Pay Bill
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
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Line Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-300">{b.date ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-200">{vendorName(b.vendor_id)}</td>
                  <td className="px-4 py-3 text-slate-200">{formatCurrency(b.amount)}</td>
                  <td className="px-4 py-3 text-slate-400">{b.category ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{b.line_items?.length ?? 0}</td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No pay bills found
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
          <div className="w-full max-w-2xl rounded-xl bg-[#1e293b] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Create Pay Bill</h2>
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Vendor</label>
                  <select
                    required
                    className={inputClass}
                    value={form.vendor_id}
                    onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
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
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Due Date</label>
                  <input
                    type="date"
                    required
                    className={inputClass}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Line Items</label>
                  <button
                    type="button"
                    onClick={() => setLineItems((li) => [...li, emptyLineItem()])}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <Plus size={12} /> Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((li, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        placeholder="GL Code"
                        className={`${inputClass} w-28`}
                        value={li.gl_code_id}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[i] = { ...li, gl_code_id: e.target.value };
                          setLineItems(updated);
                        }}
                      />
                      <input
                        placeholder="Amount"
                        type="number"
                        step="0.01"
                        className={`${inputClass} w-28`}
                        value={li.total_amount}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[i] = { ...li, total_amount: e.target.value };
                          setLineItems(updated);
                        }}
                      />
                      <input
                        placeholder="Description"
                        className={inputClass}
                        value={li.description}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[i] = { ...li, description: e.target.value };
                          setLineItems(updated);
                        }}
                      />
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLineItems((items) => items.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md bg-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
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

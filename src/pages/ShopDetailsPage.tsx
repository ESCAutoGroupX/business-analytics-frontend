import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import client from "../api/client";

interface Location {
  id: number;
  location_name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  shop_id: number | null;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-400" />
    </div>
  );
}

export default function ShopDetailsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Location | null>(null);

  useEffect(() => {
    client
      .get<Location[]>("/locations/")
      .then((r) => setLocations(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError("Failed to load locations"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Shop Details</h1>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelected(selected?.id === loc.id ? null : loc)}
              className={`rounded-xl bg-[#1e293b] p-5 text-left transition-colors hover:bg-slate-700/60 ${
                selected?.id === loc.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-blue-400" />
                <h3 className="font-semibold text-white">{loc.location_name}</h3>
              </div>
              <p className="text-sm text-slate-400">{loc.address_line_1}</p>
              {loc.address_line_2 && (
                <p className="text-sm text-slate-400">{loc.address_line_2}</p>
              )}
              <p className="text-sm text-slate-400">
                {loc.city}, {loc.state_province} {loc.postal_code}
              </p>
              {loc.shop_id != null && (
                <p className="mt-2 text-xs text-slate-500">Shop ID: {loc.shop_id}</p>
              )}
            </button>
          ))}
          {locations.length === 0 && (
            <p className="text-sm text-slate-500">No locations found</p>
          )}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="mt-6 rounded-xl bg-[#1e293b] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">{selected.location_name}</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Address</dt>
              <dd className="text-slate-200">
                {selected.address_line_1}
                {selected.address_line_2 ? `, ${selected.address_line_2}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">City</dt>
              <dd className="text-slate-200">{selected.city}</dd>
            </div>
            <div>
              <dt className="text-slate-400">State / Province</dt>
              <dd className="text-slate-200">{selected.state_province}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Postal Code</dt>
              <dd className="text-slate-200">{selected.postal_code}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Country</dt>
              <dd className="text-slate-200">{selected.country}</dd>
            </div>
            {selected.shop_id != null && (
              <div>
                <dt className="text-slate-400">Shop ID</dt>
                <dd className="text-slate-200">{selected.shop_id}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

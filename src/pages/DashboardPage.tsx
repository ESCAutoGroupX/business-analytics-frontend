const cards = [
  { title: "Bank Balance", value: "--", color: "border-emerald-500" },
  { title: "Revenue", value: "--", color: "border-blue-500" },
  { title: "Expenses", value: "--", color: "border-amber-500" },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-100">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border-l-4 ${card.color} border border-slate-700 bg-[#1e293b] p-6`}
          >
            <p className="text-sm font-medium text-slate-400">{card.title}</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

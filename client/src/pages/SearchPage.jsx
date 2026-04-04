import { useState } from "react";

const BADGE_COLORS = {
  green: "bg-green-100 text-green-800 border-green-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  red: "bg-red-100 text-red-800 border-red-200",
  gray: "bg-gray-100 text-gray-800 border-gray-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
};

function SearchPage() {
  const [filters, setFilters] = useState({
    from: "YYC",
    to: "LAX",
    date: "2026-04-15",
    passengers: 1,
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const [compareList, setCompareList] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [detailsData, setDetailsData] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});

  const handleSearch = async () => {
    if (!filters.from || !filters.to) {
      setError("Please enter both origin and destination airport codes.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    setCompareList([]);
    setCompareData(null);
    setExpandedId(null);
    setDetailsData({});
    setSearched(true);

    try {
      const params = new URLSearchParams({
        from: filters.from.toUpperCase(),
        to: filters.to.toUpperCase(),
        passengers: filters.passengers,
      });
      const res = await fetch(`/flights/recommendations?${params}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to fetch flights.");
      } else {
        setResults(data.recommendations || []);
        if ((data.recommendations || []).length === 0) {
          setError("No flights found for this route.");
        }
      }
    } catch (err) {
      setError("Could not connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompareToggle = async (flight) => {
    const alreadyIn = compareList.find((f) => f.Flight_ID === flight.Flight_ID);

    let newList;
    if (alreadyIn) {
      newList = compareList.filter((f) => f.Flight_ID !== flight.Flight_ID);
      setCompareData(null);
    } else {
      if (compareList.length >= 2) return;
      newList = [...compareList, flight];
    }

    setCompareList(newList);

    if (newList.length === 2) {
      setCompareLoading(true);
      setCompareData(null);
      try {
        const ids = newList.map((f) => f.Flight_ID).join(",");
        const res = await fetch(`/flights/compare?flight_ids=${ids}`);
        const data = await res.json();
        if (data.success) {
          setCompareData(data.comparison);
        }
      } catch {
        // compare silently fails — list still shows
      } finally {
        setCompareLoading(false);
      }
    }
  };

  const handleToggleDetails = async (flight) => {
    const id = flight.Flight_ID;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (detailsData[id]) return;

    setDetailsLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/flights/${id}/details`);
      const data = await res.json();
      if (data.success) {
        setDetailsData((prev) => ({ ...prev, [id]: data.flight }));
      }
    } catch {
      // silently fail — basic info is still visible
    } finally {
      setDetailsLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveSearch = async () => {
    const userId = prompt("Enter your User ID to save this search:");
    if (!userId) return;
    try {
      const res = await fetch("/searches/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(userId),
          origin_airport: filters.from.toUpperCase(),
          destination_airport: filters.to.toUpperCase(),
          departure_date: filters.date,
          num_passengers: filters.passengers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Search saved successfully!");
      } else {
        alert(data.error || "Failed to save search.");
      }
    } catch {
      alert("Could not connect to the server.");
    }
  };

  const filterSummary = `${filters.from.toUpperCase()} → ${filters.to.toUpperCase()} | ${filters.date} | ${filters.passengers} passenger${filters.passengers > 1 ? "s" : ""}`;

  const winnerBadge = (winner, side) => {
    if (winner === side) return "font-bold text-green-700";
    return "text-gray-700";
  };

  return (
    <div className="min-h-screen bg-stone-100 text-gray-800">
      {/* Top Bar */}
      <header className="border-b-4 border-stone-700 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold tracking-wide">Search Portal</h1>
          <div className="flex items-center gap-3 text-sm">
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
              Dashboard
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
              Saved Searches
            </button>
            <button className="rounded-full bg-stone-800 px-4 py-2 text-white hover:bg-stone-900">
              Account
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1.7fr_0.9fr]">
        {/* Left Side */}
        <section>
          {/* Filter Panel */}
          <div className="mb-8 rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Selected Filters</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSearch}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Save Search
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="rounded-md bg-stone-800 px-3 py-2 text-sm text-white hover:bg-stone-900 disabled:opacity-60"
                >
                  {loading ? "Searching…" : "Confirm"}
                </button>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-dashed border-gray-300 bg-stone-50 px-4 py-4 text-center text-base font-medium">
              {filterSummary}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <input
                type="text"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                placeholder="From (e.g. YYC)"
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-stone-700"
              />
              <input
                type="text"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                placeholder="To (e.g. YYZ)"
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-stone-700"
              />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-stone-700"
              />
              <input
                type="number"
                min="1"
                value={filters.passengers}
                onChange={(e) => setFilters({ ...filters, passengers: Number(e.target.value) })}
                placeholder="Passengers"
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-stone-700"
              />
            </div>
          </div>

          {/* Results */}
          <div>
            <h2 className="mb-4 text-3xl font-semibold tracking-wide">Search Results</h2>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-gray-500">Loading flights…</div>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <div className="py-12 text-center text-gray-500">No flights found for this route.</div>
            )}

            {!loading && !searched && (
              <div className="py-12 text-center text-gray-400">
                Enter origin and destination airport codes, then click Confirm.
              </div>
            )}

            <div className="space-y-4">
              {results.map((flight) => {
                const isCompared = compareList.some((f) => f.Flight_ID === flight.Flight_ID);
                const isExpanded = expandedId === flight.Flight_ID;
                const details = detailsData[flight.Flight_ID];
                const loadingDetails = detailsLoading[flight.Flight_ID];

                return (
                  <div
                    key={flight.Flight_ID}
                    className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      {/* Label badges */}
                      <div className="flex flex-wrap gap-2">
                        {(flight.labels || []).map((label, i) => (
                          <span
                            key={i}
                            className={`inline-block rounded-lg border px-3 py-1 text-sm font-semibold ${
                              BADGE_COLORS[flight.badge_colors?.[i]] || BADGE_COLORS.gray
                            }`}
                          >
                            {label.toUpperCase()}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                          Book Now
                        </button>
                        <button
                          onClick={() => handleCompareToggle(flight)}
                          className={`rounded-lg px-4 py-2 text-sm ${
                            isCompared
                              ? "bg-stone-800 text-white"
                              : compareList.length >= 2
                              ? "cursor-not-allowed border border-gray-200 text-gray-400"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                          disabled={!isCompared && compareList.length >= 2}
                        >
                          {isCompared ? "Selected" : "Compare"}
                        </button>
                        <button
                          onClick={() => handleToggleDetails(flight)}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          {isExpanded ? "Hide Details" : "More Details"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr]">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {flight.Flight_number} &mdash; {flight.airline}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                          {flight.departure_time_formatted} → {flight.arrival_time_formatted}
                          &nbsp;&bull;&nbsp;{flight.Duration}
                          &nbsp;&bull;&nbsp;{flight.stops === 0 ? "Direct" : `${flight.stops} stop(s)`}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {flight.origin_code} → {flight.destination_code}
                          &nbsp;&bull;&nbsp;{flight.Available_seats} seats left
                        </p>
                      </div>
                      <div className="flex items-center justify-start md:justify-end">
                        <div className="text-left md:text-right">
                          <p className="text-sm text-gray-500">Starting from</p>
                          <p className="text-2xl font-bold">{flight.price_formatted}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-gray-700">
                        {loadingDetails && <p className="text-gray-400">Loading details…</p>}
                        {details && (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-1 font-semibold">Flight Info</p>
                              <ul className="space-y-1">
                                <li><span className="font-medium">Aircraft:</span> {details.aircraft_type}</li>
                                <li><span className="font-medium">Status:</span> {details.status}</li>
                                <li><span className="font-medium">Duration:</span> {details.duration?.formatted}</li>
                                <li><span className="font-medium">Seat Class:</span> {details.availability?.seat_class}</li>
                              </ul>
                            </div>
                            <div>
                              <p className="mb-1 font-semibold">Pricing</p>
                              <ul className="space-y-1">
                                <li><span className="font-medium">Base:</span> {details.pricing?.base_price_formatted}</li>
                                <li><span className="font-medium">Taxes:</span> {details.pricing?.taxes_formatted}</li>
                                <li><span className="font-medium">Total:</span> {details.pricing?.total_formatted}</li>
                              </ul>
                            </div>
                            <div>
                              <p className="mb-1 font-semibold">Baggage Policy</p>
                              <ul className="space-y-1">
                                <li><span className="font-medium">Checked bag:</span> {details.baggage?.checked_bag_limit_formatted}</li>
                                <li><span className="font-medium">Extra bag fee:</span> {details.baggage?.extra_bag_fee_formatted}</li>
                                <li><span className="font-medium">Carry-on:</span> {details.baggage?.carry_on_allowed ? "Yes" : "No"}</li>
                                <li><span className="font-medium">Personal item:</span> {details.baggage?.personal_item_allowed ? "Yes" : "No"}</li>
                              </ul>
                            </div>
                            <div>
                              <p className="mb-1 font-semibold">Airline</p>
                              <ul className="space-y-1">
                                <li><span className="font-medium">Name:</span> {details.airline_info?.name}</li>
                                <li><span className="font-medium">Country:</span> {details.airline_info?.country}</li>
                                <li><span className="font-medium">Contact:</span> {details.airline_info?.contact || "N/A"}</li>
                              </ul>
                            </div>
                          </div>
                        )}
                        {!loadingDetails && !details && (
                          <p className="text-gray-400">Could not load details.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Side */}
        <aside className="space-y-6">
          {/* Compare Panel */}
          <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Compare Options</h2>
              <button
                onClick={() => { setCompareList([]); setCompareData(null); }}
                className="text-sm text-red-600 hover:underline"
              >
                Clear
              </button>
            </div>

            {compareList.length === 0 && (
              <p className="text-sm text-gray-600">Select up to 2 options to compare side by side.</p>
            )}

            <div className="space-y-3">
              {compareList.map((flight) => (
                <div key={flight.Flight_ID} className="rounded-xl border border-gray-200 bg-stone-50 p-4">
                  <p className="font-semibold">{flight.Flight_number} — {flight.airline}</p>
                  <p className="text-sm text-gray-600">
                    {flight.departure_time_formatted} → {flight.arrival_time_formatted} &bull; {flight.Duration}
                  </p>
                  <p className="mt-2 text-lg font-bold">{flight.price_formatted}</p>
                </div>
              ))}
            </div>

            {compareList.length === 2 && !compareData && !compareLoading && (
              <p className="mt-4 text-sm font-medium text-green-700">Two options selected. Ready to compare.</p>
            )}

            {compareLoading && (
              <p className="mt-4 text-sm text-gray-400">Loading comparison…</p>
            )}

            {compareData && (
              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-gray-700">Side-by-Side Comparison</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-left font-medium text-gray-500"></th>
                      <th className="pb-2 text-center font-semibold">{compareData.flight_a.flight_number}</th>
                      <th className="pb-2 text-center font-semibold">{compareData.flight_b.flight_number}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { label: "Price", key: "price" },
                      { label: "Duration", key: "duration" },
                      { label: "Departure", key: "departure_time" },
                      { label: "Arrival", key: "arrival_time" },
                      { label: "Seats", key: "available_seats" },
                      { label: "Checked Bag", key: "checked_baggage" },
                    ].map(({ label, key }) => {
                      const row = compareData.comparison_table[key];
                      return (
                        <tr key={key}>
                          <td className="py-2 font-medium text-gray-500">{label}</td>
                          <td className={`py-2 text-center ${winnerBadge(row.winner, "A")}`}>
                            {row.flight_a}
                            {row.winner === "A" && <span className="ml-1 text-xs text-green-600">✓</span>}
                          </td>
                          <td className={`py-2 text-center ${winnerBadge(row.winner, "B")}`}>
                            {row.flight_b}
                            {row.winner === "B" && <span className="ml-1 text-xs text-green-600">✓</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">How It Works</h2>
            <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-gray-700">
              <li>Enter airport codes (e.g. YYC, YYZ) and click Confirm to fetch live results.</li>
              <li>Results are ranked as Cheapest, Fastest, Best Overall, and Good Choice.</li>
              <li>Select any two flights and click Compare for a detailed side-by-side breakdown.</li>
              <li>Click More Details to see full pricing, baggage policy, and airline info.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default SearchPage;

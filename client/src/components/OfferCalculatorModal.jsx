import React, { useState } from "react";
import { X, Calculator, Plus, Trash2, Award, DollarSign, CheckCircle2 } from "lucide-react";

export const OfferCalculatorModal = ({ isOpen, onClose }) => {
  const [offers, setOffers] = useState([
    { id: 1, company: "Google", base: 140000, bonus: 25000, equity: 40000, type: "Hybrid" },
    { id: 2, company: "Stripe", base: 155000, bonus: 15000, equity: 35000, type: "Remote" },
  ]);

  if (!isOpen) return null;

  const handleAddOffer = () => {
    const newId = Date.now();
    setOffers([
      ...offers,
      { id: newId, company: "New Offer", base: 120000, bonus: 10000, equity: 15000, type: "Remote" },
    ]);
  };

  const handleRemoveOffer = (id) => {
    setOffers(offers.filter((o) => o.id !== id));
  };

  const handleUpdateOffer = (id, field, val) => {
    setOffers(
      offers.map((o) =>
        o.id === id ? { ...o, [field]: field === "company" || field === "type" ? val : Number(val) || 0 } : o
      )
    );
  };

  const calculateTC = (offer) => {
    return Number(offer.base || 0) + Number(offer.bonus || 0) + Number(offer.equity || 0);
  };

  const maxTC = offers.length > 0 ? Math.max(...offers.map(calculateTC)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card max-w-4xl w-full p-6 sm:p-8 bg-slate-900 border border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Offer Compensation Comparison Calculator</h2>
              <p className="text-xs text-slate-400">
                Compare Base Salary, Signing Bonus, and Equity side by side to evaluate Total Compensation (TC).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Comparing {offers.length} Offer Packages
          </span>
          <button
            onClick={handleAddOffer}
            className="btn-primary flex items-center gap-1.5 text-xs py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Offer to Compare</span>
          </button>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const tc = calculateTC(offer);
            const isHighest = offers.length > 1 && tc === maxTC && tc > 0;

            return (
              <div
                key={offer.id}
                className={`glass-card p-5 relative border transition-all ${
                  isHighest
                    ? "border-emerald-500/60 bg-gradient-to-b from-emerald-950/30 to-slate-900 shadow-lg shadow-emerald-500/10"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                {isHighest && (
                  <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[10px] uppercase flex items-center gap-1 shadow-md">
                    <Award className="w-3 h-3" />
                    Highest TC
                  </span>
                )}

                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={offer.company}
                    onChange={(e) => handleUpdateOffer(offer.id, "company", e.target.value)}
                    className="bg-transparent border-b border-slate-700 focus:border-sky-500 text-white font-bold text-base outline-none w-40"
                  />
                  {offers.length > 1 && (
                    <button
                      onClick={() => handleRemoveOffer(offer.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Base Salary ($)</label>
                    <input
                      type="number"
                      value={offer.base}
                      onChange={(e) => handleUpdateOffer(offer.id, "base", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Signing / Annual Bonus ($)</label>
                    <input
                      type="number"
                      value={offer.bonus}
                      onChange={(e) => handleUpdateOffer(offer.id, "bonus", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Annual Equity ($)</label>
                    <input
                      type="number"
                      value={offer.equity}
                      onChange={(e) => handleUpdateOffer(offer.id, "equity", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Total Comp Box */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Comp (TC)</span>
                    <span className="text-lg font-extrabold text-emerald-400 font-mono">
                      ${tc.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium">
                    {offer.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
};

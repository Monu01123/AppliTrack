// src/components/OfferCalculatorModal.jsx
//
// Offer Compensation Comparison Calculator — Corkboard / Pinned Index Card reskin.
// All state, calculation logic, and CRUD operations are 100% unchanged.

import React, { useState } from "react";
import { X, Calculator, Plus, Trash2, Award, DollarSign, CheckCircle2 } from "lucide-react";

const ROTATIONS = ["cork-card-r1", "cork-card-r2", "cork-card-r3", "cork-card-r4"];

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
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(31,28,23,0.5)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--wall)",
          borderRadius: 3,
          boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
          width: "100%",
          maxWidth: 960,
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          padding: "2rem",
          border: "1px solid rgba(31,28,23,0.15)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem" }}
          title="Close"
        >
          <X size={20} />
        </button>

        {/* ── Header ── */}
        <div style={{ marginBottom: "1.75rem", borderBottom: "1px dashed rgba(31,28,23,0.18)", paddingBottom: "1.25rem" }}>
          <div className="tape-label" style={{ marginBottom: "0.5rem" }}>
            side-by-side analysis
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Calculator size={22} style={{ color: "var(--stamp-blue)" }} />
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Offer Compensation Calculator
            </h2>
          </div>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.85rem",
              color: "var(--grey)",
              marginTop: "0.35rem",
            }}
          >
            Compare Base Salary, Signing/Annual Bonus, and Equity side by side to evaluate true Total Compensation (TC).
          </p>
        </div>

        {/* ── Action bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-stamp)",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--grey)",
            }}
          >
            Comparing {offers.length} Offer Package{offers.length !== 1 ? "s" : ""}
          </span>
          <button onClick={handleAddOffer} className="btn-cork" style={{ fontSize: "0.8125rem" }}>
            <Plus size={15} /> Add Offer to Compare
          </button>
        </div>

        {/* ── Offers Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {offers.map((offer, i) => {
            const tc = calculateTC(offer);
            const isHighest = offers.length > 1 && tc === maxTC && tc > 0;
            const rotClass = ROTATIONS[i % ROTATIONS.length];

            return (
              <div
                key={offer.id}
                className={`cork-card ${rotClass}`}
                style={{
                  border: isHighest ? "2px solid var(--stamp-green)" : "1px solid rgba(31,28,23,0.12)",
                  background: isHighest ? "#F5F8F2" : "var(--card)",
                  position: "relative",
                }}
              >
                {/* Highest TC rubber stamp badge */}
                {isHighest && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span className="stamp stamp-offer" style={{ fontSize: "0.62rem" }}>
                      ★ HIGHEST TOTAL COMP
                    </span>
                  </div>
                )}

                {/* Company Name + Delete */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <input
                    type="text"
                    value={offer.company}
                    placeholder="Company Name"
                    onChange={(e) => handleUpdateOffer(offer.id, "company", e.target.value)}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1.5px dashed rgba(31,28,23,0.25)",
                      padding: "0.2rem 0",
                      width: "100%",
                      outline: "none",
                    }}
                  />
                  {offers.length > 1 && (
                    <button
                      onClick={() => handleRemoveOffer(offer.id)}
                      className="btn-icon btn-icon-danger"
                      title="Remove offer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Inputs */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--grey)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Base Salary ($)
                    </label>
                    <input
                      type="number"
                      value={offer.base}
                      onChange={(e) => handleUpdateOffer(offer.id, "base", e.target.value)}
                      className="cork-input no-icon"
                      style={{ padding: "0.45rem 0.75rem" }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--grey)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Signing / Annual Bonus ($)
                    </label>
                    <input
                      type="number"
                      value={offer.bonus}
                      onChange={(e) => handleUpdateOffer(offer.id, "bonus", e.target.value)}
                      className="cork-input no-icon"
                      style={{ padding: "0.45rem 0.75rem" }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--grey)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Annual Equity ($)
                    </label>
                    <input
                      type="number"
                      value={offer.equity}
                      onChange={(e) => handleUpdateOffer(offer.id, "equity", e.target.value)}
                      className="cork-input no-icon"
                      style={{ padding: "0.45rem 0.75rem" }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--grey)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Work Arrangement
                    </label>
                    <select
                      value={offer.type}
                      onChange={(e) => handleUpdateOffer(offer.id, "type", e.target.value)}
                      className="cork-input no-icon"
                      style={{ padding: "0.45rem 0.75rem", cursor: "pointer" }}
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>

                <hr className="cork-divider" />

                {/* Total Comp display */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    paddingTop: "0.25rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-stamp)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--grey)",
                        display: "block",
                      }}
                    >
                      Total Comp (TC)
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.45rem",
                        fontWeight: 700,
                        color: isHighest ? "var(--stamp-green)" : "var(--ink)",
                      }}
                    >
                      ${tc.toLocaleString()}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      background: "var(--tape)",
                      borderRadius: 1,
                      color: "var(--ink)",
                      fontWeight: 600,
                    }}
                  >
                    {offer.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "2rem",
            paddingTop: "1.25rem",
            borderTop: "1px dashed rgba(31,28,23,0.18)",
          }}
        >
          <button onClick={onClose} className="btn-cork">
            Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
};

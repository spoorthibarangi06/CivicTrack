/**
 * Formatting utilities for CivicTrack Karnataka
 */

export function formatINR(val, compact = false) {
  if (val === null || val === undefined || isNaN(val)) {
    return "Not available in source";
  }
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (num === 0) return "₹0.00";

  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
  }

  // Standard Indian numbering format (e.g. 12,34,567.00)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(val) {
  if (!val) return "Not available in source";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return val;
  }
}

export function formatPercent(val) {
  if (val === null || val === undefined || isNaN(val)) {
    return "Not available in source";
  }
  const num = typeof val === "string" ? parseFloat(val) : val;
  return `${num.toFixed(1)}%`;
}

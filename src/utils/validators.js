// IPRS requires a 10-digit Indian mobile number.
export const isValidPhone = (phone) => /^\d{10}$/.test(phone || "");

export const isValidOtp = (otp) => /^\d{4}$/.test(otp || "");

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

export const isValidGstin = (gstin) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin || "");

export const sanitizeGstin = (value) =>
  (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);

export const sanitizeDigits = (value, maxLength) => {
  const digits = (value || "").replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
};

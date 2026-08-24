// IPRS requires a 10-digit Indian mobile number.
export const isValidPhone = (phone) => /^\d{10}$/.test(phone || "");

export const isValidOtp = (otp) => /^\d{4}$/.test(otp || "");

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

export const sanitizeDigits = (value, maxLength) => {
  const digits = (value || "").replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
};

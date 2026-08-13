import { request } from "./apiClient";
import { setToken, clearToken } from "./tokenStorage";

function sendOtp(phone) {
  return request("/auth/send-otp", { method: "POST", body: { phone } });
}

async function verifyOtp(phone, otp) {
  const data = await request("/auth/verify-otp", { method: "POST", body: { phone, otp } });
  if (data?.token) setToken(data.token);
  return data;
}

async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export { sendOtp, verifyOtp, logout };

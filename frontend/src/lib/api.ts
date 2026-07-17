import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err?.response?.data?.error || err?.message || "حدث خطأ غير متوقع.";
    return Promise.reject(new Error(message));
  }
);

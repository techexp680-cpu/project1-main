import axios from "axios";

const BACKEND_URL = "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("oc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;

export function inr(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

import axios from "axios";

const BACKEND_URL = "https://project1-main.onrender.com";

export const API = BACKEND_URL + "/api";

// Format amounts as Indian Rupees (INR)
export const inr = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const client = axios.create({
  baseURL: API,
});

export default client;
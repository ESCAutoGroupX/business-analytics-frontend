import axios from "axios";

const client = axios.create({
  baseURL: "https://api.businessanalyticsinc.com",
  headers: { "Content-Type": "application/json" },
});

// Attach access_token from localStorage to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to /login on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default client;

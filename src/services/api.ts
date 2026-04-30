import axios from "axios";

const api = axios.create({
  baseURL: "/api", MONGODB_URI="mongodb+srv://fabiulabrandao15_db_user:futgestao2026@cluster0.cislst7.mongodb.net/"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("organizer_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

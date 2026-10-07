import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getPromoCodes = async () => {
  const response = await axios.get(API_URL);
  return response.data.data;
};

export const getPromoCodeById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data.data;
};

export const createPromoCode = async (data) => {
  const response = await axios.post(API_URL, data);
  return response.data.data;
};

export const updatePromoCode = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data.data;
};

export const deletePromoCode = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
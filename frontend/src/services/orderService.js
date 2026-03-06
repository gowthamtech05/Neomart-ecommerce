import axios from "axios";

const API_URL = "${import.meta.env.VITE_API_URL}/orders";

export const createOrder = async (orderData, token) => {
  const res = await axios.post(API_URL, orderData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getMyOrders = async (token) => {
  const res = await axios.get(`${API_URL}/myorders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getAllOrders = async (token) => {
  const res = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

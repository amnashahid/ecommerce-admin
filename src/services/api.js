export const API_URL = 'https://lightsalmon-marten-148688.hostingersite.com/api' //import.meta.env.VITE_API_URL;
export const BASE_URL = 'https://lightsalmon-marten-148688.hostingersite.com' 

export const login = async (phone, password) => {
  const response = await fetch(`${API_URL}/auth/admin-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};
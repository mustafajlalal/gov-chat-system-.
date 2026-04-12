const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export const api = {
  async post(url: string, body: any) {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Request failed');
    }
    return res.json();
  },
  async get(url: string) {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const res = await fetch(fullUrl);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Request failed');
    }
    return res.json();
  },
  async patch(url: string, body: any) {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Request failed');
    }
    return res.json();
  },
  async delete(url: string) {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Request failed');
    }
    return res.json();
  }
};

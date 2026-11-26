import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

export const fetchStats = async () => {
  const { data } = await api.get('/stats');
  return data.data;
};

export const fetchBooks = async ({
  category = '',
  availableOnly = false,
  search = '',
  page = 1,
  limit = 5,
} = {}) => {
  const params = { page, limit };
  if (category && category !== 'All') {
    params.category = category;
  }
  if (availableOnly) {
    params.availableOnly = 'true';
  }
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const { data } = await api.get('/books', { params });
  return data.data;
};

export const createBook = async (payload) => {
  const { data } = await api.post('/books', payload);
  return data;
};

export const updateBook = async (id, payload) => {
  const { data } = await api.put(`/books/${id}`, payload);
  return data;
};

export const deleteBook = async (id) => {
  const { data } = await api.delete(`/books/${id}`);
  return data;
};

export const issueBook = async (bookId, payload) => {
  const { data } = await api.post(`/books/${bookId}/issue`, payload);
  return data;
};

export const fetchBookLoans = async (bookId) => {
  const { data } = await api.get(`/books/${bookId}/loans`);
  return data.data;
};

export const returnLoan = async (loanId) => {
  const { data } = await api.post(`/loans/${loanId}/return`);
  return data;
};

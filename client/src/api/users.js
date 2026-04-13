import api from './axios';

export const getUsers = () => api.get('/users');
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getMyTasks = () => api.get('/tasks/my');

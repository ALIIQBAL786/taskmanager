import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  loading: true,   // true while we check for a stored session on mount
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      dispatch({ type: 'LOGOUT' });
      return;
    }
    authApi
      .getMe()
      .then(({ data }) => dispatch({ type: 'SET_USER', payload: data.user }))
      .catch(() => {
        localStorage.clear();
        dispatch({ type: 'LOGOUT' });
      });
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      dispatch({ type: 'SET_USER', payload: data.user });
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await authApi.register({ name, email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      dispatch({ type: 'SET_USER', payload: data.user });
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await authApi.logout(refreshToken).catch(() => {});
    localStorage.clear();
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

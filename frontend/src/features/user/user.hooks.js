import { useState, useEffect } from "react";
import httpClient from "@/services/httpClient";
import {
  loginUser,
  logoutUser,
  getAllUsers,
//   getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword,
} from "./user.api";

const CURRENT_USER_KEY = 'currentUser';

// ====== AUTENTICAÇÃO ======

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function isAuthenticated() {
    const token = httpClient.tokenManager.getAccessToken();
    return !!token && !httpClient.tokenManager.isTokenExpired(token);
  }

  async function login(email, password) {
    try {
      setLoading(true);
      setError(null);
      const response = await loginUser({ email, password });
      const { accessToken, refreshToken, user } = response.data;

      httpClient.tokenManager.setTokens(accessToken, refreshToken);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      setCurrentUser(user);

      return user;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await logoutUser();
    } catch (err) {
      // mesmo se der erro no backend, limpa sessão local
      console.error('Erro ao fazer logout no backend:', err);
    } finally {
      httpClient.tokenManager.clearTokens();
      localStorage.removeItem(CURRENT_USER_KEY);
      setCurrentUser(null);
    }
  }

  return { currentUser, loading, error, isAuthenticated, login, logout };
}

// ====== CRUD ======

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      try {
        const { data } = await getAllUsers();
        if (!ignore) setUsers(data);
      } catch (err) {
        if (!ignore) setError(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUsers();

    return () => { ignore = true; };
  }, []);

  async function refreshUsers() {
    try {
      setLoading(true);
      const { data } = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function addUser(newUser) {
    try {
      const response = await createUser(newUser);
      setSuccessMessage(response.message);
      await refreshUsers();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function editUser(id, updatedUser) {
    try {
      const response = await updateUser(id, updatedUser);
      setSuccessMessage(response.message);
      await refreshUsers();
      return response.data;
    } catch (err) {
      setError(err);
    }
  }

  async function removeUser(id) {
    try {
      const response = await deleteUser(id);
      setSuccessMessage(response.message);
      await refreshUsers();
    } catch (err) {
      setError(err);
    }
  }

  async function changePassword(id, currentPassword, newPassword) {
    try {
      const response = await updatePassword(id, { currentPassword, newPassword });
      setSuccessMessage(response.message);
    } catch (err) {
      setError(err);
    }
  }

  return {
    users,
    loading,
    error,
    successMessage,
    addUser,
    editUser,
    removeUser,
    changePassword,
    refreshUsers,
  };
}
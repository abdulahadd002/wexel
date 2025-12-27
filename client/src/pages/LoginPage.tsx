import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginForm />;
}

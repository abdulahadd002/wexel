import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common';
import './Header.css';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        <h1 className="header-logo">Wexel</h1>
      </div>
      <div className="header-actions">
        {user && (
          <>
            <span className="header-user">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

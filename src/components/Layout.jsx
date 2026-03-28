import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './layout/Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
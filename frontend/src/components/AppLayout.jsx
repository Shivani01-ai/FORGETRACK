import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="app-main flex">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <TopBar />
        <main className="max-w-[1440px] mx-auto w-full px-6 md:px-8 lg:px-12 pt-8 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

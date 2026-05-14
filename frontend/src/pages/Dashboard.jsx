import React from 'react';
import HeroTicker from '../components/dashboard/HeroTicker';
import SessionCard from '../components/dashboard/SessionCard';
import AttendanceCard from '../components/dashboard/AttendanceCard';
import OverviewCard from '../components/dashboard/OverviewCard';
import ActivityCard from '../components/dashboard/ActivityCard';

export default function Dashboard() {
  return (
    <div className="w-full">
      <HeroTicker />
      
      {/* 2-Up Hero Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SessionCard />
        <AttendanceCard />
      </div>

      {/* 2-Up Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverviewCard />
        <ActivityCard />
      </div>
    </div>
  );
}

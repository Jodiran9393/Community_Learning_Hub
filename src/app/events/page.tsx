"use client";

import Layout from "@/components/Layout";
import EventList from "@/components/events/EventList";
import EventCalendar from "@/components/events/EventCalendar";
import { useState } from "react";

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">Upcoming Events</h1>
          
          <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary-light'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary-light'}`}
            >
              Calendar
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-8">
          <p className="text-lg text-neutral-700 dark:text-neutral-300">
            Join our live events and workshops to learn from experts and connect with other community members.
          </p>
        </div>
        
        {viewMode === 'list' ? <EventList /> : <EventCalendar />}
      </div>
    </Layout>
  );
}

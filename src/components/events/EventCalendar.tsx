"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUpcomingEvents } from '@/lib/supabase/events';
import { Event } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

export default function EventCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    async function loadEvents() {
      try {
        const upcomingEvents = await getUpcomingEvents();
        setEvents(upcomingEvents);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Group events by date
  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(event => {
    const dateKey = format(new Date(event.start_date), 'yyyy-MM-dd');
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  function handlePreviousMonth() {
    setCurrentMonth(subMonths(currentMonth, 1));
  }

  function handleNextMonth() {
    setCurrentMonth(addMonths(currentMonth, 1));
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
      {/* Calendar header */}
      <div className="p-4 bg-primary-light/10 dark:bg-primary-dark/20 flex items-center justify-between">
        <button 
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Previous month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-dark dark:text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold text-primary-dark dark:text-primary-light">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button 
          onClick={handleNextMonth}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Next month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-dark dark:text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {daysInMonth.map((day, i) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const hasEvents = dayEvents.length > 0;
          const today = isSameDay(day, new Date());
          
          return (
            <div 
              key={i} 
              className={`min-h-[100px] p-2 border-b border-r border-neutral-200 dark:border-neutral-700 ${today ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
            >
              <div className="text-right">
                <span className={`inline-block w-7 h-7 leading-7 text-center rounded-full ${today ? 'bg-primary text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                {dayEvents.map((event) => (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.id}`}
                    className={`block text-xs p-1 rounded truncate ${event.is_premium ? 'bg-accent/20 text-accent-dark' : 'bg-primary/20 text-primary-dark dark:bg-primary/30 dark:text-primary-light'}`}
                  >
                    {format(new Date(event.start_date), 'h:mm a')} - {event.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

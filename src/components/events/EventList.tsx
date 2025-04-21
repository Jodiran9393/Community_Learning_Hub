"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUpcomingEvents, getUserEventRegistrations } from '@/lib/supabase/events';
import { Event, EventRegistration } from '@/lib/types';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<Record<string, EventRegistration>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadEvents() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser({ id: session.user.id });
          
          // Load user registrations
          const registrations = await getUserEventRegistrations(session.user.id);
          const registrationMap: Record<string, EventRegistration> = {};
          registrations.forEach(reg => {
            registrationMap[reg.event_id] = reg;
          });
          setUserRegistrations(registrationMap);
        }
        
        // Load upcoming events
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
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading events...</p>
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

  if (events.length === 0) {
    return (
      <div className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
        <p className="text-neutral-600 dark:text-neutral-300">No upcoming events found. Check back soon!</p>
      </div>
    );
  }

  // Group events by month
  const eventsByMonth: Record<string, Event[]> = {};
  events.forEach(event => {
    const monthYear = format(new Date(event.start_date), 'MMMM yyyy');
    if (!eventsByMonth[monthYear]) {
      eventsByMonth[monthYear] = [];
    }
    eventsByMonth[monthYear].push(event);
  });

  return (
    <div className="space-y-8">
      {Object.entries(eventsByMonth).map(([monthYear, monthEvents]) => (
        <div key={monthYear} className="space-y-4">
          <h3 className="text-xl font-bold text-primary-dark">{monthYear}</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {monthEvents.map(event => {
              const isRegistered = userRegistrations[event.id];
              const registrationStatus = isRegistered?.status;
              const isPremium = event.is_premium;
              const isFull = event.max_attendees && event.current_attendees >= event.max_attendees;
              
              return (
                <div 
                  key={event.id} 
                  className={`p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow ${isPremium ? 'border-l-4 border-accent' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-primary-dark">
                        <Link href={`/events/${event.id}`} className="hover:text-primary transition-colors">
                          {event.title}
                        </Link>
                      </h4>
                      <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {format(new Date(event.start_date), 'h:mm a')} - {format(new Date(event.end_date), 'h:mm a')}
                      </div>
                    </div>
                    
                    {isPremium && (
                      <div className="px-3 py-1 bg-accent/20 text-accent-dark text-sm font-medium rounded-full">
                        Premium
                      </div>
                    )}
                  </div>
                  
                  <p className="mt-3 text-neutral-600 dark:text-neutral-300 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {event.is_online ? 'Online Event' : `Location: ${event.location}`}
                    </div>
                    
                    {event.max_attendees && (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {event.current_attendees} / {event.max_attendees} attendees
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    {registrationStatus ? (
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        registrationStatus === 'registered' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                          : 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400'
                      }`}>
                        {registrationStatus === 'registered' ? 'Registered' : 'Waitlisted'}
                      </div>
                    ) : isPremium && !currentUser ? (
                      <Link 
                        href="/pricing" 
                        className="inline-block px-4 py-2 bg-accent hover:bg-accent-dark text-primary-dark font-bold rounded-md transition-colors"
                      >
                        Premium Event
                      </Link>
                    ) : isFull ? (
                      <Link 
                        href={`/events/${event.id}`} 
                        className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                      >
                        Join Waitlist
                      </Link>
                    ) : (
                      <Link 
                        href={`/events/${event.id}`} 
                        className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
                      >
                        Register
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

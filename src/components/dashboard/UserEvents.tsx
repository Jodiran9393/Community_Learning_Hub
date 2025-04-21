"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserEventRegistrations } from '@/lib/supabase/events';
import { Event, EventRegistration } from '@/lib/types';
import { format } from 'date-fns';

export default function UserEvents() {
  const [events, setEvents] = useState<(Event & { registration: EventRegistration })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadEvents() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          return;
        }
        
        // Get user's event registrations
        const registrations = await getUserEventRegistrations(session.user.id);
        
        if (registrations.length === 0) {
          setEvents([]);
          return;
        }
        
        // Get event details for each registration
        const eventIds = registrations.map(reg => reg.event_id);
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds);
          
        if (eventError) throw eventError;
        
        // Combine events with registrations
        const eventsWithRegistrations = eventData.map(event => {
          const registration = registrations.find(reg => reg.event_id === event.id);
          return {
            ...event,
            registration: registration!,
          };
        });
        
        // Sort by start date
        eventsWithRegistrations.sort((a, b) => {
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        });
        
        setEvents(eventsWithRegistrations);
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
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-primary-dark mb-4">Your Events</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-primary-dark mb-4">Your Events</h2>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-primary-dark mb-4">Your Events</h2>
      
      {events.length === 0 ? (
        <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
          <p>You haven't registered for any events yet.</p>
          <Link 
            href="/events"
            className="inline-block mt-2 text-primary hover:text-primary-dark transition-colors"
          >
            Browse events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="border-b border-neutral-200 dark:border-neutral-700 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Link 
                    href={`/events/${event.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {event.title}
                  </Link>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {event.is_online ? 'Online Event' : `Location: ${event.location}`}
                  </p>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      event.registration.status === 'registered' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                        : 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400'
                    }`}>
                      {event.registration.status === 'registered' ? 'Registered' : 'Waitlisted'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary-dark">
                    {format(new Date(event.start_date), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {format(new Date(event.start_date), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="text-center pt-2">
            <Link 
              href="/events"
              className="text-primary hover:text-primary-dark transition-colors"
            >
              View all events
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

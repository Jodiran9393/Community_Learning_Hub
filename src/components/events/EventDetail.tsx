"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEventById, registerForEvent, cancelRegistration, getUserEventRegistrations, userHasPremiumAccess } from '@/lib/supabase/events';
import { Event, EventRegistration } from '@/lib/types';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface EventDetailProps {
  eventId: string;
}

export default function EventDetail({ eventId }: EventDetailProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadEvent() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser({ id: session.user.id });
          
          // Check premium access
          const hasPremium = await userHasPremiumAccess(session.user.id);
          setHasPremiumAccess(hasPremium);
          
          // Load user registrations
          const registrations = await getUserEventRegistrations(session.user.id);
          const eventRegistration = registrations.find(reg => reg.event_id === eventId);
          if (eventRegistration) {
            setRegistration(eventRegistration);
          }
        }
        
        // Load event details
        const eventDetails = await getEventById(eventId);
        if (!eventDetails) {
          setError('Event not found');
          return;
        }
        setEvent(eventDetails);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  async function handleRegister() {
    if (!currentUser || !event) return;
    
    if (event.is_premium && !hasPremiumAccess) {
      router.push('/pricing');
      return;
    }
    
    setRegistering(true);
    setError(null);
    
    try {
      const registration = await registerForEvent(eventId, currentUser.id);
      if (registration) {
        setRegistration(registration);
      } else {
        throw new Error('Failed to register for event');
      }
    } catch (err: any) {
      console.error('Error registering for event:', err);
      setError(err.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  }

  async function handleCancelRegistration() {
    if (!currentUser || !registration) return;
    
    setCancelling(true);
    setError(null);
    
    try {
      const success = await cancelRegistration(registration.id, currentUser.id);
      if (success) {
        setRegistration(null);
      } else {
        throw new Error('Failed to cancel registration');
      }
    } catch (err: any) {
      console.error('Error cancelling registration:', err);
      setError(err.message || 'Failed to cancel registration');
    } finally {
      setCancelling(false);
    }
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
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error || 'Event not found'}</p>
        <button 
          onClick={() => router.push('/events')} 
          className="mt-2 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const isFull = event.max_attendees && event.current_attendees >= event.max_attendees;
  const isPremium = event.is_premium;
  const showRegisterButton = currentUser && !registration;
  const showCancelButton = currentUser && registration;
  const isPremiumBlocked = isPremium && !hasPremiumAccess;

  return (
    <div className="space-y-6">
      {/* Event header */}
      <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">{event.title}</h1>
            <div className="mt-2 text-neutral-500 dark:text-neutral-400">
              {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="mt-1 text-neutral-500 dark:text-neutral-400">
              {format(new Date(event.start_date), 'h:mm a')} - {format(new Date(event.end_date), 'h:mm a')}
            </div>
          </div>
          
          {isPremium && (
            <div className="px-3 py-1 bg-accent/20 text-accent-dark text-sm font-medium rounded-full">
              Premium Event
            </div>
          )}
        </div>
        
        <div className="mt-4 prose dark:prose-invert max-w-none">
          {event.description.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center text-neutral-700 dark:text-neutral-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.is_online ? 'Online Event' : event.location}
          </div>
          
          {event.max_attendees && (
            <div className="flex items-center text-neutral-700 dark:text-neutral-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {event.current_attendees} / {event.max_attendees} attendees
            </div>
          )}
        </div>
      </div>
      
      {/* Registration status */}
      <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-primary-dark mb-4">Registration</h2>
        
        {!currentUser ? (
          <div className="p-4 bg-neutral-100 dark:bg-neutral-700 rounded-md">
            <p className="text-neutral-700 dark:text-neutral-300 mb-2">Please sign in to register for this event.</p>
            <a 
              href="/" 
              className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
            >
              Sign In
            </a>
          </div>
        ) : registration ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-md ${
              registration.status === 'registered' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            }`}>
              <p className={`font-medium ${
                registration.status === 'registered' 
                  ? 'text-green-800 dark:text-green-400' 
                  : 'text-amber-800 dark:text-amber-400'
              }`}>
                {registration.status === 'registered' 
                  ? 'You are registered for this event!' 
                  : 'You are on the waitlist for this event.'}
              </p>
              {registration.status === 'waitlisted' && (
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  We'll notify you if a spot becomes available.
                </p>
              )}
              {registration.status === 'registered' && event.is_online && event.meeting_url && (
                <div className="mt-4">
                  <a 
                    href={event.meeting_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
            
            <button
              onClick={handleCancelRegistration}
              disabled={cancelling}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Registration'}
            </button>
          </div>
        ) : isPremiumBlocked ? (
          <div className="p-4 bg-accent/10 border border-accent rounded-md">
            <p className="text-neutral-700 dark:text-neutral-300 mb-2">
              This is a premium event. Upgrade your subscription to register.
            </p>
            <a 
              href="/pricing" 
              className="inline-block px-4 py-2 bg-accent hover:bg-accent-dark text-primary-dark font-bold rounded-md transition-colors"
            >
              View Subscription Plans
            </a>
          </div>
        ) : isFull ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-amber-800 dark:text-amber-400 font-medium">
                This event is currently full.
              </p>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                You can join the waitlist and we'll notify you if a spot becomes available.
              </p>
            </div>
            
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? 'Joining Waitlist...' : 'Join Waitlist'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-neutral-700 dark:text-neutral-300">
              Secure your spot for this event by registering below.
            </p>
            
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? 'Registering...' : 'Register for Event'}
            </button>
          </div>
        )}
      </div>
      
      {/* Event details */}
      {event.is_online && (
        <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-primary-dark mb-4">How to Join</h2>
          
          {registration?.status === 'registered' && event.meeting_url ? (
            <div>
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                You can join this online event using the link below at the scheduled time.
              </p>
              <a 
                href={event.meeting_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
              >
                Join Meeting
              </a>
            </div>
          ) : (
            <p className="text-neutral-700 dark:text-neutral-300">
              After registering, you will receive the meeting link to join this online event.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

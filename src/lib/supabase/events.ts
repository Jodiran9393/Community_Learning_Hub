"use client";

import { createClient } from '@/lib/supabase/client';
import { Event, EventRegistration, UserProfile } from '@/lib/types';

// Initialize the Supabase client
const supabase = createClient();

// Events
export async function getUpcomingEvents(): Promise<Event[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', now)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data as Event[];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}

export async function getPastEvents(): Promise<Event[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .lt('end_date', now)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data as Event[];
  } catch (error) {
    console.error('Error fetching past events:', error);
    return [];
  }
}

export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;
    return data as Event;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    return null;
  }
}

// Event Registrations
export async function getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data as EventRegistration[];
  } catch (error) {
    console.error(`Error fetching registrations for user ${userId}:`, error);
    return [];
  }
}

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    return data as EventRegistration[];
  } catch (error) {
    console.error(`Error fetching registrations for event ${eventId}:`, error);
    return [];
  }
}

export async function registerForEvent(eventId: string, userId: string): Promise<EventRegistration | null> {
  try {
    // First check if the event exists and has space
    const event = await getEventById(eventId);
    if (!event) throw new Error('Event not found');
    
    // Check if the event is premium and if the user has premium access
    if (event.is_premium) {
      const hasPremium = await userHasPremiumAccess(userId);
      if (!hasPremium) throw new Error('This event requires a premium subscription');
    }
    
    // Check if the event has space
    if (event.max_attendees && event.current_attendees >= event.max_attendees) {
      // Add to waitlist instead
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'waitlisted'
        })
        .select()
        .single();
        
      if (error) throw error;
      return data as EventRegistration;
    }
    
    // Register for the event
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: 'registered'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Increment the current_attendees count
    await supabase
      .from('events')
      .update({ current_attendees: event.current_attendees + 1 })
      .eq('id', eventId);
      
    return data as EventRegistration;
  } catch (error) {
    console.error(`Error registering for event ${eventId}:`, error);
    return null;
  }
}

export async function cancelRegistration(registrationId: string, userId: string): Promise<boolean> {
  try {
    // Get the registration to check if it's valid
    const { data: registration, error: fetchError } = await supabase
      .from('event_registrations')
      .select('*, events!inner(*)')
      .eq('id', registrationId)
      .eq('user_id', userId)
      .single();
      
    if (fetchError) throw fetchError;
    if (!registration) throw new Error('Registration not found');
    
    // Delete the registration
    const { error: deleteError } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', registrationId);
      
    if (deleteError) throw deleteError;
    
    // If the user was registered (not waitlisted), decrement the attendee count
    if (registration.status === 'registered') {
      await supabase
        .from('events')
        .update({ current_attendees: Math.max(0, registration.events.current_attendees - 1) })
        .eq('id', registration.event_id);
        
      // Check if there's someone on the waitlist to move up
      const { data: waitlistedUsers, error: waitlistError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', registration.event_id)
        .eq('status', 'waitlisted')
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (!waitlistError && waitlistedUsers && waitlistedUsers.length > 0) {
        // Move the first waitlisted user to registered
        await supabase
          .from('event_registrations')
          .update({ status: 'registered' })
          .eq('id', waitlistedUsers[0].id);
          
        // Increment the attendee count back up
        await supabase
          .from('events')
          .update({ current_attendees: registration.events.current_attendees })
          .eq('id', registration.event_id);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error cancelling registration ${registrationId}:`, error);
    return false;
  }
}

// Check if user has premium access
export async function userHasPremiumAccess(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.subscription_tier === 'premium' || data.subscription_tier === 'basic';
  } catch (error) {
    console.error(`Error checking premium access for user ${userId}:`, error);
    return false;
  }
}

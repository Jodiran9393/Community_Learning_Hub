"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserSubscription } from '@/lib/stripe/subscription';
import { UserProfile } from '@/lib/types';

export default function UserProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          window.location.href = '/';
          return;
        }
        
        // Get user profile
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setProfile(data as UserProfile);
        
        // Get subscription
        const tier = await getUserSubscription(session.user.id);
        setSubscription(tier);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-primary-dark mb-4">Profile</h2>
        <div className="animate-pulse">
          <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-700 rounded-full mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-primary-dark mb-4">Profile</h2>
        <p className="text-red-600 dark:text-red-400">{error || 'Profile not found'}</p>
      </div>
    );
  }

  // Get first letter of display name for avatar
  const avatarInitial = profile.display_name.charAt(0).toUpperCase();
  
  // Format date
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-primary-dark mb-4">Profile</h2>
      <div className="flex flex-col space-y-4">
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={profile.display_name} 
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {avatarInitial}
          </div>
        )}
        
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Name</p>
          <p className="font-medium">{profile.display_name}</p>
        </div>
        
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Username</p>
          <p className="font-medium">@{profile.username}</p>
        </div>
        
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Member Since</p>
          <p className="font-medium">{memberSince}</p>
        </div>
        
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Current Plan</p>
          <p className="font-medium text-primary capitalize">{subscription}</p>
        </div>
        
        {profile.badges && profile.badges.length > 0 && (
          <div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Badges</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.badges.map((badge, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-primary/10 text-primary-dark text-xs font-medium rounded"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <a 
          href="/dashboard/settings"
          className="block w-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-center font-medium py-2 px-4 rounded transition-colors duration-200"
        >
          Edit Profile
        </a>
      </div>
    </div>
  );
}

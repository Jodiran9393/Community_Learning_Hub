"use client";

import { useState, useEffect } from 'react';
import Layout from "@/components/Layout";
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types';
import Link from 'next/link';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  
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
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    
    try {
      if (!profile) throw new Error('Profile not loaded');
      
      // Check if username is taken (if changed)
      if (username !== profile.username) {
        const { data: existingUser, error: usernameError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();
          
        if (existingUser) {
          throw new Error('Username is already taken');
        }
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          username,
          bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
        
      if (updateError) throw updateError;
      
      setMessage('Profile updated successfully');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Link 
            href="/dashboard"
            className="text-primary hover:text-primary-dark mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-primary-dark mb-8">Account Settings</h1>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-8">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
              <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              <div className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
            </div>
          ) : error && !profile ? (
            <div className="text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {message && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded">
                  {message}
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-2" htmlFor="displayName">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-2" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-neutral-500">@</span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border rounded-md bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-2" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                />
              </div>
              
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-primary-dark mb-4">Email & Password</h2>
          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            Update your email address or change your password.
          </p>
          <div className="space-y-4">
            <div>
              <Link 
                href="/dashboard/settings/email"
                className="inline-block bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-medium py-2 px-4 rounded transition-colors duration-200"
              >
                Change Email
              </Link>
            </div>
            <div>
              <Link 
                href="/dashboard/settings/password"
                className="inline-block bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-medium py-2 px-4 rounded transition-colors duration-200"
              >
                Change Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

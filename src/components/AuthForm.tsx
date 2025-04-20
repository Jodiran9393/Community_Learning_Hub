"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client'; // Use the client we created
import { useEffect, useState } from 'react';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

export default function AuthForm() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  
  useEffect(() => {
    try {
      const supabase = createClient();
      
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session as Session | null);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event: AuthChangeEvent, session: Session | null) => {
          setSession(session);
        }
      );

      // Cleanup listener on component unmount
      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Supabase configuration error:', error);
      setIsSupabaseConfigured(false);
    }
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4 text-primary-dark">Authentication Setup Required</h3>
        <p className="mb-4 text-neutral-700 dark:text-neutral-300">
          To enable authentication features, you need to configure your Supabase credentials.
        </p>
        <div className="p-4 bg-neutral-100 dark:bg-neutral-700 rounded-md">
          <p className="text-sm font-mono mb-2">1. Create a <code>.env.local</code> file in the project root</p>
          <p className="text-sm font-mono mb-2">2. Add the following environment variables:</p>
          <pre className="bg-neutral-200 dark:bg-neutral-800 p-3 rounded text-xs overflow-x-auto">
            NEXT_PUBLIC_SUPABASE_URL=your_supabase_url<br/>
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
          </pre>
          <p className="text-sm mt-2">You can find these values in your Supabase project settings.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
        <Auth
          supabaseClient={createClient()}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']} // Optional: Add social providers
          theme="dark" // Or "light" based on preference or theme detection
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
                button_label: 'Sign in',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: 'Already have an account? Sign in',
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a Password',
                button_label: 'Sign up',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: 'Don\'t have an account? Sign up',
              },
              forgotten_password: {
                email_label: 'Email address',
                password_label: 'Your Password',
                button_label: 'Send reset instructions',
                link_text: 'Forgot your password?',
              },
              update_password: {
                password_label: 'New password',
                button_label: 'Update password',
              },
            },
          }}
        />
      </div>
    );
  } else {
    return (
      <div className="text-center mt-8">
        <p>Logged in as: {session.user.email}</p>
        <button
          onClick={() => createClient().auth.signOut()}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          Sign out
        </button>
      </div>
    );
  }
}

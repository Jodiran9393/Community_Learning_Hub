import Layout from "@/components/Layout";
import { createClient } from "@/lib/supabase/client";
import { TIER_FEATURES, SUBSCRIPTION_TIERS } from "@/lib/stripe";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-primary-dark mb-8">Your Dashboard</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Profile</h2>
              <div className="flex flex-col space-y-4">
                <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                  JD
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">Name</p>
                  <p className="font-medium">John Doe</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">Email</p>
                  <p className="font-medium">john.doe@example.com</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">Member Since</p>
                  <p className="font-medium">April 19, 2025</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">Current Plan</p>
                  <p className="font-medium text-primary">{TIER_FEATURES[SUBSCRIPTION_TIERS.FREE].name}</p>
                </div>
              </div>
              <div className="mt-6">
                <Link 
                  href="/dashboard/settings"
                  className="block w-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-center font-medium py-2 px-4 rounded transition-colors duration-200"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Navigation</h2>
              <nav className="space-y-2">
                <Link 
                  href="/dashboard"
                  className="block py-2 px-3 bg-primary/10 text-primary-dark rounded font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/activity"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Activity
                </Link>
                <Link 
                  href="/dashboard/bookmarks"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Bookmarks
                </Link>
                <Link 
                  href="/dashboard/settings"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Settings
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Subscription Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 border-l-4 border-primary">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-primary-dark">Your Subscription</h2>
                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm font-medium rounded-full">
                  Free Plan
                </span>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                Upgrade your plan to unlock additional features and content.
              </p>
              <Link 
                href="/pricing"
                className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-200"
              >
                View Plans
              </Link>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">You joined the community</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Welcome to the Community Learning Hub!</p>
                    </div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Today</span>
                  </div>
                </div>
                <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
                  <p>No other recent activity</p>
                </div>
              </div>
            </div>
            
            {/* Upcoming Events */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Upcoming Events</h2>
              <div className="space-y-4">
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Introduction to AI Ethics</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Virtual Workshop</p>
                    </div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">May 15, 2025</span>
                  </div>
                </div>
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Community Project Showcase</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Online Meetup</p>
                    </div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">June 5, 2025</span>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <Link 
                    href="/events"
                    className="text-primary hover:text-primary-dark transition-colors duration-200"
                  >
                    View all events
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

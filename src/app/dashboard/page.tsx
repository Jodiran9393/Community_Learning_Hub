"use client";

import Layout from "@/components/Layout";
import UserProfileCard from "@/components/dashboard/UserProfile";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import UserActivity from "@/components/dashboard/UserActivity";
import UserEvents from "@/components/dashboard/UserEvents";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-primary-dark mb-8">Your Dashboard</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <UserProfileCard />
            
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
                  href="/dashboard/subscription"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Subscription
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
            <SubscriptionCard />
            
            {/* Recent Activity */}
            <UserActivity />
            
            {/* Upcoming Events */}
            <UserEvents />
          </div>
        </div>
      </div>
    </Layout>
  );
}

import Layout from "@/components/Layout";
import Link from "next/link";

export default function AdminPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-primary-dark mb-8">Admin Dashboard</h1>
        
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Admin Menu</h2>
              <nav className="space-y-2">
                <Link 
                  href="/admin"
                  className="block py-2 px-3 bg-primary/10 text-primary-dark rounded font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/users"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Users
                </Link>
                <Link 
                  href="/admin/content"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Content
                </Link>
                <Link 
                  href="/admin/subscriptions"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Subscriptions
                </Link>
                <Link 
                  href="/admin/forum"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Forum Management
                </Link>
                <Link 
                  href="/admin/events"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Events
                </Link>
                <Link 
                  href="/admin/settings"
                  className="block py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors duration-200"
                >
                  Settings
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-primary-dark">128</p>
                <div className="mt-2 flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-green-500">+12% this week</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Active Subscriptions</h3>
                <p className="text-3xl font-bold text-primary-dark">42</p>
                <div className="mt-2 flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-green-500">+8% this month</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Forum Posts</h3>
                <p className="text-3xl font-bold text-primary-dark">256</p>
                <div className="mt-2 flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-green-500">+24% this week</span>
                </div>
              </div>
            </div>
            
            {/* Recent Users */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-xl font-bold text-primary-dark">Recent Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Plan
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-light rounded-full flex items-center justify-center text-white font-bold">
                            JD
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white">John Doe</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">john.doe@example.com</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        Basic
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        April 19, 2025
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-accent rounded-full flex items-center justify-center text-primary-dark font-bold">
                            JS
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white">Jane Smith</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">jane.smith@example.com</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        Premium
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        April 18, 2025
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-300 font-bold">
                            RJ
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white">Robert Johnson</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">robert.j@example.com</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        Free
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        April 17, 2025
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 text-center">
                <Link 
                  href="/admin/users"
                  className="text-primary hover:text-primary-dark transition-colors duration-200"
                >
                  View all users
                </Link>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">New user registered</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">John Doe (john.doe@example.com)</p>
                    </div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Today, 2:30 PM</span>
                  </div>
                </div>
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">New subscription</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Jane Smith upgraded to Premium</p>
                    </div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Today, 1:15 PM</span>
                  </div>
                </div>
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">New blog post published</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Welcome to the Community Learning Hub</p>
                    </div>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Today, 10:45 AM</span>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <Link 
                    href="/admin/activity"
                    className="text-primary hover:text-primary-dark transition-colors duration-200"
                  >
                    View all activity
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

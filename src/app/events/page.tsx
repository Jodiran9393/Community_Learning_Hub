import Layout from "@/components/Layout";

export default function EventsPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-primary-dark mb-8">Upcoming Events</h1>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-8">
          <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-4">
            Join our live events and workshops to learn from experts and connect with other community members.
          </p>
          
          <div className="p-4 bg-accent/10 border border-accent rounded-md">
            <p className="font-medium text-primary-dark">
              This feature is coming soon! We're working on integrating a calendar and event registration system.
            </p>
          </div>
        </div>
        
        {/* Placeholder for future events */}
        <div className="grid gap-6">
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border-l-4 border-primary">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-dark">Introduction to AI Ethics</h3>
                <p className="text-neutral-600 dark:text-neutral-400">Virtual Workshop</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">May 15, 2025</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">2:00 PM - 4:00 PM EST</p>
              </div>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              Join us for a comprehensive introduction to the ethical considerations in AI development and deployment.
            </p>
            <button className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors duration-200">
              Coming Soon
            </button>
          </div>
          
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border-l-4 border-accent">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-dark">Community Project Showcase</h3>
                <p className="text-neutral-600 dark:text-neutral-400">Online Meetup</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-accent-dark">June 5, 2025</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">6:00 PM - 8:00 PM EST</p>
              </div>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              Members will present their AI projects and receive feedback from the community. Great networking opportunity!
            </p>
            <button className="bg-accent hover:bg-accent-dark text-primary-dark font-medium py-2 px-4 rounded transition-colors duration-200">
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

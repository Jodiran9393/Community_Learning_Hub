import Layout from "@/components/Layout";

export default function ForumPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-primary-dark mb-8">Community Forum</h1>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-8">
          <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-4">
            Connect with other learners, share your projects, and get help from the community.
          </p>
          
          <div className="p-4 bg-accent/10 border border-accent rounded-md">
            <p className="font-medium text-primary-dark">
              This feature is coming soon! We're integrating Supabase real-time capabilities for a seamless forum experience.
            </p>
          </div>
        </div>
        
        {/* Placeholder for future forum categories */}
        <div className="grid gap-6">
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-primary-dark mb-2">General Discussion</h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              Introduce yourself and discuss general topics related to AI and machine learning.
            </p>
            <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>0 threads</span>
              <span>0 posts</span>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-primary-dark mb-2">Project Showcase</h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              Share your AI projects and get feedback from the community.
            </p>
            <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>0 threads</span>
              <span>0 posts</span>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-primary-dark mb-2">Help & Support</h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              Ask questions and get help with your AI learning journey.
            </p>
            <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>0 threads</span>
              <span>0 posts</span>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-primary-dark mb-2">Resources & Tutorials</h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              Share and discover learning resources, tutorials, and articles.
            </p>
            <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>0 threads</span>
              <span>0 posts</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

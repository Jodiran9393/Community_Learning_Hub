import Layout from "@/components/Layout";
import CategoryList from "@/components/forum/CategoryList";

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
        
        {/* Forum Categories */}
        <h2 className="text-2xl font-bold text-primary-dark mb-4">Categories</h2>
        <CategoryList />
      </div>
    </Layout>
  );
}

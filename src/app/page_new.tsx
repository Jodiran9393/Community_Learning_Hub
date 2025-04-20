import Layout from "@/components/Layout";
import AuthForm from "@/components/AuthForm";
import Link from "next/link";

export default function Home() {
  return (
    <Layout>
      <div className="text-center py-10">
        <h2 className="text-4xl font-bold text-primary-dark mb-4">
          Welcome to the Community Learning Hub!
        </h2>
        <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6">
          Learn, share, and grow together.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link href="/blog" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-full transition-colors duration-200">
            Explore Blog
          </Link>
          <Link href="/pricing" className="bg-accent hover:bg-accent-dark text-primary-dark font-bold py-2 px-6 rounded-full transition-colors duration-200">
            View Plans
          </Link>
        </div>
      </div>

      {/* Featured Content Section */}
      <div className="max-w-6xl mx-auto mb-16">
        <h3 className="text-2xl font-bold text-primary-dark mb-6 text-center">Featured Content</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-primary/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold text-primary-dark mb-2">Learn AI Fundamentals</h4>
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">Start your journey with our beginner-friendly guides to AI concepts.</p>
              <Link href="/blog" className="text-primary hover:text-primary-dark font-medium transition-colors">
                Read more →
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-accent/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold text-primary-dark mb-2">Join Our Community</h4>
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">Connect with like-minded learners and share your AI journey.</p>
              <Link href="/forum" className="text-primary hover:text-primary-dark font-medium transition-colors">
                Explore forum →
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-primary-light/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold text-primary-dark mb-2">Upcoming Events</h4>
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">Attend workshops and webinars hosted by AI experts.</p>
              <Link href="/events" className="text-primary hover:text-primary-dark font-medium transition-colors">
                View calendar →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold text-primary-dark mb-6 text-center">Join Our Community</h3>
        <AuthForm />
      </div>
    </Layout>
  );
}

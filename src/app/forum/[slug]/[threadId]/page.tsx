"use client";

import { useParams } from 'next/navigation';
import Layout from "@/components/Layout";
import ThreadView from "@/components/forum/ThreadView";
import Link from 'next/link';

export default function ThreadPage() {
  const params = useParams();
  const slug = params.slug as string;
  const threadId = params.threadId as string;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Link 
            href={`/forum/${slug}`} 
            className="text-primary hover:text-primary-dark transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Category
          </Link>
        </div>
        
        <ThreadView threadId={threadId} categorySlug={slug} />
      </div>
    </Layout>
  );
}

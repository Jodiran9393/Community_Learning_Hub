"use client";

import { useParams } from 'next/navigation';
import Layout from "@/components/Layout";
import EventDetail from "@/components/events/EventDetail";
import Link from 'next/link';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Link 
            href="/events" 
            className="text-primary hover:text-primary-dark transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Events
          </Link>
        </div>
        
        <EventDetail eventId={eventId} />
      </div>
    </Layout>
  );
}

// Forum Types
export type ForumCategory = {
  id: string;
  name: string;
  description: string;
  slug: string;
  created_at: string;
  is_premium: boolean; // Whether this category requires a premium subscription
};

export type ForumThread = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
};

export type ForumPost = {
  id: string;
  content: string;
  thread_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_solution: boolean;
};

export type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  post_count: number;
  thread_count: number;
  badges: string[];
};

// Subscription Types
export type SubscriptionTier = {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  stripe_price_id: string;
};

// Event Types
export type Event = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  is_online: boolean;
  meeting_url?: string;
  is_premium: boolean; // Whether this event requires a premium subscription
  max_attendees?: number;
  current_attendees: number;
};

export type EventRegistration = {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  status: 'registered' | 'waitlisted' | 'cancelled';
};

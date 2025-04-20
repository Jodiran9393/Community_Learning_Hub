import Layout from "@/components/Layout";
import { TIER_FEATURES, SUBSCRIPTION_TIERS } from "@/lib/stripe";
import Link from "next/link";

export default function PricingPage() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary-dark mb-4">Membership Plans</h1>
          <p className="text-lg text-neutral-700 dark:text-neutral-300 max-w-3xl mx-auto">
            Join our community and get access to exclusive content, forum discussions, and live events.
            Choose the plan that works best for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-700 flex flex-col">
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {TIER_FEATURES[SUBSCRIPTION_TIERS.FREE].name}
              </h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-extrabold text-neutral-900 dark:text-white">
                  Free
                </span>
              </div>
              <p className="mt-5 text-neutral-500 dark:text-neutral-400">
                Get started with basic access
              </p>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-4">
                {TIER_FEATURES[SUBSCRIPTION_TIERS.FREE].features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg className="h-6 w-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
              <Link 
                href="/auth/signup"
                className="block w-full bg-primary-light hover:bg-primary text-white text-center font-medium py-3 px-4 rounded transition-colors duration-200"
              >
                Sign up for free
              </Link>
            </div>
          </div>

          {/* Basic Tier */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl overflow-hidden border-2 border-primary flex flex-col transform scale-105 z-10">
            <div className="p-1 bg-primary text-white text-center font-medium">
              Most Popular
            </div>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {TIER_FEATURES[SUBSCRIPTION_TIERS.BASIC].name}
              </h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-extrabold text-neutral-900 dark:text-white">
                  ${TIER_FEATURES[SUBSCRIPTION_TIERS.BASIC].price}
                </span>
                <span className="ml-1 text-xl font-medium text-neutral-500 dark:text-neutral-400">/month</span>
              </div>
              <p className="mt-5 text-neutral-500 dark:text-neutral-400">
                Perfect for active community members
              </p>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-4">
                {TIER_FEATURES[SUBSCRIPTION_TIERS.BASIC].features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg className="h-6 w-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
              <button 
                className="block w-full bg-primary hover:bg-primary-dark text-white text-center font-medium py-3 px-4 rounded transition-colors duration-200"
                onClick={() => alert('Subscription functionality coming soon!')}
              >
                Subscribe Now
              </button>
            </div>
          </div>

          {/* Premium Tier */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-700 flex flex-col">
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {TIER_FEATURES[SUBSCRIPTION_TIERS.PREMIUM].name}
              </h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-extrabold text-neutral-900 dark:text-white">
                  ${TIER_FEATURES[SUBSCRIPTION_TIERS.PREMIUM].price}
                </span>
                <span className="ml-1 text-xl font-medium text-neutral-500 dark:text-neutral-400">/month</span>
              </div>
              <p className="mt-5 text-neutral-500 dark:text-neutral-400">
                For dedicated learners who want it all
              </p>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-4">
                {TIER_FEATURES[SUBSCRIPTION_TIERS.PREMIUM].features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg className="h-6 w-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
              <button 
                className="block w-full bg-accent hover:bg-accent-dark text-primary-dark text-center font-medium py-3 px-4 rounded transition-colors duration-200"
                onClick={() => alert('Subscription functionality coming soon!')}
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-primary-dark mb-4">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto grid gap-6 mt-8">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-primary-dark mb-2">Can I change my plan later?</h3>
              <p className="text-neutral-700 dark:text-neutral-300">Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-primary-dark mb-2">How do I cancel my subscription?</h3>
              <p className="text-neutral-700 dark:text-neutral-300">You can cancel your subscription from your account settings. Your access will continue until the end of your current billing period.</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-primary-dark mb-2">Do you offer refunds?</h3>
              <p className="text-neutral-700 dark:text-neutral-300">We offer a 14-day money-back guarantee. If you're not satisfied with your subscription, contact us within 14 days of purchase for a full refund.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

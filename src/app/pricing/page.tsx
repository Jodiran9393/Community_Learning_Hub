"use client";

import Layout from "@/components/Layout";
import PricingPlans from "@/components/subscription/PricingPlans";

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

        <PricingPlans />

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

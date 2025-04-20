"use client";

import { useEffect, useState } from 'react';

export default function EnvTest() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: string | null;
    supabaseKeyPartial: string | null;
  }>({ supabaseUrl: null, supabaseKeyPartial: null });

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setEnvStatus({
      supabaseUrl: url || null,
      // Only show first 5 chars of the key for security
      supabaseKeyPartial: key ? `${key.substring(0, 5)}...` : null
    });
  }, []);

  return (
    <div className="p-4 bg-neutral-100 dark:bg-neutral-700 rounded-md my-4">
      <h3 className="text-lg font-bold mb-2">Environment Variables Status</h3>
      <p className="mb-1">
        <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {envStatus.supabaseUrl ? "✅ Found" : "❌ Missing"}
      </p>
      <p className="mb-1">
        <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {envStatus.supabaseKeyPartial ? `✅ Found (starts with ${envStatus.supabaseKeyPartial})` : "❌ Missing"}
      </p>
      <div className="mt-4 text-sm">
        <p className="font-semibold">Troubleshooting Tips:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Ensure .env.local is in the root directory (not in src)</li>
          <li>Verify the environment variable names are exactly as shown</li>
          <li>Restart the development server after making changes</li>
          <li>Check for any syntax errors in your .env.local file</li>
        </ul>
      </div>
    </div>
  );
}

// app/page.tsx 또는 app/chat/page.tsx
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import Chat from "@/components/Chat";

export default function ChatBot() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    return <div>Please log in to use the chatbot.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Chat with AI</h1>
        <Chat userId={userId} />
      </div>
    </div>
  );
}


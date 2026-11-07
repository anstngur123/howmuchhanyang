'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-blue-600 tracking-tight">
          얼마하냥?
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold">
          <Link href="/" className="text-gray-700 hover:text-blue-600">상품 목록</Link>
          <Link href="/items/new" className="text-gray-700 hover:text-blue-600">상품 등록</Link>
          <Link href="/my-trades" className="text-gray-700 hover:text-blue-600">내 거래</Link>
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l">
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {user.email} (시연계정)
              </span>
              <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

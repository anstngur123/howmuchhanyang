'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert('로그인 실패: ' + error.message);
    router.push('/');
  };

  const handleSignUp = async () => {
    if (!email || !password) return alert('이메일과 비밀번호(6자 이상)를 입력하세요.');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert('가입 실패: ' + error.message);
    alert('시연 계정 생성 및 로그인 완료!');
    router.push('/');
  };

  return (
    <main className="max-w-md mx-auto mt-12 p-6 bg-white border rounded-2xl shadow-sm">
      <h1 className="text-xl font-bold mb-2">시연 계정 로그인</h1>
      <p className="text-xs text-gray-500 mb-6">
        ※ MVP 시연용 테스트 로그인입니다. (실제 한양대 포털/이메일 인증은 추후 연동)
      </p>

      <form onSubmit={handleLogin} className="space-y-4 text-sm">
        <div>
          <label className="block font-semibold mb-1">이메일</label>
          <input
            type="email"
            placeholder="예: user_a@hanyang.ac.kr"
            className="w-full border p-2.5 rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">비밀번호 (6자 이상)</label>
          <input
            type="password"
            placeholder="******"
            className="w-full border p-2.5 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
        >
          로그인
        </button>
        <button
          type="button"
          onClick={handleSignUp}
          className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200"
        >
          이 입력 정보로 시연 계정 즉시 가입
        </button>
      </form>
    </main>
  );
}

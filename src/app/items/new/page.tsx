'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TradeType } from '@/types';

export default function NewItemPage() {
  const router = useRouter();
  const [type, setType] = useState<TradeType>('SALE');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('한양플라자 앞');
  const [description, setDescription] = useState('');
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert('로그인이 필요합니다.');
      return router.push('/login');
    }

    const numPrice = Number(price);
    if (!title.trim() || !description.trim() || !location.trim()) {
      return alert('필수 항목을 모두 입력해주세요.');
    }
    if (isNaN(numPrice) || numPrice < 0) {
      return alert('가격은 0원 이상이어야 합니다.');
    }
    if (type === 'RENTAL') {
      if (!rentalStart || !rentalEnd || rentalStart > rentalEnd) {
        return alert('올바른 대여 가능 시작일과 종료일을 입력해주세요.');
      }
    }

    setLoading(true);
    const { error } = await supabase.from('items').insert({
      seller_id: userData.user.id,
      seller_email: userData.user.email,
      title,
      description,
      type,
      price: numPrice,
      location,
      status: 'AVAILABLE',
      rental_start_date: type === 'RENTAL' ? rentalStart : null,
      rental_end_date: type === 'RENTAL' ? rentalEnd : null,
    });
    setLoading(false);

    if (error) return alert('등록 실패: ' + error.message);
    router.push('/');
  };

  return (
    <main className="max-w-xl mx-auto p-6 bg-white border rounded-2xl shadow-sm mt-8">
      <h1 className="text-xl font-bold mb-6">물건 올리기</h1>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType('SALE')}
            className={`flex-1 py-2 font-bold rounded-lg ${
              type === 'SALE' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
            }`}
          >
            판매하기
          </button>
          <button
            type="button"
            onClick={() => setType('RENTAL')}
            className={`flex-1 py-2 font-bold rounded-lg ${
              type === 'RENTAL' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'
            }`}
          >
            빌려주기 (대여)
          </button>
        </div>

        <div>
          <label className="block font-semibold mb-1">상품 제목</label>
          <input
            type="text"
            className="w-full border p-2.5 rounded-lg"
            placeholder="예: 전공책, 닌텐도 스위치"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            {type === 'SALE' ? '판매 가격 (원)' : '1일 대여료 (원)'}
          </label>
          <input
            type="number"
            min="0"
            className="w-full border p-2.5 rounded-lg"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {type === 'RENTAL' && (
          <div className="grid grid-cols-2 gap-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div>
              <label className="block text-xs font-bold text-purple-800 mb-1">대여 가능 시작일</label>
              <input
                type="date"
                className="w-full border p-2 rounded bg-white"
                value={rentalStart}
                onChange={(e) => setRentalStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-800 mb-1">대여 가능 종료일</label>
              <input
                type="date"
                className="w-full border p-2 rounded bg-white"
                value={rentalEnd}
                onChange={(e) => setRentalEnd(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block font-semibold mb-1">거래 희망 장소</label>
          <input
            type="text"
            className="w-full border p-2.5 rounded-lg"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">상세 설명</label>
          <textarea
            className="w-full border p-2.5 rounded-lg h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '등록 중...' : '등록 완료'}
        </button>
      </form>
    </main>
  );
}

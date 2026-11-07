'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Item } from '@/types';

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      const { data } = await supabase.from('items').select('*').eq('id', id).single();
      if (data) setItem(data);
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  if (loading) return <p className="p-8 text-center">불러오는 중...</p>;
  if (!item) return <p className="p-8 text-center">상품을 찾을 수 없습니다.</p>;

  // 대여 일수 계산 (시작일·종료일 모두 포함, 같은 날 = 1일)
  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const days = calcDays();
  const totalPrice = days * item.price;

  const handleRequest = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      alert('로그인이 필요합니다.');
      return router.push('/login');
    }
    if (user.id === item.seller_id) {
      return alert('본인이 등록한 상품에는 요청할 수 없습니다.');
    }
    if (item.type === 'SALE' && item.status !== 'AVAILABLE') {
      return alert('이미 예약중이거나 판매 완료된 상품입니다.');
    }

    // 대여 날짜 검증 (한국 시간 날짜 기준)
    if (item.type === 'RENTAL') {
      const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (!startDate || !endDate || days <= 0) {
        return alert('올바른 대여 시작일과 종료일을 선택해주세요.');
      }
      if (startDate < todayKST) {
        return alert('과거 날짜로는 대여를 신청할 수 없습니다.');
      }
      if (
        (item.rental_start_date && startDate < item.rental_start_date) ||
        (item.rental_end_date && endDate > item.rental_end_date)
      ) {
        return alert(`대여 가능 기간(${item.rental_start_date} ~ ${item.rental_end_date}) 내에서만 선택해주세요.`);
      }
    }

    // 중복 PENDING 요청 확인
    const { data: existing } = await supabase
      .from('trade_requests')
      .select('id')
      .eq('item_id', item.id)
      .eq('buyer_id', user.id)
      .eq('status', 'PENDING');

    if (existing && existing.length > 0) {
      return alert('이미 대기 중인 요청이 있습니다.');
    }

    const { error } = await supabase.from('trade_requests').insert({
      item_id: item.id,
      buyer_id: user.id,
      buyer_email: user.email,
      status: 'PENDING',
      start_date: item.type === 'RENTAL' ? startDate : null,
      end_date: item.type === 'RENTAL' ? endDate : null,
    });

    if (error) return alert('요청 실패: ' + error.message);
    alert('요청이 완료되었습니다! 내 거래 화면으로 이동합니다.');
    router.push('/my-trades');
  };

  return (
    <main className="max-w-xl mx-auto p-6 bg-white border rounded-2xl shadow-sm mt-8 space-y-5">
      {/* 기본 이미지 영역 */}
      <div className="w-full h-44 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium">
        [기본 상품 이미지 - {item.type === 'SALE' ? '중고판매' : '방학대여'}]
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
          {item.type === 'SALE' ? '판매' : '대여'} / {item.status}
        </span>
        <span className="text-xs text-gray-500">등록자: {item.seller_email}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <p className="text-sm text-gray-500 mt-1">거래 장소: {item.location}</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap">
        {item.description}
      </div>

      <div className="text-xl font-extrabold">
        {item.type === 'SALE'
          ? `판매가: ${item.price.toLocaleString()}원`
          : `1일 대여료: ${item.price.toLocaleString()}원`}
      </div>

      {item.type === 'RENTAL' && (
        <div className="border border-purple-200 bg-purple-50 p-4 rounded-xl space-y-3 text-sm">
          <p className="font-bold text-purple-900">
            대여 가능 기간: {item.rental_start_date} ~ {item.rental_end_date}
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              className="border p-2 rounded bg-white flex-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>~</span>
            <input
              type="date"
              className="border p-2 rounded bg-white flex-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {days > 0 && (
            <p className="text-right font-bold text-purple-800">
              총 {days}일 × {item.price.toLocaleString()}원 = {totalPrice.toLocaleString()}원 (안내 금액)
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleRequest}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl"
      >
        {item.type === 'SALE' ? '구매 요청 보내기' : '대여 요청 보내기'}
      </button>
    </main>
  );
}

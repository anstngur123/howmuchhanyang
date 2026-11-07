'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Item, TradeRequest } from '@/types';

export default function MyTradesPage() {
  const router = useRouter();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [receivedReqs, setReceivedReqs] = useState<TradeRequest[]>([]);
  const [sentReqs, setSentReqs] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      alert('로그인이 필요합니다.');
      return router.push('/login');
    }

    // 1. 내가 등록한 상품
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    const myItemList = items || [];
    setMyItems(myItemList);

    // 2. 내가 받은 요청 (내 상품들에 들어온 요청)
    if (myItemList.length > 0) {
      const itemIds = myItemList.map((i) => i.id);
      const { data: rec } = await supabase
        .from('trade_requests')
        .select('*, items(*)')
        .in('item_id', itemIds)
        .order('created_at', { ascending: false });
      setReceivedReqs(rec || []);
    }

    // 3. 내가 보낸 요청
    const { data: sent } = await supabase
      .from('trade_requests')
      .select('*, items(*)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    setSentReqs(sent || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 요청 승인 처리 (판매 중복 방지 & 대여 날짜 겹침 검사)
  const handleApprove = async (req: TradeRequest) => {
    const item = req.items;
    if (!item) return;

    if (item.type === 'SALE') {
      // 최신 상품 상태 재확인
      const { data: freshItem } = await supabase
        .from('items')
        .select('status')
        .eq('id', item.id)
        .single();

      if (freshItem?.status !== 'AVAILABLE') {
        return alert('이미 예약되었거나 판매 완료된 상품은 추가 승인할 수 없습니다.');
      }

      await supabase.from('items').update({ status: 'RESERVED' }).eq('id', item.id);
      await supabase.from('trade_requests').update({ status: 'APPROVED' }).eq('id', req.id);
    } else {
      // 대여: 기존 APPROVED 요청들과 하루라도 겹치는지 DB 재조회 검사
      const { data: approvedList } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('item_id', item.id)
        .eq('status', 'APPROVED');

      const hasOverlap = (approvedList || []).some((app) => {
        return req.start_date! <= app.end_date! && req.end_date! >= app.start_date!;
      });

      if (hasOverlap) {
        return alert('이미 승인된 대여 기간과 하루 이상 겹쳐서 승인할 수 없습니다.');
      }

      await supabase.from('trade_requests').update({ status: 'APPROVED' }).eq('id', req.id);
    }

    loadData();
  };

  // 거절 처리
  const handleReject = async (reqId: string) => {
    await supabase.from('trade_requests').update({ status: 'REJECTED' }).eq('id', reqId);
    loadData();
  };

  // 완료 처리 (판매 완료 or 대여 반납 완료)
  const handleComplete = async (req: TradeRequest) => {
    const item = req.items;
    if (!item) return;

    await supabase.from('trade_requests').update({ status: 'COMPLETED' }).eq('id', req.id);
    if (item.type === 'SALE') {
      await supabase.from('items').update({ status: 'COMPLETED' }).eq('id', item.id);
    }
    loadData();
  };

  if (loading) return <p className="p-8 text-center">거래 내역을 불러오는 중...</p>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">내 거래 관리</h1>

      {/* 1. 받은 구매/대여 요청 */}
      <section className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-bold mb-4 pb-2 border-b">받은 구매·대여 요청 (판매자 전용)</h2>
        {receivedReqs.length === 0 ? (
          <p className="text-sm text-gray-400">아직 받은 요청이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {receivedReqs.map((req) => (
              <div key={req.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 rounded">
                    {req.items?.type === 'SALE' ? '판매' : '대여'}
                  </span>
                  <p className="font-bold">{req.items?.title}</p>
                  <p className="text-xs text-gray-500">요청자: {req.buyer_email}</p>
                  {req.items?.type === 'RENTAL' && (
                    <p className="text-xs text-purple-700 font-semibold">
                      신청 대여기간: {req.start_date} ~ {req.end_date}
                    </p>
                  )}
                  <p className="text-xs font-bold text-blue-600">요청 상태: {req.status}</p>
                </div>

                <div className="flex gap-2">
                  {req.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(req)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1.5 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200"
                      >
                        거절
                      </button>
                    </>
                  )}
                  {req.status === 'APPROVED' && (
                    <button
                      onClick={() => handleComplete(req)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                    >
                      {req.items?.type === 'SALE' ? '판매 완료 처리' : '반납 완료 처리'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. 내가 보낸 요청 */}
      <section className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-bold mb-4 pb-2 border-b">내가 보낸 요청 (구매/대여자 전용)</h2>
        {sentReqs.length === 0 ? (
          <p className="text-sm text-gray-400">보낸 요청이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {sentReqs.map((req) => (
              <div key={req.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold">{req.items?.title}</p>
                  {req.start_date && (
                    <p className="text-xs text-purple-700">
                      대여 기간: {req.start_date} ~ {req.end_date}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">가격: {req.items?.price.toLocaleString()}원</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. 내가 등록한 상품 */}
      <section className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-bold mb-4 pb-2 border-b">내가 등록한 상품</h2>
        {myItems.length === 0 ? (
          <p className="text-sm text-gray-400">등록한 상품이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {myItems.map((item) => (
              <div key={item.id} className="border p-3 rounded flex justify-between text-sm">
                <span className="font-semibold">
                  [{item.type === 'SALE' ? '판매' : '대여'}] {item.title}
                </span>
                <span className="text-gray-500 font-medium">{item.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

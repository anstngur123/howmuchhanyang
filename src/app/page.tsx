'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Item } from '@/types';

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">캠퍼스 벼룩 & 방학 대여</h1>
          <p className="text-sm text-gray-500 mt-1">종강 후 남는 물건을 판매하거나 방학 동안 빌려주세요.</p>
        </div>
        <Link
          href="/items/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg"
        >
          + 물건 올리기
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-12 text-gray-500">상품 목록을 불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white text-gray-400">
          아직 등록된 상품이 없습니다. 첫 상품을 등록해 보세요!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="block border border-gray-200 bg-white p-5 rounded-xl shadow-sm hover:border-blue-400 transition"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2 items-center">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      item.type === 'SALE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {item.type === 'SALE' ? '판매' : '대여'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {item.status === 'AVAILABLE' ? '거래가능' : item.status === 'RESERVED' ? '예약중' : '거래완료'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{item.location}</span>
              </div>

              <h2 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h2>
              <p className="text-sm text-gray-500 line-clamp-1 mb-4">{item.description}</p>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-extrabold text-base">
                  {item.type === 'SALE'
                    ? `${item.price.toLocaleString()}원`
                    : `1일 ${item.price.toLocaleString()}원`}
                </span>
                <span className="text-xs text-blue-600 font-semibold">상세보기 &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

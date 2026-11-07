export type TradeType = 'SALE' | 'RENTAL';
export type ItemStatus = 'AVAILABLE' | 'RESERVED' | 'COMPLETED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Item {
  id: string;
  seller_id: string;
  seller_email: string;
  title: string;
  description: string;
  type: TradeType;
  price: number;
  location: string;
  status: ItemStatus;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  created_at: string;
}

export interface TradeRequest {
  id: string;
  item_id: string;
  buyer_id: string;
  buyer_email: string;
  status: RequestStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  items?: Item; // Join 조회용
}

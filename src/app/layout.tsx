import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: '얼마하냥? - 한양대 중고판매 & 방학대여',
  description: '한양대 학생들을 위한 종강 벼룩시장 및 대여 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}

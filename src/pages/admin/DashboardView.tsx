import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Armchair, Users, Clock,
  MoreHorizontal, RotateCcw, Utensils, Loader2, Calendar, User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { tableService } from '@/services/tableService';

// --- INTERFACE ---
interface TableData {
  maBan: string;
  tenBan: string;
  sucChua: number;
  maTrangThai?: string; 
  tenTrangThai?: string; 
  trangThaiHienThi?: string; 
  maTrangThai?: string;
  tenTrangThai?: string; // Tên hiển thị (Trống, Đang phục vụ...)
  trangThaiHienThi?: string; // Trạng thái từ API GetManagerTableStatus
  maTang?: string;
  tenTang?: string;
  thoiGianVao?: string;
  ghiChu?: string; 
  maDonHang?: string; 
}

interface TangData {
  maTang: string;
  tenTang: string;
}

const DashboardView: React.FC = () => {
  const { user } = useAuth();

  // State Data
  const [tables, setTables] = useState<TableData[]>([]);
  const [tangs, setTangs] = useState<TangData[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE BỘ LỌC ---
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeople, setSelectedPeople] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // State Thời gian
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // --- GỌI API ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Gọi API Dashboard lúc:", selectedTime);
        const [tablesData, tangsData] = await Promise.all([
          tableService.getDashboardTableStatusManager(selectedTime).catch(err => []),
          tableService.getTangs().catch(err => [])
        ]);
        setTables(tablesData || []);
        setTangs(tangsData || []);
      } catch (error) {
        console.error("Lỗi hệ thống:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTime]);

  // --- LOGIC LỌC CLIENT-SIDE (ĐÃ CHUẨN HÓA) ---
  const filteredTables = tables.filter(t => {
    // 1. Lọc Tầng
    const matchFloor = selectedFloor === 'all' || t.maTang === selectedFloor;

    // 2. Lọc Trạng Thái
    const statusToCheck = t.trangThaiHienThi || t.tenTrangThai || '';
    let matchStatus = true;
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'trong') {
        matchStatus = statusToCheck === 'Trống' || statusToCheck === 'Đang trống';
      } else if (selectedStatus === 'dang_phuc_vu') {
        matchStatus = statusToCheck === 'Đang phục vụ' ||
          statusToCheck === 'Chờ t hanh toán' ||
          statusToCheck === 'Đang phục vụ (Walk-in/Cũ)';
      } else if (selectedStatus === 'dat_truoc') {
        matchStatus = statusToCheck.includes('Đã đặt') ||
          statusToCheck === 'Đã đặt  (Sắp đến)' ||
          statusToCheck === 'Đã đặt (Quá giờ)';
      } else if (selectedStatus === 'bao_tri') {
        matchStatus = statusToCheck === 'Bảo trì';
      }
    }

    // 3. Lọc Số Người
    // Logic: Chỉ ẩn bàn khi nó QUÁ LỚN (lãng phí). Bàn nhỏ (để ghép) vẫn hiện.
    let matchPeople = true;
    if (selectedPeople && parseInt(selectedPeople) > 0) {
        const numPeople = parseInt(selectedPeople);
        const capacity = Number(t.sucChua);
        const MAX_EXTRA_SEATS = 3; // Cho phép dư tối đa 4 ghế

        // Điều kiện ẩn: Sức chứa lớn hơn Số khách quá 4 đơn vị
        if ((capacity - numPeople) > MAX_EXTRA_SEATS) {
            matchPeople = false; // Ẩn đi
        } else {
            matchPeople = true; // Giữ lại (Bao gồm cả bàn nhỏ hơn số khách)
        }
    }

    // 4. Tìm kiếm
    const searchText = searchQuery.toLowerCase();
    const matchSearch = searchText === '' ||
      (t.tenBan || '').toLowerCase().includes(searchText) ||
      (t.ghiChu || '').toLowerCase().includes(searchText) ||
      (t.maDonHang || '').toLowerCase().includes(searchText);

    return matchFloor && matchStatus && matchPeople && matchSearch;
  });

  // --- HELPER STYLE (UPDATED) ---
  const getStatusStyle = (statusName: string | undefined, note: string | undefined) => {
    const s = (statusName || '').toLowerCase(); // Chuyển về chữ thường để so sánh
    const n = (note || '').toLowerCase();       // Kiểm tra cả ghi chú

    // 1. ƯU TIÊN MÀU CAM (ĐÃ ĐẶT) LÊN ĐẦU TIÊN
    // Nếu trạng thái HOẶC ghi chú có chữ "đã đặt" -> Màu Cam
    if (
      s.includes('đã đặt') ||
      s.includes('sắp đến') ||
      s.includes('quá giờ') ||
      s === 'dadat' ||
      n.includes('đã đặt ')
    ) {
      console.log("Xác định màu Đã đặt cho trạng thái:", statusName, "và ghi chú:", note);
      return {
        cardBorder: 'border-orange-200 dark:border-orange-900',
        bg: 'bg-white dark:bg-gray-800',
        iconBg: 'bg-orange-100 dark:bg-orange-900/50',
        iconColor: 'text-orange-600 dark:text-orange-400',
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        label: s.includes('sắp đến') ? 'Đã đặt (Sắp đến)' :
          s.includes('quá giờ') ? 'Đã đặt (Quá giờ)' : 'Đã đặt trước'
      };
    }

    // 2. MÀU ĐỎ (ĐANG PHỤC VỤ)
    else if (
      s.includes('đang phục vụ') ||
      s.includes('chờ thanh toán') ||
      s.includes('có khách') ||
      s === 'dang_phuc_vu'
    ) {
      console.log("Xác định màu Đang phục vụ cho trạng thái:", statusName, "và ghi chú:", note);
      return {
        cardBorder: 'border-rose-200 dark:border-rose-900',
        bg: 'bg-white dark:bg-gray-800',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50',
        iconColor: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
        label: s.includes('chờ thanh toán') ? 'Chờ thanh toán' : 'Đang phục vụ'
      };
    }
    // 3. MÀU XÁM (BẢO TRÌ)
    else if (s.includes('bảo trì') || s === 'baotri') {
      return {
        cardBorder: 'border-gray-200 dark:border-gray-700',
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        iconBg: 'bg-gray-200 dark:bg-gray-700',
        iconColor: 'text-gray-500 dark:text-gray-400',
        badge: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
        label: 'Bảo trì'
      };
    }
    // 4. MẶC ĐỊNH: MÀU XANH (TRỐNG)
    else {
      return {
        cardBorder: 'border-emerald-200 dark:border-emerald-900',
        bg: 'bg-white dark:bg-gray-800',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
        label: 'Bàn trống'
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sơ đồ bàn</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Trạng thái lúc: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{new Date(selectedTime).toLocaleString('vi-VN')}</span>
            </p>
          </div>

          {/* Legend */}
          <div className="flex gap-3 text-xs font-medium bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Trống
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div> Phục vụ
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div> Đã đặt
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row gap-4 items-center justify-between transition-colors duration-300">
          <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">

            {/* 1. Chọn ngày giờ */}
            <div className="relative group">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 z-10" />
              <input
                type="datetime-local"
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors cursor-pointer hover:bg-white dark:hover:bg-gray-600 min-w-[200px]"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block mx-1"></div>

            {/* 2. Lọc Tầng */}
            <div className="relative group">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 z-10" />
              < select
                className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white cursor-pointer hover:bg-white dark:hover:bg-gray-600 appearance-none"
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
              >
                <option value="all">Tất cả các tầng</option>
                {tangs.map(t => <option key={t.maTang} value={t.maTang}>{t.tenTang}</option>)}
              </select>
            </div>

            {/* 3. Lọc Trạng Thái */}
            <select
              className="pl-4 pr-8 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white cursor-pointer hover:bg-white dark:hover:bg-gray-600"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="trong">Bàn trống</option>
              <option value="dang_phuc_vu">Đang phục vụ</option>
              <option value="dat_truoc">Đã đặt trước</option>
              <option value="bao_tri">Bảo trì</option>
            </select>

            {/* 4. MỚI: Lọc Số Người */}
            <div className="relative group w-28">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 z-10" />
              <input
                type="number"
                min="1"
                placeholder="Số người"
                className="w-full pl-9 pr-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                value={selectedPeople}
                onChange={(e) => setSelectedPeople(e.target.value)}
              />
            </div>
          </div>

          {/* 5. Tìm kiếm */}
          <div className="relative w-full md:w-64 group mt-3 md:mt-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Tìm tên bàn..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* VIEW DANH SÁCH BÀN */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredTables.map((table) => {
            // Sử dụng trangThaiHienThi nếu có, nếu không thì dùng tenTrangThai
            const statusDisplay = table.trangThaiHienThi || table.tenTrangThai || 'Trống';
            const style = getStatusStyle(statusDisplay, table.ghiChu);
            const hasOrder = table.ghiChu && (statusDisplay.includes('phục vụ') || statusDisplay.includes('đặt'));

            return (
              <div
                key={table.maBan}
                className={`relative group flex flex-col items-center p-4 rounded-2xl border ${style.bg} ${style.cardBorder} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-sm`}
                title={table.ghiChu || ''} // Tooltip hiển thị thông tin hóa đơn
              >
                <div className="w-full flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">{table.tenBan}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{table.tenTang}</p>
                  </div>
                  <button className="text-gray-300 hover:text-indigo-500 dark:text-gray-600 dark:hover:text-indigo-400 flex-shrink-0 ml-2">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${style.iconBg} ${style.iconColor}`}>
                  {(style.label === 'Đang phục vụ' || style.label === 'Chờ thanh toán') ? (
                    <Utensils className="w-8 h-8 animate-pulse" />
                  ) : (
                    <Armchair className="w-8 h-8" />
                  )}
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${style.badge}`}>
                  {style.label}
                </span>

                {/* Hiển thị thông tin hóa đơn nếu có */}
                {hasOrder && (
                  <div className="w-full mb-2 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <p className="text-[9px] text-indigo-700 dark:text-indigo-300 font-medium truncate text-center">
                      {table.ghiChu}
                    </p>
                  </div>
                )}

                <div className="w-full border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-1.5" />
                    <span className="text-sm font-semibold">{table.sucChua}</span>
                  </div>

                  {(style.label === 'Đang phục vụ' || style.label === 'Chờ thanh toán') && table.thoiGianVao ? (
                    <div className="flex items-center text-indigo-500 dark:text-indigo-400">
                      <Clock className="w-4 h-4 mr-1.5" />
                      <span className="text-xs font-bold">{table.thoiGianVao.slice(11, 16)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300 dark:text-gray-600">--:--</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredTables.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Không tìm thấy bàn nào</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {selectedPeople ? `Không có bàn nào đủ chỗ cho ${selectedPeople} người.` : 'Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatus(' all');
              setSelectedFloor('all');
              setSelectedPeople('');
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" /> Đặt lại bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
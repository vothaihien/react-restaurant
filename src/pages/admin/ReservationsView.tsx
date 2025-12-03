import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext"; 
import { 
  Calendar, Clock, User, Phone, Mail, Search, 
  Users, CheckCircle2, XCircle, AlertCircle, 
  Utensils, CalendarDays, RefreshCcw, Plus, 
  MoreVertical, Check, ArrowRight
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";

// --- IMPORT SERVICES ---
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import { tableService } from "@/services/tableService";
import { bookingService } from "@/services/bookingService";
import { orderService } from "@/services/orderService";
import { donHangService, DonHangActive } from "@/services/donHangService";
import { khachHangService } from "@/services/khachHangService";

// --- INTERFACE ---
interface BanAn {
  maBan: string;
  tenBan: string;
  maTrangThai: string;
  tenTrangThai: string;
  sucChua: number;
  maTang: string;
  tenTang: string;
}

// =================================================================
// 1. COMPONENT FORM ĐẶT BÀN
// =================================================================
const BookingForm: React.FC<{ onBookingSuccess: () => void }> = ({ onBookingSuccess }) => {
  const { user } = useAuth();
  const { notify } = useFeedback();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [bookingDate, setBookingDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [bookingTime, setBookingTime] = useState<string>(dayjs().format("HH:mm"));
  
  // Logic State
  const [selectedTables, setSelectedTables] = useState<BanAn[]>([]);
  const [availableTables, setAvailableTables] = useState<BanAn[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Customer Logic
  const [isWalkInGuest, setIsWalkInGuest] = useState(false);
  const [isCustomerFound, setIsCustomerFound] = useState(false);
  const [loyaltyMessage, setLoyaltyMessage] = useState<string | null>(null);

  // --- TÌM BÀN TRỐNG ---
  const fetchAvailableTables = useCallback(async () => {
    if (!bookingDate || !bookingTime || partySize < 1) {
      setAvailableTables([]);
      return;
    }
    
    setLoadingTables(true);
    try {
      const dateTimeStr = `${bookingDate}T${bookingTime}:00`;
      const tables = await tableService.getTablesByTime(dateTimeStr, partySize);
      
      // LOGIC LỌC BÀN (ĐÃ SỬA)
      const available = Array.isArray(tables) ? tables.filter((t: any) => {
        const statusName = (t.tenTrangThai || '').toLowerCase();
        const statusCode = t.maTrangThai;

        // 1. LOẠI BỎ CÁC BÀN ĐANG BẬN
        // TTBA002: Đang phục vụ (Có khách)
        // TTBA003: Đã đặt (Booking)
        if (statusCode === 'TTBA002' || statusCode === 'TTBA003' || 
            statusName.includes('có khách') || statusName.includes('đã đặt') || statusName.includes('phục vụ')) {
            return false; 
        }

        // 2. CHỈ LẤY BÀN TRỐNG
        // TTBA001: Bàn trống
        return statusCode === 'TTBA001' || statusName.includes('trống');

      }).sort((a: BanAn, b: BanAn) => {
          // Sắp xếp ưu tiên bàn vừa vặn
          const diffA = a.sucChua - partySize;
          const diffB = b.sucChua - partySize;

          const aDuCho = diffA >= 0;
          const bDuCho = diffB >= 0;

          if (aDuCho && !bDuCho) return -1; 
          if (!aDuCho && bDuCho) return 1;

          if (aDuCho && bDuCho) return diffA - diffB; // Cả 2 đều đủ -> Chọn bàn nhỏ hơn (tiết kiệm)
          return b.sucChua - a.sucChua; // Cả 2 đều thiếu -> Chọn bàn to hơn (để dễ ghép)

      }) : [];
      
      setAvailableTables(available);
    } catch (error) {
      console.error("Lỗi tải bàn trống:", error);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  }, [bookingDate, bookingTime, partySize]);

  useEffect(() => {
    fetchAvailableTables();
  }, [fetchAvailableTables]);

  // --- TÌM KHÁCH HÀNG ---
  const handleSearchCustomer = async () => {
    if (!phone) return notify({ tone: "warning", title: "Cảnh báo", description: "Vui lòng nhập SĐT!" });
    
    try {
      const data = await khachHangService.searchByPhone(phone);
      if (data && data.found) {
        setName(data.tenKhach || "");
        setEmail(data.email || "");
        setIsCustomerFound(true);
        setLoyaltyMessage(data.message || "Khách hàng thân thiết");
        notify({ tone: "success", title: "Đã tìm thấy", description: `Khách hàng: ${data.tenKhach}` });
      } else {
        setIsCustomerFound(false);
        setLoyaltyMessage("Khách hàng mới");
        notify({ tone: "info", title: "Thông báo", description: "SĐT chưa tồn tại. Vui lòng nhập tên để tạo mới." });
      }
    } catch (err) {
      notify({ tone: "error", title: "Lỗi", description: "Lỗi kết nối khi tìm khách hàng." });
    }
  };

  // ... (Các hàm handleToggleWalkInGuest, handleTableToggle giữ nguyên) ...
  const handleToggleWalkInGuest = () => {
    setIsWalkInGuest(!isWalkInGuest);
    if (!isWalkInGuest) {
      setName("Khách Vãng Lai");
      setPhone("");
      setEmail("");
      setIsCustomerFound(false);
      setLoyaltyMessage(null);
    } else {
      setName("");
    }
  };

  const handleTableToggle = (table: BanAn) => {
    if (selectedTables.find(t => t.maBan === table.maBan)) {
      setSelectedTables(selectedTables.filter(t => t.maBan !== table.maBan));
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || (!isWalkInGuest && !phone) || selectedTables.length === 0) {
      return notify({ tone: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập đủ thông tin và chọn bàn!" });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
         return notify({ tone: "warning", title: "Email sai", description: "Vui lòng nhập đúng định dạng email hoặc để trống." });
    }

    const totalCapacity = selectedTables.reduce((sum, table) => sum + (table.sucChua || 0), 0);
    if (partySize > totalCapacity) {
      const confirm = window.confirm(`Tổng sức chứa (${totalCapacity}) nhỏ hơn số khách (${partySize}). Bạn có chắc muốn xếp vào các bàn này không?`);
      if (!confirm) return;
    }

    // Validation thời gian
    const dateTimeStr = `${bookingDate}T${bookingTime}:00`;
    const bookingDateTime = new Date(dateTimeStr);
    // ... (Validation ngày tháng giữ nguyên) ...
    const maxDaysAhead = 30;
    const maxDateTime = new Date();
    maxDateTime.setDate(maxDateTime.getDate() + maxDaysAhead);
    
    if (bookingDateTime > maxDateTime) {
      return notify({ tone: "warning", title: "Thời gian không hợp lệ", description: `Chỉ có thể đặt bàn trong vòng ${maxDaysAhead} ngày tới.` });
    }


    setSubmitting(true);
    try {
      const maNhanVienCurrent = (user as any)?.employeeId || ""; 
      if (!maNhanVienCurrent) {
          notify({ tone: "error", title: "Lỗi xác thực", description: "Không tìm thấy mã nhân viên. Vui lòng đăng nhập lại." });
          setSubmitting(false);
          return;
      }

      const payload = {
        DanhSachMaBan: selectedTables.map((t) => t.maBan),
        HoTenKhach: name,
        SoDienThoaiKhach: isWalkInGuest ? "" : phone,
        Email: email || null,
        ThoiGianDatHang: bookingDateTime.toISOString(),
        SoLuongNguoi: partySize,
        MaNhanVien: maNhanVienCurrent,
        GhiChu: "Nhân viên đặt tại quầy (POS)"
      };
      
      const res = await bookingService.createReservationByStaff(payload);
      
      let successMsg = res.Message || "Tạo đặt bàn thành công!";
      if (res.KhuyenMai && res.KhuyenMai !== "Không có") {
        successMsg += ` (${res.KhuyenMai})`;
      }

      notify({ tone: "success", title: "Thành công", description: successMsg });
      
      // Reset Form
      setName(""); setPhone(""); setEmail(""); setPartySize(2); setSelectedTables([]);
      setIsWalkInGuest(false); setIsCustomerFound(false); setLoyaltyMessage(null);
      
      onBookingSuccess(); // Refresh danh sách

    } catch (error: any) {
      console.error("Lỗi tạo đặt bàn:", error);
      const errorMessage = error.response?.data?.message || error.message || "Không thể tạo đặt bàn";
      notify({ tone: "error", title: "Thất bại", description: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  // ... (Phần render giữ nguyên như cũ) ...
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
      {/* ... (Code giao diện form giữ nguyên) ... */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-[hsl(var(--primary))]" />
          Tạo Đặt Bàn Mới
        </h2>
        <button 
          onClick={handleToggleWalkInGuest}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            isWalkInGuest 
            ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]" 
            : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          }`}
        >
          {isWalkInGuest ? "Đang chọn: Khách Lẻ" : "Chế độ Khách Lẻ"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CỘT TRÁI: THÔNG TIN KHÁCH */}
        <div className="space-y-5">
          {/* ... (Các input SĐT, Số khách, Tên, Email, Ngày giờ - Giữ nguyên code của bạn) ... */}
           <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số điện thoại</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none dark:text-white disabled:opacity-50"
                            placeholder={isWalkInGuest ? "Không cần nhập" : "09xxxx..."}
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); if(isWalkInGuest) setIsWalkInGuest(false); }}
                            disabled={isWalkInGuest}
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={handleSearchCustomer}
                        disabled={isWalkInGuest || !phone}
                        className="px-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:brightness-95 disabled:opacity-50"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số khách</label>
                <div className="relative">
                    <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="number" min="1"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none dark:text-white"
                        value={partySize}
                        onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                    />
                </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên khách hàng</label>
            <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none dark:text-white ${isCustomerFound ? 'font-bold text-green-600' : ''}`}
                    placeholder="Nhập tên khách..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={isCustomerFound || isWalkInGuest}
                />
            </div>
            {loyaltyMessage && (
                <p className="text-xs mt-1 text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {loyaltyMessage}
                </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email <span className="text-xs text-gray-400 font-normal">(Tùy chọn - Nhận vé điện tử)</span>
            </label>
            <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="email" 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none dark:text-white disabled:opacity-50"
                    placeholder="khachhang@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isWalkInGuest || isCustomerFound} 
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày đặt</label>
                <input 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none dark:text-white"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giờ đặt</label>
                <input 
                    type="time" 
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none dark:text-white"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                />
             </div>
          </div>
        </div>

        {/* CỘT PHẢI: CHỌN BÀN */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chọn bàn ({selectedTables.length} bàn đã chọn)
                </label>
                {loadingTables && <span className="text-xs text-gray-500 animate-pulse">Đang tìm bàn trống...</span>}
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50 min-h-[250px] max-h-[300px] overflow-y-auto custom-scrollbar">
                {availableTables.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        {loadingTables ? (
                            <p>Đang tải...</p>
                        ) : (
                            <>
                                <XCircle className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">Không có bàn trống phù hợp</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {availableTables.map(table => {
                            const isSelected = selectedTables.some(t => t.maBan === table.maBan);
                            const isTooSmall = table.sucChua < partySize; 
                            const isTooBig = table.sucChua >= partySize * 2 + 2; 

                            return (
                                <button
                                    key={table.maBan}
                                    type="button"
                                    onClick={() => handleTableToggle(table)}
                                    className={`
                                        relative p-2 rounded-lg text-sm font-medium border transition-all flex flex-col items-center justify-center
                                        ${isSelected 
                                            ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]" 
                                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[hsl(var(--primary))]"
                                        }
                                        ${isTooBig && !isSelected ? "opacity-60 hover:opacity-100" : ""} 
                                    `}
                                >
                                    <span>{table.tenBan}</span>
                                    <span className={`text-[10px] ${isTooSmall ? 'text-red-500 font-bold' : 'opacity-80'}`}>
                                        {table.sucChua} ghế
                                    </span>
                                    
                                    {isTooBig && !isSelected && (
                                        <span className="absolute top-1 left-1 text-[10px]" title="Bàn lớn">⚠️</span>
                                    )}

                                    {isSelected && <CheckCircle2 className="w-4 h-4 absolute top-1 right-1 text-white" />}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-3 bg-[hsl(var(--primary))] hover:brightness-90 text-white font-bold rounded-xl shadow-lg shadow-[hsl(var(--primary))]/30 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {submitting ? "Đang xử lý..." : <><Plus className="w-5 h-5" /> TẠO ĐẶT BÀN</>}
            </button>
        </div>
      </form>
    </div>
  );
};

// =================================================================
// 2. COMPONENT DANH SÁCH ĐẶT BÀN (MAIN VIEW)
// =================================================================
const ReservationsView: React.FC = () => {
  const { notify } = useFeedback();
  const [orders, setOrders] = useState<DonHangActive[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDetailOrderId, setViewDetailOrderId] = useState<string | null>(null);
  
  // State Filter
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));

  const fetchData = useCallback(async () => {
    // setLoading(true); // Có thể bỏ comment nếu muốn hiện loading spinner mỗi lần
    try {
      const dateStr = dayjs(selectedDate).format("YYYY-MM-DD");
      const ordersData = await donHangService.getActiveBookings(dateStr);
      
      // DEBUG: Log dữ liệu trả về để kiểm tra
      console.log(`Dữ liệu đơn hàng ngày ${dateStr}:`, ordersData); 

      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error("Lỗi tải đơn:", error);
      setOrders([]); 
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // --- TỰ ĐỘNG CẬP NHẬT (POLLING) ---
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh mỗi 15s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAction = async (action: 'CHECKIN' | 'CANCEL' | 'NOSHOW', maDonHang: string) => {
    const order = orders.find(o => o.maDonHang === maDonHang);
    
    if (action === 'CHECKIN' && order) {
      // ... (Logic cảnh báo thời gian check-in giữ nguyên) ...
       const bookingTime = dayjs(order.thoiGianNhanBan);
       const now = dayjs();
       const hoursDiff = bookingTime.diff(now, 'hour', true);
       if (hoursDiff > 2) {
         if (!window.confirm(`Check-in sớm hơn ${Math.round(hoursDiff)} giờ. Bạn có chắc muốn tiếp tục?`)) return;
       }
       if (hoursDiff < -0.5) {
         if (!window.confirm(`Đã quá ${Math.round(Math.abs(hoursDiff) * 60)} phút. Có muốn đánh dấu No-show?`)) return;
       }
    }
    
    if (!window.confirm("Xác nhận thao tác?")) return;

    try {
      const statusMap = { 'CHECKIN': 'CHO_THANH_TOAN', 'CANCEL': 'DA_HUY', 'NOSHOW': 'NO_SHOW' };
      await orderService.updateOrderStatus(maDonHang, statusMap[action]);
      notify({ tone: "success", title: "Thành công", description: "Cập nhật trạng thái xong." });
      fetchData(); // Reload danh sách
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Lỗi cập nhật";
      notify({ tone: "error", title: "Lỗi", description: errorMessage });
    }
  };

  const renderStatusBadge = (status: string) => {
    const styles: any = {
        "CHO_XAC_NHAN": "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
        "DA_XAC_NHAN": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
        "CHO_THANH_TOAN": "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
        "DA_HUY": "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400",
        "NO_SHOW": "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
    };
    const labels: any = {
        "CHO_XAC_NHAN": "Chờ xác nhận", "DA_XAC_NHAN": "Đã xác nhận", 
        "CHO_THANH_TOAN": "Đang phục vụ", "DA_HUY": "Đã hủy", "NO_SHOW": "No-Show"
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles["DA_HUY"]}`}>
            {labels[status] || status}
        </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 font-sans">
        <BookingForm onBookingSuccess={fetchData} />

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Danh Sách Đơn Đặt Bàn
                </h3>
                <div className="flex items-center gap-3">
                    <input 
                        type="date" 
                        className="pl-4 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <button onClick={fetchData} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Đang tải danh sách...</div>
                ) : orders.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-gray-400 dark:text-gray-500">
                        <Calendar className="w-12 h-12 mb-3 opacity-20" />
                        <p>Không có đơn đặt bàn nào trong ngày {dayjs(selectedDate).format("DD/MM/YYYY")}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs">
                            <tr>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Giờ đến</th>
                                <th className="p-4">Bàn</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {orders.map((order) => (
                                <tr key={order.maDonHang} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{order.tenNguoiNhan}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Users className="w-3 h-3" /> {order.soNguoi} khách
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-gray-700 dark:text-gray-300">
                                        {/* Hiển thị giờ nhận bàn. Nếu chưa có (đặt trước), hiển thị giờ dự kiến */}
                                        {dayjs(order.thoiGianNhanBan).isValid() ? dayjs(order.thoiGianNhanBan).format("HH:mm") : "--:--"}
                                    </td>
                                    <td className="p-4 text-gray-800 dark:text-gray-200">
                                        {order.banAn && order.banAn.length > 0 ? order.banAn.join(", ") : <span className="italic">Chưa xếp</span>}
                                    </td>
                                    <td className="p-4 text-center">
                                        {renderStatusBadge(order.maTrangThai)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {(order.maTrangThai === 'CHO_XAC_NHAN' || order.maTrangThai === 'DA_XAC_NHAN') && (
                                                <button onClick={() => handleAction('CHECKIN', order.maDonHang)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                                                    Vào bàn
                                                </button>
                                            )}
                                            {order.maTrangThai === 'CHO_THANH_TOAN' && (
                                                <button onClick={() => setViewDetailOrderId(order.maDonHang)} className="px-3 py-1.5 bg-[hsl(var(--primary))] hover:brightness-90 text-white rounded-lg text-xs font-bold">
                                                    Thanh toán
                                                </button>
                                            )}
                                            <button onClick={() => handleAction('CANCEL', order.maDonHang)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {viewDetailOrderId && (
            <OrderDetailModal
                maDonHang={viewDetailOrderId}
                onClose={() => setViewDetailOrderId(null)}
                onPaymentSuccess={() => { fetchData(); setViewDetailOrderId(null); }}
            />
        )}
    </div>
  );
};

export default ReservationsView;
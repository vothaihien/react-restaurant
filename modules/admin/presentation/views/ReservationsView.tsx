import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Popover,
  MenuList,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import {
  People,
  CheckCircle,
  Cancel,
  HelpOutline,
  Search,
  Star,
  PersonOff
} from "@mui/icons-material";
import { LocalizationProvider, DateTimePicker, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

// --- IMPORT SERVICES (Đảm bảo đường dẫn đúng với dự án của bạn) ---
import OrderDetailModal from '@/components/OrderDetailModal';
import { tableService } from "@/services/tableService";
import { bookingService } from "@/services/bookingService";
import { orderService } from "@/services/orderService";
import { donHangService, DonHangActive } from "@/services/donHangService";
import { khachHangService } from "@/services/khachHangService"; // <--- SERVICE MỚI
import { useAuth } from "@/contexts";

// --- ĐỊNH NGHĨA TYPE ---
interface BanAn {
  maBan: string;
  tenBan: string;
  maTrangThai: string;
  tenTrangThai: string;
  sucChua: number;
  maTang: string;
  tenTang: string;
}

const BookingForm: React.FC<{ onBookingSuccess: () => void }> = ({
  onBookingSuccess,
}) => {

  const { user } = useAuth();
  // State Form Data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [bookingTime, setBookingTime] = useState<Dayjs | null>(dayjs());
  const [selectedTables, setSelectedTables] = useState<BanAn[]>([]);
  
  // State xử lý dữ liệu bàn & loading
  const [availableTables, setAvailableTables] = useState<BanAn[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State Logic Khách Hàng & Khuyến Mãi
  const [isWalkInGuest, setIsWalkInGuest] = useState(false);
  const [isCustomerFound, setIsCustomerFound] = useState(false);
  const [loyaltyMessage, setLoyaltyMessage] = useState<string | null>(null);
  const [isVipEligible, setIsVipEligible] = useState(false);

  // --- HÀM TÌM KIẾM BÀN TRỐNG ---
  const fetchAvailableTables = async (time: Dayjs, party: number) => {
    setLoadingTables(true);
    try {
      const tables = await tableService.getTablesByTime(time.toISOString(), party);
      setAvailableTables(tables);
    } catch (error) {
      console.error("Lỗi tải bàn trống:", error);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    if (bookingTime) {
      fetchAvailableTables(bookingTime, partySize);
    }
  }, [bookingTime, partySize]);

  // --- HÀM TÌM KIẾM KHÁCH HÀNG ---
  const handleSearchCustomer = async () => {
    if (!phone) {
      alert("Vui lòng nhập SĐT để tìm!");
      return;
    }
    try {
      const data = await khachHangService.searchByPhone(phone);
      if (data.found) {
        setName(data.tenKhach || ""); 
        setEmail(data.email || "");
        setIsCustomerFound(true);
        setLoyaltyMessage(data.message || null);
        setIsVipEligible(data.duocGiamGia || false);
      } else {
        setIsCustomerFound(false);
        setName("");
        setEmail("");
        setLoyaltyMessage("Khách hàng mới (Chưa có lịch sử tích lũy)");
        setIsVipEligible(false);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
      alert("Không tìm thấy khách hàng hoặc lỗi kết nối.");
    }
  };

  // --- HÀM CHUYỂN CHẾ ĐỘ KHÁCH LẺ ---
  const handleSetWalkInGuest = () => {
    setIsWalkInGuest(true);
    setPhone("");       
    setEmail("");       
    setName("Khách Vãng Lai");
    setIsCustomerFound(false);
    setLoyaltyMessage(null);
    setIsVipEligible(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    if (isWalkInGuest) {
        setIsWalkInGuest(false); 
        setName(""); 
    }
  };

  // --- HÀM SUBMIT TẠO ĐƠN (ĐÃ CẬP NHẬT GỌI API STAFF) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || (!isWalkInGuest && !phone) || !bookingTime || selectedTables.length === 0) {
      alert("Vui lòng nhập đủ thông tin và chọn bàn!");
      return;
    }

    const maNhanVienCurrent = (user && user.type === 'admin') ? user.employeeId : '';

    if (!maNhanVienCurrent) {
        alert("Lỗi: Không xác định được nhân viên thực hiện! Vui lòng đăng nhập lại.");
        return;
    }

    setSubmitting(true);
    try {
      const data = {
        DanhSachMaBan: selectedTables.map((t) => t.maBan),
        HoTenKhach: name,
        SoDienThoaiKhach: isWalkInGuest ? "" : phone,
        Email: email || null,
        ThoiGianDatHang: bookingTime!.toISOString(),
        SoLuongNguoi: partySize,
        // TODO: Lấy MaNhanVien từ Context đăng nhập. Tạm thời hardcode NV001
        MaNhanVien: maNhanVienCurrent, 
      };
      
      // GỌI HÀM DÀNH CHO NHÂN VIÊN (staff/create)
      const res = await bookingService.createReservationByStaff(data);
      
      // Xử lý thông báo dựa trên kết quả trả về từ C#
      let msg = res.Message || "Tạo đặt bàn thành công!";
      
      // Kiểm tra thông báo khuyến mãi từ Server trả về
      if (res.KhuyenMai && res.KhuyenMai !== "Không có") {
          msg += `\n🎉 ${res.KhuyenMai}`;
      }
      
      alert(msg);
      onBookingSuccess();
      
      // Reset Form
      setName(""); setPhone(""); setEmail(""); setPartySize(2); setBookingTime(dayjs()); setSelectedTables([]);
      setIsWalkInGuest(false); setIsCustomerFound(false); setLoyaltyMessage(null); setIsVipEligible(false);
    } catch (error: any) {
      console.error("Lỗi tạo đặt bàn:", error);
      alert(`Lỗi: ${error.message || "Không thể tạo đặt bàn"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Tạo Đặt Bàn Mới (Nhân Viên)</Typography>
        <Button 
            variant={isWalkInGuest ? "contained" : "outlined"} 
            color="secondary"
            size="small"
            onClick={handleSetWalkInGuest}
            startIcon={<PersonOff />}
        >
            Khách Lẻ (Không lưu)
        </Button>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1.5 }}>
          
          {/* CỘT 1: SĐT & TÌM */}
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" }, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label={isWalkInGuest ? "Không cần SĐT" : "Điện thoại (Nhập để tìm)"}
              value={phone}
              onChange={handlePhoneChange}
              required={!isWalkInGuest}
              disabled={isWalkInGuest}
              placeholder={isWalkInGuest ? "Chế độ Khách Lẻ" : "09xxxx..."}
              sx={{ bgcolor: isWalkInGuest ? '#f0f0f0' : 'white' }}
            />
            <Button 
                variant="contained" color="info" onClick={handleSearchCustomer}
                disabled={isWalkInGuest || !phone} sx={{ minWidth: '50px' }}
            >
                <Search />
            </Button>
          </Box>

          {/* CỘT 2: TÊN KHÁCH */}
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <TextField
              fullWidth
              label="Tên khách"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              InputProps={{
                readOnly: isCustomerFound,
                style: isCustomerFound ? { backgroundColor: '#f0f4f8' } : {}
              }}
            />
          </Box>

          {/* THÔNG BÁO VIP (HIỂN THỊ KHI TÌM THẤY) */}
          {loyaltyMessage && (
            <Box sx={{ p: 1.5, width: "100%" }}>
                <Paper 
                    variant="outlined" 
                    sx={{ 
                        p: 1.5, 
                        bgcolor: isVipEligible ? '#e8f5e9' : '#f5f5f5',
                        borderColor: isVipEligible ? '#66bb6a' : '#ddd',
                        display: 'flex', alignItems: 'center', gap: 1
                    }}
                >
                    {isVipEligible ? <Star color="success" /> : <People color="action" />}
                    <Typography 
                        variant="body2" 
                        color={isVipEligible ? "success.main" : "text.secondary"} 
                        fontWeight={isVipEligible ? "bold" : "regular"}
                    >
                        {loyaltyMessage}
                    </Typography>
                </Paper>
            </Box>
          )}

          {/* EMAIL */}
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <TextField
              fullWidth label="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Box>

          {/* SỐ LƯỢNG KHÁCH */}
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <TextField
              fullWidth type="number" label="Số lượng khách"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
              required InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
          
          {/* THỜI GIAN */}
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Thời gian nhận bàn" value={bookingTime}
                onChange={(newValue) => setBookingTime(newValue)}
                // Dòng 'slots' đã bị xóa
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </LocalizationProvider>
          </Box>

          {/* CHỌN BÀN */}
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <Autocomplete
              multiple
              options={availableTables}
              getOptionLabel={(option) => `${option.tenBan} (${option.sucChua} chỗ)`}
              value={selectedTables}
              onChange={(event, newValue) => setSelectedTables(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Chọn bàn" placeholder="Chọn bàn..." />
              )}
            />
          </Box>

          {/* NÚT SUBMIT */}
          <Box sx={{ p: 1.5, width: "100%", textAlign: "right" }}>
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : "Tạo Đặt Bàn"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

// =================================================================
// 2. COMPONENT VIEW CHÍNH (ReservationsView)
// =================================================================
const ReservationsView: React.FC = () => {
  const [orders, setOrders] = useState<DonHangActive[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDetailOrderId, setViewDetailOrderId] = useState<string | null>(null);

  // State Popover Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<DonHangActive | null>(null);
  
  // State Bộ lọc ngày
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  // HÀM TẢI DANH SÁCH ĐƠN HÀNG
  const fetchData = async () => {
    setLoading(true);
    try {
      const dateParam = selectedDate ? selectedDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
      const ordersData = await donHangService.getActiveBookings(dateParam);
      setOrders(ordersData as DonHangActive[]);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]); 

  // --- CÁC HÀM XỬ LÝ HÀNH ĐỘNG ---
  const handleOrderClick = (event: React.MouseEvent<HTMLElement>, order: DonHangActive) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  // Xác nhận khách đến -> Chuyển sang CHO_THANH_TOAN
  const handleCheckIn = async (maDonHang: string) => {
    handleCloseMenu();
    if (!window.confirm("Xác nhận khách đã đến?")) return;
    try {
      await orderService.updateOrderStatus(maDonHang, "CHO_THANH_TOAN");
      alert("Check-in thành công!");
      fetchData();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  // Mở modal thanh toán
  const handlePayment = (maDonHang: string) => {
    handleCloseMenu();
    setViewDetailOrderId(maDonHang); 
  };

  const handleCancel = async (maDonHang: string) => {
    handleCloseMenu();
    if (!window.confirm("Bạn có chắc muốn HỦY đơn hàng này?")) return;
    try {
      await orderService.updateOrderStatus(maDonHang, "DA_HUY");
      alert("Đã hủy đơn!");
      fetchData();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  const handleNoShow = async (maDonHang: string) => {
    handleCloseMenu();
    if (!window.confirm("Xác nhận khách No-show?")) return;
    try {
      await orderService.updateOrderStatus(maDonHang, "NO_SHOW");
      alert("Đã cập nhật No-show!");
      fetchData();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  // --- GIAO DIỆN CHÍNH ---
  return (
    <Box sx={{ p: 3, bgcolor: "#f4f6f8", minHeight: "100vh" }}>
      {/* 1. FORM ĐẶT BÀN */}
      <BookingForm onBookingSuccess={fetchData} />

      {/* 2. DANH SÁCH ĐƠN HÀNG */}
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>Đơn Hàng Đang Chờ</Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Chọn ngày xem đơn"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            // Dòng 'slots' đã bị xóa
            enableAccessibleFieldDOMStructure={false} 
            slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }} 
          />
        </LocalizationProvider>

        {/* Danh sách Card */}
        {loading ? (
          <CircularProgress />
        ) : (
          <Box sx={{ maxHeight: 600, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {orders.length === 0 && <Typography>Không có đơn hàng nào.</Typography>}
            {orders.map((order) => (
              <Card 
                key={order.maDonHang} variant="outlined" 
                onClick={(e) => handleOrderClick(e, order)}
                sx={{ cursor: "pointer", "&:hover": { boxShadow: 2 } }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {order.tenNguoiNhan} ({order.soNguoi} người)
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Giờ ăn: {dayjs(order.thoiGianNhanBan).format("HH:mm DD/MM/YYYY")}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Bàn: {order.banAn.join(", ")}
                  </Typography>
                  <Chip 
                    label={order.trangThai} 
                    size="small" sx={{ mt: 1 }}
                    color={order.maTrangThai === "CHO_THANH_TOAN" ? "error" : order.maTrangThai === "DA_XAC_NHAN" ? "primary" : "warning"}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* 3. MENU HÀNH ĐỘNG (POPOVER) */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {selectedOrder && (
          <MenuList>
            {/* Menu cho trạng thái CHỜ XÁC NHẬN */}
            {selectedOrder.maTrangThai === "CHO_XAC_NHAN" && [
              <MenuItem key="check" onClick={() => handleCheckIn(selectedOrder.maDonHang)}>
                 <CheckCircle sx={{ mr: 1 }} color="primary" /> Xác nhận đơn
              </MenuItem>,
              <MenuItem key="cancel" onClick={() => handleCancel(selectedOrder.maDonHang)}>
                 <Cancel sx={{ mr: 1 }} color="error" /> Hủy đơn
              </MenuItem>
            ]}
            {/* Menu cho trạng thái ĐÃ XÁC NHẬN */}
            {selectedOrder.maTrangThai === "DA_XAC_NHAN" && [
               <MenuItem key="in" onClick={() => handleCheckIn(selectedOrder.maDonHang)}>
                  <CheckCircle sx={{ mr: 1 }} color="success" /> Khách vào bàn (Check-in)
               </MenuItem>,
               <MenuItem key="noshow" onClick={() => handleNoShow(selectedOrder.maDonHang)}>
                  <HelpOutline sx={{ mr: 1 }} color="warning" /> Báo No-Show
               </MenuItem>,
               <MenuItem key="cancel" onClick={() => handleCancel(selectedOrder.maDonHang)}>
                  <Cancel sx={{ mr: 1 }} color="error" /> Hủy đơn
               </MenuItem>
            ]}
            {/* Menu cho trạng thái ĐANG ĂN (CHỜ THANH TOÁN) */}
            {selectedOrder.maTrangThai === "CHO_THANH_TOAN" && [
               <MenuItem key="pay" onClick={() => handlePayment(selectedOrder.maDonHang)}>
                  <CheckCircle sx={{ mr: 1 }} color="primary" /> Thanh Toán
               </MenuItem>
            ]}
            {/* Menu chung */}
            <MenuItem key="detail" onClick={() => { handleCloseMenu(); setViewDetailOrderId(selectedOrder.maDonHang); }}>
               Xem chi tiết
            </MenuItem>
          </MenuList>
        )}
      </Popover>

      {/* 4. MODAL CHI TIẾT ĐƠN HÀNG */}
      {viewDetailOrderId && (
        <OrderDetailModal
          maDonHang={viewDetailOrderId}
          onClose={() => setViewDetailOrderId(null)}
          onPaymentSuccess={() => { fetchData(); setViewDetailOrderId(null); }}
        />
      )}
    </Box>
  );
};

export default ReservationsView;
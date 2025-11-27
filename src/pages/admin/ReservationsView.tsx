import React, { useState, useEffect, useCallback } from "react";
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
    useTheme,
    IconButton,
    Snackbar,
    Alert
} from "@mui/material";
import {
    People,
    CheckCircle,
    Cancel,
    HelpOutline,
    Search,
    Star,
    PersonOff,
    RestaurantMenu,
    CalendarToday,
    AccessTime,
    MoreVert
} from "@mui/icons-material";
import { LocalizationProvider, DateTimePicker, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

// --- IMPORT SERVICES (Đảm bảo đường dẫn đúng với dự án của bạn) ---
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import { tableService } from "@/services/tableService";
import { bookingService } from "@/services/bookingService";
import { orderService } from "@/services/orderService";
import { donHangService, DonHangActive } from "@/services/donHangService";
import { khachHangService } from "@/services/khachHangService"; 
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
    const theme = useTheme();
    const { user } = useAuth();
    
    // State Form Data
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [isUserInteracted, setIsUserInteracted] = useState(false);
    const [partySize, setPartySize] = useState(2);
    const [bookingTime, setBookingTime] = useState<Dayjs | null>(dayjs());
    const [selectedTables, setSelectedTables] = useState<BanAn[]>([]);
    
    // State xử lý dữ liệu bàn & loading
    const [availableTables, setAvailableTables] = useState<BanAn[]>([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning'| 'info' }>({ open: false, message: '', severity: 'success' });

    // State Logic Khách Hàng & Khuyến Mãi
    const [isWalkInGuest, setIsWalkInGuest] = useState(false);
    const [isCustomerFound, setIsCustomerFound] = useState(false);
    const [loyaltyMessage, setLoyaltyMessage] = useState<string | null>(null);
    const [isVipEligible, setIsVipEligible] = useState(false);

    // --- HÀM TÌM KIẾM BÀN TRỐNG ---
    const fetchAvailableTables = useCallback(async (time: Dayjs, party: number) => {
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
    }, []);

    useEffect(() => {
        if (bookingTime) {
            fetchAvailableTables(bookingTime, partySize);
        }
    }, [bookingTime, partySize, fetchAvailableTables]);

    // --- HÀM TÌM KIẾM KHÁCH HÀNG ---
    const handleSearchCustomer = async () => {
        if (!phone) {
            setSnackbar({ open: true, message: "Vui lòng nhập SĐT để tìm!", severity: 'warning' });
            return;
        }
        
        // Hiển thị loading nhẹ (nếu muốn) hoặc disable nút tìm kiếm
        // setSearchingCustomer(true); 

        try {
            console.log("Đang tìm khách hàng với SĐT:", phone);
            const data = await khachHangService.searchByPhone(phone);
            console.log("Kết quả tìm kiếm:", data);

            if (data && data.found) { // Kiểm tra kỹ data.found
                // 1. Tự động điền tên và email
                setName(data.tenKhach || ""); 
                setEmail(data.email || "");
                
                // 2. Cập nhật trạng thái
                setIsCustomerFound(true);
                setLoyaltyMessage(data.message || "Khách hàng thân thiết");
                setIsVipEligible(data.duocGiamGia || false);
                
                // 3. Thông báo
                setSnackbar({ open: true, message: `Đã tìm thấy: ${data.tenKhach}`, severity: 'success' });
            } else {
                // Không tìm thấy
                setIsCustomerFound(false);
                // Giữ nguyên tên/email nếu người dùng đã nhập, hoặc reset nếu muốn
                // setName(""); 
                // setEmail("");
                
                setLoyaltyMessage("Khách hàng mới (Chưa có trong hệ thống)");
                setIsVipEligible(false);
                
                setSnackbar({ open: true, message: "SĐT chưa tồn tại. Vui lòng nhập tên để tạo mới.", severity: 'info' });
            }
        } catch (err: any) {
            console.error("Lỗi API tìm kiếm:", err);
            setSnackbar({ open: true, message: "Lỗi kết nối khi tìm khách hàng.", severity: 'error' });
        } finally {
            // setSearchingCustomer(false);
        }
    };


    useEffect(() => {
    // Chỉ chạy khi user chưa chọn giờ thủ công
    if (!isUserInteracted) {
        const timer = setInterval(() => {
            // Cập nhật lại thời gian bằng hiện tại
            setBookingTime(dayjs());
        }, 1000 * 30); // Cập nhật mỗi 30 giây

        // Dọn dẹp timer khi component unmount
        return () => clearInterval(timer);
    }
}, [isUserInteracted]);

// Hàm xử lý khi user chọn giờ
const handleTimeChange = (newValue: Dayjs | null) => {
    setIsUserInteracted(true); // Đánh dấu là user đã can thiệp -> Ngừng tự chạy
    setBookingTime(newValue);
};

    // --- HÀM BẬT/TẮT CHẾ ĐỘ KHÁCH LẺ (ĐÃ SỬA) ---
    const handleToggleWalkInGuest = () => {
        if (isWalkInGuest) {
            // Tắt chế độ Khách Lẻ -> Chuyển về chế độ nhập thông tin
            setIsWalkInGuest(false);
            setName("");
            setPhone("");
            setEmail("");
            setIsCustomerFound(false);
            setLoyaltyMessage(null);
            setIsVipEligible(false);
        } else {
            // Bật chế độ Khách Lẻ -> Thiết lập mặc định
            setIsWalkInGuest(true);
            setPhone("");       
            setEmail("");       
            setName("Khách Vãng Lai");
            setIsCustomerFound(false);
            setLoyaltyMessage(null);
            setIsVipEligible(false);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPhone = e.target.value;
        setPhone(newPhone);
        
        // Nếu đang ở chế độ khách vãng lai nhưng bắt đầu nhập số điện thoại, tự động tắt chế độ khách vãng lai
        if (isWalkInGuest && newPhone) {
            setIsWalkInGuest(false); 
            setName(""); // Xóa tên "Khách Vãng Lai"
        }
        // Xóa thông tin khách hàng đã tìm thấy/loyalty nếu số điện thoại thay đổi
        if (isCustomerFound || loyaltyMessage) {
            setIsCustomerFound(false);
            setLoyaltyMessage(null);
            setIsVipEligible(false);
            // Giữ lại tên nếu đang nhập thủ công, hoặc xóa nếu là tên đã tự động điền từ lần tìm kiếm trước đó
            if (name === "Khách Vãng Lai") setName(""); 
        }
    };

    // Hàm Reset Form
    const resetForm = () => {
        setName(""); setPhone(""); setEmail(""); setPartySize(2); setBookingTime(dayjs()); setSelectedTables([]);
        setIsWalkInGuest(false); setIsCustomerFound(false); setLoyaltyMessage(null); setIsVipEligible(false);
    }


    // --- HÀM SUBMIT TẠO ĐƠN ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || (!isWalkInGuest && !phone) || !bookingTime || selectedTables.length === 0) {
            setSnackbar({ open: true, message: "Vui lòng nhập đủ thông tin và chọn bàn!", severity: 'warning' });
            return;
        }

        const maNhanVienCurrent = (user && (user.type === 'admin' || user.type === 'staff') && user.employeeId) ? user.employeeId : '';
        if (!maNhanVienCurrent) {
            setSnackbar({ open: true, message: "Lỗi: Không xác định được nhân viên thực hiện! Vui lòng đăng nhập lại.", severity: 'error' });
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
            
            setSnackbar({ open: true, message: msg, severity: 'success' });
            onBookingSuccess();
            
            // Reset Form
            resetForm();
        } catch (error: any) {
            console.error("Lỗi tạo đặt bàn:", error);
            setSnackbar({ open: true, message: `Lỗi: ${error.message || "Không thể tạo đặt bàn"}`, severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Paper elevation={4} sx={{ p: 3, mb: 4, bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: `2px solid ${theme.palette.divider}`, pb: 1.5 }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                    <RestaurantMenu sx={{ mr: 1, verticalAlign: 'middle' }} /> Tạo Đặt Bàn Mới
                </Typography>
                <Button 
                    variant={isWalkInGuest ? "contained" : "outlined"} 
                    color={isWalkInGuest ? "secondary" : undefined}
                    size="medium"
                    onClick={handleToggleWalkInGuest}
                    startIcon={<PersonOff />}
                >
                    {isWalkInGuest ? "Đang Khách Lẻ (Nhấp để hủy)" : "Khách Lẻ (Không lưu)"}
                </Button>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1.5 }}>
                    
                    {/* CỘT 1: SĐT & TÌM */}
                    <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" }, display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            label={isWalkInGuest ? "Chế độ Khách Lẻ" : "Điện thoại (Nhập để tìm)"}
                            value={phone}
                            onChange={handlePhoneChange}
                            required={!isWalkInGuest}
                            disabled={isWalkInGuest}
                            placeholder={isWalkInGuest ? "Không cần nhập" : "09xxxx..."}
                            sx={{ bgcolor: isWalkInGuest ? theme.palette.action.disabledBackground : 'white' }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Button 
                            variant="contained" color="info" onClick={handleSearchCustomer}
                            disabled={isWalkInGuest || !phone} sx={{ minWidth: '50px', p: 0 }}
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
                                readOnly: isCustomerFound || isWalkInGuest, // Tên tự động điền/Khách Lẻ -> ReadOnly
                                style: (isCustomerFound || isWalkInGuest) ? { backgroundColor: theme.palette.grey[100], fontWeight: 'bold' } : {}
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* THÔNG BÁO VIP (HIỂN THỊ KHI TÌM THẤY) */}
                    {loyaltyMessage && (
                        <Box sx={{ p: 1.5, width: "100%" }}>
                            <Paper 
                                elevation={1}
                                sx={{ 
                                    p: 1.5, 
                                    bgcolor: isVipEligible ? theme.palette.success.light : theme.palette.info.light,
                                    color: isVipEligible ? theme.palette.success.contrastText : theme.palette.info.contrastText,
                                    borderLeft: `5px solid ${isVipEligible ? theme.palette.success.main : theme.palette.info.main}`,
                                    display: 'flex', alignItems: 'center', gap: 1
                                }}
                            >
                                {isVipEligible ? <Star color="success" /> : <People color="action" />}
                                <Typography variant="body2" fontWeight="bold">
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
                            disabled={isWalkInGuest}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* SỐ LƯỢNG KHÁCH */}
                    <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
                        <TextField
                            fullWidth type="number" label="Số lượng khách"
                            value={partySize}
                            onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                            required InputProps={{ inputProps: { min: 1 } }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    
                    {/* THỜI GIAN */}
                    <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
    label="Thời gian nhận bàn"
    value={bookingTime}
    onChange={handleTimeChange} // Dùng hàm mới này thay vì viết inline
    // Trừ đi 1 phút để tránh lỗi lệch giây (ví dụ 8:50:00 vs 8:50:05)
    minDateTime={dayjs().subtract(1, 'minute')} 
    slotProps={{ 
        textField: { 
            fullWidth: true, 
            required: true,
            // XÓA DÒNG helperText CŨ ĐI NHÉ
        },
        // Thêm cái này để hiển thị thông báo lỗi chuẩn của MUI nếu user cố tình chọn quá khứ
        actionBar: {
            actions: ['clear', 'today', 'accept'],
        }
    }}
/>
                        </LocalizationProvider>
                    </Box>

                    {/* CHỌN BÀN */}
                    <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
                        <Autocomplete
                            multiple
                            options={availableTables}
                            loading={loadingTables}
                            getOptionLabel={(option) => `${option.tenBan} (${option.sucChua} chỗ - Tầng ${option.tenTang})`}
                            value={selectedTables}
                            onChange={(event, newValue) => setSelectedTables(newValue)}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Chọn bàn" 
                                    placeholder="Chọn bàn..." 
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingTables ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Box>

                    {/* NÚT SUBMIT */}
                    <Box sx={{ p: 1.5, width: "100%", textAlign: "right" }}>
                        <Button 
                            type="submit" variant="contained" color="primary" size="large" 
                            disabled={submitting}
                            startIcon={submitting ? null : <CheckCircle />}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : "Tạo Đặt Bàn"}
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

// =================================================================
// 2. COMPONENT VIEW CHÍNH (ReservationsView)
// =================================================================
const ReservationsView: React.FC = () => {
    const theme = useTheme();
    const [orders, setOrders] = useState<DonHangActive[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDetailOrderId, setViewDetailOrderId] = useState<string | null>(null);

    // State Popover Menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedOrder, setSelectedOrder] = useState<DonHangActive | null>(null);
    
    // State Bộ lọc ngày
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [snackbar, setSnackbar] = useState<{ 
    open: boolean, 
    message: string, 
    severity: 'success' | 'error' | 'warning' | 'info' 
}>({ open: false, message: '', severity: 'success' });

    // HÀM TẢI DANH SÁCH ĐƠN HÀNG
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Format này OK, nhưng hãy chắc chắn Back-end nhận đúng format này
            const dateParam = selectedDate ? selectedDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
            
            console.log("Đang gọi API getActiveBookings với ngày:", dateParam); // Log 1

            const ordersData = await donHangService.getActiveBookings(dateParam);
            
            console.log("Dữ liệu API trả về:", ordersData); // Log 2: Xem nó trả về mảng rỗng [] hay có dữ liệu?

            if (Array.isArray(ordersData)) {
                 setOrders(ordersData as DonHangActive[]);
            } else {
                 console.warn("API không trả về mảng!", ordersData);
                 setOrders([]);
            }
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    // --- CÁC HÀM XỬ LÝ HÀNH ĐỘNG ---
    const handleOrderClick = (event: React.MouseEvent<HTMLElement>, order: DonHangActive) => {
        // Thay vì mở Popover khi click vào cả Card, ta chỉ mở khi click vào Icon 3 chấm (MoreVert)
        // setAnchorEl(event.currentTarget);
        // setSelectedOrder(order);
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, order: DonHangActive) => {
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
        if (!window.confirm("Xác nhận khách đã đến và vào bàn?")) return;
        try {
            await orderService.updateOrderStatus(maDonHang, "CHO_THANH_TOAN");
            setSnackbar({ open: true, message: "Check-in thành công! Đơn hàng đã chuyển sang trạng thái Đang phục vụ.", severity: 'success' });
            fetchData();
        } catch (error: any) {
            setSnackbar({ open: true, message: `Lỗi Check-in: ${error.message}`, severity: 'error' });
        }
    };

    // Mở modal thanh toán (Thực tế là xem chi tiết và xử lý tiếp)
    const handlePayment = (maDonHang: string) => {
        handleCloseMenu();
        setViewDetailOrderId(maDonHang); 
    };

    const handleCancel = async (maDonHang: string) => {
        handleCloseMenu();
        if (!window.confirm("Bạn có chắc muốn HỦY đơn hàng này?")) return;
        try {
            await orderService.updateOrderStatus(maDonHang, "DA_HUY");
            setSnackbar({ open: true, message: "Đã hủy đơn hàng.", severity: 'warning' });
            fetchData();
        } catch (error: any) {
            setSnackbar({ open: true, message: `Lỗi Hủy đơn: ${error.message}`, severity: 'error' });
        }
    };

    const handleNoShow = async (maDonHang: string) => {
        handleCloseMenu();
        if (!window.confirm("Xác nhận khách No-show (Không đến)?")) return;
        try {
            await orderService.updateOrderStatus(maDonHang, "NO_SHOW");
            setSnackbar({ open: true, message: "Đã cập nhật No-show!", severity: 'info' });
            fetchData();
        } catch (error: any) {
            setSnackbar({ open: true, message: `Lỗi No-show: ${error.message}`, severity: 'error' });
        }
    };

    const getStatusChipProps = (maTrangThai: string) => {
        switch (maTrangThai) {
            case "CHO_XAC_NHAN":
                return { label: "CHỜ XÁC NHẬN", color: "warning" as const, icon: <HelpOutline /> };
            case "DA_XAC_NHAN":
                return { label: "ĐÃ XÁC NHẬN", color: "primary" as const, icon: <CheckCircle /> };
            case "CHO_THANH_TOAN":
                return { label: "ĐANG PHỤC VỤ", color: "error" as const, icon: <RestaurantMenu /> };
            case "DA_HUY":
                return { label: "ĐÃ HỦY", color: "default" as const, icon: <Cancel /> };
            case "NO_SHOW":
                return { label: "NO-SHOW", color: "secondary" as const, icon: <PersonOff /> };
            default:
                return { label: maTrangThai, color: "default" as const, icon: null };
        }
    };

    // --- GIAO DIỆN CHÍNH ---
    return (
        <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
            {/* 1. FORM ĐẶT BÀN */}
            <BookingForm onBookingSuccess={fetchData} />
            
            <hr style={{ border: `1px dashed ${theme.palette.divider}`, margin: '30px 0' }} />

            {/* 2. DANH SÁCH ĐƠN HÀNG */}
            <Paper elevation={4} sx={{ p: 3, mt: 4, bgcolor: '#ffffff' }}>
                <Typography variant="h5" gutterBottom color="textPrimary" fontWeight="bold">
                    <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} /> Đơn Hàng Đang Chờ & Đang Phục Vụ
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Chọn ngày xem đơn"
                        value={selectedDate}
                        onChange={(newValue) => setSelectedDate(newValue)}
                        slotProps={{ 
                            textField: { 
                                fullWidth: true, 
                                sx: { mb: 2 }, 
                                InputProps: { 
                                    startAdornment: <CalendarToday sx={{ mr: 1, color: theme.palette.action.active }} /> 
                                }
                            } 
                        }} 
                    />
                </LocalizationProvider>

                {/* Danh sách Card */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ maxHeight: 600, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                        {orders.length === 0 && (
                            <Typography variant="subtitle1" color="textSecondary" sx={{ textAlign: 'center', p: 3 }}>
                                Không có đơn hàng nào vào ngày này.
                            </Typography>
                        )}
                        {orders.map((order) => {
                            const statusProps = getStatusChipProps(order.maTrangThai);
                            return (
                                <Card 
                                    key={order.maDonHang} 
                                    variant="elevation" 
                                    elevation={1}
                                    sx={{ 
                                        cursor: "default", 
                                        "&:hover": { boxShadow: 4 }, 
                                        borderLeft: `5px solid ${theme.palette[statusProps.color].main || theme.palette.grey[300]}`
                                    }}
                                >
                                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" color="textPrimary">
                                                {order.tenNguoiNhan} ({order.soNguoi} người)
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <AccessTime sx={{ mr: 0.5, fontSize: 16 }} />
                                                Giờ nhận: {dayjs(order.thoiGianNhanBan).format("HH:mm DD/MM/YYYY")}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <RestaurantMenu sx={{ mr: 0.5, fontSize: 16 }} />
                                                Bàn: {order.banAn.join(", ")}
                                            </Typography>
                                            <Chip 
                                                {...statusProps}
                                                size="small" 
                                                sx={{ mt: 1, fontWeight: 'bold' }}
                                            />
                                        </Box>
                                        
                                        <IconButton onClick={(e) => handleOpenMenu(e, order)} size="large" color="inherit">
                                            <MoreVert />
                                        </IconButton>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}
            </Paper>

            {/* 3. MENU HÀNH ĐỘNG (POPOVER) */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                {selectedOrder && (
                    <MenuList>
                        {/* Menu cho trạng thái CHỜ XÁC NHẬN */}
                        {(selectedOrder.maTrangThai === "CHO_XAC_NHAN" || selectedOrder.maTrangThai === "DA_XAC_NHAN") && [
                            <MenuItem key="check" onClick={() => handleCheckIn(selectedOrder.maDonHang)}>
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
                                <CheckCircle sx={{ mr: 1 }} color="primary" /> Thanh Toán (Tạo đơn)
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
            
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ReservationsView;
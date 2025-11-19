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
  FormControl,
  SelectChangeEvent,
  Popover,
  MenuList,
  Autocomplete,
  MenuItem, // Phải import MenuItem để dùng
} from "@mui/material";
import {
  LocalizationProvider,
  DateTimePicker,
  DatePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  People,
  CheckCircle,
  AccessTime,
  Cancel,
  HelpOutline,
  CalendarMonth,
} from "@mui/icons-material";

// Import service
import { tableService } from "@/services/tableService";
import { bookingService } from "@/services/bookingService";
import { orderService } from "@/services/orderService";
import { donHangService, DonHangActive } from "@/services/donHangService";

// Định nghĩa kiểu dữ liệu (Nên dời ra file models/)
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
// COMPONENT FORM ĐẶT BÀN (Không thay đổi)
// =================================================================
const BookingForm: React.FC<{ onBookingSuccess: () => void }> = ({
  onBookingSuccess,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [bookingTime, setBookingTime] = useState<Dayjs | null>(dayjs());
  const [selectedTables, setSelectedTables] = useState<BanAn[]>([]);
  const [availableTables, setAvailableTables] = useState<BanAn[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAvailableTables = async (time: Dayjs, party: number) => {
    setLoadingTables(true);
    try {
      const tables = await tableService.getTablesByTime(
        time.toISOString(),
        party
      );
      // SỬA LẠI DÒNG NÀY: Bỏ .filter()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingTime, partySize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !bookingTime || selectedTables.length === 0) {
      alert(
        "Vui lòng nhập đủ thông tin (Tên, SĐT, Thời gian, và ít nhất 1 Bàn)"
      );
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        DanhSachMaBan: selectedTables.map((t) => t.maBan),
        HoTenKhach: name,
        SoDienThoaiKhach: phone,
        Email: email || null,
        ThoiGianDatHang: bookingTime!.toISOString(), // Thêm ! vì đã check ở trên
        SoLuongNguoi: partySize,
        MaNhanVien: "NV001", // TODO: Lấy mã NV đang đăng nhập
      };
      await bookingService.createReservation(data);
      alert("Tạo đặt bàn thành công!");
      onBookingSuccess();
      
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setPartySize(2);
      setBookingTime(dayjs());
      setSelectedTables([]); // Sửa lỗi
    } catch (error: any) {
      console.error("Lỗi tạo đặt bàn:", error);
      alert(`Lỗi: ${error.message || "Không thể tạo đặt bàn"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Tạo Đặt Bàn Mới
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1.5 }}>
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <TextField
              fullWidth
              label="Tên khách"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Box>
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <TextField
              fullWidth
              label="Điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Box>
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <TextField
              fullWidth
              label="Email (Không bắt buộc)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Box>
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <TextField
              fullWidth
              type="number"
              label="Số lượng khách"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
              required
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Thời gian nhận bàn"
                value={bookingTime}
                onChange={(newValue) => setBookingTime(newValue)}
                slots={{ textField: TextField }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
                enableAccessibleFieldDOMStructure={false}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ p: 1.5, width: { xs: "100%", sm: "50%" } }}>
            <Autocomplete
              multiple // CHO PHÉP CHỌN NHIỀU
              id="danh-sach-ban"
              options={availableTables}
              getOptionLabel={(option) =>
                `${option.tenBan} (Tầng: ${option.tenTang}, Sức chứa: ${option.sucChua})`
              }
              value={selectedTables}
              onChange={(event, newValue) => {
                setSelectedTables(newValue);
              }}
              isOptionEqualToValue={(option, value) =>
                option.maBan === value.maBan
              }
              loading={loadingTables}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Chọn bàn phù hợp"
                  placeholder="Có thể chọn nhiều bàn"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingTables ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
          <Box sx={{ p: 1.5, width: "100%", textAlign: "right" }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : "Tạo Đặt Bàn"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

// =================================================================
// COMPONENT CHÍNH (Đã xóa Sơ Đồ Bàn và sửa lỗi)
// =================================================================
const ReservationsView: React.FC = () => {
  const [orders, setOrders] = useState<DonHangActive[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho Popover (menu hành động)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<DonHangActive | null>(null);

  // State cho bộ lọc ngày
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  // HÀM GỌI API (ĐÃ SỬA LẠI)
  const fetchData = async () => {
    setLoading(true);
    try {
      // Format ngày để gửi API (VD: '2025-11-18')
      const dateParam = selectedDate
        ? selectedDate.format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

      // Chỉ gọi API lấy đơn hàng
      const ordersData = await donHangService.getActiveBookings(dateParam);
      setOrders(ordersData as DonHangActive[]);

    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      setOrders([]); // Set rỗng nếu lỗi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]); 

  
  const handleOrderClick = (
    event: React.MouseEvent<HTMLElement>,
    order: DonHangActive
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleCheckIn = async (maDonHang: string) => {
    handleCloseMenu();
    if (
      !window.confirm(
        "Xác nhận khách đã đến? Đơn hàng sẽ chuyển sang 'Đang ăn' (Chờ thanh toán)."
      )
    )
      return;
    try {
      await orderService.updateOrderStatus(maDonHang, "CHO_THANH_TOAN");
      alert("Check-in thành công!");
      fetchData();
    } catch (error: any) {
      alert(`Lỗi check-in: ${error.message}`);
    }
  };

  const handlePayment = async (maDonHang: string) => {
    handleCloseMenu();
    if (
      !window.confirm(
        "Xác nhận thanh toán cho đơn này? Bàn sẽ chuyển về 'Trống'."
      )
    )
      return;
    try {
      await orderService.updateOrderStatus(maDonHang, "DA_HOAN_THANH");
      alert("Thanh toán thành công!");
      fetchData();
    } catch (error: any) {
      alert(`Lỗi thanh toán: ${error.message}`);
    }
  };

  const handleCancel = async (maDonHang: string) => {
    handleCloseMenu();
    if (!window.confirm("Bạn có chắc muốn HỦY đơn hàng này?")) return;
    try {
      await orderService.updateOrderStatus(maDonHang, "DA_HUY");
      alert("Hủy đơn thành công!");
      fetchData(); // Tải lại danh sách
    } catch (error: any) {
      alert(`Lỗi hủy đơn: ${error.message}`);
    }
  };

  // BÁO NO-SHOW (CHO ĐƠN 'DA_XAC_NHAN' CỦA HÔM NAY)
  const handleNoShow = async (maDonHang: string) => {
    handleCloseMenu();
    if (!window.confirm("Xác nhận khách KHÔNG ĐẾN (No-show)?")) return;
    try {
      await orderService.updateOrderStatus(maDonHang, "NO_SHOW");
      alert("Cập nhật No-show thành công!");
      fetchData(); // Tải lại danh sách
    } catch (error: any) {
      alert(`Lỗi No-show: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f4f6f8" }}>
      {/* 1. Form đặt bàn */}
      <BookingForm onBookingSuccess={fetchData} />

      {/* 2. Danh sách đơn hàng (không còn 2 cột) */}
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Đơn Hàng Đang Chờ
        </Typography>

        {/* BỘ LỌC NGÀY */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Chọn ngày xem đơn"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slots={{ textField: TextField }}
            slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
            enableAccessibleFieldDOMStructure={false}
          />
        </LocalizationProvider>

        {/* DANH SÁCH ĐƠN HÀNG */}
        {loading ? (
          <CircularProgress />
        ) : (
          <Box
            sx={{
              maxHeight: 600,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {orders.length === 0 && (
              <Typography>Không có đơn hàng nào cho ngày đã chọn.</Typography>
            )}

            {orders.map((order) => (
              <Card
                key={order.maDonHang}
                variant="outlined"
                onClick={(e) => handleOrderClick(e, order)}
                sx={{ cursor: "pointer", "&:hover": { boxShadow: 2 } }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {order.tenNguoiNhan} ({order.soNguoi} người)
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {dayjs(order.thoiGianNhanBan).format("HH:mm DD/MM/YYYY")}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Bàn: {order.banAn.join(", ")}
                  </Typography>
                  <Chip
                    label={order.trangThai}
                    color={
                      order.maTrangThai === "CHO_THANH_TOAN"
                        ? "error"
                        : order.maTrangThai === "DA_XAC_NHAN"
                        ? "primary"
                        : "warning" // CHO_XAC_NHAN
                    }
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* 3. Popover (Menu hành động - ĐÃ CẬP NHẬT LOGIC) */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {selectedOrder && ( // Thêm check này cho an toàn
          <MenuList>
            {(() => {
              if (!selectedOrder) return null;

              const isToday = dayjs(selectedOrder.thoiGianNhanBan).isSame(
                dayjs(),
                "day"
              );
              const maTrangThai = selectedOrder.maTrangThai;

              // 1. Đơn chờ nhân viên xác nhận (đơn từ app mobile)
              if (maTrangThai === "CHO_XAC_NHAN") {
                return (
                  <>
                    <MenuItem
                      onClick={() => handleCheckIn(selectedOrder.maDonHang)}
                    >
                      <CheckCircle sx={{ mr: 1 }} color="primary" /> XÁC NHẬN ĐƠN
                    </MenuItem>
                    <MenuItem
                      onClick={() => handleCancel(selectedOrder.maDonHang)}
                    >
                      <Cancel sx={{ mr: 1 }} color="error" /> Hủy đơn
                    </MenuItem>
                  </>
                );
              }

              // 2. Đơn đã đặt (DA_XAC_NHAN)
              if (maTrangThai === "DA_XAC_NHAN") {
                if (isToday) {
                  // Đơn của hôm nay
                  return (
                    <>
                      <MenuItem
                        onClick={() => handleCheckIn(selectedOrder.maDonHang)}
                      >
                        <CheckCircle sx={{ mr: 1 }} color="success" /> Check-in (Vào bàn)
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleCancel(selectedOrder.maDonHang)}
                      >
                        <Cancel sx={{ mr: 1 }} color="error" /> Hủy đơn
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleNoShow(selectedOrder.maDonHang)}
                      >
                        <HelpOutline sx={{ mr: 1 }} color="warning" /> Báo No-Show
                      </MenuItem>
                    </>
                  );
                } else {
                  // Đơn của ngày tương lai
                  return (
                    <MenuItem
                      onClick={() => handleCancel(selectedOrder.maDonHang)}
                    >
                      <Cancel sx={{ mr: 1 }} color="error" /> Hủy đơn
                    </MenuItem>
                  );
                }
              }

              // 3. Đơn đang ăn (CHO_THANH_TOAN)
              if (maTrangThai === "CHO_THANH_TOAN") {
                return (
                  <>
                    <MenuItem
                      onClick={() => handlePayment(selectedOrder.maDonHang)}
                    >
                      <CheckCircle sx={{ mr: 1 }} color="primary" /> Thanh Toán & Trả bàn
                    </MenuItem>
                    <MenuItem onClick={handleCloseMenu}>
                      {/* TODO: Mở Modal gọi món */}
                      Thêm/Sửa món ăn (Tab Sơ Đồ Bàn)
                    </MenuItem>
                  </>
                );
              }

              return <MenuItem disabled>Không có hành động</MenuItem>;
            })()}

            <MenuItem onClick={handleCloseMenu}>Xem chi tiết đơn</MenuItem>
          </MenuList>
        )}
      </Popover>
    </Box>
  );
};

export default ReservationsView;
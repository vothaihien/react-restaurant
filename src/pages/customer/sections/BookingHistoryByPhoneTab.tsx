import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reservationsApi } from "@/api/reservations";
import { useFeedback } from "@/contexts/FeedbackContext";

type HistoryCustomerInfo = {
  maKhachHang: string;
  hoTen?: string;
  email?: string;
  soDienThoai?: string;
  soLanAn?: number;
};

type HistoryBookingItem = {
  maDonHang?: string;
  MaDonHang?: string;
  tenBan?: string;
  TenBan?: string;
  thoiGianBatDau?: string;
  ThoiGianBatDau?: string;
  thoiGianDuKien?: string;
  ThoiGianDuKien?: string;
  soLuongNguoi?: number;
  SoLuongNguoi?: number;
  trangThai?: string;
  TrangThai?: string;
  daHuy?: boolean;
  DaHuy?: boolean;
};

const BookingHistoryByPhoneTab: React.FC = () => {
  const { notify } = useFeedback();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<HistoryCustomerInfo | null>(
    null
  );
  const [bookings, setBookings] = useState<HistoryBookingItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!phone.trim()) {
      notify({
        tone: "warning",
        title: "Thiếu số điện thoại",
        description: "Vui lòng nhập số điện thoại để tra cứu lịch sử.",
      });
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await reservationsApi.getHistoryByPhone(phone.trim());
      setCustomerInfo(res.customer || null);
      setBookings(res.bookings || []);
      setMessage(res.message || "");
    } catch (err: any) {
      setCustomerInfo(null);
      setBookings([]);
      setMessage("");
      notify({
        tone: "error",
        title: "Không thể tra cứu",
        description:
          err?.message ||
          "Có lỗi xảy ra khi tra cứu lịch sử đặt bàn. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBookingStatus = (booking: HistoryBookingItem) => {
    const isCancelled = booking.daHuy ?? booking.DaHuy ?? false;
    const statusText = booking.trangThai || booking.TrangThai || "Đang xử lý";
    if (isCancelled) return <span className="text-red-600">Đã hủy</span>;
    return <span className="text-emerald-600">{statusText}</span>;
  };

  const renderBookingCard = (booking: HistoryBookingItem) => {
    const maDon = booking.maDonHang || booking.MaDonHang || "N/A";
    const tenBan = booking.tenBan || booking.TenBan || "Chưa cập nhật";
    const batDau = booking.thoiGianBatDau || booking.ThoiGianBatDau;
    const duKien = booking.thoiGianDuKien || booking.ThoiGianDuKien;
    const soNguoi = booking.soLuongNguoi || booking.SoLuongNguoi || 0;

    return (
      <div
        key={maDon}
        className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-sm text-slate-500">Mã đơn</div>
              <div className="text-base font-semibold text-slate-900">
                {maDon}
              </div>
            </div>
            <div className="text-sm">{renderBookingStatus(booking)}</div>
          </div>
          <div className="text-sm text-slate-700">
            Bàn: <span className="font-medium">{tenBan}</span>
          </div>
          <div className="text-sm text-slate-700">
            Thời gian đặt:{" "}
            {batDau
              ? new Date(batDau).toLocaleString("vi-VN")
              : "Chưa cập nhật"}
          </div>
          {duKien && (
            <div className="text-sm text-blue-700">
              Dự kiến nhận bàn: {new Date(duKien).toLocaleString("vi-VN")}
            </div>
          )}
          <div className="text-sm text-slate-700">Số khách: {soNguoi}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tra cứu lịch sử đặt bàn</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 items-start"
          >
            <Input
              placeholder="Nhập số điện thoại đã dùng để đặt bàn"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 min-w-[240px]"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tra cứu..." : "Xem lịch sử"}
            </Button>
          </form>
          <p className="mt-3 text-sm text-slate-600">
            Hệ thống sẽ tìm theo đúng số điện thoại từng dùng khi đặt bàn. Nếu
            không tìm thấy, bạn có thể thử lại hoặc liên hệ hotline để được hỗ
            trợ.
          </p>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả tra cứu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            )}

            {customerInfo && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <div className="font-semibold">
                  {customerInfo.hoTen || "Khách hàng"}
                </div>
                <div>Số điện thoại: {customerInfo.soDienThoai}</div>
                {customerInfo.email && <div>Email: {customerInfo.email}</div>}
                {typeof customerInfo.soLanAn === "number" && (
                  <div>Đã ghé: {customerInfo.soLanAn} lần</div>
                )}
              </div>
            )}

            {bookings.length === 0 ? (
              <div className="text-sm text-slate-500">
                {customerInfo
                  ? "Khách hàng chưa có lịch sử đặt bàn."
                  : "Không có dữ liệu để hiển thị."}
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => renderBookingCard(booking))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingHistoryByPhoneTab;



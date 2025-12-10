import React from 'react';

interface InvoiceProps {
  order: any;
  groupedItems: any[];
  totalAmount: number;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>((props, ref) => {
  const { order, groupedItems, totalAmount } = props;

  if (!order) return null;

  const formatCurrency = (val: number | null | undefined) => {
    const num = val ?? 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleString('vi-VN');
    } catch {
      return '-';
    }
  };

  return (
    <div ref={ref} className="p-8 bg-white text-black font-sans max-w-[80mm] mx-auto text-sm">
      {/* Header */}
      <div className="text-center mb-4 border-b border-dashed border-black pb-4">
        <h1 className="text-xl font-bold uppercase">Viet Restaurant</h1>
        <p className="text-xs">Địa chỉ: 140 Lê Trọng Tấn, Q. Tân Phú, TP.HCM</p>
        <p className="text-xs">Hotline: 1900 1234</p>
        <h2 className="text-lg font-bold mt-4 uppercase">HÓA ĐƠN THANH TOÁN</h2>
        <p className="text-xs">Số phiếu: {order.maDonHang || order.MaDonHang || '---'}</p>
        <p className="text-xs">Ngày: {formatDate(order.thoiGianDatHang || order.ThoiGianDatHang || order.ThoiGianDat)}</p>
      </div>

      {/* Thông tin */}
      <div className="mb-4 text-xs">
        <div className="flex justify-between">
          <span>Khách hàng:</span>
          <span className="font-bold">{order.hoTenKhachHang || order.HoTenKhachHang || order.tenNguoiDat || order.TenNguoiDat || '---'}</span>
        </div>
        <div className="flex justify-between">
          <span>Thu ngân:</span>
          <span>{order.tenNhanVien || order.TenNhanVien || 'Admin'}</span>
        </div>
      </div>

      {/* Chi tiết món */}
      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Món</th>
            <th className="text-center py-1">SL</th>
            <th className="text-right py-1">Tiền</th>
          </tr>
        </thead>
        <tbody>
          {groupedItems && groupedItems.length > 0 ? groupedItems.map((group, gIdx) => {
            const tenBan = group.tenBan || group.TenBan || 'Chung';
            const items = group.items || group.Items || [];
            
            return (
              <React.Fragment key={gIdx}>
                {/* Tên bàn */}
                <tr className="bg-gray-100">
                  <td colSpan={3} className="py-1 font-bold italic pt-2">{tenBan}</td>
                </tr>
                {/* Món ăn */}
                {items.map((item: any, i: number) => {
                  const tenMon = item.tenMon || item.TenMon || 'Món không xác định';
                  const tenPhienBan = item.tenPhienBan || item.TenPhienBan || '';
                  const soLuong = item.soLuong ?? item.SoLuong ?? 0;
                  const thanhTien = item.thanhTien ?? item.ThanhTien ?? (item.donGia ?? item.DonGia ?? 0) * soLuong;
                  
                  return (
                    <tr key={i} className="border-b border-dotted border-gray-300">
                      <td className="py-1">
                        <div>{tenMon}</div>
                        {tenPhienBan && <div className="text-[10px] text-gray-500">({tenPhienBan})</div>}
                      </td>
                      <td className="text-center py-1 align-top">{soLuong}</td>
                      <td className="text-right py-1 align-top">{formatCurrency(thanhTien)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          }) : (
            <tr>
              <td colSpan={3} className="text-center py-2 text-gray-500">Không có món nào</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tổng tiền */}
      <div className="border-t border-black pt-2 mb-6">
        <div className="flex justify-between font-bold text-base">
          <span>TỔNG CỘNG:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Đã đặt cọc:</span>
          <span>{formatCurrency(order.tienDatCoc ?? order.TienDatCoc ?? 0)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold mt-2 border-t border-dotted pt-2">
          <span>CẦN THANH TOÁN:</span>
          <span>{formatCurrency(Math.max(0, totalAmount - (order.tienDatCoc ?? order.TienDatCoc ?? 0)))}</span>
        </div>
      </div>

      <div className="text-center text-xs italic">
        <p>Cảm ơn quý khách!</p>
        <p>Hẹn gặp lại.</p>
      </div>
    </div>
  );
});
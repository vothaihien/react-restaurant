import React from 'react';

interface InvoiceProps {
  order: any;
  groupedItems: any[];
  totalAmount: number;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>((props, ref) => {
  const { order, groupedItems, totalAmount } = props;

  if (!order) return null;

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatDate = (date: string) => date ? new Date(date).toLocaleString('vi-VN') : '-';

  return (
    <div ref={ref} className="p-8 bg-white text-black font-sans max-w-[80mm] mx-auto text-sm">
      {/* Header */}
      <div className="text-center mb-4 border-b border-dashed border-black pb-4">
        <h1 className="text-xl font-bold uppercase">Viet Restaurant</h1>
        <p className="text-xs">Địa chỉ: 140 Lê Trọng Tấn, Q. Tân Phú, TP.HCM</p>
        <p className="text-xs">Hotline: 1900 1234</p>
        <h2 className="text-lg font-bold mt-4 uppercase">HÓA ĐƠN THANH TOÁN</h2>
        <p className="text-xs">Số phiếu: {order.maDonHang}</p>
        <p className="text-xs">Ngày: {formatDate(order.thoiGianDatHang)}</p>
      </div>

      {/* Thông tin */}
      <div className="mb-4 text-xs">
        <div className="flex justify-between">
          <span>Khách hàng:</span>
          <span className="font-bold">{order.hoTenKhachHang}</span>
        </div>
        <div className="flex justify-between">
          <span>Thu ngân:</span>
          <span>{order.tenNhanVien || 'Admin'}</span>
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
          {groupedItems.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {/* Tên bàn */}
              <tr className="bg-gray-100">
                <td colSpan={3} className="py-1 font-bold italic pt-2">{group.tenBan}</td>
              </tr>
              {/* Món ăn */}
              {group.items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-dotted border-gray-300">
                  <td className="py-1">
                    <div>{item.tenMon}</div>
                    <div className="text-[10px] text-gray-500">({item.tenPhienBan})</div>
                  </td>
                  <td className="text-center py-1 align-top">{item.soLuong}</td>
                  <td className="text-right py-1 align-top">{formatCurrency(item.thanhTien)}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
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
          <span>{formatCurrency(order.tienDatCoc || 0)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold mt-2 border-t border-dotted pt-2">
          <span>CẦN THANH TOÁN:</span>
          <span>{formatCurrency(totalAmount - (order.tienDatCoc || 0))}</span>
        </div>
      </div>

      <div className="text-center text-xs italic">
        <p>Cảm ơn quý khách!</p>
        <p>Hẹn gặp lại.</p>
      </div>
    </div>
  );
});
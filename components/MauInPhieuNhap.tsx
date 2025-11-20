import React from 'react';

// Sửa Interface: Chỉ nhận đúng 1 biến 'data'
interface Props {
    data: any; 
}

export const MauInPhieuNhap = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
    // Lấy data từ props ra
    const { data } = props;

    // Nếu chưa bấm in (data là null) thì không hiện gì cả
    if (!data) return null;

    return (
        <div ref={ref} className="p-10 bg-white text-black font-sans" style={{ width: '100%', minHeight: '297mm' }}>
            {/* --- HEADER --- */}
            <div className="flex justify-between border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase">PHIẾU NHẬP KHO</h1>
                    <p className="italic mt-1">Mã phiếu: <strong>{data.maNhapHang}</strong></p>
                </div>
                <div className="text-right text-sm">
                    <p className="font-bold">NHÀ HÀNG CỦA HIẾU</p>
                    <p>ĐC: 123 Đường ABC, Quận 1, TP.HCM</p>
                    <p>Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
            </div>

            {/* --- THÔNG TIN CHUNG --- */}
            <div className="mb-6 grid grid-cols-2 gap-8 text-sm">
                <div>
                    <h3 className="font-bold border-b border-gray-400 mb-2">Nhà Cung Cấp</h3>
                    <p><strong>Tên:</strong> {data.tenNhaCungCap}</p>
                    <p><strong>ĐC:</strong> {data.diaChiNCC}</p>
                    <p><strong>SĐT:</strong> {data.sdtNCC}</p>
                </div>
                <div>
                    <h3 className="font-bold border-b border-gray-400 mb-2">Thông tin Phiếu</h3>
                    <p><strong>Ngày lập:</strong> {new Date(data.ngayLap).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Người nhập:</strong> {data.tenNhanVien}</p>
                    <p><strong>Trạng thái:</strong> {data.tenTrangThai}</p>
                </div>
            </div>

            {/* --- BẢNG CHI TIẾT --- */}
            <table className="w-full border-collapse border border-black text-sm mb-6">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border border-black p-2 w-10">STT</th>
                        <th className="border border-black p-2 text-left">Tên Hàng</th>
                        <th className="border border-black p-2 text-center">ĐVT</th>
                        <th className="border border-black p-2 text-center">SL</th>
                        <th className="border border-black p-2 text-right">Đơn Giá</th>
                        <th className="border border-black p-2 text-right">Thành Tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Lưu ý: Dùng data.chiTiet để map */}
                    {data.chiTiet?.map((item: any, idx: number) => (
                        <tr key={idx}>
                            <td className="border border-black p-2 text-center">{idx + 1}</td>
                            <td className="border border-black p-2">{item.tenNguyenLieu}</td>
                            <td className="border border-black p-2 text-center">{item.donViTinh}</td>
                            <td className="border border-black p-2 text-center font-bold">{item.soLuong}</td>
                            <td className="border border-black p-2 text-right">{item.giaNhap.toLocaleString()}</td>
                            <td className="border border-black p-2 text-right font-bold">
                                {(item.soLuong * item.giaNhap).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={5} className="border border-black p-2 text-right font-bold uppercase">Tổng Cộng:</td>
                        <td className="border border-black p-2 text-right font-bold text-lg">
                            {data.tongTien?.toLocaleString()} đ
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* --- CHỮ KÝ --- */}
            <div className="grid grid-cols-3 gap-4 text-center mt-12">
                <div>
                    <p className="font-bold text-xs uppercase">Người Lập</p>
                    <p className="italic text-[10px]">(Ký, họ tên)</p>
                </div>
                <div>
                    <p className="font-bold text-xs uppercase">Thủ Kho</p>
                    <p className="italic text-[10px]">(Ký, họ tên)</p>
                </div>
                <div>
                    <p className="font-bold text-xs uppercase">Nhà Cung Cấp</p>
                    <p className="italic text-[10px]">(Ký, họ tên)</p>
                </div>
            </div>
        </div>
    );
});
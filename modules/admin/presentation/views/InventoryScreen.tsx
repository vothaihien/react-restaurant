import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

<<<<<<< Updated upstream:modules/admin/presentation/views/InventoryScreen.tsx
// --- IMPORT TYPES ---

import InventoryService from '@/services/inventoryService';
import { MauInPhieuNhap } from '@/components/MauInPhieuNhap';
import {  
=======
// --- IMPORT TYPES & SERVICES ---
import { 
>>>>>>> Stashed changes:src/pages/admin/InventoryScreen.tsx
    NhaCungCap, 
    NguyenLieuNCC, 
    CartItem, 
    PhieuNhapHistory, 
    NhapKhoPayload 
<<<<<<< Updated upstream:modules/admin/presentation/views/InventoryScreen.tsx
}  from 'src/types/InventoryTypes';
=======
} from '@/types/InventoryTypes';
import InventoryService from '@/services/inventoryService';
import { MauInPhieuNhap } from '@/components/printing/MauInPhieuNhap';
import { useAuth } from '@/contexts';
>>>>>>> Stashed changes:src/pages/admin/InventoryScreen.tsx

const InventoryScreen = () => {

    const { user } = useAuth();
    // --- 1. STATE QUẢN LÝ ---
    const [activeTab, setActiveTab] = useState<1 | 2>(1);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Dữ liệu
    const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);
    const [ingredients, setIngredients] = useState<NguyenLieuNCC[]>([]);
    // Khởi tạo mảng rỗng để tránh lỗi map
    const [historyList, setHistoryList] = useState<PhieuNhapHistory[]>([]); 

    // Form nhập liệu
    const [selectedSupplier, setSelectedSupplier] = useState<NhaCungCap | null>(null);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
    const [inputQuantity, setInputQuantity] = useState<number>(1);
    const [inputPrice, setInputPrice] = useState<number>(0);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Bộ lọc & In ấn
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [printData, setPrintData] = useState<any>(null); 

    // Ref cho chức năng in
    const componentRef = useRef<HTMLDivElement>(null);

    // --- 2. INIT DATA (Đã bỏ check token thủ công) ---
    useEffect(() => {
        fetchSuppliers();
        fetchHistory();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [filterStatus]);

    // --- 3. HÀM GỌI LỆNH IN ---
    const handlePrintTrigger = useReactToPrint({
        contentRef: componentRef, 
        documentTitle: `PhieuNhap_${printData?.maNhapHang || 'Temp'}`,
    });

    // --- 4. GỌI SERVICE (ĐÃ SỬA: BỎ .data) ---
    const fetchSuppliers = async () => {
        try {
            // Sửa: Kết quả trả về là data luôn, không cần .data
            const data = await InventoryService.getSuppliers();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
    };

    const fetchIngredientsBySupplier = async (maNCC: string) => {
        try {
            // Sửa: Bỏ .data
            const data = await InventoryService.getIngredientsBySupplier(maNCC);
            setIngredients(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setIngredients([]); }
    };

    const fetchHistory = async () => {
        try {
            // Sửa: Bỏ .data và kiểm tra mảng
            const data = await InventoryService.getHistory(filterStatus);
            setHistoryList(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setHistoryList([]); }
    };

    // --- 5. XỬ LÝ LOGIC FORM ---
    const handleSelectSupplier = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const maNCC = e.target.value;
        if (!maNCC) {
            setSelectedSupplier(null); setIngredients([]); return;
        }
        if (cart.length > 0 && !editingId) {
            if (!confirm("Đổi NCC sẽ xóa danh sách hiện tại?")) return;
        }
        const supplier = suppliers.find(s => s.maNhaCungCap === maNCC) || null;
        setSelectedSupplier(supplier);
        setCart([]); setSelectedIngredientId(''); setInputPrice(0);
        fetchIngredientsBySupplier(maNCC);
    };

    const handleSelectIngredient = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const maCungUng = e.target.value;
        setSelectedIngredientId(maCungUng);
        const ing = ingredients.find(i => i.maCungUng === maCungUng);
        setInputPrice(ing ? (ing.giaGoiY || 0) : 0);
    };

    const handleAddProduct = () => {
        if (!selectedIngredientId) return alert("Chọn nguyên liệu!");
        if (inputQuantity <= 0) return alert("Số lượng > 0!");
        const ing = ingredients.find(i => i.maCungUng === selectedIngredientId);
        if (!ing) return;

        const idx = cart.findIndex(c => c.maCungUng === selectedIngredientId);
        if (idx !== -1) {
            const newCart = [...cart];
            newCart[idx].soLuong += inputQuantity;
            if (inputPrice > 0) newCart[idx].giaNhap = inputPrice;
            setCart(newCart);
        } else {
            setCart([...cart, {
                maCungUng: ing.maCungUng,
                maNguyenLieu: ing.maNguyenLieu,
                tenNguyenLieu: ing.tenNguyenLieu,
                donViTinh: ing.donViTinh,
                soLuong: inputQuantity,
                giaNhap: inputPrice
            }]);
        }
    };

    const handleUpdateRowPrice = (idx: number, val: number) => {
        const newCart = [...cart]; newCart[idx].giaNhap = val; setCart(newCart);
    };

    const handleRemoveItem = (idx: number) => {
        const newCart = [...cart]; newCart.splice(idx, 1); setCart(newCart);
    };

    // --- 6. XỬ LÝ EDIT & IN ẤN ---
    
    const handleEditClick = async (maPhieu: string) => {
        try {
            // Sửa: Bỏ .data
            const data: any = await InventoryService.getReceiptDetail(maPhieu);
            setEditingId(maPhieu);

            const ncc = suppliers.find(s => s.maNhaCungCap === data.maNhaCungCap) || null;
            setSelectedSupplier(ncc);
            if (data.maNhaCungCap) await fetchIngredientsBySupplier(data.maNhaCungCap);

            setCart(data.chiTiet.map((item: any) => ({
                maCungUng: item.maCungUng,
                maNguyenLieu: item.maNguyenLieu,
                tenNguyenLieu: item.tenNguyenLieu,
                donViTinh: item.donViTinh,
                soLuong: item.soLuong,
                giaNhap: item.giaNhap
            })));
            setActiveTab(1);
        } catch (err) { alert("Lỗi tải phiếu"); }
    };

    const handlePrintClick = async (maPhieu: string) => {
        try {
            // Sửa: Bỏ .data
            const data: any = await InventoryService.getReceiptDetail(maPhieu);

            const ncc = suppliers.find(s => s.maNhaCungCap === data.maNhaCungCap);
            
            const fullData = {
                ...data,
                maNhapHang: maPhieu, 
                ngayLap: data.ngayLapPhieu || new Date().toISOString(),
                tenNhaCungCap: ncc?.tenNhaCungCap || "---",
                diaChiNCC: ncc?.diaChi,
                sdtNCC: ncc?.soDienThoai,
                tenNhanVien: (user && user.type === 'admin') 
        ? `${user.employeeId} - ${user.name}` 
        : (user?.name || "Admin"),
                tenTrangThai: data.trangThai === 'DA_HOAN_TAT' ? 'Đã nhập kho' : 'Phiếu tạm'
            };

            setPrintData(fullData);

            setTimeout(() => {
                handlePrintTrigger();
            }, 200);

        } catch (err) {
            console.error(err);
            alert("Không thể tải dữ liệu để in!");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null); setCart([]); setSelectedSupplier(null); 
        setIngredients([]); setSelectedIngredientId('');
    };

    // --- 7. SUBMIT ---
    const handleSubmit = async (trangThaiStr: string) => {
        if (!selectedSupplier || cart.length === 0) return alert("Thiếu thông tin!");

        const maNhanVienCurrent = (user && user.type === 'admin') ? user.employeeId : '';

        if (!maNhanVienCurrent) {
            return alert("Lỗi: Không xác định được nhân viên đang đăng nhập! Vui lòng đăng nhập lại.");
        }

        const payload: NhapKhoPayload = {
        // Lưu ý: Các trường cấp 1 thường tự map được, nhưng chi tiết bên trong mảng thì nên cẩn thận
        maNhanVien: maNhanVienCurrent,
        maNhaCungCap: selectedSupplier.maNhaCungCap,
        maTrangThai: trangThaiStr,
        
        // SỬA CHỖ NÀY: Viết hoa chữ cái đầu cho khớp DTO C#
        chiTiet: cart.map(c => ({ 
            MaCungUng: c.maCungUng,  // maCungUng -> MaCungUng
            SoLuong: c.soLuong,      // soLuong -> SoLuong
            GiaNhap: c.giaNhap       // giaNhap -> GiaNhap
        }))
    };

        try {
            if (editingId) {
                await InventoryService.updateReceipt(editingId, payload);
                alert("Đã cập nhật!");
            } else {
                await InventoryService.createReceipt(payload);
                alert(trangThaiStr === 'MOI_TAO' ? "Đã lưu nháp!" : "Đã nhập kho!");
            }
            handleCancelEdit(); setActiveTab(2); fetchHistory();
        } catch (err: any) {
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    // --- 8. RENDER ---
    return (
        <div className="p-4 bg-gray-50 min-h-screen font-sans">
            
            {/* COMPONENT ẨN ĐỂ IN */}
            <div style={{ display: "none" }}>
                <MauInPhieuNhap ref={componentRef} data={printData} />
            </div>

            {/* HEADER TABS */}
            <div className="flex border-b border-gray-300 mb-4 bg-white shadow-sm rounded-t">
                <button className={`flex-1 py-3 font-bold ${activeTab === 1 ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-500'}`} onClick={() => setActiveTab(1)}>
                    {editingId ? `✏️ ĐANG SỬA: ${editingId}` : '📝 TẠO PHIẾU NHẬP'}
                </button>
                <button className={`flex-1 py-3 font-bold ${activeTab === 2 ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-500'}`} onClick={() => setActiveTab(2)}>
                    🕒 LỊCH SỬ NHẬP
                </button>
            </div>

            {/* TAB 1: FORM */}
            {activeTab === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-4 rounded shadow border">
                            {editingId && <button onClick={handleCancelEdit} className="w-full mb-3 bg-gray-500 text-white py-2 rounded">🔙 Hủy Sửa</button>}
                            <h3 className="font-bold text-lg mb-3">1. Nhà Cung Cấp</h3>
                            <select className="w-full p-2 border rounded mb-3" value={selectedSupplier?.maNhaCungCap || ''} onChange={handleSelectSupplier} disabled={!!editingId}>
                                <option value="">-- Chọn NCC --</option>
                                {suppliers.map(s => <option key={s.maNhaCungCap} value={s.maNhaCungCap}>{s.tenNhaCungCap}</option>)}
                            </select>
                            {selectedSupplier && <div className="bg-blue-50 p-3 rounded text-sm text-blue-800"><p>ĐC: {selectedSupplier.diaChi}</p><p>SĐT: {selectedSupplier.soDienThoai}</p></div>}
                        </div>

                        <div className="bg-white p-4 rounded shadow border">
                            <h3 className="font-bold text-lg mb-3">2. Chọn Hàng</h3>
                            <select className="w-full p-2 border rounded mb-3" value={selectedIngredientId} onChange={handleSelectIngredient} disabled={!selectedSupplier}>
                                <option value="">-- Chọn món --</option>
                                {ingredients.map(ing => <option key={ing.maCungUng} value={ing.maCungUng}>{ing.tenNguyenLieu} ({ing.donViTinh})</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div><label className="text-xs font-bold">Số lượng</label><input type="number" className="w-full p-2 border rounded" value={inputQuantity} onChange={e => setInputQuantity(Number(e.target.value))} /></div>
                                <div><label className="text-xs font-bold">Giá Nhập</label><input type="number" className="w-full p-2 border rounded" value={inputPrice} onChange={e => setInputPrice(Number(e.target.value))} /></div>
                            </div>
                            <button onClick={handleAddProduct} disabled={!selectedSupplier} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-300">+ THÊM</button>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded shadow border flex flex-col h-[calc(100vh-140px)]">
                        <div className="p-4 border-b bg-gray-50 font-bold text-lg">3. Danh sách hàng</div>
                        <div className="flex-1 overflow-auto p-4">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr><th className="p-2 text-left">Tên</th><th className="p-2 text-center">ĐVT</th><th className="p-2 text-center">SL</th><th className="p-2 text-right">Giá</th><th className="p-2 text-right">Tổng</th><th className="p-2"></th></tr>
                                </thead>
                                <tbody>
                                    {cart.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Trống</td></tr> : 
                                    cart.map((item, idx) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{item.tenNguyenLieu}</td>
                                            <td className="p-2 text-center">{item.donViTinh}</td>
                                            <td className="p-2 text-center font-bold">{item.soLuong}</td>
                                            <td className="p-2"><input type="number" className="w-full p-1 border text-right" value={item.giaNhap} onChange={e => handleUpdateRowPrice(idx, Number(e.target.value))} /></td>
                                            <td className="p-2 text-right font-bold">{(item.soLuong * item.giaNhap).toLocaleString()}</td>
                                            <td className="p-2 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-red-500">🗑️</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                            <div className="font-bold text-red-600 text-xl">TỔNG: {cart.reduce((s, i) => s + i.soLuong * i.giaNhap, 0).toLocaleString()} đ</div>
                            <div className="flex gap-2">
                                <button onClick={() => handleSubmit('MOI_TAO')} className="px-4 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600">💾 LƯU NHÁP</button>
                                <button onClick={() => handleSubmit('DA_HOAN_TAT')} className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">✅ HOÀN TẤT</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: LỊCH SỬ */}
            {activeTab === 2 && (
                <div className="bg-white p-6 rounded shadow border">
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                        <button onClick={() => setFilterStatus(null)} className={`px-3 py-1 border rounded ${!filterStatus ? 'bg-blue-600 text-white' : ''}`}>Tất cả</button>
                        <button onClick={() => setFilterStatus('MOI_TAO')} className={`px-3 py-1 border rounded ${filterStatus === 'MOI_TAO' ? 'bg-gray-600 text-white' : ''}`}>Nháp</button>
                        <button onClick={() => setFilterStatus('DA_HOAN_TAT')} className={`px-3 py-1 border rounded ${filterStatus === 'DA_HOAN_TAT' ? 'bg-green-600 text-white' : ''}`}>Hoàn tất</button>
                        <button onClick={fetchHistory} className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded">🔄 Refresh</button>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr><th className="p-3">Mã</th><th className="p-3">Ngày Lập</th><th className="p-3">NCC</th><th className="p-3 text-right">Tổng Tiền</th><th className="p-3 text-center">Trạng Thái</th><th className="p-3 text-center">Thao Tác</th></tr>
                            </thead>
                            <tbody>
                                {/* Sửa: Thêm ? để tránh lỗi nếu historyList bị undefined */}
                                {historyList?.length > 0 ? historyList.map(item => (
                                    <tr key={item.maNhapHang} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-bold text-blue-600">{item.maNhapHang}</td>
                                        <td className="p-3">{new Date(item.ngayLap).toLocaleString('vi-VN')}</td>
                                        <td className="p-3">{item.tenNhaCungCap}</td>
                                        <td className="p-3 text-right font-bold">{item.tongTien.toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs ${item.maTrangThai === 'DA_HOAN_TAT' ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>
                                                {item.tenTrangThai || item.maTrangThai}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center flex justify-center gap-2">
                                            {item.maTrangThai !== 'DA_HOAN_TAT' && (
                                                <button onClick={() => handleEditClick(item.maNhapHang)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600">✏️ Sửa</button>
                                            )}
                                            <button 
                                                onClick={() => handlePrintClick(item.maNhapHang)} 
                                                className="bg-gray-700 text-white px-2 py-1 rounded text-xs hover:bg-gray-800"
                                            >
                                                🖨️ In
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryScreen;
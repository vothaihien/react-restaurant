import React, { useState } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import { inventoryApi } from '@/shared/api/inventory';

const InventoryView: React.FC = () => {
    const { ingredients, lowStockIds, recordInventoryIn } = useAppContext() as any;
    const [selectedIng, setSelectedIng] = useState<string>('');
    const [qty, setQty] = useState<number>(0);

    // Form thêm nguyên liệu mới
    const [showAddForm, setShowAddForm] = useState(false);
    const [newIngredient, setNewIngredient] = useState({
        TenNguyenLieu: '',
        DonViTinh: '',
        SoLuongTonKho: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');

    const lowIds: string[] = (lowStockIds && lowStockIds()) || [];

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIng || !qty) return;
        recordInventoryIn([{ ingredientId: selectedIng, quantity: qty }]);
        setQty(0);
    };

    const handleAddIngredient = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newIngredient.TenNguyenLieu.trim()) {
            setError('Vui lòng nhập tên nguyên liệu');
            return;
        }

        setIsSubmitting(true);
        try {
            await inventoryApi.createIngredient({
                TenNguyenLieu: newIngredient.TenNguyenLieu.trim(),
                DonViTinh: newIngredient.DonViTinh.trim() || undefined,
                SoLuongTonKho: newIngredient.SoLuongTonKho || 0
            });

            // Reset form
            setNewIngredient({
                TenNguyenLieu: '',
                DonViTinh: '',
                SoLuongTonKho: 0
            });
            setShowAddForm(false);

            // Reload trang để cập nhật danh sách
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi thêm nguyên liệu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Tồn kho</h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                    {showAddForm ? 'Hủy' : '+ Thêm nguyên liệu mới'}
                </button>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Nhập kho nhanh</h3>
                <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
                    <select value={selectedIng} onChange={(e) => setSelectedIng(e.target.value)} className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300">
                        <option value="">Chọn nguyên liệu</option>
                        {(ingredients || []).map((ing: any) => (
                            <option key={ing.maNguyenLieu || ing.id} value={ing.maNguyenLieu || ing.id}>{ing.tenNguyenLieu || ing.name}</option>
                        ))}
                    </select>
                    <input type="number" value={qty} onChange={(e) => setQty(parseFloat(e.target.value))} placeholder="Số lượng" className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" />
                    <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white">Nhập</button>
                </form>
            </div>

            {showAddForm && (
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">Thêm nguyên liệu mới</h3>
                    <form onSubmit={handleAddIngredient} className="space-y-3">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên nguyên liệu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newIngredient.TenNguyenLieu}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, TenNguyenLieu: e.target.value })}
                                    placeholder="VD: Thịt bò, Rau cải..."
                                    required
                                    className="w-full bg-white text-gray-900 rounded px-3 py-2 border border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Đơn vị tính
                                </label>
                                <input
                                    type="text"
                                    value={newIngredient.DonViTinh}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, DonViTinh: e.target.value })}
                                    placeholder="VD: kg, g, lít..."
                                    className="w-full bg-white text-gray-900 rounded px-3 py-2 border border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số lượng tồn kho
                                </label>
                                <input
                                    type="number"
                                    value={newIngredient.SoLuongTonKho}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, SoLuongTonKho: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full bg-white text-gray-900 rounded px-3 py-2 border border-gray-300"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Đang thêm...' : 'Thêm nguyên liệu'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setError('');
                                    setNewIngredient({ TenNguyenLieu: '', DonViTinh: '', SoLuongTonKho: 0 });
                                }}
                                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(ingredients || []).map((ing: any) => (
                        <div key={ing.maNguyenLieu || ing.id} className={`p-4 rounded-lg border ${lowIds.includes(ing.maNguyenLieu || ing.id) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                            <div className="text-gray-900 font-semibold">{ing.tenNguyenLieu || ing.name}</div>
                            <div className="text-gray-700 text-sm">Tồn: {ing.stock || ing.soLuongTonKho || 0} {ing.donViTinh || ing.unit || ''}</div>
                            {typeof ing.minStock === 'number' && <div className="text-gray-500 text-xs">Tối thiểu: {ing.minStock}</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InventoryView;

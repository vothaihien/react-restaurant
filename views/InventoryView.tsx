import React, { useState } from 'react';
import { useAppContext } from '@/core/context/AppContext';

const InventoryView: React.FC = () => {
    const { ingredients, lowStockIds, recordInventoryIn } = useAppContext() as any;
    const [selectedIng, setSelectedIng] = useState<string>('');
    const [qty, setQty] = useState<number>(0);

    const lowIds: string[] = (lowStockIds && lowStockIds()) || [];

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIng || !qty) return;
        recordInventoryIn([{ ingredientId: selectedIng, quantity: qty }]);
        setQty(0);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-3">Tồn kho</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(ingredients || []).map((ing: any) => (
                        <div key={ing.id} className={`p-4 rounded-lg border ${lowIds.includes(ing.id) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                            <div className="text-gray-900 font-semibold">{ing.name}</div>
                            <div className="text-gray-700 text-sm">Tồn: {ing.stock} {ing.unit}</div>
                            {typeof ing.minStock === 'number' && <div className="text-gray-500 text-xs">Tối thiểu: {ing.minStock}</div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Nhập kho nhanh</h3>
                <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
                    <select value={selectedIng} onChange={(e) => setSelectedIng(e.target.value)} className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300">
                        <option value="">Chọn nguyên liệu</option>
                        {(ingredients || []).map((ing: any) => (
                            <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                    </select>
                    <input type="number" value={qty} onChange={(e) => setQty(parseFloat(e.target.value))} placeholder="Số lượng" className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" />
                    <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white">Nhập</button>
                </form>
            </div>
        </div>
    );
};

export default InventoryView;

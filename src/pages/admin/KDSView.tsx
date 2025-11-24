import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

const viKdsStatus = (s: string) => {
    switch (s) {
        case 'Queued': return 'Chờ chế biến';
        case 'InProgress': return 'Đang chế biến';
        case 'Done': return 'Hoàn tất';
        default: return s;
    }
};

const KDSView: React.FC = () => {
    const { kdsQueue } = useAppContext() as any;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Màn hình bếp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(kdsQueue || []).map((k: any) => (
                    <div key={k.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-gray-900 font-semibold">Bàn {k.tableName}</div>
                            <div className="text-xs text-gray-500">{new Date(k.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div className="text-gray-700 text-sm mb-2">Trạng thái: {viKdsStatus(k.status)}</div>
                        <div className="space-y-1">
                            {k.items.map((it: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-gray-900">
                                    <span>{it.qty}x {it.name} <span className="text-gray-500">({it.size})</span></span>
                                    {it.notes && <span className="text-gray-500">{it.notes}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KDSView;



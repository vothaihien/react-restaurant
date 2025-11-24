import React, { useState } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import { TableStatus } from '@/core/types';
const SettingsView: React.FC = () => {
    const { tables, updateTableStatus } = useAppContext();
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    const handleStatusChange = (tableId: string, newStatus: TableStatus) => {
        updateTableStatus(tableId, newStatus);
        setSelectedTable(null);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Cài đặt hệ thống</h1>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Quản lý bàn ăn</h2>
                <p className="text-gray-600 mb-6">Cấu hình trạng thái và thông tin các bàn ăn trong nhà hàng.</p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tables.map(table => (
                        <div key={table.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                            <h3 className="font-bold text-gray-900 mb-2">{table.name}</h3>
                            <p className="text-sm text-gray-600 mb-1">Sức chứa: {table.capacity} người</p>
                            <p className="text-sm text-gray-600 mb-3">Trạng thái: {table.status}</p>
                            <button
                                onClick={() => setSelectedTable(selectedTable === table.id ? null : table.id)}
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                                {selectedTable === table.id ? 'Hủy' : 'Đổi trạng thái'}
                            </button>
                            {selectedTable === table.id && (
                                <div className="mt-2 space-y-1">
                                    {Object.values(TableStatus).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(table.id, status)}
                                            className="block w-full text-left text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Thông tin hệ thống</h2>
                <div className="space-y-3 text-gray-700">
                    <div>
                        <span className="font-semibold">Phiên bản:</span> 1.0.0
                    </div>
                    <div>
                        <span className="font-semibold">Tổng số bàn:</span> {tables.length}
                    </div>
                    <div>
                        <span className="font-semibold">Bàn đang sử dụng:</span>{' '}
                        {tables.filter(t => t.status === TableStatus.Occupied).length}
                    </div>
                    <div>
                        <span className="font-semibold">Bàn trống:</span>{' '}
                        {tables.filter(t => t.status === TableStatus.Empty).length}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';

const MasterDataView: React.FC = () => {
    const { suppliers, addSupplier, tables, addTable, deleteTable, staff, addStaff, deleteStaff } = useAppContext() as any;
    const [name, setName] = useState<string>('');

    const add = () => {
        if (!name.trim()) return;
        addSupplier({ name });
        setName('');
    };

    // table quick add
    const [tableName, setTableName] = useState('');
    const [capacity, setCapacity] = useState<number>(2);
    const addTbl = () => {
        if (!tableName.trim() || capacity <= 0) return;
        addTable({ name: tableName, capacity });
        setTableName(''); setCapacity(2);
    };

    // staff quick add
    const [staffName, setStaffName] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('Waiter');
    const addStf = () => {
        if (!staffName.trim() || !username.trim()) return;
        addStaff({ name: staffName, username, role });
        setStaffName(''); setUsername(''); setRole('Waiter');
    };

    const tabs = [
        { id: 'suppliers', label: 'Nhà cung cấp' },
        { id: 'tables', label: 'Bàn ăn' },
        { id: 'staff', label: 'Nhân viên & Vai trò' }
    ] as const;
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('suppliers');

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Quản lý Danh mục</h2>

            <div className="bg-white border border-gray-200 rounded-lg">
                <div className="border-b border-gray-200 flex flex-wrap gap-2 px-4 pt-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-t font-semibold ${activeTab === tab.id ? 'bg-white border border-b-white border-gray-200 text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="p-4 space-y-4">
                    {activeTab === 'suppliers' && (
                        <>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300 flex-1" placeholder="Tên nhà cung cấp" value={name} onChange={(e) => setName(e.target.value)} />
                                <button onClick={add} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white">Thêm</button>
                            </div>
                            <div className="space-y-2">
                                {(suppliers || []).map((s: any) => (
                                    <div key={s.id} className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">{s.name}</div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'tables' && (
                        <>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300 flex-1" placeholder="Tên bàn" value={tableName} onChange={(e) => setTableName(e.target.value)} />
                                <input type="number" className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300 w-full sm:w-32" placeholder="Sức chứa" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value) || 2)} />
                                <button onClick={addTbl} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white">Thêm bàn</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {(tables || []).map((t: any) => (
                                    <div key={t.id} className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900 flex items-center justify-between">
                                        <div>{t.name} <span className="text-gray-500 text-sm">(Sức chứa: {t.capacity})</span></div>
                                        <button onClick={() => deleteTable(t.id)} className="text-red-600 hover:text-red-700">Xóa</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'staff' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" placeholder="Họ tên" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
                                <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} />
                                <select className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" value={role} onChange={(e) => setRole(e.target.value)}>
                                    {['Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen'].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <button onClick={addStf} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white">Thêm nhân viên</button>
                            </div>
                            <div className="space-y-2">
                                {(staff || []).map((u: any) => (
                                    <div key={u.id} className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900 flex items-center justify-between">
                                        <div>{u.name} <span className="text-gray-500 text-sm">@{u.username} · {u.role}</span></div>
                                        <button onClick={() => deleteStaff(u.id)} className="text-red-600 hover:text-red-700">Xóa</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MasterDataView;



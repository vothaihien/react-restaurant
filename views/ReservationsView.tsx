import React, { useState } from 'react';
import { useAppContext } from '@/core/context/AppContext';

const viResStatus = (s: string) => {
    switch (s) {
        case 'Booked': return 'Đã đặt';
        case 'Seated': return 'Đang sử dụng';
        case 'Cancelled': return 'Đã hủy';
        case 'NoShow': return 'Vắng mặt';
        default: return s;
    }
};

const ReservationsView: React.FC = () => {
    const { reservations, confirmArrival, cancelReservation, markNoShow, tables, createReservation } = useAppContext() as any;

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000;

    const todays = (reservations || []).filter((r: any) => r.time >= start && r.time < end);

    const getTableName = (id?: string | null) => (tables || []).find((t: any) => t.id === id)?.name || 'N/A';
    const getTableNames = (r: any) => {
        if (r.tableIds && r.tableIds.length > 0) {
            return r.tableIds.map((id: string) => getTableName(id)).join(', ');
        } else if (r.tableId) {
            return getTableName(r.tableId);
        }
        return 'N/A';
    };

    // quick create
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [party, setParty] = useState<number>(2);
    const [time, setTime] = useState<string>('');
    const [tableId, setTableId] = useState<string>('');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !time) return;
        const [hh, mm] = time.split(':').map(x => parseInt(x));
        const when = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hh || 0, mm || 0).getTime();
        createReservation({ customerName: name, phone, partySize: party, time: when, tableId: tableId || null, source: 'InPerson' });
        setName(''); setPhone(''); setParty(2); setTime(''); setTableId('');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Đặt bàn (Hôm nay)</h2>

            <form onSubmit={submit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
                <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" placeholder="Tên khách" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" placeholder="Điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" type="number" min={1} placeholder="Số khách" value={party} onChange={(e) => setParty(parseInt(e.target.value) || 1)} />
                <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                <select className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300" value={tableId} onChange={(e) => setTableId(e.target.value)}>
                    <option value="">Gán bàn (không bắt buộc)</option>
                    {(tables || []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white">Tạo</button>
            </form>

            <div className="space-y-3">
                {todays.length === 0 && <p className="text-gray-500">Hôm nay chưa có đặt bàn.</p>}
                {todays.map((r: any) => (
                    <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <div className="text-gray-900 font-semibold">{r.customerName} · {r.partySize} khách</div>
                            <div className="text-gray-600 text-sm">{new Date(r.time).toLocaleTimeString()} · Bàn: {getTableNames(r)} · Trạng thái: {viResStatus(r.status)}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => confirmArrival(r.id)} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white">Check-in</button>
                            <button onClick={() => markNoShow(r.id)} className="px-3 py-2 rounded bg-yellow-500 hover:bg-yellow-400 text-white">Vắng mặt</button>
                            <button onClick={() => cancelReservation(r.id)} className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-white">Hủy</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReservationsView;

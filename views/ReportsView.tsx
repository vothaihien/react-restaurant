
import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import { formatVND } from '@/shared/utils';
import { Api } from '@/shared/utils/api';

const currency = formatVND;

const ReportsView: React.FC = () => {
    const { orders } = useAppContext() as any;
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [monthly, setMonthly] = useState<Array<{ thang: number; doanhThu: number }>>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await Api.getRevenueByMonth(year);
                setMonthly(data || []);
            } catch {
                setMonthly([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [year]);

    const { todayRevenue, monthRevenue, paymentBreakdown, topItems } = useMemo(() => {
        const now = new Date();
        const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const paid = (orders || []).filter((o: any) => o.closedAt && o.paymentMethod);

        const todayRevenue = paid.filter((o: any) => (o.closedAt as number) >= startDay).reduce((a: number, o: any) => a + o.total, 0);
        const monthRevenue = paid.filter((o: any) => (o.closedAt as number) >= startMonth).reduce((a: number, o: any) => a + o.total, 0);

        const paymentBreakdown: Record<string, number> = {};
        paid.forEach((o: any) => {
            paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + o.total;
        });

        const itemCount: Record<string, { name: string; qty: number; revenue: number }> = {};
        paid.forEach((o: any) => {
            o.items.forEach((it: any) => {
                const price = it.menuItem.sizes.find((s: any) => s.name === it.size)?.price || 0;
                const key = `${it.menuItem.id}-${it.size}`;
                const rec = itemCount[key] || { name: `${it.menuItem.name} (${it.size})`, qty: 0, revenue: 0 };
                rec.qty += it.quantity;
                rec.revenue += price * it.quantity;
                itemCount[key] = rec;
            });
        });
        const topItems = Object.values(itemCount).sort((a, b) => b.qty - a.qty).slice(0, 5);

        return { todayRevenue, monthRevenue, paymentBreakdown, topItems };
    }, [orders]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Báo cáo & Thống kê</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="text-gray-500 text-sm">Doanh thu hôm nay</div>
                    <div className="text-2xl font-bold text-gray-900">{currency(todayRevenue)}</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="text-gray-500 text-sm">Doanh thu tháng này</div>
                    <div className="text-2xl font-bold text-gray-900">{currency(monthRevenue)}</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="text-gray-500 text-sm">Phương thức thanh toán</div>
                    <div className="text-gray-900">
                        {Object.keys(paymentBreakdown).length === 0 && <div className="text-gray-500">Chưa có thanh toán.</div>}
                        {Object.entries(paymentBreakdown).map(([k, v]) => (
                            <div key={k} className="flex justify-between"><span>{k}</span><span>{currency(v as number)}</span></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Món bán chạy</h2>
                {topItems.length === 0 ? (
                    <p className="text-gray-500">Chưa có dữ liệu.</p>
                ) : (
                    <div className="space-y-2">
                        {topItems.map((t: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-gray-900">
                                <span>{t.name} <span className="text-gray-500">x{t.qty}</span></span>
                                <span>{currency(t.revenue)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900">Doanh thu theo tháng (API)</h2>
                    <div className="flex items-center gap-2">
                        <label className="text-gray-700 text-sm">Năm</label>
                        <input className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300 w-28" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())} />
                    </div>
                </div>
                {loading ? <div className="text-gray-500">Đang tải...</div> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Array.from({ length: 12 }).map((_, idx) => {
                            const th = idx + 1;
                            const row = monthly.find(x => (x.thang || x.Thang) === th);
                            const val = row ? (row.doanhThu ?? (row as any).DoanhThu) : 0;
                            return (
                                <div key={th} className="flex items-center justify-between border border-gray-200 rounded px-3 py-2">
                                    <span className="text-gray-700">Tháng {th}</span>
                                    <span className="font-semibold text-gray-900">{formatVND(val || 0)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsView;

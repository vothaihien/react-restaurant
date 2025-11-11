import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import { TableStatus } from '@/features/tables/domain/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { DateTimePicker } from '@/shared/components/ui/date-time-picker';
import { formatVND } from '@/shared/utils';
import { useFeedback } from '@/core/context/FeedbackContext';
import { useAuth } from '@/core/context/AuthContext';
import { Api } from '@/shared/utils/api';

const CustomerPortalView: React.FC = () => {
    const { menuItems, createReservation, tables } = useAppContext() as any;
    const { user, isAuthenticated, checkUser, login, register, logout } = useAuth();
    const [tab, setTab] = useState<'home' | 'booking' | 'menu' | 'order' | 'loyalty' | 'promotions' | 'feedback'>('home');
    const { notify } = useFeedback();

    // Debug: Log menuItems changes
    useEffect(() => {
        console.log('CustomerPortalView - menuItems updated:', menuItems?.length, menuItems);
    }, [menuItems]);

    // Booking form
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [party, setParty] = useState(2);
    const [dateTime, setDateTime] = useState<Date | undefined>(undefined);
    const [notes, setNotes] = useState('');
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

    // Cart (shared for booking pre-order & order tab)
    const [cart, setCart] = useState<any[]>([]);

    const submitBooking = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !dateTime) {
            notify({
                tone: 'warning',
                title: 'Thiếu thông tin đặt bàn',
                description: 'Vui lòng nhập họ tên và chọn ngày giờ mong muốn.',
            });
            return;
        }
        const ts = dateTime.getTime();
        // append preorder summary to notes if any
        const preorder = cart.length
            ? `\n[Đặt món trước] ${cart.map(c => `${c.qty}x ${c.name} (${c.size})`).join(', ')}`
            : '';
        const reservationData: any = {
            customerName: name,
            phone,
            partySize: party,
            time: ts,
            source: 'App',
            notes: (notes || '') + preorder
        };
        if (selectedTableIds.length > 0) {
            reservationData.tableIds = selectedTableIds;
        } else {
            reservationData.tableId = null;
        }
        createReservation(reservationData);
        setName(''); setPhone(''); setParty(2); setDateTime(undefined); setNotes(''); setSelectedTableIds([]); setCart([]);
        notify({
            tone: 'success',
            title: 'Đã gửi yêu cầu',
            description: 'Nhà hàng sẽ liên hệ lại để xác nhận đặt bàn trong thời gian sớm nhất.',
        });
    };

    // Menu - only show items in stock (default to true if undefined)
    const availableMenuItems = useMemo(() => {
        const items = (menuItems || []).filter((m: any) => {
            // Show item if inStock is true or undefined (default to showing)
            // Also log for debugging
            const shouldShow = m.inStock !== false;
            if (!shouldShow) {
                console.log('Filtered out item:', m.name, 'inStock:', m.inStock);
            }
            return shouldShow;
        });
        console.log('Available menu items:', items.length, 'out of', menuItems?.length || 0, 'Total items:', menuItems);
        return items;
    }, [menuItems]);
    const categories = useMemo(() => Array.from(new Set(availableMenuItems.map((m: any) => m.category))), [availableMenuItems]);
    const [cat, setCat] = useState<string>('');
    const filtered = useMemo(() => (cat ? availableMenuItems.filter((m: any) => m.category === cat) : availableMenuItems), [availableMenuItems, cat]);

    // Featured dishes (top 6 by price as a simple proxy)
    const featured = useMemo(() => {
        const flat: any[] = [];
        availableMenuItems.forEach((m: any) => {
            m.sizes.forEach((s: any) => flat.push({ ...m, featureKey: `${m.id}-${s.name}`, sizeName: s.name, price: s.price }));
        });
        return flat.sort((a, b) => b.price - a.price).slice(0, 6);
    }, [availableMenuItems]);

    const addToCart = (item: any, sizeName: string) => {
        const key = item.id + '-' + sizeName;
        const found = cart.find((c) => c.key === key);
        if (found) setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c));
        else setCart([{ key, id: item.id, name: item.name, size: sizeName, price: item.sizes.find((s: any) => s.name === sizeName)?.price || 0, qty: 1 }, ...cart]);
    };
    const inc = (key: string) => setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c));
    const dec = (key: string) => setCart(cart.flatMap(c => c.key === key ? (c.qty > 1 ? [{ ...c, qty: c.qty - 1 }] : []) : [c]));
    const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

    const statusClass = (s: string, selected: boolean) => {
        const base = 'p-4 rounded-lg border-2 transition cursor-pointer';
        if (selected) return `${base} border-indigo-600 bg-indigo-50`;
        switch (s) {
            case TableStatus.Available:
                return `${base} border-green-500 bg-green-50 hover:bg-green-100`;
            case TableStatus.Occupied:
                return `${base} border-blue-300 bg-blue-50 opacity-60 cursor-not-allowed`;
            case TableStatus.Reserved:
                return `${base} border-yellow-300 bg-yellow-50 opacity-60 cursor-not-allowed`;
            case TableStatus.CleaningNeeded:
                return `${base} border-red-300 bg-red-50 opacity-60 cursor-not-allowed`;
            default:
                return `${base} border-gray-300 bg-white`;
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">Website Nhà hàng</h1>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="home">Trang chủ</TabsTrigger>
                    <TabsTrigger value="booking">Đặt bàn</TabsTrigger>
                    <TabsTrigger value="menu">Thực đơn</TabsTrigger>
                    <TabsTrigger value="order">Đặt món</TabsTrigger>
                    <TabsTrigger value="loyalty">Thành viên</TabsTrigger>
                    <TabsTrigger value="promotions">Khuyến mãi</TabsTrigger>
                    <TabsTrigger value="feedback">Phản hồi</TabsTrigger>
                </TabsList>

                <TabsContent value="home" className="space-y-6">
                    <section className="relative overflow-hidden rounded-xl">
                        <img src={featured[0]?.imageUrls?.[0] || 'https://picsum.photos/seed/restaurant-hero/1600/500'} alt="hero" className="w-full h-64 md:h-80 object-cover" />
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute inset-0 flex items-center">
                            <div className="px-6 md:px-10">
                                <h2 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">Trải nghiệm ẩm thực tinh tế</h2>
                                <p className="mt-2 text-white/90 max-w-xl">Nguyên liệu tươi, công thức độc quyền, không gian ấm cúng cho mọi dịp đặc biệt.</p>
                                <div className="mt-4 flex gap-3">
                                    <Button onClick={() => setTab('booking')}>Đặt bàn ngay</Button>
                                    <Button variant="outline" onClick={() => setTab('menu')}>Xem thực đơn</Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h3 className="text-2xl font-semibold text-gray-900">Về nhà hàng</h3>
                        <p className="mt-2 text-gray-700">Chúng tôi theo đuổi triết lý ẩm thực hiện đại, tôn vinh nguyên liệu bản địa và trải nghiệm khách hàng. Đội ngũ bếp có hơn 10 năm kinh nghiệm tại các nhà hàng đạt chuẩn quốc tế.</p>
                    </section>

                    <section className="bg-white border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-2xl font-semibold text-gray-900">Món nổi bật</h3>
                            <button onClick={() => setTab('menu')} className="text-indigo-600 hover:underline">Xem tất cả</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {featured.map((f: any) => (
                                <div key={f.featureKey} className="bg-white border border-gray-200 rounded p-2">
                                    <img src={f.imageUrls?.[0]} className="w-full h-24 object-cover rounded" />
                                    <div className="mt-2 text-sm font-semibold text-gray-900 line-clamp-2">{f.name}</div>
                                    <div className="text-xs text-gray-600">{f.sizeName} · {formatVND(f.price)}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="booking" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sơ đồ bàn (trạng thái hiện tại)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {(tables || []).map((t: any) => {
                                    const disabled = t.status !== TableStatus.Available;
                                    const selected = selectedTableIds.includes(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            disabled={disabled}
                                            onClick={() => {
                                                if (selected) {
                                                    setSelectedTableIds(selectedTableIds.filter(id => id !== t.id));
                                                } else {
                                                    setSelectedTableIds([...selectedTableIds, t.id]);
                                                }
                                            }}
                                            className={statusClass(t.status, selected)}
                                            title={disabled ? 'Bàn không khả dụng' : selected ? 'Bỏ chọn bàn này' : 'Chọn bàn này'}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-900">{t.name}</span>
                                                <span className="text-xs text-gray-600">{t.capacity} khách</span>
                                            </div>
                                            <div className="mt-1 text-sm text-gray-700">{t.status === TableStatus.Available ? 'Trống' : t.status === TableStatus.Occupied ? 'Đang sử dụng' : t.status === TableStatus.Reserved ? 'Đã đặt' : 'Chờ dọn'}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">Lưu ý: Sơ đồ thể hiện trạng thái hiện tại (demo). Tình trạng theo giờ sẽ cập nhật ở bước xác nhận.</div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white border border-gray-200 p-4 rounded">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Đặt món trước (tuỳ chọn)</h4>
                            <div className="flex gap-2 mb-3 flex-wrap">
                                <button onClick={() => setCat('')} className={`px-3 py-1 rounded ${cat === '' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Tất cả</button>
                                {categories.map((c: string) => (
                                    <button key={c} onClick={() => setCat(c)} className={`px-3 py-1 rounded ${cat === c ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{c}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {filtered.map((m: any) => (
                                    <div key={m.id} className="bg-white border border-gray-200 rounded p-3">
                                        <div className="text-gray-900 font-semibold">{m.name}</div>
                                        <div className="text-gray-600 text-sm mb-2">{m.category}</div>
                                        {m.sizes.map((s: any) => (
                                            <button key={s.name} onClick={() => addToCart(m, s.name)} className="w-full text-left bg-gray-50 hover:bg-gray-100 text-gray-900 px-2 py-1 rounded border border-gray-200 mb-1">
                                                {s.name} - {formatVND(s.price)}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Giỏ hàng (tuỳ chọn)</h4>
                            <div className="space-y-2">
                                {cart.length === 0 ? <div className="text-gray-500">Chưa có món.</div> : cart.map(item => (
                                    <div key={item.key} className="flex items-center justify-between text-gray-900">
                                        <span className="mr-2">{item.qty}x {item.name} ({item.size})</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => dec(item.key)} className="px-2 py-1 rounded border border-gray-300">-</button>
                                            <button onClick={() => inc(item.key)} className="px-2 py-1 rounded border border-gray-300">+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex justify-between text-gray-900 font-semibold">
                                <span>Tạm tính</span><span>{formatVND(total)}</span>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin đặt bàn</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitBooking} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Input placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} />
                                <Input placeholder="Điện thoại" value={phone} onChange={e => setPhone(e.target.value)} />
                                <Input type="number" min={1} placeholder="Số khách" value={party} onChange={e => setParty(parseInt(e.target.value) || 1)} />
                                <div className="md:col-span-2">
                                    <DateTimePicker value={dateTime} onChange={setDateTime} />
                                </div>
                                <Input className="md:col-span-3" placeholder="Ghi chú (dịp, yêu cầu đặc biệt)" value={notes} onChange={e => setNotes(e.target.value)} />
                                <div className="md:col-span-3 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        {selectedTableIds.length > 0
                                            ? `Đã chọn ${selectedTableIds.length} bàn: ${selectedTableIds.map(id => (tables || []).find((t: any) => t.id === id)?.name || id).join(', ')}`
                                            : 'Chưa chọn bàn (tuỳ chọn)'}
                                    </div>
                                    <Button type="submit">Gửi yêu cầu</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="menu">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thực đơn trực tuyến</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-3 flex-wrap">
                                <button onClick={() => setCat('')} className={`px-3 py-1 rounded ${cat === '' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Tất cả</button>
                                {categories.map((c: string) => (
                                    <button key={c} onClick={() => setCat(c)} className={`px-3 py-1 rounded ${cat === c ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{c}</button>
                                ))}
                            </div>
                            {filtered.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Chưa có món nào trong danh mục này.</p>
                                    <p className="text-sm mt-2">Tổng số món: {menuItems?.length || 0}, Còn hàng: {availableMenuItems.length}</p>
                                    {menuItems && menuItems.length > 0 && (
                                        <div className="mt-4 text-xs text-gray-400">
                                            <p>Debug: Tất cả món:</p>
                                            <ul className="list-disc list-inside">
                                                {menuItems.map((m: any) => (
                                                    <li key={m.id}>{m.name} - inStock: {String(m.inStock)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" key={`menu-grid-${menuItems?.length || 0}`}>
                                    {filtered.map((m: any) => (
                                        <div key={m.id} className="bg-white border border-gray-200 rounded p-3">
                                            <img src={m.imageUrls?.[0]} className="w-full h-28 object-cover rounded" />
                                            <div className="mt-2 text-gray-900 font-semibold">{m.name}</div>
                                            <div className="text-gray-600 text-sm">{m.description}</div>
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {m.sizes.map((s: any) => (
                                                    <div key={s.name} className="text-sm text-gray-900 flex items-center justify-between bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                                                        <span>{s.name}</span>
                                                        <span>{formatVND(s.price)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="order">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white border border-gray-200 p-4 rounded">
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">Đặt món online</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {availableMenuItems.map((m: any) => (
                                    <div key={m.id} className="bg-white border border-gray-200 rounded p-3">
                                        <div className="text-gray-900 font-semibold">{m.name}</div>
                                        <div className="text-gray-600 text-sm mb-2">{m.category}</div>
                                        {m.sizes.map((s: any) => (
                                            <button key={s.name} onClick={() => addToCart(m, s.name)} className="w-full text-left bg-gray-50 hover:bg-gray-100 text-gray-900 px-2 py-1 rounded border border-gray-200 mb-1">
                                                {s.name} - {formatVND(s.price)}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Giỏ hàng</h3>
                            <div className="space-y-2">
                                {cart.length === 0 ? <div className="text-gray-500">Chưa có món.</div> : cart.map(item => (
                                    <div key={item.key} className="flex justify-between text-gray-900">
                                        <span>{item.qty}x {item.name} ({item.size})</span>
                                        <span>{formatVND(item.price * item.qty)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex justify-between text-gray-900 font-bold">
                                <span>Tổng</span><span>{formatVND(total)}</span>
                            </div>
                            <Button className="mt-3 w-full" variant="default">Đặt hàng (demo)</Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="loyalty">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thành viên & Lịch sử đặt bàn</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!isAuthenticated ? <AuthBox /> : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-gray-900">Xin chào, <span className="font-semibold">{user?.name}</span></div>
                                        <div className="text-gray-700 text-sm">Mã KH: {user?.customerId}</div>
                                        <Button variant="outline" onClick={logout}>Đăng xuất</Button>
                                    </div>
                                    <BookingHistorySection token={user?.token || ''} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="promotions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Khuyến mãi & Sự kiện</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Hiển thị các chương trình ưu đãi và form đăng ký sự kiện (demo).</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedback">
                    <Card>
                        <CardHeader>
                            <CardTitle>Phản hồi & Hỗ trợ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Gửi đánh giá và liên hệ CSKH (demo).</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CustomerPortalView;

const BookingHistorySection: React.FC<{ token: string }> = ({ token }) => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { notify, confirm } = useFeedback();

    useEffect(() => {
        if (!token) return;
        const load = async () => {
            setLoading(true);
            try {
                const data = await Api.getMyBookings(token);
                setBookings(data || []);
            } catch (err: any) {
                notify({
                    tone: 'error',
                    title: 'Lỗi tải lịch sử',
                    description: err?.message || 'Không thể tải lịch sử đặt bàn'
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token, notify]);

    const handleCancel = async (maDonHang: string) => {
        if (!token) return;
        const shouldCancel = await confirm({
            title: 'Hủy đặt bàn',
            description: 'Bạn có chắc chắn muốn hủy đặt bàn này?',
            confirmText: 'Hủy đặt bàn',
            cancelText: 'Giữ lại',
            tone: 'danger'
        });
        if (!shouldCancel) return;
        try {
            await Api.cancelBooking(maDonHang, token);
            notify({
                tone: 'success',
                title: 'Đã hủy đặt bàn',
                description: 'Đặt bàn đã được hủy thành công.'
            });
            setBookings(prev => prev.map(b =>
                b.maDonHang === maDonHang || b.MaDonHang === maDonHang
                    ? { ...b, daHuy: true, coTheHuy: false }
                    : b
            ));
        } catch (err: any) {
            notify({
                tone: 'error',
                title: 'Lỗi hủy đặt bàn',
                description: err?.message || 'Không thể hủy đặt bàn'
            });
        }
    };

    if (loading) return <div className="text-gray-500">Đang tải...</div>;
    if (bookings.length === 0) return <div className="text-gray-500">Chưa có lịch sử đặt bàn.</div>;

    return (
        <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">Lịch sử đặt bàn</h4>
            {bookings.map((b: any) => {
                const maDon = b.maDonHang || b.MaDonHang;
                const tenBan = b.tenBan || b.TenBan;
                const thoiGian = b.thoiGianBatDau || b.ThoiGianBatDau;
                const soNguoi = b.soLuongNguoi || b.SoLuongNguoi;
                const trangThai = b.trangThai || b.TrangThai;
                const daHuy = b.daHuy || b.DaHuy;
                const coTheHuy = b.coTheHuy || b.CoTheHuy;

                return (
                    <div key={maDon} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-semibold text-gray-900">Bàn {tenBan}</div>
                                <div className="text-sm text-gray-600">
                                    {new Date(thoiGian).toLocaleString('vi-VN')} · {soNguoi} khách
                                </div>
                                <div className="text-sm text-gray-700 mt-1">Trạng thái: {trangThai}</div>
                            </div>
                            {coTheHuy && !daHuy && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancel(maDon)}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    Hủy đặt
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const AuthBox: React.FC = () => {
    const { notify } = useFeedback();
    const { checkUser, login, register } = useAuth();
    const [step, setStep] = useState<'identify' | 'otp'>('identify');
    const [identifier, setIdentifier] = useState('');
    const [exists, setExists] = useState<boolean | null>(null);
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');

    const doCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier) return;
        try {
            const res = await checkUser(identifier);
            setExists(res.userExists);
            setStep('otp');
            notify({ tone: 'success', title: 'Đã gửi OTP', description: identifier.includes('@') ? 'Vui lòng kiểm tra email' : 'OTP đã hiển thị ở server console (dev)' });
        } catch (err: any) {
            notify({ tone: 'error', title: 'Lỗi', description: err?.message || 'Không gửi được OTP' });
        }
    };

    const doSubmitOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return;
        try {
            if (exists) {
                await login(identifier, otp);
                notify({ tone: 'success', title: 'Đăng nhập thành công' });
            } else {
                if (!name) {
                    notify({ tone: 'warning', title: 'Thiếu họ tên đăng ký' });
                    return;
                }
                await register(identifier, name, otp);
                notify({ tone: 'success', title: 'Đăng ký thành công' });
            }
        } catch (err: any) {
            notify({ tone: 'error', title: 'Lỗi', description: err?.message || 'Xác thực thất bại' });
        }
    };

    return (
        <div className="max-w-md space-y-3">
            {step === 'identify' ? (
                <form onSubmit={doCheck} className="space-y-2">
                    <Input placeholder="Email hoặc SĐT" value={identifier} onChange={e => setIdentifier(e.target.value)} />
                    <Button type="submit">Nhận OTP</Button>
                </form>
            ) : (
                <form onSubmit={doSubmitOtp} className="space-y-2">
                    {!exists && <Input placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} />}
                    <Input placeholder="OTP" value={otp} onChange={e => setOtp(e.target.value)} />
                    <Button type="submit">{exists ? 'Đăng nhập' : 'Đăng ký'}</Button>
                </form>
            )}
        </div>
    );
}

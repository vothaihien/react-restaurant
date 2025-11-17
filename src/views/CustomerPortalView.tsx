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
    const { menuItems, createReservation, tables, getAvailableTables } = useAppContext() as any;
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

    // Available tables for selected date/time
    const [availableTables, setAvailableTables] = useState<Array<{ id: string; name: string; capacity: number; status: string; maTang?: string; tenTang?: string }>>([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [selectedTang, setSelectedTang] = useState<string>('');
    const [tangs, setTangs] = useState<Array<{ maTang: string; tenTang: string }>>([]);

    // Cart (shared for booking pre-order & order tab)
    const [cart, setCart] = useState<any[]>([]);

    // Load tầng
    useEffect(() => {
        const loadTangs = async () => {
            try {
                console.log('Loading tầng from API...');
                const data = await Api.getTangs();
                console.log('Fetched tầng (raw):', data);
                console.log('Type of data:', typeof data, 'Is array:', Array.isArray(data));

                if (data && Array.isArray(data) && data.length > 0) {
                    const mappedTangs = data.map((t: any) => {
                        const mapped = {
                            maTang: t.maTang || t.MaTang,
                            tenTang: t.tenTang || t.TenTang
                        };
                        console.log('Mapping tầng:', t, '->', mapped);
                        return mapped;
                    });
                    console.log('Mapped tầng (final):', mappedTangs);
                    setTangs(mappedTangs);
                } else {
                    console.warn('No tầng data or empty array:', data);
                }
            } catch (error: any) {
                console.error('Error loading tầng:', error);
                console.error('Error details:', {
                    message: error?.message,
                    stack: error?.stack,
                    response: error?.response
                });
            }
        };
        loadTangs();
    }, []);

    // Fetch available tables when dateTime and party change
    useEffect(() => {
        if (!dateTime || !party || party < 1) {
            setAvailableTables([]);
            setSelectedTableIds([]);
            return;
        }

        const fetchTables = async () => {
            setLoadingTables(true);
            try {
                const tables = await getAvailableTables(dateTime.getTime(), party);
                console.log('Fetched tables (raw):', tables);
                console.log('Tables with tầng info:', tables?.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    maTang: t.maTang,
                    tenTang: t.tenTang
                })));
                setAvailableTables(tables || []);
                // Reset selected tables when new tables are loaded
                setSelectedTableIds([]);
            } catch (error: any) {
                console.error('Error fetching available tables:', error);
                notify({
                    tone: 'error',
                    title: 'Lỗi tải danh sách bàn',
                    description: error?.message || 'Không thể tải danh sách bàn có sẵn. Vui lòng thử lại.',
                });
                setAvailableTables([]);
            } finally {
                setLoadingTables(false);
            }
        };

        fetchTables();
    }, [dateTime, party, getAvailableTables, notify]);

    // Filter tables by selected tầng
    const filteredTables = useMemo(() => {
        console.log('Filtering tables - selectedTang:', selectedTang, 'availableTables count:', availableTables.length);

        if (!selectedTang || selectedTang.trim() === '') {
            console.log('No tầng selected, returning all tables');
            return availableTables;
        }

        const selectedMaTang = selectedTang.toString().trim();
        console.log('Filtering by maTang:', selectedMaTang);

        const filtered = availableTables.filter(t => {
            const tableMaTang = (t.maTang || t.MaTang || '').toString().trim();
            const match = tableMaTang === selectedMaTang;

            console.log(`Table ${t.name}: maTang="${tableMaTang}", selected="${selectedMaTang}", match=${match}`);

            return match;
        });

        console.log('Filter result:', {
            selectedTang: selectedMaTang,
            totalTables: availableTables.length,
            filteredCount: filtered.length,
            filteredTables: filtered.map(t => ({ name: t.name, maTang: t.maTang || t.MaTang })),
            allTablesSample: availableTables.slice(0, 5).map(t => ({
                name: t.name,
                maTang: t.maTang || t.MaTang,
                tenTang: t.tenTang || t.TenTang
            }))
        });

        return filtered;
    }, [availableTables, selectedTang]);

    const submitBooking = async (e: React.FormEvent) => {
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
        // Phần đặt món trước đã được ẩn tạm thời
        // const preorder = cart.length
        //     ? `\n[Đặt món trước] ${cart.map(c => `${c.qty}x ${c.name} (${c.size})`).join(', ')}`
        //     : '';

        try {
            // Get selected table (only one table is allowed)
            const tableId = selectedTableIds.length > 0 ? selectedTableIds[0] : null;

            const reservationData: any = {
                customerName: name,
                phone,
                partySize: party,
                time: ts,
                source: 'App',
                notes: notes || '', // Đã bỏ preorder
                tableId: tableId
            };

            await createReservation(reservationData);

            // Reset form
            setName('');
            setPhone('');
            setParty(2);
            setDateTime(undefined);
            setNotes('');
            setSelectedTableIds([]);
            setCart([]);
            setAvailableTables([]);

            notify({
                tone: 'success',
                title: 'Đã gửi yêu cầu',
                description: tableId
                    ? `Đã gửi yêu cầu đặt bàn ${availableTables.find(t => t.id === tableId)?.name || tableId}. Nhà hàng sẽ liên hệ lại để xác nhận.`
                    : 'Đã gửi yêu cầu đặt bàn. Nhà hàng sẽ liên hệ lại để xác nhận.',
            });
        } catch (error: any) {
            notify({
                tone: 'error',
                title: 'Lỗi đặt bàn',
                description: error?.message || 'Không thể gửi yêu cầu đặt bàn. Vui lòng thử lại.',
            });
        }
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

    const statusClass = (s: string | TableStatus, selected: boolean) => {
        const base = 'p-4 rounded-lg border-2 transition cursor-pointer';
        if (selected) return `${base} border-indigo-600 bg-indigo-50`;

        // Normalize status to check
        const statusValue = typeof s === 'string' ? s : s;
        const statusStr = typeof statusValue === 'string' ? statusValue.toLowerCase().trim() : '';

        // Check if it's the enum value
        if (statusValue === TableStatus.Available) {
            return `${base} border-green-500 bg-green-50 hover:bg-green-100`;
        }
        if (statusValue === TableStatus.Occupied || statusValue === TableStatus.Reserved || statusValue === TableStatus.CleaningNeeded) {
            return `${base} border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed`;
        }

        // Check string values
        const isAvailable = statusStr === 'available' ||
            statusStr === 'đang trống' ||
            statusStr === 'trống';
        const isOccupied = statusStr === 'occupied' ||
            statusStr === 'đang sử dụng' ||
            statusStr === 'đang dùng';
        const isReserved = statusStr === 'reserved' ||
            statusStr === 'đã đặt' ||
            statusStr === 'đặt trước';
        const isCleaning = statusStr === 'cleaning needed' ||
            statusStr === 'chờ dọn' ||
            statusStr === 'dọn' ||
            statusStr === 'bảo trì' ||
            statusStr === 'đang bảo trì';
        const isNotEnoughCapacity = statusStr === 'không đủ sức chứa' ||
            statusStr === 'không đủ chỗ';

        if (isAvailable) {
            return `${base} border-green-500 bg-green-50 hover:bg-green-100`;
        }
        if (isOccupied || isReserved || isCleaning || isNotEnoughCapacity) {
            return `${base} border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed`;
        }
        return `${base} border-gray-300 bg-white`;
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
                            <CardTitle>Chọn thời gian và số lượng khách</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày và giờ muốn đặt</label>
                                    <DateTimePicker value={dateTime} onChange={setDateTime} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng khách</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="Số khách"
                                        value={party}
                                        onChange={e => setParty(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            </div>
                            {dateTime && party >= 1 && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Đã chọn: <strong>{new Date(dateTime).toLocaleString('vi-VN')}</strong> cho <strong>{party}</strong> khách
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {dateTime && party >= 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Chọn bàn có sẵn</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingTables ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Đang tải danh sách bàn có sẵn...</p>
                                    </div>
                                ) : availableTables.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Không có bàn nào trống trong khung giờ này.</p>
                                        <p className="text-sm mt-2">Vui lòng chọn thời gian khác hoặc liên hệ nhà hàng.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                                            <div className="text-sm text-gray-600">
                                                Tìm thấy <strong>{filteredTables.length}</strong> bàn có sẵn cho {party} khách vào {new Date(dateTime).toLocaleString('vi-VN')}
                                            </div>
                                            {tangs.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium text-gray-700">Lọc theo tầng:</label>
                                                    <select
                                                        value={selectedTang}
                                                        onChange={(e) => setSelectedTang(e.target.value)}
                                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                                                    >
                                                        <option value="">Tất cả tầng</option>
                                                        {tangs.map((tang) => (
                                                            <option key={tang.maTang} value={tang.maTang}>
                                                                {tang.tenTang}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {filteredTables.map((t: any) => {
                                                const isAvailable = t.status === 'Đang trống' || t.status === 'Available' || t.status === TableStatus.Available;
                                                const disabled = !isAvailable;
                                                const selected = selectedTableIds.includes(t.id);
                                                return (
                                                    <button
                                                        key={t.id}
                                                        disabled={disabled}
                                                        onClick={() => {
                                                            if (selected) {
                                                                setSelectedTableIds([]);
                                                            } else {
                                                                // Only allow selecting one table
                                                                setSelectedTableIds([t.id]);
                                                            }
                                                        }}
                                                        className={statusClass(t.status, selected)}
                                                        title={disabled ? 'Bàn không khả dụng' : selected ? 'Bỏ chọn bàn này' : 'Chọn bàn này'}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-gray-900">{t.name}</span>
                                                            <span className="text-xs text-gray-600">{t.capacity} khách</span>
                                                        </div>
                                                        {t.tenTang && (
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                {t.tenTang}
                                                            </div>
                                                        )}
                                                        <div className="mt-1 text-sm text-gray-700">
                                                            {t.status === 'Đang trống' || t.status === 'Available' || t.status === TableStatus.Available
                                                                ? 'Trống'
                                                                : t.status === 'Đã đặt' || t.status === 'Reserved' || t.status === TableStatus.Reserved
                                                                    ? 'Đã đặt'
                                                                    : t.status === 'Đang sử dụng' || t.status === 'Occupied' || t.status === TableStatus.Occupied
                                                                        ? 'Đang sử dụng'
                                                                        : t.status === 'Không đủ sức chứa'
                                                                            ? 'Không đủ chỗ'
                                                                            : t.status === 'Đang bảo trì'
                                                                                ? 'Bảo trì'
                                                                                : t.status}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedTableIds.length > 0 && (
                                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <p className="text-sm text-green-800">
                                                    Đã chọn bàn: <strong>{availableTables.find((t: any) => t.id === selectedTableIds[0])?.name || selectedTableIds[0]}</strong>
                                                    {availableTables.find((t: any) => t.id === selectedTableIds[0])?.tenTang && (
                                                        <span> - {availableTables.find((t: any) => t.id === selectedTableIds[0])?.tenTang}</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Phần đặt món trước đã được ẩn tạm thời */}
                    {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    </div> */}

                    {dateTime && party >= 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin đặt bàn</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitBooking} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên *</label>
                                            <Input placeholder="Nhập họ tên" value={name} onChange={e => setName(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Điện thoại</label>
                                            <Input placeholder="Nhập số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú (dịp, yêu cầu đặc biệt)</label>
                                        <Input placeholder="Ví dụ: Sinh nhật, yêu cầu bàn gần cửa sổ..." value={notes} onChange={e => setNotes(e.target.value)} />
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div className="text-sm text-muted-foreground">
                                            {selectedTableIds.length > 0
                                                ? `Đã chọn bàn: ${availableTables.find((t: any) => t.id === selectedTableIds[0])?.name || selectedTableIds[0]}${availableTables.find((t: any) => t.id === selectedTableIds[0])?.tenTang ? ` - ${availableTables.find((t: any) => t.id === selectedTableIds[0])?.tenTang}` : ''}`
                                                : 'Chưa chọn bàn (tuỳ chọn)'}
                                        </div>
                                        <Button type="submit" disabled={!name || !dateTime}>Gửi yêu cầu đặt bàn</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
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

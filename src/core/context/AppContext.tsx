import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { Table, Order, MenuItem, OrderItem, Ingredient, Reservation, Supplier, KDSItem, InventoryTransaction, InventoryTransactionItem, Staff } from '@/core/types';
import { TableStatus, PaymentMethod } from '@/core/types';
import { TABLES, ORDERS, MENU_ITEMS, INGREDIENTS, RESERVATIONS, SUPPLIERS, KDS_QUEUE, INVENTORY_TRANSACTIONS, STAFFS } from '@/core/constants';

const generateDailyId = (existingIds: string[]): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const datePrefix = `${day}${month}${year}`;

    const todaysIds = existingIds.filter(id => id.startsWith(datePrefix));
    const nextSeq = todaysIds.length + 1;
    const seqStr = String(nextSeq).padStart(3, '0');

    return `${datePrefix}${seqStr}`;
};

interface AppContextType {
    tables: Table[];
    orders: Order[];
    menuItems: MenuItem[];
    ingredients: Ingredient[];
    reservations: Reservation[];
    suppliers: Supplier[];
    kdsQueue: KDSItem[];
    inventoryTransactions: InventoryTransaction[];
    staff: Staff[];

    createOrder: (tableId: string, items: OrderItem[]) => void;
    updateOrder: (orderId: string, items: OrderItem[]) => void;
    closeOrder: (orderId: string, paymentMethod: PaymentMethod) => void;
    updateTableStatus: (tableId: string, status: TableStatus) => void;
    getOrderForTable: (tableId: string) => Order | undefined;
    sendOrderToKDS: (orderId: string) => void;

    addMenuItem: (itemData: Omit<MenuItem, 'id'>) => void;
    updateMenuItem: (item: MenuItem) => void;
    deleteMenuItem: (itemId: string) => void;
    generateRecipeId: () => string;

    // Reservations
    createReservation: (data: Omit<Reservation, 'id' | 'status'> & { status?: Reservation['status'] }) => void;
    updateReservation: (res: Reservation) => void;
    cancelReservation: (id: string, reason?: string) => void;
    confirmArrival: (id: string) => void;
    markNoShow: (id: string, reason?: string) => void;

    // Inventory & Procurement
    recordInventoryIn: (items: InventoryTransactionItem[], supplierId?: string, note?: string) => void;
    adjustInventory: (items: InventoryTransactionItem[], note?: string) => void;
    consumeByOrderItems: (items: OrderItem[]) => void;
    lowStockIds: () => string[];

    // Suppliers
    addSupplier: (s: Omit<Supplier, 'id'>) => void;
    updateSupplier: (s: Supplier) => void;
    deleteSupplier: (id: string) => void;

    // Tables CRUD
    addTable: (t: Omit<Table, 'id' | 'status' | 'orderId'>) => void;
    updateTable: (t: Table) => void;
    deleteTable: (id: string) => void;

    // Staff CRUD
    addStaff: (s: Omit<Staff, 'id' | 'active'> & { active?: boolean }) => void;
    updateStaff: (s: Staff) => void;
    deleteStaff: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
    }
    return defaultValue;
};

const saveToStorage = <T,>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
    }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load from localStorage or use defaults
    const [tables, setTables] = useState<Table[]>(() => loadFromStorage('restaurant_tables', TABLES));
    const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('restaurant_orders', ORDERS));
    const [menuItems, setMenuItems] = useState<MenuItem[]>(() => loadFromStorage('restaurant_menuItems', MENU_ITEMS));
    const [ingredients, setIngredients] = useState<Ingredient[]>(() => loadFromStorage('restaurant_ingredients', INGREDIENTS));
    const [reservations, setReservations] = useState<Reservation[]>(() => loadFromStorage('restaurant_reservations', RESERVATIONS));
    const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('restaurant_suppliers', SUPPLIERS));
    const [kdsQueue, setKdsQueue] = useState<KDSItem[]>(() => loadFromStorage('restaurant_kdsQueue', KDS_QUEUE));
    const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => loadFromStorage('restaurant_inventoryTransactions', INVENTORY_TRANSACTIONS));
    const [staff, setStaff] = useState<Staff[]>(() => loadFromStorage('restaurant_staff', STAFFS));

    // Save to localStorage whenever state changes
    React.useEffect(() => {
        saveToStorage('restaurant_tables', tables);
    }, [tables]);

    React.useEffect(() => {
        saveToStorage('restaurant_orders', orders);
    }, [orders]);

    React.useEffect(() => {
        saveToStorage('restaurant_menuItems', menuItems);
    }, [menuItems]);

    React.useEffect(() => {
        saveToStorage('restaurant_ingredients', ingredients);
    }, [ingredients]);

    React.useEffect(() => {
        saveToStorage('restaurant_reservations', reservations);
    }, [reservations]);

    React.useEffect(() => {
        saveToStorage('restaurant_suppliers', suppliers);
    }, [suppliers]);

    React.useEffect(() => {
        saveToStorage('restaurant_kdsQueue', kdsQueue);
    }, [kdsQueue]);

    React.useEffect(() => {
        saveToStorage('restaurant_inventoryTransactions', inventoryTransactions);
    }, [inventoryTransactions]);

    React.useEffect(() => {
        saveToStorage('restaurant_staff', staff);
    }, [staff]);

    const calculateTotals = (items: OrderItem[], discount: number = 0) => {
        const subtotal = items.reduce((acc, item) => {
            const size = item.menuItem.sizes.find(s => s.name === item.size);
            const price = size ? size.price : 0;
            return acc + (price * item.quantity);
        }, 0);
        const total = subtotal * (1 - discount / 100);
        return { subtotal, total };
    };

    const createOrder = (tableId: string, items: OrderItem[]) => {
        const newOrderId = `o${Date.now()}`;
        const { subtotal, total } = calculateTotals(items);
        const newOrder: Order = {
            id: newOrderId,
            tableId,
            items,
            subtotal,
            total,
            discount: 0,
            createdAt: Date.now(),
        };
        setOrders(prev => [...prev, newOrder]);
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: TableStatus.Occupied, orderId: newOrderId } : t));
    };

    const updateOrder = (orderId: string, items: OrderItem[]) => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const { subtotal, total } = calculateTotals(items, o.discount);
                return { ...o, items, subtotal, total };
            }
            return o;
        }));
    };

    const closeOrder = (orderId: string, paymentMethod: PaymentMethod) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, closedAt: Date.now(), paymentMethod } : o));
        const order = orders.find(o => o.id === orderId);
        if (order) {
            setTables(prev => prev.map(t => t.id === order.tableId ? { ...t, status: TableStatus.CleaningNeeded, orderId } : t));
        }
    };

    const updateTableStatus = (tableId: string, status: TableStatus) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status, orderId: status === TableStatus.Available ? null : t.orderId } : t));
    }

    const getOrderForTable = (tableId: string): Order | undefined => {
        const table = tables.find(t => t.id === tableId);
        if (!table || !table.orderId) return undefined;
        return orders.find(o => o.id === table.orderId && !o.closedAt);
    };

    const sendOrderToKDS = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const table = tables.find(t => t.id === order.tableId);
        const kdsItem: KDSItem = {
            id: `k${Date.now()}`,
            orderId: order.id,
            tableName: table ? table.name : order.tableId,
            items: order.items.map(oi => ({ name: oi.menuItem.name, size: oi.size, qty: oi.quantity, notes: oi.notes })),
            createdAt: Date.now(),
            status: 'Queued',
        };
        setKdsQueue(prev => [kdsItem, ...prev]);
        consumeByOrderItems(order.items);
    };

    const generateRecipeId = (): string => {
        const allRecipeIds: string[] = [];
        menuItems.forEach(item => {
            item.sizes.forEach(size => {
                if (size.recipe && size.recipe.id) {
                    allRecipeIds.push(size.recipe.id);
                }
            });
        });
        return generateDailyId(allRecipeIds);
    };

    const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
        const newItemId = generateDailyId(menuItems.map(item => item.id));
        const newItem: MenuItem = {
            id: newItemId,
            ...itemData,
        };
        setMenuItems(prev => [...prev, newItem]);
    };

    const updateMenuItem = (updatedItem: MenuItem) => {
        setMenuItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
    };

    const deleteMenuItem = (itemId: string) => {
        setMenuItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Reservations
    const createReservation = (data: Omit<Reservation, 'id' | 'status'> & { status?: Reservation['status'] }) => {
        const newId = generateDailyId(reservations.map(r => r.id));
        const newRes: Reservation = { id: newId, status: data.status ?? 'Booked', ...data } as Reservation;
        setReservations(prev => [...prev, newRes]);
        // 支持多张桌子
        if (newRes.tableIds && newRes.tableIds.length > 0) {
            setTables(prev => prev.map(t => newRes.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Reserved } : t));
        } else if (newRes.tableId) {
            setTables(prev => prev.map(t => t.id === newRes.tableId ? { ...t, status: TableStatus.Reserved } : t));
        }
    };

    const updateReservation = (res: Reservation) => {
        setReservations(prev => prev.map(r => r.id === res.id ? res : r));
    };

    const cancelReservation = (id: string) => {
        const res = reservations.find(r => r.id === id);
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'Cancelled' } : r));
        // 支持多张桌子：取消预订时将桌子状态改回 Available
        if (res) {
            if (res.tableIds && res.tableIds.length > 0) {
                setTables(prev => prev.map(t => res.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Available } : t));
            } else if (res.tableId) {
                setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: TableStatus.Available } : t));
            }
        }
    };

    const confirmArrival = (id: string) => {
        const res = reservations.find(r => r.id === id);
        if (!res) return;
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'Seated' } : r));
        // 支持多张桌子
        if (res.tableIds && res.tableIds.length > 0) {
            setTables(prev => prev.map(t => res.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Occupied } : t));
        } else if (res.tableId) {
            setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: TableStatus.Occupied } : t));
        }
    };

    const markNoShow = (id: string) => {
        const res = reservations.find(r => r.id === id);
        if (!res) return;
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'NoShow' } : r));
        if (res.tableIds && res.tableIds.length > 0) {
            setTables(prev => prev.map(t => res.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Available } : t));
        } else if (res.tableId) {
            setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: TableStatus.Available } : t));
        }
    };

    // Inventory helpers
    const lowStockIds = () => ingredients.filter(i => typeof i.minStock === 'number' && i.stock <= (i.minStock as number)).map(i => i.id);

    const recordInventoryIn = (items: InventoryTransactionItem[], supplierId?: string, note?: string) => {
        const newId = generateDailyId(inventoryTransactions.map(tx => tx.id));
        const tx: InventoryTransaction = { id: newId, type: 'IN', items, supplierId, createdAt: Date.now(), note };
        setInventoryTransactions(prev => [tx, ...prev]);
        setIngredients(prev => prev.map(ing => {
            const line = items.find(it => it.ingredientId === ing.id);
            return line ? { ...ing, stock: ing.stock + line.quantity } : ing;
        }));
    };

    const adjustInventory = (items: InventoryTransactionItem[], note?: string) => {
        const newId = generateDailyId(inventoryTransactions.map(tx => tx.id));
        const tx: InventoryTransaction = { id: newId, type: 'ADJUST', items, createdAt: Date.now(), note };
        setInventoryTransactions(prev => [tx, ...prev]);
        setIngredients(prev => prev.map(ing => {
            const line = items.find(it => it.ingredientId === ing.id);
            return line ? { ...ing, stock: ing.stock + line.quantity } : ing; // quantity may be negative
        }));
    };

    const consumeByOrderItems = (items: OrderItem[]) => {
        const consumption: Record<string, number> = {};
        items.forEach(oi => {
            const size = oi.menuItem.sizes.find(s => s.name === oi.size);
            if (!size || !size.recipe) return;
            size.recipe.ingredients.forEach(ri => {
                const qty = (consumption[ri.ingredient.id] || 0) + ri.quantity * oi.quantity;
                consumption[ri.ingredient.id] = qty;
            });
        });
        const lines: InventoryTransactionItem[] = Object.entries(consumption).map(([ingredientId, quantity]) => ({ ingredientId, quantity: -quantity }));
        const newId = generateDailyId(inventoryTransactions.map(tx => tx.id));
        const tx: InventoryTransaction = { id: newId, type: 'CONSUME', items: lines, createdAt: Date.now(), note: 'Auto consume by order' };
        setInventoryTransactions(prev => [tx, ...prev]);
        setIngredients(prev => prev.map(ing => {
            const line = lines.find(it => it.ingredientId === ing.id);
            return line ? { ...ing, stock: Math.max(0, ing.stock + line.quantity) } : ing;
        }));
    };

    // Suppliers CRUD
    const addSupplier = (s: Omit<Supplier, 'id'>) => {
        const newId = generateDailyId(suppliers.map(sp => sp.id));
        const sup: Supplier = { id: newId, ...s } as Supplier;
        setSuppliers(prev => [sup, ...prev]);
    };
    const updateSupplier = (s: Supplier) => {
        setSuppliers(prev => prev.map(x => x.id === s.id ? s : x));
    };
    const deleteSupplier = (id: string) => {
        setSuppliers(prev => prev.filter(x => x.id !== id));
    };

    // Tables CRUD
    const addTable = (t: Omit<Table, 'id' | 'status' | 'orderId'>) => {
        const newId = generateDailyId(tables.map(tb => tb.id));
        const table: Table = { id: newId, name: t.name, capacity: t.capacity, status: TableStatus.Available, orderId: null };
        setTables(prev => [...prev, table]);
    };
    const updateTable = (t: Table) => {
        setTables(prev => prev.map(x => x.id === t.id ? t : x));
    };
    const deleteTable = (id: string) => {
        setTables(prev => prev.filter(x => x.id !== id));
    };

    // Staff CRUD
    const addStaff = (s: Omit<Staff, 'id' | 'active'> & { active?: boolean }) => {
        const newId = generateDailyId(staff.map(u => u.id));
        const user: Staff = { id: newId, active: s.active ?? true, ...s } as Staff;
        setStaff(prev => [user, ...prev]);
    };
    const updateStaff = (s: Staff) => {
        setStaff(prev => prev.map(x => x.id === s.id ? s : x));
    };
    const deleteStaff = (id: string) => {
        setStaff(prev => prev.filter(x => x.id !== id));
    };

    return (
        <AppContext.Provider value={{ tables, orders, menuItems, ingredients, reservations, suppliers, kdsQueue, inventoryTransactions, staff, createOrder, updateOrder, closeOrder, updateTableStatus, getOrderForTable, sendOrderToKDS, addMenuItem, updateMenuItem, deleteMenuItem, generateRecipeId, createReservation, updateReservation, cancelReservation, confirmArrival, markNoShow, recordInventoryIn, adjustInventory, consumeByOrderItems, lowStockIds, addSupplier, updateSupplier, deleteSupplier, addTable, updateTable, deleteTable, addStaff, updateStaff, deleteStaff }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};


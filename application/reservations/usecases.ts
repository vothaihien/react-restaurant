import type { Reservation } from '@domain/index';

export interface OnlineBookingInput {
    customerName: string;
    phone?: string;
    partySize: number;
    time: number;
    notes?: string;
}

// Demo use case: adapter sẽ được truyền vào từ presentation
export function submitOnlineReservation(adapter: { create: (data: Omit<Reservation, 'id' | 'status'>) => void }, input: OnlineBookingInput) {
    adapter.create({ customerName: input.customerName, phone: input.phone, partySize: input.partySize, time: input.time, tableId: null, source: 'App', notes: input.notes });
}

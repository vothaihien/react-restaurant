export type ReservationStatus = 'Booked' | 'Seated' | 'Cancelled' | 'NoShow';

export interface Reservation {
    id: string; // Auto-generated: DDMMYYYYNNN
    customerName: string;
    phone?: string;
    partySize: number;
    time: number; // timestamp
    status: ReservationStatus;
    tableId?: string | null;
    tableIds?: string[];
    source?: 'App' | 'Phone' | 'InPerson';
    notes?: string;
}



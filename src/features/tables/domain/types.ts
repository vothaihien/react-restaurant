export enum TableStatus {
    Available = 'Available',
    Occupied = 'Occupied',
    Reserved = 'Reserved',
    CleaningNeeded = 'Cleaning Needed',
}

export interface Table {
    id: string;
    name: string;
    capacity: number;
    status: TableStatus;
    orderId?: string | null;
}


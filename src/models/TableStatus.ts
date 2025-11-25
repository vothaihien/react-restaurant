export enum TableStatus {
    Available ,
    Occupied,
    Reserved ,
    CleaningNeeded ,
}

export interface Table {
    id: string;
    name: string;
    capacity: number;
    status: TableStatus;
    orderId?: string | null;
}



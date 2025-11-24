import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Format số tiền thành VND
export function formatVND(amount: number): string {
    // Làm tròn số vì VND không có số thập phân
    const roundedAmount = Math.round(amount);
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(roundedAmount);
}


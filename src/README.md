# Cấu trúc dự án

Dự án được tổ chức theo **Feature-Based Architecture** để dễ bảo trì và mở rộng.

## Cấu trúc thư mục

```
src/
├── features/              # Các tính năng chính
│   ├── reservations/     # Quản lý đặt bàn
│   │   ├── presentation/ # Views, Components
│   │   ├── domain/       # Types, Entities
│   │   └── application/  # Use cases, Services
│   ├── menu/             # Quản lý thực đơn
│   ├── orders/           # Quản lý đơn hàng
│   ├── tables/           # Quản lý bàn ăn
│   └── inventory/        # Quản lý kho
│
├── shared/               # Code dùng chung
│   ├── components/       # UI Components chung
│   │   └── ui/          # Base UI components
│   ├── hooks/           # Custom hooks
│   └── utils/           # Utility functions
│
├── core/                 # Core functionality
│   ├── context/         # React Contexts
│   ├── constants/       # Constants
│   └── types/           # Global types
│
└── infrastructure/      # Infrastructure layer
    ├── storage/         # Local storage, API
    └── api/             # API clients
```

## Nguyên tắc

1. **Feature Isolation**: Mỗi feature độc lập, có thể phát triển riêng
2. **Shared Code**: Code dùng chung đặt trong `shared/`
3. **Domain Logic**: Business logic đặt trong `domain/`
4. **Presentation**: UI components đặt trong `presentation/`
5. **Application**: Use cases và services đặt trong `application/`

## Import paths

Sử dụng path aliases để import dễ dàng:

```typescript
import { Button } from '@/shared/components/ui/button'
import { useReservations } from '@/features/reservations/application/useReservations'
import { Reservation } from '@/features/reservations/domain/types'
```


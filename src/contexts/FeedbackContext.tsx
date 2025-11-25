import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    ReactNode,
} from 'react';

import type { FeedbackDialogState, FeedbackNotification } from '@/types';
import FeedbackViewport from '@/components/feedback/FeedbackViewport';

type NotificationInput = Omit<FeedbackNotification, 'id'> & { id?: string };

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    tone?: FeedbackDialogState['tone'];
}

interface FeedbackContextValue {
    notify: (input: NotificationInput) => string;
    dismiss: (id: string) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<FeedbackNotification[]>([]);
    const [dialog, setDialog] = useState<FeedbackDialogState | null>(null);
    const resolverRef = useRef<(result: boolean) => void>();
    const timeoutMap = useRef<Record<string, number>>({});

    const dismiss = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
        const timeoutId = timeoutMap.current[id];
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            delete timeoutMap.current[id];
        }
    }, []);

    const notify = useCallback(
        ({ id, duration = DEFAULT_DURATION, ...rest }: NotificationInput) => {
            const nextId = id ?? `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            setNotifications((prev) => {
                const withoutDuplicated = prev.filter((item) => item.id !== nextId);
                return [...withoutDuplicated, { ...rest, id: nextId }];
            });

            if (duration !== Infinity) {
                const timeoutId = window.setTimeout(() => {
                    dismiss(nextId);
                }, duration);
                timeoutMap.current[nextId] = timeoutId;
            }

            return nextId;
        },
        [dismiss],
    );

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
            setDialog({
                title: options.title,
                description: options.description,
                confirmText: options.confirmText ?? 'Xác nhận',
                cancelText: options.cancelText ?? 'Huỷ',
                tone: options.tone ?? 'primary',
            });
        });
    }, []);

    const handleDialogResult = useCallback(
        (result: boolean) => {
            if (resolverRef.current) {
                resolverRef.current(result);
                resolverRef.current = undefined;
            }
            setDialog(null);
        },
        [],
    );

    const value = useMemo<FeedbackContextValue>(
        () => ({ notify, dismiss, confirm }),
        [notify, dismiss, confirm],
    );

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            <FeedbackViewport
                notifications={notifications}
                dialog={dialog}
                onDismiss={dismiss}
                onDialogAction={handleDialogResult}
            />
        </FeedbackContext.Provider>
    );
};

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
};





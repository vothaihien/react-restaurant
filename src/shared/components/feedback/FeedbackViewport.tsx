import React, { useEffect, useRef } from 'react';

import {
    AlertOctagonIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    InfoIcon,
    XIcon,
} from '../Icons';
import type { FeedbackDialogState, FeedbackNotification } from '@/core/types';

interface FeedbackViewportProps {
    notifications: FeedbackNotification[];
    dialog: FeedbackDialogState | null;
    onDismiss: (id: string) => void;
    onDialogAction: (result: boolean) => void;
}

const notificationToneMap = {
    success: {
        icon: CheckCircleIcon,
        container: 'border-green-200 bg-green-50 text-green-900 shadow-green-100/60',
        accent: 'bg-green-500',
    },
    info: {
        icon: InfoIcon,
        container: 'border-blue-200 bg-blue-50 text-blue-900 shadow-blue-100/60',
        accent: 'bg-blue-500',
    },
    warning: {
        icon: AlertTriangleIcon,
        container: 'border-yellow-200 bg-yellow-50 text-yellow-900 shadow-yellow-100/70',
        accent: 'bg-yellow-500',
    },
    error: {
        icon: AlertOctagonIcon,
        container: 'border-red-200 bg-red-50 text-red-900 shadow-red-100/70',
        accent: 'bg-red-500',
    },
} as const satisfies Record<FeedbackNotification['tone'], {
    icon: React.FC<{ className?: string }>;
    container: string;
    accent: string;
}>;

const dialogToneMap = {
    primary: {
        confirmButton: 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-600',
        iconWrapper: 'bg-indigo-100 text-indigo-600',
    },
    danger: {
        confirmButton: 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-600',
        iconWrapper: 'bg-red-100 text-red-600',
    },
} as const;

const FeedbackViewport: React.FC<FeedbackViewportProps> = ({
    notifications,
    dialog,
    onDismiss,
    onDialogAction,
}) => {
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (dialog && cancelButtonRef.current) {
            cancelButtonRef.current.focus({ preventScroll: true });
        }
    }, [dialog]);

    useEffect(() => {
        if (!dialog) return;

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onDialogAction(false);
            }
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onDialogAction(true);
            }
        };

        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [dialog, onDialogAction]);

    return (
        <>
            <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
                {notifications.map((notification) => {
                    const tone = notificationToneMap[notification.tone];
                    const Icon = tone.icon;
                    return (
                        <div
                            key={notification.id}
                            className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-lg transition-all ${tone.container}`}
                        >
                            <div className={`absolute inset-y-0 left-0 w-1 ${tone.accent}`} aria-hidden="true" />
                            <div className="flex items-start gap-3 p-4">
                                <div className={`mt-1 rounded-full bg-white/60 p-1 text-inherit`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{notification.title}</p>
                                    {notification.description && (
                                        <p className="mt-1 text-sm text-current/80">{notification.description}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onDismiss(notification.id)}
                                    className="rounded-full p-1 text-current/60 transition hover:bg-black/5 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {dialog && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8">
                    <div className="max-w-lg w-full rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div
                                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${dialogToneMap[dialog.tone].iconWrapper
                                    }`}
                            >
                                {dialog.tone === 'danger' ? (
                                    <AlertOctagonIcon className="h-6 w-6" />
                                ) : (
                                    <InfoIcon className="h-6 w-6" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{dialog.title}</h2>
                                {dialog.description && (
                                    <p className="mt-1 text-sm text-gray-600">{dialog.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                ref={cancelButtonRef}
                                onClick={() => onDialogAction(false)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                            >
                                {dialog.cancelText}
                            </button>
                            <button
                                type="button"
                                onClick={() => onDialogAction(true)}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${dialogToneMap[dialog.tone].confirmButton
                                    }`}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackViewport;

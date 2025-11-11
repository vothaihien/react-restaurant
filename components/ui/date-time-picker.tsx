"use client"

import * as React from "react"
import { CalendarIcon, Clock } from "lucide-react"
import { format, set } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Input } from "./input"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export interface DateTimePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function DateTimePicker({
    value,
    onChange,
    placeholder = "Chọn ngày giờ",
    disabled,
    className,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false)

    const handleDateSelect = (day: Date | undefined) => {
        if (!onChange) return
        if (!day) {
            onChange(undefined)
            return
        }
        const base = value ?? new Date()
        const next = new Date(day)
        next.setHours(base.getHours(), base.getMinutes(), 0, 0)
        onChange(next)
    }

    const updateTime = (hours: number, minutes: number) => {
        if (!onChange) return
        const base = value ?? new Date()
        const next = set(base, { hours, minutes, seconds: 0, milliseconds: 0 })
        onChange(next)
    }

    const handleHoursChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = Number.parseInt(event.target.value, 10)
        if (Number.isNaN(input)) return
        const minutes = value ? value.getMinutes() : 0
        updateTime(clamp(input, 0, 23), minutes)
    }

    const handleMinutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = Number.parseInt(event.target.value, 10)
        if (Number.isNaN(input)) return
        const hours = value ? value.getHours() : 0
        updateTime(hours, clamp(input, 0, 59))
    }

    const adjustTime = (type: "hours" | "minutes", delta: number) => {
        const current = value ?? new Date()
        const hours = current.getHours()
        const minutes = current.getMinutes()
        if (type === "hours") {
            const nextHours = (hours + delta + 24) % 24
            updateTime(nextHours, minutes)
        } else {
            const total = minutes + delta
            const wrappedMinutes = ((total % 60) + 60) % 60
            const hourDelta = Math.floor(total / 60)
            const nextHours = (hours + hourDelta + 24) % 24
            updateTime(nextHours, wrappedMinutes)
        }
    }

    const handleClear = () => {
        onChange?.(undefined)
        setOpen(false)
    }

    const displayValue = value ? format(value, "dd/MM/yyyy HH:mm") : placeholder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {displayValue}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-4">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Giờ</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => adjustTime("hours", -1)}
                                >
                                    -
                                </Button>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    className="h-8 w-16 text-center"
                                    value={value ? value.getHours().toString().padStart(2, "0") : ""}
                                    onChange={handleHoursChange}
                                    placeholder="HH"
                                    min={0}
                                    max={23}
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => adjustTime("hours", 1)}
                                >
                                    +
                                </Button>
                            </div>
                            <span className="text-lg font-semibold">:</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => adjustTime("minutes", -5)}
                                >
                                    -
                                </Button>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    className="h-8 w-16 text-center"
                                    value={value ? value.getMinutes().toString().padStart(2, "0") : ""}
                                    onChange={handleMinutesChange}
                                    placeholder="MM"
                                    min={0}
                                    max={59}
                                    step={5}
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => adjustTime("minutes", 5)}
                                >
                                    +
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-end pt-1">
                            <Button variant="ghost" size="sm" type="button" onClick={handleClear}>
                                Xoá
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}


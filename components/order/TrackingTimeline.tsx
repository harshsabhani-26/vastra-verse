import { format, isSameDay } from "date-fns";
import { Check, Package, Truck, MapPin } from "lucide-react";

interface TimelineEvent {
    id: string;
    event: string;
    details?: string | null;
    createdAt: Date | string;
}

interface TrackingTimelineProps {
    events: TimelineEvent[];
    className?: string;
}

export function TrackingTimeline({ events, className = "" }: TrackingTimelineProps) {
    // Sort events by date descending (newest first)
    const sortedEvents = [...events].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Group events by date
    const groupedEvents: { date: Date, events: TimelineEvent[] }[] = [];

    sortedEvents.forEach(event => {
        const eventDate = new Date(event.createdAt);
        const existingGroup = groupedEvents.find(group => isSameDay(group.date, eventDate));

        if (existingGroup) {
            existingGroup.events.push(event);
        } else {
            groupedEvents.push({ date: eventDate, events: [event] });
        }
    });

    if (events.length === 0) {
        return (
            <div className={`text-center py-8 text-stone-500 ${className}`}>
                <p>No tracking updates available yet.</p>
            </div>
        );
    }

    return (
        <div className={`space-y-8 ${className}`}>
            {groupedEvents.map((group, groupIndex) => (
                <div key={group.date.toISOString()} className="animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${groupIndex * 100}ms` }}>
                    <h3 className="font-semibold text-[#1C1917] mb-4 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
                        {format(group.date, "EEEE, d MMMM")}
                    </h3>

                    <div className="space-y-0 relative">
                        {/* Vertical line connecting events within same day */}
                        {group.events.length > 1 && (
                            <div className="absolute left-[3.5rem] top-4 bottom-4 w-0.5 bg-stone-200 -z-10"></div>
                        )}

                        {group.events.map((event, index) => {
                            const isDelivered = event.event.toLowerCase().includes("delivered");
                            const isOutForDelivery = event.event.toLowerCase().includes("out for delivery");

                            return (
                                <div key={event.id} className="flex gap-4 items-start py-3 group">
                                    <div className="w-12 text-xs text-stone-500 pt-1 text-right shrink-0">
                                        {format(new Date(event.createdAt), "h:mm a")}
                                    </div>

                                    <div className="relative shrink-0">
                                        {/* Dot/Icon */}
                                        <div className={`w-3 h-3 rounded-full mt-1.5 ring-4 ring-white ${isDelivered ? 'bg-green-600' :
                                                isOutForDelivery ? 'bg-[#1a4d3a]' : 'bg-stone-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pt-0.5">
                                        <p className={`text-sm font-medium ${isDelivered ? 'text-green-700' : 'text-[#1C1917]'}`}>
                                            {event.event}
                                        </p>
                                        {event.details && (
                                            <p className="text-xs text-stone-500 mt-1 italic">
                                                {event.details}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { ArrowRightLeft, Clock, CheckCircle, Loader2 } from 'lucide-react';

interface RoutingEvent {
  id: string;
  type: 'lend' | 'borrow' | 'repay' | 'liquidate';
  agent: string;
  amount: string;
  token: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export default function RoutingFeed() {
  const [events, setEvents] = useState<RoutingEvent[]>([]);

  // Mock data generator
  useEffect(() => {
    const mockAgents = ['Agent Alpha', 'Agent Beta', 'Agent Gamma', 'Agent Delta', 'Agent Omega'];
    const mockTokens = ['USDC'];
    const mockTypes: RoutingEvent['type'][] = ['lend', 'borrow', 'repay', 'liquidate'];

    // Generate initial events
    const initialEvents: RoutingEvent[] = Array.from({ length: 5 }, (_, i) => ({
      id: `evt-${i}`,
      type: mockTypes[Math.floor(Math.random() * mockTypes.length)],
      agent: mockAgents[Math.floor(Math.random() * mockAgents.length)],
      amount: (Math.random() * 10000).toFixed(2),
      token: mockTokens[Math.floor(Math.random() * mockTokens.length)],
      timestamp: new Date(Date.now() - i * 60000),
      status: Math.random() > 0.2 ? 'completed' : 'pending',
    }));

    setEvents(initialEvents);

    // Add new event every 5 seconds
    const interval = setInterval(() => {
      const newEvent: RoutingEvent = {
        id: `evt-${Date.now()}`,
        type: mockTypes[Math.floor(Math.random() * mockTypes.length)],
        agent: mockAgents[Math.floor(Math.random() * mockAgents.length)],
        amount: (Math.random() * 10000).toFixed(2),
        token: mockTokens[Math.floor(Math.random() * mockTokens.length)],
        timestamp: new Date(),
        status: Math.random() > 0.3 ? 'completed' : 'pending',
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 10));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: RoutingEvent['type']) => {
    switch (type) {
      case 'lend':
        return <div className="h-2 w-2 rounded-full bg-[#00FFB8]" />;
      case 'borrow':
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
      case 'repay':
        return <div className="h-2 w-2 rounded-full bg-purple-500" />;
      case 'liquidate':
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
    }
  };

  const getEventLabel = (type: RoutingEvent['type']) => {
    switch (type) {
      case 'lend':
        return 'Lend';
      case 'borrow':
        return 'Borrow';
      case 'repay':
        return 'Repay';
      case 'liquidate':
        return 'Liquidate';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#222222] px-6 py-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-[#00FFB8]" />
          <h3 className="font-medium text-white">Live Routing Feed</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFB8] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFB8]"></span>
          </span>
          <span className="text-xs text-[#888888]">Live</span>
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {events.map((event, index) => (
          <div
            key={event.id}
            className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#222222]/50 ${
              index !== events.length - 1 ? 'border-b border-[#222222]' : ''
            } animate-slide-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              {getEventIcon(event.type)}
              <div>
                <p className="text-sm font-medium text-white">
                  {getEventLabel(event.type)} <span className="text-[#00FFB8]">{event.amount}</span> {event.token}
                </p>
                <p className="text-xs text-[#888888]">{event.agent}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {event.status === 'pending' && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#888888]" />
              )}
              {event.status === 'completed' && (
                <CheckCircle className="h-3.5 w-3.5 text-[#00FFB8]" />
              )}
              <span className="text-xs text-[#888888] flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(event.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

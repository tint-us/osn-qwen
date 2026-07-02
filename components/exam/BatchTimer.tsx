"use client";

import { useEffect, useState } from "react";

interface BatchTimerProps {
  enabled: boolean;
  durationMinutes: number;
  startedAt: string | null;
  onExpire: () => void;
}

export function BatchTimer({
  enabled,
  durationMinutes,
  startedAt,
  onExpire,
}: BatchTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!enabled || !startedAt) {
      setTimeLeft(null);
      return;
    }

    function calculate() {
      const start = new Date(startedAt!).getTime();
      const totalSeconds = durationMinutes * 60;
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = totalSeconds - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        setExpired(true);
        return true;
      }
      setTimeLeft(remaining);
      return false;
    }

    calculate();
    const interval = setInterval(() => {
      if (calculate()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, durationMinutes, startedAt]);

  useEffect(() => {
    if (expired) {
      onExpire();
    }
  }, [expired, onExpire]);

  if (!enabled) {
    return null;
  }

  if (timeLeft === null) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  let colorClass = "text-green-600";
  if (timeLeft < 60) {
    colorClass = "text-red-600 font-bold";
  } else if (timeLeft < 300) {
    colorClass = "text-yellow-600";
  }

  return (
    <div className={`text-lg ${colorClass} tabular-nums`}>
      {expired ? "Waktu Habis" : `⏱ ${display}`}
    </div>
  );
}

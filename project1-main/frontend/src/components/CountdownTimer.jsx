import { useEffect, useState } from "react";

function getTimeLeft(target) {
  const targetTime = new Date(target).getTime();
  const now = Date.now();

  const difference = Math.max(0, targetTime - now);

  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference / 3600000) % 24),
    minutes: Math.floor((difference / 60000) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    finished: difference <= 0,
  };
}

export default function CountdownTimer({
  target,
  label = "DROP ENDS IN",
}) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(target));

  useEffect(() => {
    setTimeLeft(getTimeLeft(target));

    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);

    return () => clearInterval(timer);
  }, [target]);

  const cell = (value, labelText) => (
    <div
      className="min-w-[58px] md:min-w-[72px] border border-white/10 bg-black/60 px-3 py-4 text-center"
      data-testid={`cd-${labelText.toLowerCase()}`}
    >
      <div className="mono text-3xl md:text-4xl text-gold tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </div>

      <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mt-2">
        {labelText}
      </div>
    </div>
  );

  if (!target) return null;

  return (
    <div
      className="inline-flex flex-col items-start gap-4"
      data-testid="countdown"
    >
      <div className="label-tiny text-gold">
        {timeLeft.finished ? "DROP CLOSED" : label}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {cell(timeLeft.days, "Days")}
        {cell(timeLeft.hours, "Hrs")}
        {cell(timeLeft.minutes, "Min")}
        {cell(timeLeft.seconds, "Sec")}
      </div>
    </div>
  );
}

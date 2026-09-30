import { useEffect, useState } from "react";

function diff(target) {
  const t = new Date(target).getTime() - Date.now();
  const clamp = Math.max(0, t);
  return {
    d: Math.floor(clamp / 86400000),
    h: Math.floor((clamp / 3600000) % 24),
    m: Math.floor((clamp / 60000) % 60),
    s: Math.floor((clamp / 1000) % 60),
  };
}

export default function CountdownTimer({ target, label = "DROP ENDS IN" }) {
  const [t, setT] = useState(diff(target));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cell = (v, l) => (
    <div className="flex flex-col items-center" data-testid={`cd-${l.toLowerCase()}`}>
      <div className="mono text-3xl md:text-4xl text-gold tabular-nums">{String(v).padStart(2, "0")}</div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 mt-1">{l}</div>
    </div>
  );
  return (
    <div className="inline-flex flex-col items-start gap-3" data-testid="countdown">
      <div className="label-tiny text-gold">{label}</div>
      <div className="flex items-center gap-5 md:gap-7">
        {cell(t.d, "Days")}
        <span className="mono text-2xl text-neutral-500">:</span>
        {cell(t.h, "Hrs")}
        <span className="mono text-2xl text-neutral-500">:</span>
        {cell(t.m, "Min")}
        <span className="mono text-2xl text-neutral-500">:</span>
        {cell(t.s, "Sec")}
      </div>
    </div>
  );
}

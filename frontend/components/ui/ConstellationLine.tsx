'use client';

interface ConstellationLineProps {
  className?: string;
  variant?: 'gold' | 'ink';
  points?: [number, number][];
}

const DEFAULT_POINTS: [number, number][] = [
  [8, 62], [96, 18], [178, 74], [252, 22], [330, 58], [402, 14],
];

export function ConstellationLine({ className = '', variant = 'gold', points = DEFAULT_POINTS }: ConstellationLineProps) {
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const color = variant === 'gold' ? '#B08A2E' : '#14131F';

  return (
    <svg
      viewBox="0 0 410 90"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={path}
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: 'draw 1.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards',
        }}
      />
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 0 || i === points.length - 1 ? 3.5 : 2.5}
          fill={color}
          opacity={0}
          style={{
            animation: `fadeUp 0.5s ease-out ${0.3 + i * 0.22}s forwards`,
          }}
        />
      ))}
    </svg>
  );
}

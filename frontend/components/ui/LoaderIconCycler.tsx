"use client";

import { useEffect, useId, useState } from "react";

const icons = ["mandala", "om", "moon", "astrolabe", "diya"] as const;

type LoaderIcon = (typeof icons)[number];

function LoaderGoldDefs({ gradientId }: { gradientId: string }) {
  return (
    <defs>
      <linearGradient id={gradientId} x1="18" y1="78" x2="78" y2="18">
        <stop stopColor="#c9932f" />
        <stop offset="1" stopColor="#f5d68a" />
      </linearGradient>
    </defs>
  );
}

function LoaderSymbol({ gradientId, icon }: { gradientId: string; icon: LoaderIcon }) {
  const gradient = `url(#${gradientId})`;
  const line = {
    fill: "none",
    stroke: gradient,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2.4,
  } as const;
  const soft = { fill: gradient, stroke: "none", opacity: 0.86 } as const;
  const gold = { fill: "#f5d68a", stroke: "none" } as const;

  if (icon === "om") {
    return (
      <text x="48" y="63" textAnchor="middle" className="loader-om" fill={gradient}>
        ॐ
      </text>
    );
  }

  if (icon === "moon") {
    return (
      <>
        <path d="M54 18a29 29 0 1 0 24 45A31 31 0 1 1 54 18Z" {...soft} />
        <path d="M70 17l3.5 8 8 3.5-8 3.5-3.5 8-3.5-8-8-3.5 8-3.5Z" {...gold} />
        <circle cx="28" cy="30" r="2.5" {...gold} />
      </>
    );
  }

  if (icon === "astrolabe") {
    return (
      <>
        <circle cx="48" cy="48" r="35" {...line} />
        <circle cx="48" cy="48" r="25" {...line} />
        <circle cx="48" cy="48" r="13" {...line} />
        <path d="M48 13v70M13 48h70M23.5 23.5l49 49M72.5 23.5l-49 49" {...line} />
        <circle cx="48" cy="48" r="4" {...gold} />
      </>
    );
  }

  if (icon === "diya") {
    return (
      <>
        <path d="M28 56h40c-2 13-10 21-20 21S30 69 28 56Z" {...soft} />
        <path d="M24 56h48M35 56c1-9 7-16 13-20 6 4 12 11 13 20M23 77h50" {...line} />
        <path d="M48 34c-5-6-3-14 2-19 6 6 9 15-2 19Z" className="loader-flame" {...gold} />
      </>
    );
  }

  return (
    <>
      <circle cx="48" cy="48" r="34" {...line} />
      <circle cx="48" cy="48" r="22" {...line} />
      <circle cx="48" cy="48" r="9" {...gold} />
      {Array.from({ length: 12 }).map((_, index) => (
        <ellipse
          key={index}
          cx="48"
          cy="20"
          rx="4.5"
          ry="13"
          transform={`rotate(${index * 30} 48 48)`}
          {...soft}
        />
      ))}
    </>
  );
}

export function LoaderIconCycler() {
  const gradientId = useId().replace(/:/g, "");
  const gradient = `url(#${gradientId})`;
  const [iconIndex, setIconIndex] = useState(0);
  const icon = icons[iconIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIconIndex((current) => (current + 1) % icons.length);
    }, 1100);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="loader-icon-cycler" aria-hidden="true">
      <svg className="loader-wheel" viewBox="0 0 120 120">
        <LoaderGoldDefs gradientId={gradientId} />
        <circle cx="60" cy="60" r="52" fill="none" stroke={gradient} strokeWidth="1.4" />
        <circle cx="60" cy="60" r="42" fill="none" stroke={gradient} strokeWidth="1.4" opacity="0.75" />
        <circle cx="60" cy="60" r="28" fill="none" stroke={gradient} strokeWidth="1.4" opacity="0.6" />
        {Array.from({ length: 24 }).map((_, index) => (
          <path
            key={index}
            d={index % 2 === 0 ? "M60 8v9" : "M60 8v5"}
            transform={`rotate(${index * 15} 60 60)`}
            fill="none"
            stroke={gradient}
            strokeLinecap="round"
            strokeWidth="1.4"
          />
        ))}
        <path d="M60 60V24" fill="none" stroke={gradient} strokeLinecap="round" strokeWidth="2.2" />
        <path d="M60 60h25" fill="none" stroke={gradient} strokeLinecap="round" strokeWidth="2.2" opacity="0.62" />
      </svg>

      <svg className="loader-symbol" viewBox="0 0 96 96" key={icon}>
        <LoaderGoldDefs gradientId={`${gradientId}-symbol`} />
        <LoaderSymbol gradientId={`${gradientId}-symbol`} icon={icon} />
      </svg>

      <style jsx>{`
        .loader-icon-cycler {
          position: relative;
          width: 5.5rem;
          height: 5.5rem;
          flex: 0 0 5.5rem;
          filter: drop-shadow(0 0 18px rgb(245 214 138 / 0.32));
        }

        .loader-wheel,
        .loader-symbol {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .loader-wheel {
          opacity: 0.58;
          animation: loaderWheelSpin 7.2s linear infinite;
        }

        .loader-symbol {
          inset: 0.75rem;
          width: calc(100% - 1.5rem);
          height: calc(100% - 1.5rem);
          animation: loaderSymbolIn 0.28s ease-out both;
        }

        .loader-om {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 56px;
          font-weight: 700;
        }

        .loader-flame {
          transform-origin: 48px 28px;
          animation: loaderFlameFlicker 0.72s ease-in-out infinite alternate;
        }

        @keyframes loaderWheelSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes loaderSymbolIn {
          from {
            opacity: 0;
            transform: scale(0.88);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes loaderFlameFlicker {
          from {
            transform: scaleY(0.9) translateY(1px);
            opacity: 0.72;
          }
          to {
            transform: scaleY(1.08) translateY(-1px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

import React from "react";

const STYLES = `
  @keyframes sk-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes sk-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.45; }
  }
  @keyframes sk-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes sk-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sk-base {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 0px,
      rgba(212,175,55,0.10)  200px,
      rgba(255,255,255,0.04) 400px
    );
    background-size: 600px 100%;
    animation: sk-shimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
    display: block;
    flex-shrink: 0;
  }

  /* dark variant (for light backgrounds) */
  .sk-base.sk-dark {
    background: linear-gradient(
      90deg,
      rgba(0,0,0,0.06) 0px,
      rgba(0,0,0,0.13) 200px,
      rgba(0,0,0,0.06) 400px
    );
    background-size: 600px 100%;
  }

  .sk-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(212,175,55,0.08);
    border-radius: 12px;
    padding: 1.25rem;
    animation: sk-fade-in 0.4s ease both;
  }

  .sk-row { display: flex; align-items: center; gap: 0.75rem; }
  .sk-col { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
  .sk-grid { display: grid; gap: 1rem; }
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = STYLES;
  document.head.appendChild(el);
  stylesInjected = true;
}

// ── Base Skeleton block ───────────────────────────────────────────────────────
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
  delay?: number; // stagger delay in ms
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius,
  className = "",
  style,
  dark,
  delay = 0,
}: SkeletonProps) {
  injectStyles();
  return (
    <span
      className={`sk-base ${dark ? "sk-dark" : ""} ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        animationDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  dark?: boolean;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  dark,
}: SkeletonTextProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={13}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          dark={dark}
          delay={i * 60}
        />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  injectStyles();
  return (
    <div className="sk-card" style={{ minHeight: 110 }}>
      <div className="sk-row" style={{ marginBottom: "1rem" }}>
        <Skeleton width={36} height={36} radius="50%" />
        <Skeleton width="55%" height={13} />
      </div>
      <Skeleton width="45%" height={32} style={{ marginBottom: 8 }} />
      <Skeleton width="70%" height={11} />
    </div>
  );
}

interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({
  showAvatar = false,
  lines = 3,
}: SkeletonCardProps) {
  injectStyles();
  return (
    <div className="sk-card">
      {showAvatar && (
        <div className="sk-row" style={{ marginBottom: "1rem" }}>
          <Skeleton width={44} height={44} radius="50%" />
          <div className="sk-col">
            <Skeleton height={14} width="60%" />
            <Skeleton height={11} width="40%" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  );
}

export function SkeletonCourseCard() {
  injectStyles();
  return (
    <div className="sk-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* thumbnail */}
      <Skeleton
        height={140}
        radius="0"
        style={{ borderRadius: "12px 12px 0 0" }}
      />
      <div style={{ padding: "1rem" }}>
        <div className="sk-row" style={{ marginBottom: "0.75rem" }}>
          <Skeleton width={60} height={20} radius={20} />
          <Skeleton width={50} height={20} radius={20} />
        </div>
        <Skeleton height={16} width="85%" style={{ marginBottom: 8 }} />
        <Skeleton height={13} width="65%" style={{ marginBottom: 16 }} />
        <div className="sk-row">
          <Skeleton width={28} height={28} radius="50%" />
          <Skeleton height={11} width="40%" />
          <Skeleton height={11} width="25%" style={{ marginLeft: "auto" }} />
        </div>
      </div>
    </div>
  );
}

interface SkeletonTableRowProps {
  cols?: number;
  showAvatar?: boolean;
}

export function SkeletonTableRow({
  cols = 5,
  showAvatar = true,
}: SkeletonTableRowProps) {
  injectStyles();
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} style={{ padding: "0.85rem 1rem" }}>
          {i === 0 && showAvatar ? (
            <div className="sk-row">
              <Skeleton width={32} height={32} radius="50%" />
              <Skeleton height={13} width="70%" delay={40} />
            </div>
          ) : (
            <Skeleton
              height={13}
              width={`${50 + ((i * 13) % 40)}%`}
              delay={i * 40}
            />
          )}
        </td>
      ))}
    </tr>
  );
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 6, cols = 5 }: SkeletonTableProps) {
  injectStyles();
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "1rem",
          padding: "0.85rem 1rem",
          borderBottom: "1px solid rgba(212,175,55,0.12)",
          background: "rgba(212,175,55,0.04)",
        }}
      >
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} height={11} width="55%" delay={i * 30} />
        ))}
      </div>
      {/* Rows */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SkeletonDashboardProps {
  statCount?: number;
  showTable?: boolean;
  showChart?: boolean;
}

export function SkeletonDashboard({
  statCount = 4,
  showTable = true,
  showChart = true,
}: SkeletonDashboardProps) {
  injectStyles();
  return (
    <div style={{ padding: "1.5rem", maxWidth: 1400, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <Skeleton height={28} width={240} style={{ marginBottom: 10 }} />
        <Skeleton height={14} width={380} />
      </div>

      {/* Stat tiles */}
      <div
        className="sk-grid"
        style={{
          gridTemplateColumns: `repeat(${statCount}, 1fr)`,
          marginBottom: "1.5rem",
        }}
      >
        {Array.from({ length: statCount }, (_, i) => (
          <div
            key={i}
            style={{
              animationDelay: `${i * 80}ms`,
              animation: "sk-fade-in 0.4s ease both",
            }}
          >
            <SkeletonStatCard />
          </div>
        ))}
      </div>

      {/* Chart + side panel */}
      {showChart && (
        <div
          className="sk-grid"
          style={{
            gridTemplateColumns: "2fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="sk-card" style={{ height: 260 }}>
            <Skeleton
              height={14}
              width={160}
              style={{ marginBottom: "1rem" }}
            />
            <Skeleton height={200} radius={8} />
          </div>
          <div className="sk-card" style={{ height: 260 }}>
            <Skeleton
              height={14}
              width={100}
              style={{ marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[80, 60, 45, 70, 55].map((w, i) => (
                <div key={i} className="sk-row">
                  <Skeleton width={28} height={28} radius="50%" />
                  <Skeleton height={12} width={`${w}%`} delay={i * 50} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {showTable && <SkeletonTable rows={6} cols={5} />}
    </div>
  );
}

export function SkeletonUserList({ rows = 8 }: { rows?: number }) {
  injectStyles();
  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Search bar + button */}
      <div className="sk-row" style={{ marginBottom: "1.5rem" }}>
        <Skeleton height={40} style={{ flex: 1 }} radius={8} />
        <Skeleton height={40} width={120} radius={8} />
        <Skeleton height={40} width={100} radius={8} />
      </div>
      <SkeletonTable rows={rows} cols={6} />
    </div>
  );
}

export function SkeletonCourseGrid({ count = 9 }: { count?: number }) {
  injectStyles();
  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div className="sk-row" style={{ marginBottom: "1.5rem" }}>
        <div style={{ flex: 1 }}>
          <Skeleton height={26} width={200} style={{ marginBottom: 8 }} />
          <Skeleton height={13} width={300} />
        </div>
        <Skeleton height={40} width={180} radius={8} />
      </div>
      {/* Search */}
      <Skeleton height={44} radius={8} style={{ marginBottom: "1.5rem" }} />
      {/* Grid */}
      <div
        className="sk-grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            style={{
              animation: "sk-fade-in 0.4s ease both",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <SkeletonCourseCard />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading…" }: PageLoaderProps) {
  injectStyles();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        gap: "1.5rem",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Crescent + ring spinner */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(212,175,55,0.15)",
            borderTopColor: "#d4af37",
            animation: "sk-spin 1s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.08)",
            borderBottomColor: "rgba(212,175,55,0.4)",
            animation: "sk-spin 1.5s linear infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            color: "#d4af37",
          }}
        >
          ☽
        </div>
      </div>

      {/* Brand */}
      <div
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "1.3rem",
          fontWeight: 300,
          color: "#f5f0e8",
          letterSpacing: "0.05em",
        }}
      >
        Muwatta<span style={{ color: "#d4af37" }}>Academy</span>
      </div>

      {/* Message */}
      <div
        style={{
          fontSize: "0.8rem",
          color: "rgba(245,240,232,0.4)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          animation: "sk-pulse 2s ease-in-out infinite",
        }}
      >
        {message}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 180,
          height: 2,
          background: "rgba(212,175,55,0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "40%",
            background:
              "linear-gradient(90deg, transparent, #d4af37, transparent)",
            animation: "sk-shimmer 1.6s ease-in-out infinite",
            backgroundSize: "600px 100%",
          }}
        />
      </div>
    </div>
  );
}

export default PageLoader;

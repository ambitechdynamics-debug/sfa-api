// ui.jsx — shared primitives: Button, Card, Input, Badge, Avatar, Tabs, Modal, etc.

// ── Button ──
function Button({ children, variant = "primary", size = "md", icon, iconRight, full, onClick, type, disabled, style, ...rest }) {
  const sizes = {
    sm: { h: 32, px: 12, font: 13, gap: 6, iconSize: 14, radius: 8 },
    md: { h: 38, px: 16, font: 14, gap: 8, iconSize: 16, radius: 10 },
    lg: { h: 48, px: 22, font: 15, gap: 10, iconSize: 18, radius: 12 },
    xl: { h: 56, px: 28, font: 16, gap: 12, iconSize: 20, radius: 14 },
  }[size];
  const variants = {
    primary: {
      background: "linear-gradient(180deg, var(--acc-bright), var(--acc-deep))",
      color: "var(--acc-ink)",
      border: "1px solid var(--acc-deep)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 18px rgba(224,138,100,0.28)",
    },
    secondary: {
      background: "var(--bg-3)",
      color: "var(--ink-0)",
      border: "1px solid var(--line-2)",
      boxShadow: "var(--sh-1)",
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-1)",
      border: "1px solid transparent",
    },
    outline: {
      background: "transparent",
      color: "var(--ink-0)",
      border: "1px solid var(--line-3)",
    },
    danger: {
      background: "var(--rose-soft)",
      color: "var(--rose)",
      border: "1px solid rgba(217, 112, 112, 0.3)",
    },
  }[variant];
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: sizes.gap,
        height: sizes.h, padding: `0 ${sizes.px}px`,
        fontFamily: "var(--font-sans)", fontSize: sizes.font, fontWeight: 500,
        letterSpacing: "-0.005em",
        borderRadius: sizes.radius,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        width: full ? "100%" : "auto",
        transition: "transform 80ms ease, box-shadow 200ms ease, background 200ms ease",
        ...variants,
        ...style,
      }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={e => (e.currentTarget.style.transform = "")}
      onMouseLeave={e => (e.currentTarget.style.transform = "")}
      {...rest}
    >
      {icon && <Icon name={icon} size={sizes.iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sizes.iconSize} />}
    </button>
  );
}

// ── Card ──
function Card({ children, padding, style, hover, ...rest }) {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-1)",
        borderRadius: "var(--r-3)",
        padding: padding === undefined ? "var(--pad-card)" : padding,
        boxShadow: "var(--sh-1)",
        transition: "border-color 200ms, transform 200ms, box-shadow 200ms",
        ...(hover && { cursor: "pointer" }),
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.borderColor = "var(--line-3)";
        e.currentTarget.style.transform = "translateY(-1px)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.borderColor = "var(--line-1)";
        e.currentTarget.style.transform = "";
      } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Input ──
function Input({ label, hint, error, icon, type = "text", value, onChange, placeholder, style, prefix, suffix, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)" }}>{label}</span>
      )}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        height: "var(--row-h)", padding: "0 12px",
        background: "var(--bg-1)",
        border: `1px solid ${error ? "var(--err)" : focus ? "var(--acc-line)" : "var(--line-2)"}`,
        borderRadius: "var(--r-2)",
        boxShadow: focus ? "0 0 0 3px var(--acc-soft)" : "var(--sh-1)",
        transition: "border-color 150ms, box-shadow 150ms",
      }}>
        {icon && <Icon name={icon} size={15} style={{ color: "var(--ink-3)" }} />}
        {prefix && <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{prefix}</span>}
        <input
          type={type}
          value={value === undefined ? "" : value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, height: "100%",
            background: "transparent", border: 0, outline: 0,
            color: "var(--ink-0)", fontSize: 14, fontFamily: "var(--font-sans)",
          }}
          {...rest}
        />
        {suffix && <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{suffix}</span>}
      </span>
      {hint && !error && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: "var(--err)" }}>{error}</span>}
    </label>
  );
}

// ── Textarea ──
function Textarea({ label, hint, error, rows = 4, value, onChange, placeholder, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)" }}>{label}</span>
      )}
      <textarea
        rows={rows}
        value={value === undefined ? "" : value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%", padding: "10px 12px",
          background: "var(--bg-1)",
          border: `1px solid ${error ? "var(--err)" : focus ? "var(--acc-line)" : "var(--line-2)"}`,
          borderRadius: "var(--r-2)",
          boxShadow: focus ? "0 0 0 3px var(--acc-soft)" : "var(--sh-1)",
          color: "var(--ink-0)", fontSize: 14, fontFamily: "var(--font-sans)",
          resize: "vertical", outline: 0, transition: "border-color 150ms, box-shadow 150ms",
        }}
        {...rest}
      />
      {hint && !error && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: "var(--err)" }}>{error}</span>}
    </label>
  );
}

// ── Badge ──
const BADGE_TONES = {
  neutral: { bg: "var(--bg-3)", color: "var(--ink-1)", line: "var(--line-2)" },
  acc:     { bg: "var(--acc-soft)", color: "var(--acc-bright)", line: "var(--acc-line)" },
  sage:    { bg: "var(--sage-soft)", color: "var(--sage)", line: "rgba(138,165,122,0.3)" },
  plum:    { bg: "var(--plum-soft)", color: "var(--plum)", line: "rgba(176,139,199,0.3)" },
  gold:    { bg: "var(--gold-soft)", color: "var(--gold)", line: "rgba(216,168,90,0.3)" },
  rose:    { bg: "var(--rose-soft)", color: "var(--rose)", line: "rgba(217,112,112,0.3)" },
  sky:     { bg: "var(--sky-soft)", color: "var(--sky)", line: "rgba(122,163,201,0.3)" },
};
function Badge({ children, tone = "neutral", icon, dot, size = "md", style }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  const dim = size === "sm" ? { font: 11, h: 20, px: 7, gap: 4, iconSz: 11 }
                            : { font: 12, h: 24, px: 10, gap: 5, iconSz: 12 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: dim.gap,
      height: dim.h, padding: `0 ${dim.px}px`,
      background: t.bg, color: t.color,
      border: `1px solid ${t.line}`,
      borderRadius: "var(--r-pill)",
      fontSize: dim.font, fontWeight: 500, letterSpacing: "-0.005em",
      whiteSpace: "nowrap",
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, background: t.color, borderRadius: "50%" }} />}
      {icon && <Icon name={icon} size={dim.iconSz} />}
      {children}
    </span>
  );
}

// ── Avatar ──
const AVATAR_GRADS = [
  ["#777777", "#555555"],
  ["#8aa57a", "#5d7a4d"],
  ["#b08bc7", "#8861a3"],
  ["#7aa3c9", "#4d7da8"],
  ["#d8a85a", "#a8803a"],
];
function Avatar({ name = "?", src, size = 32, style }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase();
  const idx = (name.charCodeAt(0) || 0) % AVATAR_GRADS.length;
  const [a, b] = AVATAR_GRADS[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: src ? `url(${src}) center/cover` : `linear-gradient(135deg, ${a}, ${b})`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.95)", fontSize: size * 0.4, fontWeight: 600,
      letterSpacing: "0.02em", textTransform: "uppercase",
      flexShrink: 0,
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
      ...style,
    }}>
      {!src && initials}
    </div>
  );
}

// ── Tabs ──
function Tabs({ value, onChange, options }) {
  return (
    <div style={{
      display: "inline-flex", gap: 2, padding: 3,
      background: "var(--bg-2)", border: "1px solid var(--line-1)",
      borderRadius: "var(--r-2)",
    }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px",
            background: value === o.value ? "var(--bg-4)" : "transparent",
            border: 0, color: value === o.value ? "var(--ink-0)" : "var(--ink-2)",
            fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)",
            borderRadius: 7, cursor: "pointer",
            transition: "background 150ms, color 150ms",
          }}>
          {o.icon && <Icon name={o.icon} size={14} />}
          {o.label}
          {o.count !== undefined && (
            <span style={{
              background: value === o.value ? "var(--bg-2)" : "var(--bg-3)",
              padding: "1px 6px", borderRadius: 4,
              fontSize: 11, color: "var(--ink-2)",
            }}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Segmented option grid (used in wizard) ──
function OptionGrid({ value, onChange, options, columns = 3, multi = false }) {
  const isSelected = (v) => multi ? (value || []).includes(v) : value === v;
  const toggle = (v) => {
    if (multi) {
      const arr = value || [];
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
    } else onChange(v);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
      {options.map(o => {
        const sel = isSelected(o.value);
        return (
          <button key={o.value} onClick={() => toggle(o.value)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
              padding: "16px 14px", textAlign: "left",
              background: sel ? "var(--acc-soft)" : "var(--bg-1)",
              border: `1px solid ${sel ? "var(--acc-line)" : "var(--line-2)"}`,
              borderRadius: "var(--r-2)",
              boxShadow: sel ? "0 0 0 3px var(--acc-soft)" : "var(--sh-1)",
              cursor: "pointer", color: "var(--ink-0)", fontFamily: "var(--font-sans)",
              transition: "all 150ms",
            }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              {o.icon && (
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: sel ? "var(--acc)" : "var(--bg-3)",
                  color: sel ? "var(--acc-ink)" : "var(--ink-1)",
                }}>
                  <Icon name={o.icon} size={16} />
                </span>
              )}
              {sel && (
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--acc)", color: "var(--acc-ink)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="check" size={12} stroke={2.5} />
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{o.label}</div>
              {o.desc && <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.4 }}>{o.desc}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Section title ──
function SectionTitle({ overline, title, subtitle, action, style }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, ...style }}>
      <div>
        {overline && (
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            color: "var(--acc)", letterSpacing: "0.1em", textTransform: "uppercase",
            marginBottom: 8,
          }}>{overline}</div>
        )}
        <h2 className="display" style={{ fontSize: 28, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ color: "var(--ink-2)", fontSize: 15, margin: "8px 0 0", maxWidth: 580, lineHeight: 1.5 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Stat card ──
function StatCard({ label, value, delta, icon, accent }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>{label}</div>
        <span style={{
          width: 30, height: 30, borderRadius: 8,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: accent === "acc" ? "var(--acc-soft)" : "var(--bg-3)",
          color: accent === "acc" ? "var(--acc-bright)" : "var(--ink-1)",
        }}>
          <Icon name={icon} size={15} />
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div className="display" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.03em" }}>{value}</div>
        {delta && (
          <span style={{ fontSize: 12, color: delta.startsWith("+") ? "var(--sage)" : "var(--rose)", fontWeight: 500 }}>
            {delta}
          </span>
        )}
      </div>
    </Card>
  );
}

// ── Empty state ──
function EmptyState({ icon = "image", title, desc, action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 14, padding: "48px 24px", textAlign: "center",
      border: "1px dashed var(--line-2)", borderRadius: "var(--r-3)",
      background: "var(--bg-1)",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: "var(--bg-3)", color: "var(--ink-2)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={22} />
      </div>
      <div>
        <div className="display" style={{ fontSize: 18, marginBottom: 4 }}>{title}</div>
        {desc && <div style={{ fontSize: 13, color: "var(--ink-2)", maxWidth: 360 }}>{desc}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Skeleton ──
function Skeleton({ w = "100%", h = 16, r = 6, style }) {
  return (
    <span style={{
      display: "inline-block", width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, var(--bg-2), var(--bg-3), var(--bg-2))",
      backgroundSize: "200% 100%",
      animation: "skel 1.4s ease-in-out infinite",
      ...style,
    }} />
  );
}

// ── Tooltip-ish kbd ──
function Kbd({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 18, height: 18, padding: "0 5px",
      background: "var(--bg-3)", border: "1px solid var(--line-2)",
      borderRadius: 4, fontSize: 11, fontFamily: "var(--font-mono)",
      color: "var(--ink-2)", lineHeight: 1,
    }}>{children}</span>
  );
}

// ── Toast ──
function Toast({ children, onClose, tone = "acc", icon = "check" }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px",
      background: "var(--bg-3)", border: "1px solid var(--line-3)",
      borderRadius: "var(--r-3)",
      boxShadow: "var(--sh-3)",
      zIndex: 1000, fontSize: 13, color: "var(--ink-0)",
      animation: "toastIn 200ms ease",
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: tone === "acc" ? "var(--acc)" : tone === "sage" ? "var(--sage)" : "var(--rose)",
        color: tone === "acc" ? "var(--acc-ink)" : "white",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}><Icon name={icon} size={12} stroke={2.5} /></span>
      {children}
      {onClose && (
        <button onClick={onClose} style={{ background: "transparent", border: 0, color: "var(--ink-3)", cursor: "pointer", padding: 4 }}>
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

// ── Modal ──
function Modal({ open, onClose, title, children, footer, width = 520 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(8, 5, 3, 0.7)",
      backdropFilter: "blur(8px)", zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      animation: "fadeIn 200ms ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto",
        background: "var(--bg-2)", border: "1px solid var(--line-2)",
        borderRadius: "var(--r-4)", boxShadow: "var(--sh-3)",
        animation: "popIn 220ms cubic-bezier(.2,.9,.3,1.1)",
      }}>
        {title && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 20px", borderBottom: "1px solid var(--line-1)",
          }}>
            <h3 className="display" style={{ fontSize: 18, margin: 0 }}>{title}</h3>
            <button onClick={onClose} style={{
              background: "transparent", border: 0, color: "var(--ink-2)",
              padding: 6, borderRadius: 6, cursor: "pointer",
            }}><Icon name="x" size={18} /></button>
          </div>
        )}
        <div style={{ padding: "20px" }}>{children}</div>
        {footer && (
          <div style={{
            padding: "14px 20px", borderTop: "1px solid var(--line-1)",
            display: "flex", justifyContent: "flex-end", gap: 8,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  Button, Card, Input, Textarea, Badge, Avatar, Tabs, OptionGrid,
  SectionTitle, StatCard, EmptyState, Skeleton, Kbd, Toast, Modal,
});

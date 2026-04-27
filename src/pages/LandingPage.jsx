// ─── src/pages/LandingPage.jsx ───────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── icon helpers ─────────────────────────────────────────────────────────────
function ChurchIcon({ size = 20, color = "#c96442" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2C10 2 5 5 5 10C5 13 7 15 10 16C13 15 15 13 15 10C15 5 10 2 10 2Z"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M8 12L10 9L12 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 2L10 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon({ color = "#c96442" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
      <path d="M5 8.5l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DotIcon() {
  return <svg width="6" height="6" viewBox="0 0 6 6" style={{ flexShrink: 0, marginTop: 7 }}><circle cx="3" cy="3" r="3" fill="#c96442" /></svg>;
}
function PricingCheck({ popular }) {
  const c = popular ? "#c96442" : "#87867f";
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.2" />
      <path d="M4 7.5l2 2 4-4" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── mock sub-components ──────────────────────────────────────────────────────
function BlueprintMock() {
  return (
    <div className="lp-blueprint-mock" style={{ background: "#30302e", borderRadius: 24, padding: 24, boxShadow: "#d97757 0 0 0 1px, rgba(217,119,87,.06) 0 0 60px 0" }}>
      <div style={{ fontSize: 11, color: "#5e5d59", marginBottom: 16, fontFamily: "'DM Sans',sans-serif" }}>
        People / <span style={{ color: "#faf9f5" }}>Rachel Okonkwo</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#4d4c48", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 500, color: "#faf9f5", flexShrink: 0 }}>R</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 500, color: "#faf9f5" }}>Rachel Okonkwo</div>
          <div style={{ fontSize: 12, color: "#87867f", marginTop: 2 }}>Member · Sandton Home Cell</div>
        </div>
      </div>
      <div style={{ background: "#141413", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#5e5d59", marginBottom: 14, fontFamily: "'DM Sans',sans-serif" }}>Growth Path</div>
        <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
          {["Believe", "Baptized"].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#c96442", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div style={{ fontSize: 9, color: "#c96442", marginTop: 5, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{s}</div>
              </div>
              <div style={{ flex: 1, height: 1, background: "#c96442", marginBottom: 14 }} />
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#c96442", border: "2px solid #d97757", boxShadow: "0 0 0 3px rgba(217,119,87,.2)" }} />
            <div style={{ fontSize: 9, color: "#d97757", marginTop: 5, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>Belong ←</div>
          </div>
          <div style={{ flex: 1, height: 1, background: "#30302e", marginBottom: 14 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #30302e" }} />
            <div style={{ fontSize: 9, color: "#5e5d59", marginTop: 5, fontFamily: "'DM Sans',sans-serif" }}>Build</div>
          </div>
        </div>
      </div>
      <div style={{ background: "#141413", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#5e5d59", marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>Current stage tasks</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[{ done: true, text: "Joined a home cell group" }, { done: true, text: "Attended 3 consecutive services" }, { done: false, text: "Complete foundations course" }].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: t.done ? "#faf9f5" : "#87867f", fontFamily: "'DM Sans',sans-serif" }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: t.done ? "#c96442" : "transparent", border: t.done ? "none" : "1px solid #30302e", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4.5l2 2 3-3.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MembersListMock() {
  const members = [
    { name: "James Martin",   role: "Pastor",  status: "active",  initials: "JM" },
    { name: "Rachel Okonkwo", role: "Member",  status: "active",  initials: "RO" },
    { name: "Thabo Dlamini",  role: "Leader",  status: "active",  initials: "TD" },
    { name: "Sarah van Wyk",  role: "Member",  status: "pending", initials: "SW" },
    { name: "Michael Peters", role: "Member",  status: "pending", initials: "MP" },
  ];
  return (
    <div className="lp-lifecycle-mock" style={{ background: "#faf9f5", border: "1px solid #f0eee6", borderRadius: 24, padding: 24, boxShadow: "rgba(0,0,0,.05) 0 8px 40px" }}>
      <div style={{ background: "#fef9e7", border: "1px solid #f0d060", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#7a6020", marginBottom: 16, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#c9a020" strokeWidth="1.2" /><path d="M7 4.5v3M7 9.5v.5" stroke="#c9a020" strokeWidth="1.2" strokeLinecap="round" /></svg>
        14 members not yet invited
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 500, color: "#141413" }}>Members</div>
        <div style={{ fontSize: 12, color: "#87867f", background: "#f0eee6", padding: "5px 10px", borderRadius: 6, fontFamily: "'DM Sans',sans-serif" }}>Import CSV</div>
      </div>
      {members.map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < members.length - 1 ? "1px solid #f5f4ed" : "none", fontFamily: "'DM Sans',sans-serif" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.status === "active" ? "#fdf0ea" : "#f0eee6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: m.status === "active" ? "#c96442" : "#87867f", flexShrink: 0 }}>{m.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#141413", fontWeight: 500 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: "#87867f" }}>{m.role}</div>
          </div>
          <div style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: m.status === "active" ? "#fdf0ea" : "#f5f4ed", color: m.status === "active" ? "#c96442" : "#87867f", fontWeight: 500 }}>{m.status === "active" ? "Active" : "Not invited"}</div>
        </div>
      ))}
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="lp-phone" style={{ width: 220, background: "#1a1a18", borderRadius: 40, padding: 10, boxShadow: "rgba(0,0,0,.25) 0 24px 64px" }}>
      <div style={{ background: "#f5f4ed", borderRadius: 30, overflow: "hidden" }}>
        <div style={{ background: "#141413", height: 28, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <span style={{ fontSize: 9, color: "#faf9f5", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>9:41</span>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><rect x="0" y="2" width="2" height="6" rx="1" fill="white" opacity=".4" /><rect x="3" y="1" width="2" height="7" rx="1" fill="white" opacity=".6" /><rect x="6" y="0" width="2" height="8" rx="1" fill="white" /><rect x="9" y="0" width="3" height="7" rx="1" fill="white" /></svg>
        </div>
        <div style={{ padding: "16px 14px", background: "#f5f4ed", minHeight: 440 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 500, color: "#141413", marginBottom: 2 }}>Good morning,</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 500, color: "#141413", marginBottom: 16 }}>Rachel.</div>
          <div style={{ background: "#faf9f5", border: "1px solid #f0eee6", borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: "rgba(0,0,0,.04) 0 4px 16px" }}>
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#87867f", marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>Your Journey</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              {[8,16,8,16,10,16,8].map((s, i) =>
                i % 2 === 0 ? (
                  <div key={i} style={{ width: s, height: s, borderRadius: "50%", background: i < 4 ? "#c96442" : i === 4 ? "#c96442" : "#e8e6dc", border: i === 4 ? "none" : "none", boxShadow: i === 4 ? "0 0 0 2px rgba(201,100,66,.25)" : "none", flexShrink: 0 }} />
                ) : (
                  <div key={i} style={{ width: s, height: 1.5, background: i < 5 ? "#c96442" : "#e8e6dc", flexShrink: 0 }} />
                )
              )}
              <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #e8e6dc", flexShrink: 0 }} />
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 500, color: "#141413" }}>Stage 3: Belong</div>
            <div style={{ fontSize: 9, color: "#87867f", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>1 task remaining</div>
          </div>
          <div style={{ background: "#faf9f5", border: "1px solid #f0eee6", borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#87867f", marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>Upcoming</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 12, fontWeight: 500, color: "#141413" }}>Sunday Service</div>
            <div style={{ fontSize: 9, color: "#87867f", marginTop: 1, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>Sun, Apr 27 · 9:00 AM</div>
            <div style={{ background: "#c96442", borderRadius: 7, padding: "5px 10px", fontSize: 9, fontWeight: 500, color: "#fff", display: "inline-block", fontFamily: "'DM Sans',sans-serif" }}>RSVP</div>
          </div>
          <div style={{ background: "#faf9f5", border: "1px solid #f0eee6", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fdf0ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "#c96442", fontFamily: "'DM Sans',sans-serif" }}>TD</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#141413", fontFamily: "'DM Sans',sans-serif" }}>Thabo (Leader)</div>
                <div style={{ fontSize: 8, color: "#87867f", fontFamily: "'DM Sans',sans-serif" }}>How was your week?</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: "#faf9f5", borderTop: "1px solid #f0eee6", display: "flex", justifyContent: "space-around", padding: "8px 0 10px" }}>
          {[
            { label: "Journey", active: true },
            { label: "Events",  active: false },
            { label: "Messages",active: false },
          ].map(t => (
            <div key={t.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: t.active ? "#fdf0ea" : "transparent" }} />
              <span style={{ fontSize: 7, color: t.active ? "#c96442" : "#b0aea5", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-faq-item" style={{ borderBottom: "1px solid #e8e6dc" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "22px 0", cursor: "pointer", background: "none", border: "none", width: "100%", fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 500, color: "#141413", lineHeight: 1.3, textAlign: "left" }}>
        {q}
        <svg style={{ flexShrink: 0, transition: "transform .25s", transform: open ? "rotate(90deg)" : "none" }} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6 7l3 3 3-3" stroke="#87867f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ overflow: "hidden", maxHeight: open ? 300 : 0, paddingBottom: open ? 20 : 0, transition: "max-height .3s ease, padding .3s ease" }}>
        <p style={{ fontSize: 16, lineHeight: 1.70, color: "#5e5d59", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{a}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function LandingPage({ onSignIn }) {
  const [scrolled, setScrolled] = useState(false);
  const rootRef      = useRef(null);
  const activePathRef = useRef(null);
  const dashedPathRef = useRef(null);

  // ── nav scroll detection ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── GSAP animations ───────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── 1. NAV + HERO LOAD SEQUENCE ─────────────────────────────────────
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".lp-nav", { y: -70, opacity: 0, duration: 0.7 })
        .from(".lp-hero-eyebrow", { y: 18, opacity: 0, duration: 0.5 }, "-=0.3")
        .from(".lp-h1-word", {
          y: 72, rotationX: -50, opacity: 0,
          stagger: 0.07, duration: 0.75,
          transformOrigin: "0% 50% -60",
        }, "-=0.2")
        .from(".lp-hero-sub", { y: 20, opacity: 0, duration: 0.6 }, "-=0.45")
        .from(".lp-hero-body", { y: 20, opacity: 0, duration: 0.6 }, "-=0.5")
        .from(".lp-cta-btn", { y: 24, opacity: 0, stagger: 0.1, duration: 0.55 }, "-=0.45")
        .from(".lp-trust", { opacity: 0, duration: 0.5 }, "-=0.35")
        .from(".lp-hero-svg", { y: 50, opacity: 0, scale: 0.97, duration: 1 }, "-=0.5");

      // ── 2. SVG JOURNEY PATH DRAW ─────────────────────────────────────────
      if (activePathRef.current) {
        const len = activePathRef.current.getTotalLength();
        gsap.set(activePathRef.current, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(activePathRef.current, {
          strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", delay: 0.9,
        });
      }
      if (dashedPathRef.current) {
        const len2 = dashedPathRef.current.getTotalLength();
        gsap.set(dashedPathRef.current, { strokeDasharray: `6 4`, strokeDashoffset: len2 });
        gsap.to(dashedPathRef.current, {
          strokeDashoffset: 0, duration: 2.5, ease: "power1.inOut", delay: 1.1,
        });
      }

      // ── 3. HERO SVG STAGE CIRCLES SCALE IN ──────────────────────────────
      gsap.from(".lp-stage-circle", {
        scale: 0, opacity: 0, stagger: 0.18, duration: 0.65,
        ease: "back.out(1.7)", delay: 1.2,
        transformOrigin: "center center",
      });

      // ── 4. SOCIAL PROOF ──────────────────────────────────────────────────
      gsap.from(".lp-proof-quote", {
        y: 24, opacity: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-social-proof", start: "top 88%" },
      });
      gsap.from(".lp-church-name", {
        y: 16, opacity: 0, stagger: 0.06, duration: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: ".lp-social-proof", start: "top 85%" },
      });

      // ── 5. BLUEPRINT SECTION (dark) ──────────────────────────────────────
      gsap.from(".lp-blueprint-left", {
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-blueprint-section", start: "top 78%" },
      });
      gsap.from(".lp-blueprint-mock", {
        x: 60, opacity: 0, rotationY: 6, duration: 1, ease: "power3.out",
        transformPerspective: 900,
        scrollTrigger: { trigger: ".lp-blueprint-section", start: "top 78%" },
      });
      gsap.from(".lp-blueprint-stage-item", {
        x: -30, opacity: 0, stagger: 0.1, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: ".lp-blueprint-stages", start: "top 82%" },
      });

      // ── 6. MEMBER LIFECYCLE ───────────────────────────────────────────────
      gsap.from(".lp-lifecycle-left", {
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-lifecycle-section", start: "top 78%" },
      });
      gsap.from(".lp-lifecycle-mock", {
        x: 60, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-lifecycle-section", start: "top 78%" },
      });

      // ── 7. GROUPS CARDS ───────────────────────────────────────────────────
      gsap.from(".lp-group-card", {
        y: 44, opacity: 0, scale: 0.96, stagger: { each: 0.12, from: "start" },
        duration: 0.75, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-groups-grid", start: "top 82%" },
      });

      // ── 8. OPERATIONS CARDS ──────────────────────────────────────────────
      gsap.from(".lp-op-card", {
        y: 40, opacity: 0, stagger: 0.1, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-ops-grid", start: "top 82%" },
      });

      // ── 9. ROLES SECTION (dark) ───────────────────────────────────────────
      gsap.from(".lp-roles-h2", {
        y: 30, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-roles-section", start: "top 80%" },
      });
      gsap.from(".lp-role-strip", {
        x: -50, opacity: 0, stagger: 0.12, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-roles-inner", start: "top 80%" },
      });

      // ── 10. MEMBER PORTAL ─────────────────────────────────────────────────
      gsap.from(".lp-portal-left", {
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-portal-section", start: "top 78%" },
      });
      gsap.from(".lp-phone", {
        x: 60, opacity: 0, scale: 0.9, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-portal-section", start: "top 78%",
          onEnter: () => {
            gsap.to(".lp-phone", {
              y: -14, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1,
            });
          },
        },
      });

      // ── 11. HOW IT WORKS ──────────────────────────────────────────────────
      gsap.from(".lp-steps-heading", {
        y: 24, opacity: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-steps-section", start: "top 82%" },
      });
      gsap.from(".lp-step-num", {
        scale: 0.4, opacity: 0, stagger: 0.18, duration: 0.8, ease: "back.out(1.5)",
        scrollTrigger: { trigger: ".lp-steps-grid", start: "top 82%" },
      });
      gsap.from(".lp-step-content", {
        y: 20, opacity: 0, stagger: 0.18, duration: 0.65, ease: "power2.out",
        scrollTrigger: { trigger: ".lp-steps-grid", start: "top 82%" },
        delay: 0.15,
      });

      // ── 12. PRICING ───────────────────────────────────────────────────────
      gsap.from(".lp-pricing-heading", {
        y: 24, opacity: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-pricing-section", start: "top 82%" },
      });
      gsap.from(".lp-pricing-card", {
        y: 56, opacity: 0, rotationX: 10, stagger: 0.14, duration: 0.85,
        ease: "power3.out", transformPerspective: 700,
        scrollTrigger: { trigger: ".lp-pricing-grid", start: "top 82%" },
      });

      // ── 13. FAQ ───────────────────────────────────────────────────────────
      gsap.from(".lp-faq-heading", {
        y: 24, opacity: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-faq-section", start: "top 82%" },
      });
      gsap.from(".lp-faq-item", {
        y: 24, opacity: 0, stagger: 0.07, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: ".lp-faq-section", start: "top 80%" },
      });

      // ── 14. FINAL CTA ─────────────────────────────────────────────────────
      gsap.from(".lp-final-h2", {
        y: 50, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".lp-final-cta", start: "top 80%" },
      });
      gsap.from(".lp-final-sub, .lp-final-btn, .lp-final-note", {
        y: 28, opacity: 0, stagger: 0.12, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: ".lp-final-cta", start: "top 80%" },
        delay: 0.2,
      });

      // ── 15. FOOTER ────────────────────────────────────────────────────────
      gsap.from(".lp-footer", {
        y: 24, opacity: 0, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: ".lp-footer", start: "top 92%" },
      });

      // ── 16. GENERIC SECTION HEADINGS (eyebrow + h2 pairs) ────────────────
      gsap.utils.toArray(".lp-section-head").forEach(el => {
        gsap.from(el, {
          y: 28, opacity: 0, duration: 0.75, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ── shared style constants ────────────────────────────────────────────────
  const S = {
    parchment: { background: "#f5f4ed" },
    ivory:     { background: "#faf9f5" },
    dark:      { background: "#141413" },
    container: { maxWidth: 1160, margin: "0 auto", padding: "0 40px" },
    eyebrow:   { fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase", color: "#87867f", marginBottom: 18, display: "block" },
    eyebrowCoral: { color: "#d97757" },
    sectionH2: { fontFamily: "'Playfair Display',serif", fontWeight: 500, lineHeight: 1.20, color: "#141413", marginBottom: 0, textWrap: "pretty", fontSize: "clamp(26px,3vw,40px)" },
    featureNum: { fontFamily: "'Playfair Display',serif", fontSize: 56, fontWeight: 500, color: "#f0eee6", lineHeight: 1, marginBottom: 16 },
    featureH2:  { fontFamily: "'Playfair Display',serif", fontWeight: 500, lineHeight: 1.20, color: "#141413", marginBottom: 20, textWrap: "pretty", fontSize: "clamp(26px,3vw,40px)" },
    featureBody:{ fontSize: 17, lineHeight: 1.70, color: "#5e5d59", marginBottom: 28, textWrap: "pretty", fontFamily: "'DM Sans',sans-serif" },
    twoCol:    { maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" },
    btnPrimary: { background: "#c96442", color: "#faf9f5", padding: "13px 28px", borderRadius: 12, fontSize: 16, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 0 0 1px rgba(201,100,66,.2)" },
    btnSecondary: { background: "#e8e6dc", color: "#4d4c48", padding: "13px 24px", borderRadius: 12, fontSize: 16, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 7, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 0 0 1px #d1cfc5" },
    checkList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
    checkItem: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, color: "#5e5d59", lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" },
  };

  const FAQS = [
    { q: "Can we import from Planning Center, ChurchTrac, or another system?", a: "Yes. ChurchOS accepts CSV exports from most church management systems. The importer auto-maps standard columns — Name, Email, Phone, Address, and more. If a column doesn't match automatically, you choose the mapping yourself." },
    { q: "Is our member data private?", a: "Your data belongs entirely to your church. ChurchOS does not sell, share, or use your member data for any purpose beyond running your account. All data is encrypted at rest and in transit." },
    { q: "What happens if a member leaves the church?", a: "You can mark them as inactive or archive their record. Archived members no longer count toward your active member limit and cannot log in, but their history — attendance, journey stages — is preserved for your records." },
    { q: "Do we need technical staff to set this up?", a: "No. ChurchOS is designed for pastors and administrators, not IT departments. Setup takes about 20 minutes for most churches. The Rooted and Oak plans include a guided onboarding call with our team." },
    { q: "Can leaders take attendance from their phones?", a: "Yes. Group leaders open ChurchOS on any phone and mark attendance for their cell or team. No app download — the member portal works from any browser and installs as a PWA with one tap." },
    { q: "How does billing work?", a: "Monthly, billed in South African Rand. No per-member fees, no hidden costs. Cancel anytime — your data exports with you in full. Annual plans available at a discount on request." },
    { q: "Is there a free trial?", a: "Yes — every plan starts with a 30-day free trial. No credit card required. Import your data, invite your leaders, and see how ChurchOS fits your church before you pay anything." },
  ];

  const PRICING = [
    { tier: "Seedling", price: "R299",   period: "/month", sub: "For church plants · Up to 100 members",           popular: false, features: ["Up to 100 members", "Full Growth Path", "Member portal (PWA)", "Attendance & events", "Email support"] },
    { tier: "Rooted",   price: "R699",   period: "/month", sub: "For growing churches · Up to 500 members",         popular: true,  features: ["Up to 500 members", "Everything in Seedling", "Groups, cells & zones", "Messaging & broadcasts", "Rules engine", "Priority support"] },
    { tier: "Oak",      price: "R1,499", period: "/month", sub: "For established congregations · Unlimited",         popular: false, features: ["Unlimited members", "Everything in Rooted", "Advanced analytics", "Custom stage definitions", "Dedicated onboarding"] },
  ];

  const ROLES = [
    { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="#d97757" strokeWidth="1.5"/><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#d97757" strokeWidth="1.5" strokeLinecap="round"/><path d="M15 4l1.5 1.5L18 4" stroke="#d97757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: "The Pastor",       desc: "Oversight of the whole body. Every stage, every group, every soul. Approve, promote, and override when it matters." },
    { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="4" width="12" height="12" rx="2" stroke="#d97757" strokeWidth="1.5"/><path d="M7 10h6M7 7h4M7 13h3" stroke="#d97757" strokeWidth="1.5" strokeLinecap="round"/></svg>,                                                                                                                                                     label: "The Admin",        desc: "Day-to-day operations. Enrolments, imports, invitations, and event logistics run clearly and without friction." },
    { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="8" r="2.5" stroke="#d97757" strokeWidth="1.5"/><path d="M6 16c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="#d97757" strokeWidth="1.5" strokeLinecap="round"/><circle cx="15" cy="6" r="2" stroke="#d97757" strokeWidth="1.2"/><path d="M13 13c.4-.6 1.2-1 2-1" stroke="#d97757" strokeWidth="1.2" strokeLinecap="round"/></svg>, label: "The Group Leader", desc: "Focused on their flock. Their members' progress, attendance, and messages — nothing outside their scope." },
    { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="5" y="3" width="10" height="14" rx="3" stroke="#d97757" strokeWidth="1.5"/><path d="M8 7h4M8 10h4M8 13h2" stroke="#d97757" strokeWidth="1.5" strokeLinecap="round"/></svg>,                                                                                                                                                          label: "The Member",       desc: "A mobile-first portal showing their journey, their tasks, their events, and a direct line to their mentor." },
  ];

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} style={{ fontFamily: "'DM Sans',sans-serif", color: "#141413", background: "#f5f4ed", overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav className="lp-nav" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(245,244,237,.93)" : "#f5f4ed",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid #e8e6dc" : "1px solid transparent",
        transition: "border-color .2s, background .2s, backdrop-filter .2s",
        padding: "0 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <button onClick={onSignIn} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 500, color: "#141413", letterSpacing: "-.3px" }}>
            <ChurchIcon size={20} />ChurchOS
          </button>
          <ul style={{ display: "flex", gap: 0, listStyle: "none", margin: 0, padding: 0 }}>
            {["Product", "Features", "For Pastors", "Pricing", "About"].map(l => (
              <li key={l}>
                <a href={l === "Pricing" ? "#pricing" : "#"} style={{ fontSize: 15, fontWeight: 500, color: "#5e5d59", padding: "0 14px", height: 64, display: "flex", alignItems: "center", textDecoration: "none", transition: "color .15s" }}
                  onMouseEnter={e => e.target.style.color = "#141413"}
                  onMouseLeave={e => e.target.style.color = "#5e5d59"}>
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={onSignIn} className="lp-cta-btn" style={{ fontSize: 14, color: "#4d4c48", fontWeight: 500, padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Sign in</button>
            <button onClick={onSignIn} className="lp-cta-btn" style={{ background: "#c96442", color: "#faf9f5", padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 0 0 1px rgba(201,100,66,.25)" }}>Start free</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ ...S.parchment, padding: "88px 40px 0", textAlign: "center" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <span className="lp-hero-eyebrow" style={S.eyebrow}>Sanctuary management</span>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(40px,5.5vw,72px)", fontWeight: 500, lineHeight: 1.05, color: "#141413", marginBottom: 20, textWrap: "pretty", perspective: 600 }}>
            {["Shepherd", "your", "church", "with", "clarity."].map((w, i) => (
              <span key={i} className="lp-h1-word" style={{ display: "inline-block", marginRight: "0.22em" }}>{w}</span>
            ))}
          </h1>
          <p className="lp-hero-sub" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(18px,2.5vw,30px)", fontWeight: 500, fontStyle: "italic", lineHeight: 1.25, color: "#5e5d59", marginBottom: 28 }}>
            Know where every member is.<br />Guide them forward with confidence.
          </p>
          <p className="lp-hero-body" style={{ fontSize: 18, lineHeight: 1.65, color: "#5e5d59", maxWidth: 560, margin: "0 auto 36px", fontFamily: "'DM Sans',sans-serif" }}>
            From first-time visitors to emerging leaders, ChurchOS helps you track every step of your people's journey. No spreadsheets. No guesswork. Just clarity.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <button className="lp-cta-btn" onClick={onSignIn} style={{ ...S.btnPrimary, padding: "15px 36px", fontSize: 17, borderRadius: 14 }}>Start free trial</button>
            <button className="lp-cta-btn" onClick={onSignIn} style={{ ...S.btnSecondary, padding: "15px 24px", fontSize: 17, borderRadius: 14 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4d4c48" strokeWidth="1.5" /><path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="#4d4c48" /></svg>
              Watch 2-min demo
            </button>
          </div>
          <p className="lp-trust" style={{ fontSize: 13, color: "#87867f", marginBottom: 72, fontFamily: "'DM Sans',sans-serif" }}>Free for 30 days · No credit card · Import your data in minutes</p>
        </div>

        {/* Hero SVG journey illustration */}
        <div className="lp-hero-svg" style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
          <svg viewBox="0 0 1000 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
            {/* Background dashed full path */}
            <path ref={dashedPathRef}
              d="M80 220 C180 220 220 130 320 130 C420 130 430 200 530 200 C630 200 640 120 740 120 C840 120 860 180 940 180"
              stroke="#e8e6dc" strokeWidth="2" fill="none" strokeDasharray="6 4" />
            {/* Active coral path */}
            <path ref={activePathRef}
              d="M80 220 C180 220 220 130 320 130 C420 130 430 200 530 200"
              stroke="#c96442" strokeWidth="2.5" fill="none" />
            {/* Stage circles */}
            <circle className="lp-stage-circle" cx="120" cy="220" r="40" fill="#fdf0ea" stroke="#c96442" strokeWidth="2" />
            <text x="120" y="214" textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="11" fontWeight="500" fill="#c96442">Believe</text>
            <text x="120" y="228" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#87867f">First connection</text>
            <circle className="lp-stage-circle" cx="320" cy="130" r="44" fill="#fdf0ea" stroke="#c96442" strokeWidth="2" />
            <text x="320" y="124" textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="11" fontWeight="500" fill="#c96442">Baptized</text>
            <text x="320" y="138" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#87867f">Public commitment</text>
            <circle className="lp-stage-circle" cx="530" cy="200" r="48" fill="#c96442" stroke="#c96442" strokeWidth="2" />
            <circle cx="530" cy="200" r="56" fill="none" stroke="#c96442" strokeWidth="1" strokeDasharray="4 3" opacity=".4" />
            <text x="530" y="194" textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="12" fontWeight="500" fill="#fff">Belong</text>
            <text x="530" y="208" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="rgba(255,255,255,.75)">Integrated in community</text>
            <circle className="lp-stage-circle" cx="740" cy="120" r="40" fill="#f5f4ed" stroke="#d1cfc5" strokeWidth="2" />
            <text x="740" y="114" textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="11" fontWeight="500" fill="#87867f">Build</text>
            <text x="740" y="128" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#b0aea5">Serving &amp; leading</text>
            {/* Decorative dots */}
            <circle cx="200" cy="178" r="3" fill="#c96442" opacity=".4" />
            <circle cx="425" cy="165" r="3" fill="#c96442" opacity=".4" />
            {/* Floating member cards */}
            <rect x="60" y="60" width="110" height="48" rx="10" fill="#faf9f5" stroke="#f0eee6" strokeWidth="1" />
            <circle cx="80" cy="84" r="10" fill="#e8e6dc" />
            <rect x="96" y="77" width="55" height="6" rx="3" fill="#e8e6dc" />
            <rect x="96" y="88" width="40" height="4" rx="2" fill="#f0eee6" />
            <rect x="800" y="50" width="130" height="54" rx="10" fill="#faf9f5" stroke="#f0eee6" strokeWidth="1" />
            <circle cx="822" cy="77" r="11" fill="#fdf0ea" />
            <rect x="840" y="68" width="60" height="6" rx="3" fill="#e8e6dc" />
            <rect x="840" y="79" width="45" height="4" rx="2" fill="#f0eee6" />
            <rect x="840" y="89" width="70" height="4" rx="2" fill="#fdf0ea" />
            {/* Stage label */}
            <rect x="480" y="262" width="100" height="22" rx="6" fill="#141413" />
            <text x="530" y="277" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fontWeight="500" fill="#d97757">Stage 3 of 4</text>
          </svg>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="lp-social-proof" style={{ ...S.ivory, padding: "56px 40px", textAlign: "center", borderTop: "1px solid #f0eee6", borderBottom: "1px solid #f0eee6" }}>
        <p className="lp-proof-quote" style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 500, fontStyle: "italic", color: "#5e5d59", marginBottom: 28 }}>
          "Trusted by pastors and church leaders across growing communities."
        </p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
          {["Grace Community", "Redeemer Church", "The Sanctuary", "Living Hope", "New Covenant", "Harvest Fellowship"].map(n => (
            <span key={n} className="lp-church-name" style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 500, color: "#b0aea5", letterSpacing: ".02em" }}>{n}</span>
          ))}
        </div>
      </section>

      {/* ── BLUEPRINT JOURNEY (DARK) ── */}
      <section className="lp-blueprint-section" style={{ ...S.dark, padding: "100px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div className="lp-blueprint-left">
            <span style={{ ...S.eyebrow, ...S.eyebrowCoral }}>The Growth Path</span>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,3.5vw,52px)", fontWeight: 500, lineHeight: 1.15, color: "#faf9f5", marginBottom: 24, textWrap: "pretty" }}>
              Every member is on a journey. You can finally see it.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.70, color: "#b0aea5", marginBottom: 32, fontFamily: "'DM Sans',sans-serif" }}>
              The Growth Path shows exactly where each person is — from first belief to leadership. Know who needs guidance, who is ready to grow, and who may be drifting.
            </p>
            <div className="lp-blueprint-stages">
              {[{ n: "01", title: "Believe", desc: "First connection with your church. The moment of arrival." }, { n: "02", title: "Baptized", desc: "Public commitment recorded and celebrated with the community." }, { n: "03", title: "Belong", desc: "Integrated into a cell group. Active, engaged, known." }, { n: "04", title: "Build", desc: "Serving, leading, and pouring into others. Multiplying." }].map(s => (
                <div key={s.n} className="lp-blueprint-stage-item" style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid #30302e" }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 500, color: "#d97757", flexShrink: 0, width: 20, marginTop: 2 }}>{s.n}</span>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 500, color: "#faf9f5", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 14, color: "#87867f", lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onSignIn} style={{ color: "#d97757", fontSize: 15, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, marginTop: 28, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              See how the Growth Path works <span>→</span>
            </button>
          </div>
          <BlueprintMock />
        </div>
      </section>

      {/* ── MEMBER LIFECYCLE ── */}
      <section className="lp-lifecycle-section" style={{ ...S.parchment, padding: "100px 40px" }}>
        <div style={S.twoCol}>
          <div className="lp-lifecycle-left">
            <div style={S.featureNum}>01</div>
            <h2 style={S.featureH2}>From first visit to full involvement.</h2>
            <p style={S.featureBody}>Bring your entire church into one place. Import members, invite them instantly, and track their progress automatically. Every action is pastoral, not administrative.</p>
            <ul style={S.checkList}>
              {["Bulk Excel or CSV import with smart column mapping", "One-click invite with temporary password generation", "Send login credentials by WhatsApp or email", "Pending-approval queue for new members", "Role-based access — Pastor, Admin, Leader, Member"].map(t => (
                <li key={t} style={S.checkItem}><CheckIcon /> {t}</li>
              ))}
            </ul>
          </div>
          <MembersListMock />
        </div>
      </section>

      {/* ── GROUPS ── */}
      <section style={{ ...S.ivory, padding: "100px 40px" }}>
        <div className="lp-section-head" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
          <span style={S.eyebrow}>Structure</span>
          <h2 style={S.sectionH2}>Organize your church the way it actually works.</h2>
        </div>
        <div className="lp-groups-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
          {[
            { title: "Home Cells",                body: "Assign members to cells based on where they live. Zones group cells by neighborhood so oversight stays clear as your church grows.",              icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L3 8V17H8V13H12V17H17V8L10 3Z" stroke="#c96442" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
            { title: "Sunday Teams",              body: "Worship, ushers, kids, media — every serving team in one place. Check in team members on Sunday morning in under a minute.",                   icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="#c96442" strokeWidth="1.5"/><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/><path d="M14.5 7a2.5 2.5 0 010 5M5.5 7a2.5 2.5 0 000 5" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/></svg> },
            { title: "Ministries & Departments",  body: "Outreach, prayer, youth, and more. Track who is involved in what. Measure participation without bureaucracy.",                                   icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 17c-.5 0-7-4.5-7-9a7 7 0 0114 0c0 4.5-6.5 9-7 9z" stroke="#c96442" strokeWidth="1.5"/><path d="M10 11V8M8 9.5h4" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/></svg> },
          ].map(c => (
            <div key={c.title} className="lp-group-card" style={{ background: "#f5f4ed", border: "1px solid #f0eee6", borderRadius: 16, padding: "28px 24px", boxShadow: "rgba(0,0,0,.04) 0 4px 20px" }}>
              <div style={{ width: 40, height: 40, background: "#fdf0ea", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>{c.icon}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 500, color: "#141413", marginBottom: 10 }}>{c.title}</div>
              <p style={{ fontSize: 15, lineHeight: 1.60, color: "#5e5d59", fontFamily: "'DM Sans',sans-serif", margin: 0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CORE OPERATIONS ── */}
      <section style={{ ...S.parchment, padding: "100px 40px", borderTop: "1px solid #f0eee6" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="lp-section-head" style={{ marginBottom: 48 }}>
            <span style={S.eyebrow}>Core operations</span>
            <h2 style={{ ...S.sectionH2, maxWidth: 500 }}>Everything your church runs on, in one place.</h2>
          </div>
          <div className="lp-ops-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { title: "Messages",      body: "Talk to members and leaders directly. No lost conversations. Members can message their mentor from any phone.",                                    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4h12v2H4zM4 9h8M4 13h6" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/><circle cx="15" cy="15" r="3" stroke="#c96442" strokeWidth="1.5"/><path d="M17 17l1.5 1.5" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/></svg> },
              { title: "Events & RSVP", body: "Plan services, workshops, and gatherings. Know who is coming. Members RSVP from their phones in seconds.",                                          icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2" stroke="#c96442" strokeWidth="1.5"/><path d="M7 2v4M13 2v4M3 9h14" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/></svg> },
              { title: "Attendance",    body: "Track service attendance in under 60 seconds. Spot trends. Notice members who may be drifting before they drift too far.",                           icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 16V9l6-5 6 5v7" stroke="#c96442" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 16v-4h4v4" stroke="#c96442" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              { title: "Rules Engine",  body: "Define eligibility for groups, ministries, and leadership. Rules are auto-enforced. Pastors can override with a documented reason.",                  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10h10M10 5l5 5-5 5" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="14" height="14" rx="3" stroke="#c96442" strokeWidth="1.5"/></svg> },
            ].map(c => (
              <div key={c.title} className="lp-op-card" style={{ background: "#faf9f5", border: "1px solid #f0eee6", borderRadius: 16, padding: "24px 20px", boxShadow: "rgba(0,0,0,.04) 0 4px 16px" }}>
                <div style={{ width: 40, height: 40, background: "#fdf0ea", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{c.icon}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 500, color: "#141413", marginBottom: 8 }}>{c.title}</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "#5e5d59", fontFamily: "'DM Sans',sans-serif", margin: 0 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES (DARK) ── */}
      <section className="lp-roles-section" style={{ ...S.dark, padding: "100px 40px" }}>
        <div className="lp-roles-inner" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="lp-roles-h2" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 500, lineHeight: 1.15, color: "#faf9f5", maxWidth: 600, marginBottom: 56, textWrap: "pretty" }}>
            Everyone sees exactly what matters to them. Nothing more.
          </h2>
          {ROLES.map((r, i) => (
            <div key={r.label} className="lp-role-strip" style={{ display: "flex", alignItems: "center", gap: 24, padding: "24px 0", borderBottom: "1px solid #30302e", borderTop: i === 0 ? "1px solid #30302e" : "none" }}>
              <div style={{ width: 44, height: 44, background: "#30302e", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 500, color: "#faf9f5", marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontSize: 14, color: "#87867f", lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>{r.desc}</div>
              </div>
              <button onClick={onSignIn} style={{ marginLeft: "auto", color: "#d97757", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                See the {r.label.replace("The ", "")} view →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── MEMBER PORTAL ── */}
      <section className="lp-portal-section" style={{ ...S.parchment, padding: "100px 40px" }}>
        <div style={{ ...S.twoCol, maxWidth: 1000 }}>
          <div className="lp-portal-left">
            <span style={S.eyebrow}>Member portal</span>
            <h2 style={S.featureH2}>Your members stay connected — without an app.</h2>
            <p style={S.featureBody}>Members can track their Growth Path, RSVP to events, and message leaders from any phone. No app store. No downloads. It installs like an app and feels like one.</p>
            <ul style={S.checkList}>
              {["Installs like an app (PWA) — no download required", "Journey tracker with stage-by-stage progression", "Event RSVP from any phone", "Direct messaging to pastor, leader, or mentor", "Self-service profile updates", "Serving team check-in"].map(t => (
                <li key={t} style={S.checkItem}><DotIcon /> {t}</li>
              ))}
            </ul>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-steps-section" id="how-it-works" style={{ ...S.ivory, padding: "100px 40px", borderTop: "1px solid #f0eee6" }}>
        <div style={S.container}>
          <div className="lp-steps-heading" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
            <span style={S.eyebrow}>Getting started</span>
            <h2 style={S.sectionH2}>Set up in minutes. Start seeing clarity immediately.</h2>
          </div>
          <div className="lp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, maxWidth: 900, margin: "0 auto", position: "relative" }}>
            {[
              { n: "01", title: "Import your members.",     body: "Drop your Excel file. ChurchOS auto-detects Name, Email, Phone, and Address. Import 1,000 members in two clicks." },
              { n: "02", title: "Define your Growth Path.", body: "Use the 4-stage starter or build your own. Edit stages, tasks, and requirements in minutes — no technical help needed." },
              { n: "03", title: "Invite your people.",      body: "Bulk-send login credentials by WhatsApp or email. Members set their own passwords at first login." },
            ].map((s, i) => (
              <div key={s.n} style={{ textAlign: "center", padding: "0 32px", position: "relative" }}>
                {i < 2 && <div style={{ position: "absolute", top: 38, right: -8, width: 16, height: 1, background: "#d97757" }} />}
                <div className="lp-step-num" style={{ fontFamily: "'Playfair Display',serif", fontSize: 64, fontWeight: 500, color: "#c96442", lineHeight: 1, marginBottom: 16 }}>{s.n}</div>
                <div className="lp-step-content">
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 500, color: "#141413", marginBottom: 10 }}>{s.title}</div>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: "#5e5d59", fontFamily: "'DM Sans',sans-serif", margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-pricing-section" id="pricing" style={{ ...S.ivory, padding: "100px 40px", borderTop: "1px solid #f0eee6" }}>
        <div style={S.container}>
          <div className="lp-pricing-heading" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
            <span style={S.eyebrow}>Pricing</span>
            <h2 style={S.sectionH2}>Simple pricing. No surprises.</h2>
          </div>
          <div className="lp-pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 1000, margin: "0 auto" }}>
            {PRICING.map(p => (
              <div key={p.tier} className="lp-pricing-card" style={{ background: p.popular ? "#fff" : "#f5f4ed", border: p.popular ? "2px solid #c96442" : "1px solid #e8e6dc", borderRadius: 16, padding: "32px 28px", position: "relative", display: "flex", flexDirection: "column" }}>
                {p.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#c96442", color: "#faf9f5", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 99, whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" }}>Most popular</div>}
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: p.popular ? "#c96442" : "#87867f", marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>{p.tier}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, fontWeight: 500, color: "#141413", lineHeight: 1, marginBottom: 4 }}>{p.price}</div>
                <div style={{ fontSize: 14, color: "#87867f", fontFamily: "'DM Sans',sans-serif" }}>{p.period}</div>
                <div style={{ fontSize: 13, color: "#87867f", marginBottom: 24, marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>{p.sub}</div>
                <div style={{ height: 1, background: "#e8e6dc", margin: "0 0 20px" }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#5e5d59", fontFamily: "'DM Sans',sans-serif" }}>
                      <PricingCheck popular={p.popular} />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={onSignIn} style={{ ...(p.popular ? S.btnPrimary : S.btnSecondary), width: "100%", justifyContent: "center" }}>Start free trial</button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 14, color: "#87867f", marginTop: 24, maxWidth: 600, margin: "24px auto 0", fontFamily: "'DM Sans',sans-serif" }}>All plans include unlimited admins, unlimited groups, and the full member portal. Free for 30 days.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq-section" style={{ ...S.parchment, padding: "100px 40px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="lp-faq-heading" style={{ marginBottom: 48 }}>
            <span style={S.eyebrow}>FAQ</span>
            <h2 style={S.sectionH2}>Questions, answered clearly.</h2>
          </div>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── CLOSING CTA (DARK) ── */}
      <section className="lp-final-cta" style={{ ...S.dark, padding: "100px 40px", textAlign: "center" }}>
        <h2 className="lp-final-h2" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(32px,4.5vw,56px)", fontWeight: 500, lineHeight: 1.10, color: "#faf9f5", marginBottom: 16, textWrap: "pretty" }}>
          Start leading your church<br />with clarity.
        </h2>
        <p className="lp-final-sub" style={{ fontSize: 18, color: "#b0aea5", marginBottom: 36, fontFamily: "'DM Sans',sans-serif" }}>See where your people are. Help them move forward.</p>
        <button className="lp-final-btn" onClick={onSignIn} style={{ ...S.btnPrimary, padding: "15px 36px", fontSize: 17, borderRadius: 14 }}>Start your free trial</button>
        <p className="lp-final-note" style={{ marginTop: 20, fontSize: 14, color: "#5e5d59", fontFamily: "'DM Sans',sans-serif" }}>30 days free · No credit card · Cancel anytime</p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer" style={{ ...S.parchment, padding: "72px 40px 40px", borderTop: "1px solid #e8e6dc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 48, marginBottom: 56 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 500, color: "#141413", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
              <ChurchIcon size={18} /> ChurchOS
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: "#87867f", maxWidth: 220, fontFamily: "'DM Sans',sans-serif", margin: 0 }}>The operating system for growing churches. One place to shepherd every soul.</p>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
            { title: "For you", links: ["Pastors", "Admins", "Group Leaders", "Members"] },
            { title: "Company", links: ["About", "Blog", "Contact", "Privacy", "Terms"] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#87867f", marginBottom: 16, fontFamily: "'DM Sans',sans-serif" }}>{col.title}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <li key={l}><a href="#" style={{ fontSize: 14, color: "#5e5d59", textDecoration: "none", fontFamily: "'DM Sans',sans-serif" }}
                    onMouseEnter={e => e.target.style.color = "#141413"}
                    onMouseLeave={e => e.target.style.color = "#5e5d59"}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", borderTop: "1px solid #e8e6dc", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#87867f", fontFamily: "'DM Sans',sans-serif" }}>© 2026 ChurchOS. Built with care in Johannesburg.</span>
          <span style={{ fontSize: 13, color: "#b0aea5", fontFamily: "'DM Sans',sans-serif" }}>Free for 30 days · No credit card required</span>
        </div>
      </footer>

    </div>
  );
}

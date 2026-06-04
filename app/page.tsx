"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import "./page.css";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Provider {
  id: string;
  name: string;
  abbr: string;
  textColor?: string;
  color: string;
  gradient: string;
  rate: number;
  fee: number;
  time: string;
  badge?: string;
  badgeType?: "best" | "fast" | "cheap";
  rating: number;
  reviews: string;
  error?: string;
  amountReceived?: number;
  status?: "success" | "estimated" | "error";
  url?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const PROVIDERS: Provider[] = [
  {
    id: "wise",
    name: "Wise",
    abbr: "W",
    color: "#00B9FF",
    gradient: "linear-gradient(135deg,#00B9FF,#0099dd)",
    rate: 83.47,
    fee: 0,
    time: "Instant",
    badge: "Best Value",
    badgeType: "best",
    rating: 4.8,
    reviews: "2.1M",
    url: "https://wise.com/",
  },
  {
    id: "remitly",
    name: "Remitly",
    abbr: "R",
    color: "#FF6B35",
    gradient: "linear-gradient(135deg,#FF6B35,#e5501a)",
    rate: 83.12,
    fee: 2.99,
    time: "3 min",
    badge: "Most Used",
    badgeType: "fast",
    rating: 4.5,
    reviews: "890K",
    url: "https://www.remitly.com/",
  },
  {
    id: "paysend",
    name: "PaySend",
    abbr: "P",
    color: "#7C3AED",
    gradient: "linear-gradient(135deg,#7C3AED,#6025c9)",
    rate: 83.05,
    fee: 1.99,
    time: "5 min",
    badge: "Low Fee",
    badgeType: "cheap",
    rating: 4.3,
    reviews: "340K",
    url: "https://paysend.com/",
  },
  {
    id: "wu",
    name: "Western Union",
    abbr: "WU",
    textColor: "#000",
    color: "#FFCC00",
    gradient: "linear-gradient(135deg,#FFCC00,#e5b800)",
    rate: 82.10,
    fee: 4.99,
    time: "10 min",
    rating: 3.9,
    reviews: "5.2M",
    url: "https://www.westernunion.com/",
  },
  {
    id: "xoom",
    name: "Xoom",
    abbr: "X",
    color: "#0070E0",
    gradient: "linear-gradient(135deg,#0070E0,#005ab8)",
    rate: 82.55,
    fee: 3.49,
    time: "1 hour",
    rating: 4.1,
    reviews: "1.2M",
    url: "https://www.xoom.com/",
  },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", flag: "🇺🇸", label: "US Dollar" },
  { code: "AED", symbol: "د.إ", flag: "🇦🇪", label: "UAE Dirham" },
  { code: "SAR", symbol: "ر.س", flag: "🇸🇦", label: "Saudi Riyal" },
  { code: "QAR", symbol: "ر.ق", flag: "🇶🇦", label: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", flag: "🇰🇼", label: "Kuwaiti Dinar" },
  { code: "OMR", symbol: "ر.ع", flag: "🇴🇲", label: "Omani Rial" },
  { code: "GBP", symbol: "£", flag: "🇬🇧", label: "British Pound" },
  { code: "CAD", symbol: "CA$", flag: "🇨🇦", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺", label: "Australian Dollar" },
];

const USD_RATES: Record<string, number> = {
  USD: 1,
  AED: 0.272,
  SAR: 0.267,
  QAR: 0.275,
  KWD: 3.25,
  OMR: 2.60,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.66,
};

// ─── Utility ─────────────────────────────────────────────────────────────────
function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
function formatCompactINR(n: number) {
  if (n >= 1000000) return "₹" + (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
function formatCurrency(amountVal: number | string, curCode: string) {
  const numericAmount = typeof amountVal === "string" ? parseFloat(amountVal || "0") : amountVal;
  return curCode + " " + numericAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="10" height="10" viewBox="0 0 10 10">
          <path
            d="M5 1l1.2 2.6H9L7 5.4l.8 2.6L5 6.4 2.2 8l.8-2.6L1 3.6h2.8z"
            fill={s <= Math.round(rating) ? "#FBBF24" : "#e5e7eb"}
          />
        </svg>
      ))}
    </span>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState("AED");
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [savingsMonths, setSavingsMonths] = useState(12);
  const [animatedSavings, setAnimatedSavings] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const [routeIndex, setRouteIndex] = useState(0);
  const routes = [
    { title: "UAE ➔ India", rate: "₹22.74", time: "(Refreshed)" },
    { title: "USA ➔ India", rate: "₹83.47", time: "(Live)" },
    { title: "UK ➔ India", rate: "₹105.82", time: "(Live)" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRouteIndex((prev) => (prev + 1) % routes.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const [alertForm, setAlertForm] = useState({ name: "", email: "", phone: "+971 ", country: "UAE", currency: "AED" });
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const COUNTRY_DATA: Record<string, { phoneCode: string; currency: string }> = {
    "UAE": { phoneCode: "+971", currency: "AED" },
    "Saudi Arabia": { phoneCode: "+966", currency: "SAR" },
    "Qatar": { phoneCode: "+974", currency: "QAR" },
    "Kuwait": { phoneCode: "+965", currency: "KWD" },
    "Oman": { phoneCode: "+968", currency: "OMR" },
    "United Kingdom": { phoneCode: "+44", currency: "GBP" },
    "United States": { phoneCode: "+1", currency: "USD" },
    "Canada": { phoneCode: "+1", currency: "CAD" },
    "Australia": { phoneCode: "+61", currency: "AUD" }
  };

  const handleCountryChange = (newCountry: string) => {
    const data = COUNTRY_DATA[newCountry];
    let newPhone = alertForm.phone;
    let newCurrency = alertForm.currency;

    if (data) {
      newCurrency = data.currency;
      
      const currentPrefixMatch = alertForm.phone.match(/^\+\d+/);
      if (currentPrefixMatch) {
        const currentPrefix = currentPrefixMatch[0];
        const restOfPhone = alertForm.phone.slice(currentPrefix.length).trim();
        newPhone = `${data.phoneCode} ${restOfPhone}`.trim();
      } else {
        newPhone = `${data.phoneCode} ${alertForm.phone}`.trim();
      }
    }

    setAlertForm({
      ...alertForm,
      country: newCountry,
      currency: newCurrency,
      phone: newPhone
    });
  };

  useEffect(() => {
    async function detectCountry() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      try {
        const res = await fetch("/api/location", { 
          signal: controller.signal,
          headers: { "Accept": "application/json" }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[Geolocation] Gracefully skipping detection. API returned status: ${res.status}. (Possible causes: 429 Rate Limit, 403 Forbidden, 500 Server Error)`);
          }
          setAlertForm(prev => ({ ...prev, country: "UAE", currency: "AED", phone: "+971 " }));
          return;
        }

        const data = await res.json();
        if (!data || data.error || !data.country_name) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[Geolocation] Gracefully skipping detection. Invalid payload: ${data?.error || "Unknown"}`);
          }
          setAlertForm(prev => ({ ...prev, country: "UAE", currency: "AED", phone: "+971 " }));
          return;
        }

        let countryKey = "";
        if (data.country_name === "United Arab Emirates") countryKey = "UAE";
        else if (data.country_name === "Saudi Arabia") countryKey = "Saudi Arabia";
        else if (data.country_name === "Qatar") countryKey = "Qatar";
        else if (data.country_name === "Kuwait") countryKey = "Kuwait";
        else if (data.country_name === "Oman") countryKey = "Oman";
        else if (data.country_name === "India") countryKey = "United States"; // Default mapping if in India
        else if (data.country_name === "United Kingdom") countryKey = "United Kingdom";
        else if (data.country_name === "United States") countryKey = "United States";
        else if (data.country_name === "Canada") countryKey = "Canada";
        else if (data.country_name === "Australia") countryKey = "Australia";

        if (countryKey && COUNTRY_DATA[countryKey]) {
          const countryInfo = COUNTRY_DATA[countryKey];
          setAlertForm(prev => ({
            ...prev,
            country: countryKey,
            currency: countryInfo.currency,
            phone: countryInfo.phoneCode + " "
          }));
        }
      } catch (e) {
        clearTimeout(timeoutId);
        if (process.env.NODE_ENV === "development") {
          console.warn("[Geolocation] Network error or timeout. Gracefully falling back to UAE default.", e);
        }
        // Robust fallback to defaults on any failure
        setAlertForm(prev => ({
          ...prev,
          country: "UAE",
          currency: "AED",
          phone: "+971 "
        }));
      }
    }
    detectCountry();
  }, []);

  const [usdRates, setUsdRates] = useState<Record<string, number>>({
    USD: 1,
    AED: 0.272,
    SAR: 0.267,
    QAR: 0.275,
    KWD: 3.25,
    OMR: 2.60,
    GBP: 1.27,
    CAD: 0.73,
    AUD: 0.66,
  });

  const [providers, setProviders] = useState<Provider[]>([
    {
      id: "wise",
      name: "Wise",
      abbr: "W",
      color: "#00B9FF",
      gradient: "linear-gradient(135deg,#00B9FF,#0099dd)",
      rate: 83.47,
      fee: 0,
      time: "Instant",
      badge: "Best Value",
      badgeType: "best",
      rating: 4.8,
      reviews: "2.1M",
    },
    {
      id: "remitly",
      name: "Remitly",
      abbr: "R",
      color: "#FF6B35",
      gradient: "linear-gradient(135deg,#FF6B35,#e5501a)",
      rate: 83.12,
      fee: 2.99,
      time: "3 min",
      badge: "Most Used",
      badgeType: "fast",
      rating: 4.5,
      reviews: "890K",
    },
    {
      id: "paysend",
      name: "PaySend",
      abbr: "P",
      color: "#7C3AED",
      gradient: "linear-gradient(135deg,#7C3AED,#6025c9)",
      rate: 83.05,
      fee: 1.99,
      time: "5 min",
      badge: "Low Fee",
      badgeType: "cheap",
      rating: 4.3,
      reviews: "340K",
    },
    {
      id: "wu",
      name: "Western Union",
      abbr: "WU",
      textColor: "#000",
      color: "#FFCC00",
      gradient: "linear-gradient(135deg,#FFCC00,#e5b800)",
      rate: 82.10,
      fee: 4.99,
      time: "10 min",
      rating: 3.9,
      reviews: "5.2M",
    },
    {
      id: "xoom",
      name: "Xoom",
      abbr: "X",
      color: "#0070E0",
      gradient: "linear-gradient(135deg,#0070E0,#005ab8)",
      rate: 82.55,
      fee: 3.49,
      time: "1 hour",
      rating: 4.1,
      reviews: "1.2M",
    },
  ]);

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch("/api/live-rates");
        if (res.ok) {
          const data = await res.json();
          if (data.usdRates) {
            setUsdRates(data.usdRates);
          }
          
          if (data.providers) {
            setProviders(prev => prev.map(p => {
              const live = data.providers[p.id];
              
              if (live && (live.status === "success" || live.status === "estimated")) {
                return {
                  ...p,
                  rate: parseFloat(live.rate.toFixed(2)),
                  fee: live.fee,
                  time: live.speed || p.time,
                  amountReceived: live.amountReceived,
                  status: live.status,
                  error: undefined // ensure error is cleared
                };
              } else if (live && live.status === "error") {
                return { ...p, error: live.message };
              }
              return p;
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load live exchange rates:", err);
      }
    }
    loadRates();
  }, []);

  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!alertForm.name.trim() || !alertForm.email.trim() || !alertForm.phone.trim() || !alertForm.country.trim()) {
      setSubmitError("Please fill out all required fields.");
      return;
    }

    if (!alertForm.email.includes("@") || !alertForm.email.includes(".")) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('Waitlist')
        .insert([
          { 
            full_name: alertForm.name, 
            email: alertForm.email, 
            whatsapp: alertForm.phone, 
            country: alertForm.country, 
            currency: alertForm.currency 
          }
        ]);

      if (error) {
        console.error("Supabase insert error:", error);
        setSubmitError(`Supabase Error: ${error.message || JSON.stringify(error)}`);
      } else {
        setAlertSubmitted(true);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setSubmitError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cur = CURRENCIES.find((c) => c.code === currency)!;
  const usdAmount = parseFloat(amount || "0") * (usdRates[currency] || 0);
  const bestRate = Math.max(...providers.map((p) => p.rate));
  const worstRate = Math.min(...providers.map((p) => p.rate));

  function inrReceived(p: Provider) {
    if (p.error) return 0;
    const net = usdAmount - p.fee;
    return Math.max(0, net * p.rate);
  }

  const sorted = [...providers].sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    return inrReceived(b) - inrReceived(a);
  });
  
  // Best/worst are calculated from valid providers only
  const validProviders = sorted.filter(p => !p.error);
  const best = validProviders[0] || providers[0];
  const worst = validProviders[validProviders.length - 1] || providers[0];
  const annualSaving = (inrReceived(best) - inrReceived(worst)) * 12;
  const totalSavings = (inrReceived(best) - inrReceived(worst)) * savingsMonths;

  useEffect(() => {
    let animationFrameId: number;
    const start = animatedSavings;
    const end = totalSavings;
    const duration = 250; // 250ms transition
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // easeOutQuad
      const currentVal = start + (end - start) * ease;
      
      setAnimatedSavings(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [totalSavings]);

  const filtered =
    activeTab === "all"
      ? sorted
      : activeTab === "fast"
      ? sorted.filter((p) => ["Instant", "3 min", "5 min"].includes(p.time))
      : sorted.filter((p) => p.fee < 2);

  return (
    <>
      

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="#" className="logo">
            <img src={scrolled ? "/logo-light.svg" : "/logo-dark.svg"} alt="Remivo" style={{ height: 28, width: "auto" }} />
          </a>

          <div className="nav-links">
            {["Compare", "How it works", "Savings"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="nav-link">
                {item}
              </a>
            ))}
          </div>

          <div className="nav-desktop-actions">
            <Link href="/login" className="btn btn-ghost">Log in</Link>
            <button className="btn btn-primary" onClick={() => document.getElementById("compare")?.scrollIntoView({ behavior: "smooth" })}>Get started →</button>
          </div>

          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="hbar"
                style={{
                  transform:
                    menuOpen && i === 0 ? "translateY(7px) rotate(45deg)" :
                    menuOpen && i === 2 ? "translateY(-7px) rotate(-45deg)" :
                    menuOpen && i === 1 ? "scaleX(0)" : "none",
                }}
              />
            ))}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          {["Compare", "How it works", "Savings"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <Link href="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Log in</Link>
          <div style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column" }}>
            <button className="btn btn-primary btn-xl" style={{ justifyContent: "center", width: "100%", padding: "1.25rem", fontSize: "1.125rem", borderRadius: "16px" }} onClick={() => { setMenuOpen(false); document.getElementById("compare")?.scrollIntoView({ behavior: "smooth" }); }}>Get started</button>
          </div>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="hero" ref={heroRef}>
        <div className="hero-grid-bg" />
        <div className="hero-orb hero-orb-1" />

        <div className="hero-container">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Independent Comparison · Live Rates · Global to India
            </div>

            <h1 className="hero-h1">
              Find the best exchange rates<br />
              <em>to India. Instantly.</em>
            </h1>

            <p className="hero-sub">
              Compare Wise, Remitly, Western Union, Xoom and more in one place. See live rates, uncover hidden fees and send more money home.
            </p>

            <div className="hero-ctas">
              <a href="#compare" className="btn btn-primary btn-xl">
                Compare Rates →
              </a>
              <a href="#savings" className="btn btn-outline btn-xl">
                View Savings
              </a>
            </div>

            <div className="hero-stats">
              {[
                { val: "100%", lbl: "Independent" },
                { val: "12+", lbl: "Providers compared" },
                { val: "60s", lbl: "Rate refresh" },
                { val: "Free", lbl: "To use forever" },
              ].map((s) => (
                <div className="hero-stat" key={s.lbl}>
                  <span className="hero-stat-val">{s.val}</span>
                  <span className="hero-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-graphic-wrap" style={{ position: "relative" }}>
            <div style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              background: "rgba(11,15,25,0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "1rem 1.25rem",
              backdropFilter: "blur(12px)",
              zIndex: 30,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              pointerEvents: "none",
              animation: "fadeUp 0.8s 0.3s ease both"
            }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#818cf8", letterSpacing: "0.05em", textTransform: "uppercase" }}>Live Transfer Route</span>
              <span key={routes[routeIndex].title + "title"} style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", animation: "fadeUp 0.3s ease" }}>{routes[routeIndex].title}</span>
              <span key={routes[routeIndex].title + "rate"} style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--green)", animation: "fadeUp 0.3s ease" }}>Live Rate: {routes[routeIndex].rate} <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{routes[routeIndex].time}</span></span>
            </div>

            <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 460, height: "auto", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "1.5rem", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="50%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#10b981"/>
                </linearGradient>
              </defs>

              <circle cx="250" cy="220" r="180" fill="url(#glow)"/>

              <g>
                <circle cx="280" cy="240" r="14" fill="#10b981" fillOpacity="0.2"/>
                <circle cx="280" cy="240" r="7" fill="#10b981"/>
                <text x="280" y="266" fill="#10b981" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily="'Cabinet Grotesk', sans-serif">INDIA</text>
              </g>

              <g>
                <circle cx="80" cy="100" r="5" fill="rgba(255,255,255,0.7)"/>
                <text x="80" y="88" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">USA</text>
              </g>
              <g>
                <circle cx="200" cy="80" r="5" fill="rgba(255,255,255,0.7)"/>
                <text x="200" y="68" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">UK</text>
              </g>
              <g>
                <circle cx="150" cy="190" r="5" fill="rgba(255,255,255,0.7)"/>
                <text x="150" y="178" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">UAE</text>
              </g>
              <g>
                <circle cx="380" cy="320" r="5" fill="rgba(255,255,255,0.7)"/>
                <text x="380" y="308" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">AUS</text>
              </g>
              <g>
                <circle cx="60" cy="160" r="5" fill="rgba(255,255,255,0.7)"/>
                <text x="60" y="148" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">CAN</text>
              </g>

              <path d="M 80 100 Q 180 120 280 240" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none"/>
              <path d="M 80 100 Q 180 120 280 240" stroke="url(#flow-grad)" strokeWidth="2.5" fill="none" strokeDasharray="30, 150" className="pulse-path"/>

              <path d="M 200 80 Q 230 150 280 240" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none"/>
              <path d="M 200 80 Q 230 150 280 240" stroke="url(#flow-grad)" strokeWidth="2.5" fill="none" strokeDasharray="30, 150" className="pulse-path" style={{ animationDelay: "-1s" }}/>

              <path d="M 150 190 Q 210 200 280 240" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none"/>
              <path d="M 150 190 Q 210 200 280 240" stroke="url(#flow-grad)" strokeWidth="2.5" fill="none" strokeDasharray="20, 100" className="pulse-path" style={{ animationDelay: "-2s" }}/>

              <path d="M 380 320 Q 340 270 280 240" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none"/>
              <path d="M 380 320 Q 340 270 280 240" stroke="url(#flow-grad)" strokeWidth="2.5" fill="none" strokeDasharray="25, 120" className="pulse-path" style={{ animationDelay: "-3s" }}/>

              <path d="M 60 160 Q 150 220 280 240" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none"/>
              <path d="M 60 160 Q 150 220 280 240" stroke="url(#flow-grad)" strokeWidth="2.5" fill="none" strokeDasharray="30, 150" className="pulse-path" style={{ animationDelay: "-1.5s" }}/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── TRUST ROW ─────────────────────────────────────────────────── */}
      <section style={{ background: "#F8FAFC", borderTop: "1px solid rgba(0,0,0,0.05)", borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "2rem 0", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Comparing Live Rates From</span>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "3rem", alignItems: "center", opacity: 0.5, filter: "grayscale(100%)" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "sans-serif", letterSpacing: "-0.02em" }}>Wise</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "serif", fontStyle: "italic", letterSpacing: "-0.02em" }}>Remitly</span>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "-0.02em" }}>Western Union</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "sans-serif", letterSpacing: "0.05em" }}>XOOM</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "sans-serif" }}>PaySend</span>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────────── */}
      <section className="section" style={{ background: "#fff", borderTop: "1px solid var(--border)", paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="section-inner">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 className="section-h2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}>
              Why Indians Abroad Compare Before They Transfer
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", maxWidth: "960px", margin: "0 auto" }}>
            {[
              {
                title: "Hidden fees can cost thousands every year",
                desc: "Many providers advertise zero fees but bury their profit margin in a poor exchange rate.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              },
              {
                title: "Exchange rate differences matter more than most people think",
                desc: "A fraction of a rupee difference on a regular monthly transfer compounds into significant lost savings over time.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              },
              {
                title: "Comparing providers takes less than 30 seconds",
                desc: "Enter your amount once. See real-time rates across all major providers instantly without creating an account.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              }
            ].map((card, i) => (
              <div key={i} style={{ padding: "1.5rem", borderRadius: "16px", background: "var(--surface)", border: "1px solid var(--border2)" }}>
                <div style={{ color: "var(--muted)", marginBottom: "1rem" }}>{card.icon}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--ink)", lineHeight: 1.4 }}>{card.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ──────────────────────────────────────────────────── */}
      <section id="compare" className="section compare-section">
        <div className="section-inner">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-label">Live Comparison</span>
            <h2 className="section-h2">
              Who sends the <em>most</em> to India?
            </h2>
            <p className="section-desc" style={{ margin: "0.75rem auto 0" }}>
              Enter your amount and currency. We show real-time rates, hidden
              fees, and exactly what your family receives.
            </p>
          </div>

          <div className="compare-widget">
            {/* Top bar: inputs */}
            <div className="compare-top">
              <div className="input-group">
                <label className="input-label">You send</label>
                <div className="amount-wrap">
                  <span className="amount-symbol">{cur.symbol}</span>
                  <input
                    className="amount-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="input-group" style={{ flex: "0 0 auto" }}>
                <label className="input-label">From currency</label>
                <div style={{ position: "relative" }}>
                  <button
                    className="currency-btn"
                    onClick={() => setShowCurrencyDrop((x) => !x)}
                  >
                    <span style={{ fontSize: "1.2rem" }}>{cur.flag}</span>
                    <span>{cur.code}</span>
                    <span style={{ marginLeft: "auto", color: "var(--muted2)", fontSize: "0.75rem" }}>▾</span>
                  </button>
                  {showCurrencyDrop && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowCurrencyDrop(false)} aria-hidden="true" />
                      <div className="currency-drop" role="listbox">
                        {CURRENCIES.map((c) => (
                          <div
                            key={c.code}
                            role="option"
                            aria-selected={c.code === currency}
                            className={`currency-opt${c.code === currency ? " active" : ""}`}
                            onClick={() => { setCurrency(c.code); setShowCurrencyDrop(false); }}
                          >
                            <span style={{ fontSize: "1.1rem" }}>{c.flag}</span>
                            <span style={{ fontWeight: 600 }}>{c.code}</span>
                            <span style={{ color: "var(--muted2)", marginLeft: "auto" }}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="input-group" style={{ flex: "0 0 auto" }}>
                <label className="input-label">They receive</label>
                <div style={{
                  background: "rgba(18,183,106,0.06)", border: "1.5px solid rgba(18,183,106,0.2)",
                  borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem",
                  fontWeight: 800, fontSize: "1rem", color: "var(--green-dark)",
                  whiteSpace: "nowrap",
                }}>
                  {formatINR(inrReceived(best))}
                  <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--muted2)", marginLeft: 4 }}>INR</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="compare-tabs">
              {[
                { key: "all", label: "All providers" },
                { key: "fast", label: "⚡ Fastest" },
                { key: "cheap", label: "💸 Cheapest fee" },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`tab-btn${activeTab === t.key ? " active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Providers */}
            <div className="providers-list">
              {filtered.map((p, i) => {
                const inr = inrReceived(p);
                const saving = inr - inrReceived(worst);
                const isBest = p.id === best.id;
                return (
                  <div
                    key={p.id}
                    className={`provider-row${isBest ? " best" : ""}`}
                  >
                    {p.badge && (
                      <span className={`p-badge badge-${p.badgeType}`}>{p.badge}</span>
                    )}
                    <div className="p-logo" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {p.id === "wise" && <img src="/providers/media__1780553564969.png" alt="Wise" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                      {p.id === "remitly" && <img src="/providers/media__1780553564980.png" alt="Remitly" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                      {p.id === "paysend" && <img src="/providers/media__1780553564986.png" alt="PaySend" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                      {p.id === "wu" && <img src="/providers/media__1780553564995.png" alt="Western Union" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                      {p.id === "xoom" && <img src="/providers/media__1780553631034.png" alt="Xoom" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                      {!["wise", "remitly", "paysend", "wu", "xoom"].includes(p.id) && <span style={{ color: "var(--ink)" }}>{p.abbr}</span>}
                    </div>

                    <div className="p-name-block">
                      <div className="p-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {p.name}
                        {p.status === "success" && (
                          <span style={{ fontSize: "0.6rem", background: "rgba(18,183,106,0.15)", color: "#12B76A", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, letterSpacing: "0.5px" }}>LIVE</span>
                        )}
                        {p.status === "estimated" && (
                          <span style={{ fontSize: "0.6rem", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, letterSpacing: "0.5px" }}>ESTIMATED</span>
                        )}
                      </div>
                      <div className="p-meta" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Stars rating={p.rating} />
                        <span>{p.rating} · {p.reviews} reviews</span>
                        <span>· {p.time}</span>
                        {p.fee === 0 ? (
                          <span style={{ color: "var(--green-dark)", fontWeight: 700 }}>No fee</span>
                        ) : (
                          <span>· {formatCurrency(p.fee / (usdRates[currency] || 1), currency)} fee</span>
                        )}
                      </div>
                    </div>

                    <div className="p-rate-block">
                      <div className="p-rate">₹{(p.rate * (usdRates[currency] || 0)).toFixed(2)}/{currency}</div>
                      <div className="p-rate-sub">exchange rate</div>
                    </div>

                    <div className="p-inr">
                      <div className="p-inr-val">{formatINR(inr)}</div>
                      <div className="p-inr-sub" style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
                        {saving > 0 && (
                          <span className="saving-tag">+{formatINR(saving)}</span>
                        )}
                        {i === filtered.length - 1 && <span style={{ fontSize: "0.7rem", color: "var(--muted2)" }}>worst</span>}
                      </div>
                    </div>

                    <div className="p-cta" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      <a 
                        href={p.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn ${p.status === "success" ? "btn-primary" : "btn-outline"}`}
                        style={{ padding: "0.55rem 1rem", fontSize: "0.8rem", whiteSpace: "nowrap", textDecoration: "none", textAlign: "center" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`[Analytics] Outbound click to ${p.id}`);
                        }}
                      >
                        {p.status === "success" ? "Transfer Now" : "Check Provider"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="compare-footer" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--muted2)" }}>
                  <span className="live-dot" />
                  Rates updated live · Indicative only
                </span>
                <button className="btn btn-primary" style={{ padding: "0.55rem 1.25rem", fontSize: "0.82rem" }} onClick={() => document.getElementById("rate-alerts")?.scrollIntoView({ behavior: "smooth" })}>
                  Set rate alert →
                </button>
              </div>
              
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ fontSize: "0.85rem" }}>ℹ️</span>
                <span>
                  <strong>LIVE</strong> = Real provider quote. <strong>ESTIMATED</strong> = Calculated using current market conditions.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAVINGS CALCULATOR ──────────────────────────────────────────── */}
      <section id="savings" className="section savings-section">
        <div className="section-inner">
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "3.5rem", alignItems: "center" }}>
            <div>
              <span className="section-label">Savings Calculator</span>
              <h2 className="section-h2" style={{ marginTop: "0.5rem" }}>
                Understand the true<br /><em>cost of transfers</em>
              </h2>
              <p className="section-desc">
                Choosing a provider with suboptimal rates for regular transfers compounds over time. Compare to see the potential savings.
              </p>
              <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "Compare real rates, not marketing rates",
                  "Hidden fees exposed instantly",
                  "Free to use — forever",
                  "Trusted by thousands of Indians abroad",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", color: "var(--muted)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(18,183,106,0.15)", border: "1px solid rgba(18,183,106,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="savings-card">
              <div className="savings-orb savings-orb-1" />
              <div className="savings-orb savings-orb-2" />
              <div style={{ position: "relative" }}>
                {/* ── PRIMARY: Savings Value ── */}
                <div style={{ marginBottom: "2.5rem" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                    Estimated Savings
                  </p>
                  <div className="savings-big" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {formatCompactINR(Math.round(animatedSavings / 100) * 100)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.6rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "100px", color: "#4ade80", fontSize: "0.75rem", fontWeight: 600 }}>
                      Exact: {formatINR(Math.round(animatedSavings / 100) * 100)}
                    </span>
                  </div>
                </div>

                {/* ── SECONDARY: Duration & Slider ── */}
                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>Duration</div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                        {(() => {
                          if (savingsMonths === 1) return "1 month";
                          if (savingsMonths < 12) return `${savingsMonths} months`;
                          if (savingsMonths === 12) return "1 year";
                          if (savingsMonths === 18) return "18 months";
                          if (savingsMonths % 12 === 0) return `${savingsMonths / 12} years`;
                          if (savingsMonths > 12) return `${(savingsMonths / 12).toFixed(1).replace(/\.0$/, "")} years`;
                          return `${savingsMonths} months`;
                        })()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>Sending</div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>{formatCurrency(amount, currency)}<span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontWeight: 500 }}>/mo</span></div>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={savingsMonths}
                    onChange={(e) => setSavingsMonths(Number(e.target.value))}
                    className="savings-slider"
                    style={{
                      background: `linear-gradient(to right, #4ade80 0%, #4ade80 ${((savingsMonths - 1) / 59) * 100}%, rgba(255,255,255,0.1) ${((savingsMonths - 1) / 59) * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </div>

                {/* ── TERTIARY: Supporting Metrics ── */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>Best provider</span>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{best.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>Monthly savings</span>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{formatINR(Math.round((inrReceived(best) - inrReceived(worst)) / 100) * 100)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>Annual savings</span>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{formatINR(Math.round(((inrReceived(best) - inrReceived(worst)) * 12) / 100) * 100)}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section" style={{ background: "#fff" }}>
        <div className="section-inner">
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <span className="section-label">How it works</span>
            <h2 className="section-h2" style={{ marginTop: "0.5rem" }}>
              How Remivo <em>works</em>
            </h2>
            <p className="section-desc" style={{ margin: "0.75rem auto 0" }}>
              No accounts required. We provide clear data to help you make an informed decision.
            </p>
          </div>

          <div className="steps-grid">
            {[
              {
                n: "01",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="5" width="16" height="12" rx="2" stroke="var(--primary)" strokeWidth="1.7" />
                    <path d="M7 9h8M7 13h5" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                ),
                title: "Enter your transfer details",
                desc: "Tell us how much you want to send and which currency. We support all major currencies — USD, GBP, AED, SAR, QAR, and more.",
              },
              {
                n: "02",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11h14M11 4l7 7-7 7" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: "Compare all providers instantly",
                desc: "See every provider's real rate, all fees, and exact INR your family receives — ranked from best to worst.",
              },
              {
                n: "03",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M5 11l5 5 7-9" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: "Transfer with confidence",
                desc: "Click through to your chosen provider and send. Set a rate alert so you never miss a great rate again.",
              },
            ].map((step) => (
              <div key={step.n} className="step-card">
                <div className="step-num">{step.n}</div>
                <div className="step-icon">{step.icon}</div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ───────────────────────────────────────────────────────── */}
      <section id="trust" className="section trust-section">
        <div className="section-inner">
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <span className="section-label">Why Remivo</span>
            <h2 className="section-h2" style={{ marginTop: "0.5rem" }}>
              Designed for <em>global reliability</em>
            </h2>
          </div>

          <div className="trust-grid">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3L4 6v5c0 4 3.1 7.7 7 8.9 3.9-1.2 7-4.9 7-8.9V6L11 3z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                ),
                title: "Total Transparency",
                desc: "We show you the real rate AND the fee. No asterisks. No fine print. What you see is exactly what your family gets.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="1.8" />
                    <path d="M11 8v3.5l2.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ),
                title: "Real-Time Rates",
                desc: "Live data refreshed every 60 seconds from all major providers. You always see today's actual rate.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11h3l2-5 3 10 2-5h4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: "No Hidden Agenda",
                desc: "We don't take commissions for pushing you toward specific providers. We just show the data.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3C7 3 4 6 4 10c0 3 1.7 5.6 4.3 6.8L11 19l2.7-2.2C16.3 15.6 18 13 18 10c0-4-3-7-7-7z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                ),
                title: "Built for Indians Worldwide",
                desc: "Compare rates from UAE, Saudi, Qatar, US, UK, and beyond. We cover the providers you actually use.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="5" y="8" width="12" height="10" rx="1.5" stroke="white" strokeWidth="1.8" />
                    <path d="M8 8V6a3 3 0 016 0v2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ),
                title: "Secure Comparisons",
                desc: "We never ask for your bank details, passport, or KYC. Compare freely, privately, securely.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ),
                title: "Always Free",
                desc: "No subscription. No account needed. Compare all you want, save thousands. That's the promise.",
              },
            ].map((t) => (
              <div key={t.title} className="trust-card">
                <div className="trust-icon">{t.icon}</div>
                <div className="trust-title">{t.title}</div>
                <div className="trust-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORTED COUNTRIES ─────────────────────────────────────────── */}
      <section className="section" style={{ background: "#fff", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "4rem 1.5rem" }}>
        <div className="section-inner">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 className="section-h2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}>
              Built for Indians Abroad Worldwide
            </h2>
            <p className="section-desc" style={{ margin: "0.75rem auto 0" }}>
              We track exchange rates across major global corridors.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", maxWidth: 960, margin: "0 auto" }}>
            {[
              { flag: "🇦🇪", name: "UAE" },
              { flag: "🇸🇦", name: "Saudi Arabia" },
              { flag: "🇶🇦", name: "Qatar" },
              { flag: "🇰🇼", name: "Kuwait" },
              { flag: "🇴🇲", name: "Oman" },
              { flag: "🇬🇧", name: "United Kingdom" },
              { flag: "🇺🇸", name: "United States" },
              { flag: "🇨🇦", name: "Canada" },
              { flag: "🇦🇺", name: "Australia" },
            ].map((c) => (
              <div 
                key={c.name} 
                style={{ 
                  display: "flex", alignItems: "center", gap: "16px", 
                  background: "#fff", border: "1px solid var(--border2)", 
                  padding: "1.25rem 1.5rem", borderRadius: "16px", 
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                  cursor: "default"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(79,70,229,0.08)";
                  e.currentTarget.style.borderColor = "rgba(79,70,229,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
                  e.currentTarget.style.borderColor = "var(--border2)";
                }}
              >
                <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "1.6rem" }}>
                  {c.flag}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem", lineHeight: 1.2 }}>{c.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2, fontWeight: 500 }}>To India (INR)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RATE ALERTS WAITLIST ────────────────────────────────────────── */}
      <section id="rate-alerts" className="section alert-section">
        <div className="section-inner">
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto", marginBottom: "2.5rem" }}>
            <span className="section-label">Rate Alerts</span>
            <h2 className="section-h2" style={{ marginTop: "0.5rem" }}>
              Stay informed on <em>rate movements</em>
            </h2>
            <p className="section-desc" style={{ margin: "0.75rem auto 0" }}>
              Sign up for rate alerts. We track the market and notify you when the exchange rate reaches your preferred threshold.
            </p>
          </div>

          <div className="alert-card">
            {alertSubmitted ? (
              <div className="alert-success">
                <div className="alert-success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#12B76A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>You're on the list.</h3>
                <p style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: 1.6 }}>
                  We'll notify you when better rates become available.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAlertSubmit}>
                {submitError && (
                  <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "12px", fontSize: "0.875rem", fontWeight: 600, marginBottom: "1.25rem", border: "1px solid #fecaca" }}>
                    {submitError}
                  </div>
                )}
                <div className="alert-input-group">
                  <label className="alert-label">Full Name</label>
                  <input required type="text" className="alert-input" placeholder="John Paul" value={alertForm.name} onChange={(e) => setAlertForm({...alertForm, name: e.target.value})} />
                </div>
                
                <div className="alert-row">
                  <div className="alert-input-group">
                    <label className="alert-label">Email Address</label>
                    <input required type="email" className="alert-input" placeholder="john.paul@example.com" value={alertForm.email} onChange={(e) => setAlertForm({...alertForm, email: e.target.value})} />
                  </div>
                  <div className="alert-input-group">
                    <label className="alert-label">WhatsApp Number</label>
                    <input required type="tel" className="alert-input" placeholder="Enter your WhatsApp number" value={alertForm.phone} onChange={(e) => setAlertForm({...alertForm, phone: e.target.value})} />
                  </div>
                </div>

                <div className="alert-row">
                  <div className="alert-input-group">
                    <label className="alert-label">Country of Residence</label>
                    <select 
                      required 
                      className="alert-input" 
                      value={Object.keys(COUNTRY_DATA).includes(alertForm.country) ? alertForm.country : (alertForm.country === "" ? "" : "Other")} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Other") {
                          setAlertForm({...alertForm, country: ""});
                        } else {
                          handleCountryChange(val);
                        }
                      }}
                    >
                      <option value="">Select country...</option>
                      {Object.keys(COUNTRY_DATA).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Other">Other...</option>
                    </select>
                  </div>
                  {(!Object.keys(COUNTRY_DATA).includes(alertForm.country) || alertForm.country === "") && (
                    <div className="alert-input-group">
                      <label className="alert-label">Manual Country</label>
                      <input 
                        required 
                        type="text" 
                        className="alert-input" 
                        placeholder="e.g. Germany" 
                        value={alertForm.country} 
                        onChange={(e) => setAlertForm({...alertForm, country: e.target.value})} 
                      />
                    </div>
                  )}
                  <div className="alert-input-group">
                    <label className="alert-label">Sending Currency</label>
                    <select className="alert-input" value={alertForm.currency} onChange={(e) => setAlertForm({...alertForm, currency: e.target.value})}>
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.label}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" className="alert-submit" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
                  {isSubmitting ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining waitlist...
                    </span>
                  ) : "Notify Me When Rates Improve"}
                </button>

                <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.75rem", color: "var(--muted2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  We never spam. We only send important rate updates.
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="cta-card">
          <div className="cta-orb cta-orb-1" />
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 100, padding: "0.3rem 0.9rem",
              fontSize: "0.72rem", fontWeight: 700, color: "#4ade80",
              letterSpacing: "0.1em", textTransform: "uppercase",
              marginBottom: "1.25rem", position: "relative",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Free · No Sign-up · Instant
          </div>
          <h2 className="cta-h2">
            Compare rates.<br />
            <em>Transfer confidently.</em>
          </h2>
          <p className="cta-sub">
            Join thousands of overseas Indians who compare before they transfer.
            Review providers across global corridors and see exactly what your recipient gets.
          </p>
          <div className="cta-btns">
            <button className="btn-cta" onClick={() => document.getElementById("compare")?.scrollIntoView({ behavior: "smooth" })}>Compare rates now →</button>
            <button className="btn-cta-ghost" onClick={() => document.getElementById("rate-alerts")?.scrollIntoView({ behavior: "smooth" })}>Set a rate alert</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-col-main">
              <div className="footer-logo">
                <img src="/logo-dark.svg" alt="Remivo" style={{ height: 28, width: "auto", marginBottom: 4 }} />
              </div>
              <p className="footer-desc" style={{ maxWidth: 280, color: "#94a3b8", fontSize: "0.85rem" }}>
                Compare transfer providers and exchange rates before sending money to India.
              </p>
            </div>

            <div className="footer-col-links">
              <div className="footer-heading">Product</div>
              <div className="footer-links">
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Compare Rates</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Savings Calculator</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Rate Alerts</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Provider Reviews</a>
              </div>
            </div>

            <div className="footer-col-links">
              <div className="footer-heading">Company</div>
              <div className="footer-links">
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">About</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Blog</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Careers</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Contact</a>
              </div>
            </div>

            <div className="footer-col-links">
              <div className="footer-heading">Legal</div>
              <div className="footer-links">
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Privacy Policy</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Terms</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Disclaimer</a>
                <a href="#" onClick={(e) => e.preventDefault()} className="footer-link">Cookie Policy</a>
              </div>
            </div>

            <div className="footer-col-corridors">
              <div className="footer-heading">Global Corridors</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  { f: "🇦🇪", n: "UAE" }, { f: "🇸🇦", n: "Saudi Arabia" },
                  { f: "🇬🇧", n: "United Kingdom" }, { f: "🇺🇸", n: "United States" },
                  { f: "🇨🇦", n: "Canada" }, { f: "🇦🇺", n: "Australia" }
                ].map(c => (
                  <div key={c.n} className="footer-country-card">
                    <span style={{ fontSize: "1.1rem" }}>{c.f}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#cbd5e1" }}>{c.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-divider" />

          <div className="footer-row-3">
            <div className="footer-copyright">
              <div>© 2026 Remivo</div>
              <div style={{ color: "#64748b", marginTop: 4 }}>Independent comparison platform.</div>
            </div>
            
            <div className="footer-providers-list">
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 8 }}>Supported Providers</div>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <span className="footer-provider-wordmark">Wise</span>
                <span className="footer-provider-wordmark">Remitly</span>
                <span className="footer-provider-wordmark">Xoom</span>
                <span className="footer-provider-wordmark">PaySend</span>
                <span className="footer-provider-wordmark">Western Union</span>
              </div>
            </div>

            <div className="footer-status">
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                Updated every 15 minutes
              </div>
              <div style={{ color: "#64748b", marginTop: 4 }}>Live + Estimated provider data</div>
            </div>
          </div>

          <details className="footer-disclaimer-details">
            <summary className="footer-disclaimer-summary">Legal Disclaimer & Disclosures</summary>
            <div className="footer-disclaimer-content">
              Remivo is an independent comparison platform and is not a financial institution, bank, or remittance service provider. We do not process transactions or handle funds. Exchange rates, transfer fees, and delivery times are provided for informational purposes only. "Live" data is fetched directly from provider public APIs where possible, while "Estimated" data relies on mid-market rates and known fee structures. Always verify the final amount and terms directly with your chosen provider before completing a transfer.
            </div>
          </details>
        </div>
      </footer>
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

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
    "India": { phoneCode: "+91", currency: "USD" },
    "UK": { phoneCode: "+44", currency: "GBP" },
    "USA": { phoneCode: "+1", currency: "USD" },
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
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          let countryKey = "";
          if (data.country_name === "United Arab Emirates") countryKey = "UAE";
          else if (data.country_name === "Saudi Arabia") countryKey = "Saudi Arabia";
          else if (data.country_name === "Qatar") countryKey = "Qatar";
          else if (data.country_name === "Kuwait") countryKey = "Kuwait";
          else if (data.country_name === "Oman") countryKey = "Oman";
          else if (data.country_name === "India") countryKey = "India";
          else if (data.country_name === "United Kingdom") countryKey = "UK";
          else if (data.country_name === "United States") countryKey = "USA";
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
        }
      } catch (e) {
        console.error("Geocoding failed, keeping defaults:", e);
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
        const res = await fetch("/api/rates");
        if (res.ok) {
          const data = await res.json();
          if (data.USD_RATES) {
            setUsdRates(data.USD_RATES);
          }
          if (data.USD_to_INR) {
            const baseInr = data.USD_to_INR;
            setProviders(prev => prev.map(p => {
              let factor = 1.0;
              if (p.id === "wise") factor = 1.00;
              else if (p.id === "remitly") factor = 0.9958;
              else if (p.id === "paysend") factor = 0.9950;
              else if (p.id === "wu") factor = 0.9836;
              else if (p.id === "xoom") factor = 0.9890;
              
              return {
                ...p,
                rate: parseFloat((baseInr * factor).toFixed(2))
              };
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
    const net = usdAmount - p.fee;
    return Math.max(0, net * p.rate);
  }

  const sorted = [...providers].sort((a, b) => inrReceived(b) - inrReceived(a));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
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

  // ── Styles ──────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: #4f46e5;
      --primary-dark: #3730a3;
      --primary-glow: rgba(79,70,229,0.15);
      --primary-light: #e0e7ff;
      --green: #10b981;
      --green-dark: #065f46;
      --green-glow: rgba(16,185,129,0.15);
      --green-light: #d1fae5;
      --ink: #0b0f19;
      --ink2: #1e293b;
      --muted: #475569;
      --muted2: #94a3b8;
      --surface: #f8fafc;
      --glass: rgba(255,255,255,0.76);
      --border: rgba(79,70,229,0.08);
      --border2: rgba(0,0,0,0.06);
      --shadow: 0 4px 32px rgba(0,0,0,0.03);
      --shadow-lg: 0 16px 64px rgba(0,0,0,0.06);
      --radius: 20px;
      --radius-sm: 12px;
    }

    html { scroll-behavior: smooth; }
    body {
      font-family: 'Cabinet Grotesk', 'Helvetica Neue', sans-serif;
      background: #f8fafc;
      color: var(--ink);
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Nav ── */
    .nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      transition: background 0.3s, box-shadow 0.3s, backdrop-filter 0.3s;
    }
    .nav.scrolled {
      background: rgba(248,250,252,0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 1px 0 rgba(0,0,0,0.05);
    }
    .nav-inner {
      max-width: 1180px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 68px; padding: 0 1.5rem;
    }
    .logo {
      font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800;
      font-size: 1.35rem; color: var(--ink); letter-spacing: -0.02em;
      text-decoration: none; display: flex; align-items: center; gap: 8px;
    }
    .logo-mark {
      width: 34px; height: 34px; border-radius: 10px;
      background: linear-gradient(135deg,#4f46e5,#6366f1);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px var(--primary-glow);
    }
    .nav-links { display: flex; gap: 2rem; }
    .nav-link {
      font-size: 0.875rem; font-weight: 500; color: var(--muted);
      text-decoration: none; transition: color 0.2s;
    }
    .nav-link:hover { color: var(--ink); }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 6px; border: none; border-radius: 100px;
      font-family: inherit; font-weight: 700; cursor: pointer;
      transition: all 0.2s; text-decoration: none; white-space: nowrap;
    }
    .btn-ghost {
      background: transparent; color: var(--muted);
      padding: 0.5rem 1.1rem; font-size: 0.875rem;
    }
    .btn-ghost:hover { color: var(--ink); background: rgba(0,0,0,0.04); }
    .btn-primary {
      background: linear-gradient(135deg,#4f46e5,#4338ca);
      color: #fff; padding: 0.6rem 1.4rem; font-size: 0.875rem;
      box-shadow: 0 4px 16px var(--primary-glow);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 28px var(--primary-glow);
    }
    .btn-primary:active { transform: translateY(0); }
    .btn-xl {
      padding: 0.9rem 2.2rem; font-size: 1rem;
      box-shadow: 0 6px 24px var(--primary-glow);
    }
    .btn-outline {
      background: transparent; color: var(--ink);
      border: 1.5px solid var(--border2);
      padding: 0.9rem 2.2rem; font-size: 1rem;
    }
    .btn-outline:hover {
      border-color: var(--primary); color: var(--primary);
      background: rgba(79,70,229,0.04);
    }
    .hamburger {
      display: none; flex-direction: column; gap: 5px;
      background: none; border: none; cursor: pointer; padding: 4px;
    }
    .hbar {
      display: block; width: 22px; height: 2px;
      background: var(--ink); border-radius: 2px; transition: 0.2s;
    }

    /* ── Hero ── */
    .hero {
      min-height: 100vh; padding: 140px 1.5rem 80px;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
      background:
        radial-gradient(ellipse 90% 60% at 50% -10%, rgba(79,70,229,0.08) 0%, transparent 70%),
        radial-gradient(ellipse 50% 40% at 80% 80%, rgba(59,130,246,0.05) 0%, transparent 60%),
        #0b0f19;
      color: #fff;
    }
    .hero-container {
      max-width: 1180px; margin: 0 auto; width: 100%;
      display: grid; grid-template-columns: 1.25fr 0.75fr;
      gap: 3.5rem; align-items: center; text-align: left;
      position: relative; z-index: 10;
    }
    @media (max-width: 968px) {
      .hero-container {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 2.5rem;
      }
    }
    .hero-grid-bg {
      position: absolute; inset: 0; pointer-events: none; overflow: hidden;
      opacity: 0.15;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 64px 64px;
      mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 80%);
    }
    .hero-orb {
      position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px);
    }
    .hero-orb-1 {
      width: 500px; height: 500px; top: -200px; left: 50%; transform: translateX(-50%);
      background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%);
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 100px; padding: 0.35rem 1rem;
      font-size: 0.78rem; font-weight: 700; color: var(--muted2);
      letter-spacing: 0.06em; text-transform: uppercase;
      margin-bottom: 1.5rem;
      animation: fadeUp 0.5s ease both;
    }
    .hero-badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--primary); flex-shrink: 0;
      box-shadow: 0 0 6px var(--primary);
      animation: pulse 2s ease infinite;
    }
    @keyframes pulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.85); }
    }
    .hero-h1 {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: clamp(2.6rem, 5.5vw, 4.2rem);
      line-height: 1.1; letter-spacing: -0.03em;
      color: #fff; font-weight: 800;
      margin-bottom: 1.25rem;
      animation: fadeUp 0.55s 0.05s ease both;
    }
    .hero-h1 em { font-style: normal; color: #818cf8; }
    .hero-sub {
      font-size: clamp(0.95rem, 1.8vw, 1.1rem);
      color: var(--muted2); max-width: 540px;
      margin-bottom: 2.25rem; line-height: 1.6;
      font-weight: 500;
      animation: fadeUp 0.55s 0.1s ease both;
    }
    @media (max-width: 968px) {
      .hero-sub { margin-left: auto; margin-right: auto; }
      .hero-ctas { justify-content: center; }
      .hero-stats { justify-content: center; }
    }
    .hero-ctas {
      display: flex; gap: 0.875rem; justify-content: flex-start; flex-wrap: wrap;
      margin-bottom: 3rem;
      animation: fadeUp 0.55s 0.15s ease both;
    }
    .hero-ctas .btn-outline {
      color: #fff; border-color: rgba(255,255,255,0.15);
    }
    .hero-ctas .btn-outline:hover {
      background: rgba(255,255,255,0.05); border-color: #fff;
    }
    .hero-stats {
      display: flex; gap: 2.25rem; justify-content: flex-start; flex-wrap: wrap;
      animation: fadeUp 0.55s 0.2s ease both;
    }
    .hero-stat { text-align: left; }
    .hero-stat-val {
      font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800;
      font-size: 1.6rem; color: #fff; display: block; line-height: 1;
    }
    .hero-stat-lbl { font-size: 0.78rem; color: var(--muted2); margin-top: 3px; }

    .hero-graphic-wrap {
      display: flex; align-items: center; justify-content: center; width: 100%;
      animation: fadeUp 0.7s 0.15s ease both;
    }
    .pulse-path {
      animation: pulsePath 4s linear infinite;
    }
    @keyframes pulsePath {
      to { stroke-dashoffset: -180; }
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Section shared ── */
    .section { padding: 6rem 1.5rem; }
    .section-inner { max-width: 1180px; margin: 0 auto; }
    .section-label {
      display: inline-block; font-size: 0.72rem; font-weight: 800;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--primary); margin-bottom: 0.75rem;
    }
    .section-h2 {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: clamp(1.9rem, 4vw, 2.75rem);
      font-weight: 800; letter-spacing: -0.03em;
      line-height: 1.15; color: var(--ink);
    }
    .section-h2 em { font-style: normal; color: var(--primary); }
    .section-desc {
      color: var(--muted); font-size: 1rem; line-height: 1.7;
      max-width: 520px; margin-top: 0.75rem;
    }

    /* ── Comparison ── */
    .compare-section {
      background:
        radial-gradient(ellipse 70% 50% at 50% 100%, rgba(79,70,229,0.03) 0%, transparent 70%),
        #fff;
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    }
    .compare-widget {
      background: #fff; border-radius: 28px; overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 24px 80px rgba(0,0,0,0.09);
      border: 1px solid rgba(0,0,0,0.06);
    }
    .compare-top {
      padding: 1.75rem 2rem;
      background: linear-gradient(135deg, rgba(79,70,229,0.03) 0%, #f8fafc 100%);
      border-bottom: 1px solid var(--border);
      display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;
    }
    .input-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }
    .input-label { font-size: 0.72rem; font-weight: 700; color: var(--muted); letter-spacing: 0.07em; text-transform: uppercase; }
    .amount-wrap { position: relative; display: flex; align-items: center; }
    .amount-symbol {
      position: absolute; left: 14px; font-weight: 700; font-size: 1rem; color: var(--muted);
      pointer-events: none;
    }
    .amount-input {
      width: 100%; background: #fff; border: 1.5px solid rgba(0,0,0,0.1);
      border-radius: var(--radius-sm); padding: 0.75rem 1rem 0.75rem 2.25rem;
      font-size: 1.1rem; font-weight: 700; font-family: inherit; color: var(--ink);
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .amount-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .currency-btn {
      background: #fff; border: 1.5px solid rgba(0,0,0,0.1);
      border-radius: var(--radius-sm); padding: 0.75rem 1rem;
      font-size: 0.9rem; font-weight: 700; font-family: inherit; color: var(--ink);
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      white-space: nowrap; transition: border-color 0.2s; position: relative;
      min-width: 160px;
    }
    .currency-btn:hover { border-color: var(--primary); }
    .currency-drop {
      position: absolute; top: calc(100% + 6px); left: 0; right: 0;
      background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.12); z-index: 50; 
      max-height: 250px; overflow-y: auto;
    }
    .currency-opt {
      display: flex; align-items: center; gap: 10px;
      padding: 0.7rem 1rem; cursor: pointer; font-size: 0.875rem; font-weight: 500;
      transition: background 0.15s;
    }
    .currency-opt:hover { background: var(--surface); }
    .currency-opt.active { background: rgba(79,70,229,0.08); color: var(--primary); }
    .compare-tabs {
      display: flex; gap: 4px;
      padding: 1rem 2rem 0;
    }
    .tab-btn {
      background: none; border: none; font-family: inherit;
      font-size: 0.82rem; font-weight: 600; color: var(--muted2);
      padding: 0.45rem 1rem; border-radius: 100px; cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: rgba(79,70,229,0.1); color: var(--primary);
    }
    .tab-btn:hover:not(.active) { background: var(--surface); color: var(--muted); }
    .providers-list { padding: 0.75rem 2rem 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .provider-row {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      align-items: center; gap: 1.25rem;
      background: #fff; border: 1.5px solid var(--border2);
      border-radius: 16px; padding: 1rem 1.25rem;
      cursor: pointer; transition: all 0.2s; position: relative;
    }
    .provider-row:hover {
      border-color: rgba(79,70,229,0.3);
      box-shadow: 0 4px 24px rgba(79,70,229,0.06);
      transform: translateY(-2px);
    }
    .provider-row.best {
      border-color: rgba(16,185,129,0.3);
      background: linear-gradient(135deg, rgba(16,185,129,0.02) 0%, #fff 100%);
      box-shadow: 0 4px 20px rgba(16,185,129,0.05);
    }
    .p-logo {
      width: 46px; height: 46px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; border: 1.5px solid rgba(0,0,0,0.08);
      background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .p-name { font-weight: 700; font-size: 0.95rem; line-height: 1.2; }
    .p-meta { font-size: 0.75rem; color: var(--muted2); margin-top: 2px; }
    .p-rate-block { text-align: right; }
    .p-rate { font-weight: 800; font-size: 0.9rem; color: var(--ink); }
    .p-rate-sub { font-size: 0.71rem; color: var(--muted2); margin-top: 1px; }
    .p-inr { text-align: right; }
    .p-inr-val {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: 1.25rem; font-weight: 700; color: var(--ink);
    }
    .p-inr-sub { font-size: 0.71rem; color: var(--muted2); margin-top: 1px; }
    .p-badge {
      position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
      font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
      padding: 0.2rem 0.7rem; border-radius: 100px; white-space: nowrap;
    }
    .badge-best { background: #10b981; color: #fff; }
    .badge-fast { background: #4f46e5; color: #fff; }
    .badge-cheap { background: #7C3AED; color: #fff; }
    .saving-tag {
      font-size: 0.7rem; font-weight: 700; color: var(--green-dark);
      background: rgba(16,185,129,0.1); border-radius: 100px;
      padding: 0.18rem 0.55rem; white-space: nowrap;
    }
    .compare-footer {
      border-top: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
      background: #f8fafc;
    }
    .live-dot {
      width: 7px; height: 7px; border-radius: 50%; background: var(--green);
      display: inline-block; margin-right: 6px;
      box-shadow: 0 0 6px var(--green);
      animation: pulse 2s ease infinite;
    }

    /* ── Savings ── */
    .savings-section { background: var(--surface); }
    .savings-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 28px; padding: 3.5rem;
      position: relative; overflow: hidden;
      box-shadow: 0 24px 80px rgba(15,23,42,0.3);
    }
    .savings-orb {
      position: absolute; border-radius: 50%; pointer-events: none; filter: blur(60px);
    }
    .savings-orb-1 {
      width: 400px; height: 400px; top: -150px; right: -100px;
      background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
    }
    .savings-orb-2 {
      width: 300px; height: 300px; bottom: -100px; left: 50px;
      background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%);
    }
    .savings-big {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: clamp(3rem, 8vw, 5.5rem); color: #4ade80;
      font-weight: 800; line-height: 1; letter-spacing: -0.03em;
    }
    .savings-slider {
      -webkit-appearance: none; width: 100%; height: 6px;
      border-radius: 100px; background: rgba(255,255,255,0.15);
      outline: none; cursor: pointer; transition: background 0.2s ease;
    }
    .savings-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 24px; height: 24px;
      border-radius: 50%; background: #ffffff;
      cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 3px rgba(74,222,128,0.25);
      transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s ease;
    }
    .savings-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 5px rgba(74,222,128,0.4);
    }
    .savings-slider::-webkit-slider-thumb:active {
      transform: scale(0.95);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 6px rgba(74,222,128,0.55);
    }
    .savings-slider::-moz-range-thumb {
      width: 24px; height: 24px; border: none;
      border-radius: 50%; background: #ffffff;
      cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 3px rgba(74,222,128,0.25);
      transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s ease;
    }
    .savings-slider::-moz-range-thumb:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 5px rgba(74,222,128,0.4);
    }
    .savings-slider::-moz-range-thumb:active {
      transform: scale(0.95);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 6px rgba(74,222,128,0.55);
    }

    /* ── How it works ── */
    .steps-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem; margin-top: 3rem;
    }
    .step-card {
      background: #fff; border-radius: var(--radius);
      padding: 2rem; border: 1px solid var(--border2);
      box-shadow: var(--shadow);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .step-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .step-num {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: 2.5rem; color: var(--primary-light); line-height: 1;
      font-weight: 800;
    }
    .step-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, rgba(79,70,229,0.08), rgba(99,102,241,0.03));
      border: 1px solid rgba(79,70,229,0.15);
      display: flex; align-items: center; justify-content: center;
      margin: 0.75rem 0 1rem;
    }
    .step-title { font-weight: 700; font-size: 1.05rem; margin-bottom: 0.4rem; }
    .step-desc { font-size: 0.875rem; color: var(--muted); line-height: 1.6; }

    /* ── Trust ── */
    .trust-section {
      background:
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(79,70,229,0.03) 0%, transparent 60%),
        #fff;
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    }
    .trust-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem; margin-top: 3rem;
    }
    .trust-card {
      background: var(--surface); border-radius: var(--radius);
      padding: 1.75rem; border: 1px solid var(--border);
      text-align: center;
      transition: transform 0.2s, background 0.2s;
    }
    .trust-card:hover { transform: translateY(-3px); background: #fff; border-color: rgba(79,70,229,0.2); }
    .trust-icon {
      width: 52px; height: 52px; border-radius: 16px;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
      box-shadow: 0 4px 16px var(--primary-glow);
    }
    .trust-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.35rem; }
    .trust-desc { font-size: 0.8rem; color: var(--muted); line-height: 1.6; }

    /* ── Rate Alert Form ── */
    .alert-section {
      background: #f8fafc;
    }
    .alert-card {
      max-width: 600px; margin: 0 auto;
      background: #fff; border: 1px solid var(--border2);
      border-radius: 24px; padding: 3rem 2.5rem;
      box-shadow: var(--shadow); position: relative; overflow: hidden;
    }
    .alert-input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.25rem; }
    .alert-label { font-size: 0.8rem; font-weight: 700; color: var(--muted); }
    .alert-input {
      width: 100%; background: #fff; border: 1.5px solid rgba(0,0,0,0.08);
      border-radius: var(--radius-sm); padding: 0.8rem 1rem;
      font-size: 1rem; font-family: inherit; color: var(--ink);
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .alert-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
    .alert-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .alert-submit {
      width: 100%; background: linear-gradient(135deg,#4f46e5,#4338ca);
      color: #fff; padding: 1rem; font-size: 1rem; font-weight: 800;
      border: none; border-radius: var(--radius-sm); font-family: inherit;
      cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 16px var(--primary-glow);
      margin-top: 0.5rem;
    }
    .alert-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 24px var(--primary-glow); }
    .alert-success {
      text-align: center; padding: 3rem 1rem;
    }
    .alert-success-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(16,185,129,0.1); color: var(--green);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
    }
    @media (max-width: 600px) {
      .alert-card { padding: 2rem 1.5rem; }
      .alert-row { grid-template-columns: 1fr; gap: 0; }
    }

    /* ── CTA Banner ── */
    .cta-banner {
      padding: 6rem 1.5rem;
      background:
        radial-gradient(ellipse 60% 70% at 50% 50%, rgba(79,70,229,0.06) 0%, transparent 70%),
        var(--surface);
    }
    .cta-card {
      max-width: 800px; margin: 0 auto;
      background: linear-gradient(135deg, #0b0f19 0%, #1e1b4b 60%, #4f46e5 200%);
      border-radius: 32px; padding: 4rem 3rem;
      text-align: center; position: relative; overflow: hidden;
      box-shadow: 0 32px 100px rgba(11,15,25,0.4);
    }
    .cta-orb {
      position: absolute; border-radius: 50%; pointer-events: none;
    }
    .cta-orb-1 {
      width: 300px; height: 300px; top: -100px; right: -80px;
      background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
      filter: blur(50px);
    }
    .cta-h2 {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-size: clamp(1.8rem, 4vw, 2.75rem);
      color: #fff; font-weight: 800; letter-spacing: -0.03em;
      margin-bottom: 1rem; position: relative;
    }
    .cta-h2 em { color: #818cf8; font-style: normal; }
    .cta-sub { color: rgba(255,255,255,0.65); font-size: 1rem; line-height: 1.7; margin-bottom: 2.5rem; position: relative; }
    .cta-btns { display: flex; gap: 0.875rem; justify-content: center; flex-wrap: wrap; position: relative; }
    .btn-cta {
      background: #4f46e5; color: #fff;
      padding: 0.9rem 2.2rem; font-size: 1rem; font-weight: 800;
      border-radius: 100px; border: none; font-family: inherit; cursor: pointer;
      transition: all 0.2s; box-shadow: 0 6px 24px var(--primary-glow);
    }
    .btn-cta:hover {
      background: #6366f1; transform: translateY(-2px);
      box-shadow: 0 12px 36px var(--primary-glow);
    }
    .btn-cta-ghost {
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85);
      padding: 0.9rem 2.2rem; font-size: 1rem; font-weight: 600;
      border-radius: 100px; border: 1px solid rgba(255,255,255,0.15);
      font-family: inherit; cursor: pointer; transition: all 0.2s;
    }
    .btn-cta-ghost:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }

    /* ── Footer ── */
    footer {
      background: #090d16; padding: 4rem 1.5rem 2rem;
    }
    .footer-inner { max-width: 1180px; margin: 0 auto; }
    .footer-grid {
      display: grid; grid-template-columns: 2fr repeat(3, 1fr);
      gap: 3rem; margin-bottom: 3rem;
    }
    .footer-logo {
      font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800;
      font-size: 1.25rem; color: #fff; display: flex; align-items: center; gap: 8px;
      margin-bottom: 0.75rem; letter-spacing: -0.02em;
    }
    .footer-desc { font-size: 0.825rem; color: #64748b; line-height: 1.7; }
    .footer-heading {
      font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em;
      text-transform: uppercase; color: #94a3b8; margin-bottom: 1.1rem;
    }
    .footer-links { display: flex; flex-direction: column; gap: 0.6rem; }
    .footer-link {
      font-size: 0.825rem; color: #64748b; text-decoration: none; transition: color 0.2s;
    }
    .footer-link:hover { color: #fff; }
    .footer-bottom {
      border-top: 1px solid #1e293b;
      padding-top: 1.75rem;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
    }
    .footer-copy { font-size: 0.78rem; color: #64748b; }
    .footer-flags { display: flex; gap: 0.5rem; align-items: center; }
    .flag-chip {
      font-size: 0.72rem; color: #94a3b8; background: #1e293b;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 100px;
      padding: 0.2rem 0.65rem; display: flex; align-items: center; gap: 4px;
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 768px) {
      .nav-links, .nav-desktop-actions { display: none; }
      .hamburger { display: flex; }
      .provider-row {
        grid-template-columns: auto 1fr;
        grid-template-areas:
          "logo name"
          "rate inr";
        gap: 1rem;
      }
      .p-logo { grid-area: logo; }
      .p-name-block { grid-area: name; }
      .p-rate-block { grid-area: rate; text-align: left; display: flex; flex-direction: column; justify-content: center; }
      .p-inr { grid-area: inr; text-align: right; }
      .savings-card { padding: 2rem; }
      .footer-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
    }
    @media (max-width: 520px) {
      .hero { padding: 100px 1.25rem 60px; }
      .hero-stats { gap: 1.25rem; }
      .compare-top { padding: 1.25rem; flex-direction: column; align-items: stretch; }
      .input-group { min-width: 100%; }
      .providers-list { padding: 0.5rem 1.25rem 1.25rem; }
      .cta-card { padding: 2.5rem 1.5rem; }
      .footer-grid { grid-template-columns: 1fr; gap: 1.75rem; }
      .savings-card { padding: 1.5rem; }
    }
    .mobile-menu {
      position: fixed; inset: 0; z-index: 190;
      background: rgba(244,247,244,0.97);
      backdrop-filter: blur(20px);
      display: flex; flex-direction: column;
      padding: 90px 2rem 2rem;
      gap: 0.5rem;
    }
    .mobile-nav-link {
      font-size: 1.25rem; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700;
      color: var(--ink); text-decoration: none; padding: 0.75rem 0;
      border-bottom: 1px solid var(--border2); display: block;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="#" className="logo">
            <img src={scrolled ? "/logo-dark.svg" : "/logo-light.svg"} alt="Remivo" style={{ height: 28, width: "auto" }} />
          </a>

          <div className="nav-links">
            {["Compare", "How it works", "Savings"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="nav-link">
                {item}
              </a>
            ))}
          </div>

          <div className="nav-desktop-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
          <div style={{ padding: "0 1rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
            <img src="/logo-dark.svg" alt="Remivo" style={{ height: 32, width: "auto" }} />
          </div>
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
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/login" className="btn btn-outline" style={{ justifyContent: "center" }} onClick={() => setMenuOpen(false)}>Log in</Link>
            <button className="btn btn-primary btn-xl" style={{ justifyContent: "center" }} onClick={() => { setMenuOpen(false); document.getElementById("compare")?.scrollIntoView({ behavior: "smooth" }); }}>Get started</button>
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
              Compare exchange rates<br />
              <em>to India. Independently.</em>
            </h1>

            <p className="hero-sub">
              We are not a provider. We are an independent platform helping you track real exchange rates, uncover hidden fees, and compare providers in real-time.
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
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>UAE ➔ India</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--green)" }}>Live Rate: ₹22.74 <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>(Refreshed)</span></span>
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

                    <div className="p-logo">
                      {p.id === "wise" && (
                        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}><path d="M5 10 L25 10 L29 20 L37 10 L45 10 L33 26 L42 40 L34 40 L27 28 L21 40 L13 40 L23 23 Z" fill="#00B9FF" /></svg>
                      )}
                      {p.id === "remitly" && (
                        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}><path d="M10 5 H30 C38 5 42 10 42 16 C42 22 38 27 30 27 H18 V45 H10 Z M18 13 V20 H30 C33 20 34 18 34 16 C34 14 33 13 30 13 Z" fill="#FF6B35" /></svg>
                      )}
                      {p.id === "paysend" && (
                        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}><circle cx="18" cy="25" r="12" fill="#7C3AED" fillOpacity="0.95" /><circle cx="32" cy="25" r="12" fill="#FFCC00" fillOpacity="0.85" /></svg>
                      )}
                      {p.id === "wu" && (
                        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}><rect x="5" y="5" width="40" height="40" rx="6" fill="#000" /><path d="M12 15 H18 L21 28 L24 15 H30 L25 35 H19 Z M31 15 H37 V28 C37 32 35 35 31 35 C28 35 26 32 26 28 V15 H31 Z" fill="#FFCC00" /></svg>
                      )}
                      {p.id === "xoom" && (
                        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}><path d="M10 10 L22 25 L10 40 H18 L25 30 L32 40 H40 L28 25 L40 10 H32 L25 20 L18 10 Z" fill="#0070E0" /></svg>
                      )}
                      {!["wise", "remitly", "paysend", "wu", "xoom"].includes(p.id) && <span style={{ color: "var(--ink)" }}>{p.abbr}</span>}
                    </div>

                    <div className="p-name-block">
                      <div className="p-name">{p.name}</div>
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
                  </div>
                );
              })}
            </div>

            <div className="compare-footer">
              <span style={{ fontSize: "0.78rem", color: "var(--muted2)" }}>
                <span className="live-dot" />
                Rates updated live · Indicative only
              </span>
              <button className="btn btn-primary" style={{ padding: "0.55rem 1.25rem", fontSize: "0.82rem" }} onClick={() => document.getElementById("rate-alerts")?.scrollIntoView({ behavior: "smooth" })}>
                Set rate alert →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAVINGS CALCULATOR ──────────────────────────────────────────── */}
      <section id="savings" className="section savings-section">
        <div className="section-inner">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
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
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Estimated Savings
                </p>
                <div className="savings-big">
                  {formatINR(Math.round(animatedSavings / 100) * 100)}
                </div>
                <p style={{ color: "#86efac", fontSize: "0.875rem", marginTop: "0.3rem" }}>
                  saved in total by switching providers
                </p>

                <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Duration</div>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.75rem", fontFamily: "'Cabinet Grotesk', sans-serif", lineHeight: 1.1 }}>
                        {(() => {
                          if (savingsMonths === 1) return "1 month";
                          if (savingsMonths < 12) return `${savingsMonths} months`;
                          if (savingsMonths === 12) return "1 year";
                          if (savingsMonths === 18) return "18 months";
                          if (savingsMonths % 12 === 0) {
                            const yrs = savingsMonths / 12;
                            return `${yrs} ${yrs === 1 ? "year" : "years"}`;
                          }
                          if (savingsMonths > 12) {
                            const yrs = (savingsMonths / 12).toFixed(1);
                            return `${yrs.endsWith('.0') ? yrs.slice(0, -2) : yrs} years`;
                          }
                          return `${savingsMonths} months`;
                        })()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Sending</div>
                      <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.95rem" }}>{formatCurrency(amount, currency)} / mo</div>
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
                      background: `linear-gradient(to right, #4ade80 0%, #4ade80 ${((savingsMonths - 1) / 59) * 100}%, rgba(255,255,255,0.15) ${((savingsMonths - 1) / 59) * 100}%, rgba(255,255,255,0.15) 100%)`
                    }}
                  />
                  
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: "0.75rem", textAlign: "center" }}>
                    Drag to estimate long-term savings
                  </p>
                </div>

                <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { label: "Monthly savings", val: formatINR(Math.round((inrReceived(best) - inrReceived(worst)) / 100) * 100) },
                    { label: "Annual savings", val: formatINR(Math.round(((inrReceived(best) - inrReceived(worst)) * 12) / 100) * 100) },
                    { 
                      label: `Total savings over ${(() => {
                        if (savingsMonths === 1) return "1 month";
                        if (savingsMonths < 12) return `${savingsMonths} months`;
                        if (savingsMonths === 12) return "1 year";
                        if (savingsMonths === 18) return "18 months";
                        if (savingsMonths % 12 === 0) return `${savingsMonths / 12} years`;
                        return `${savingsMonths} months`;
                      })()}`, 
                      val: formatINR(Math.round(totalSavings / 100) * 100), 
                      highlight: true 
                    },
                    { label: "Best provider", val: best.name },
                  ].map((stat) => (
                    <div 
                      key={stat.label} 
                      style={{ 
                        background: stat.highlight ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", 
                        border: stat.highlight ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 16, 
                        padding: "1rem",
                        gridColumn: stat.highlight ? "span 2" : "auto"
                      }}
                    >
                      <div style={{ fontSize: "0.72rem", color: stat.highlight ? "#86efac" : "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontWeight: 800, color: stat.highlight ? "#4ade80" : "#fff", fontSize: stat.highlight ? "1.4rem" : "1.05rem", fontFamily: "'Cabinet Grotesk', sans-serif" }}>{stat.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem" }}>
                  {[
                    { label: "Best provider rate", val: `₹${(bestRate * (usdRates[currency] || 0)).toFixed(2)}/${currency}` },
                    { label: "Worst provider rate", val: `₹${(worstRate * (usdRates[currency] || 0)).toFixed(2)}/${currency}` },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{stat.label}</div>
                      <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)", fontSize: "0.85rem" }}>{stat.val}</div>
                    </div>
                  ))}
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
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", maxWidth: 800, margin: "0 auto" }}>
            {[
              { flag: "🇦🇪", name: "UAE" },
              { flag: "🇸🇦", name: "Saudi Arabia" },
              { flag: "🇶🇦", name: "Qatar" },
              { flag: "🇰🇼", name: "Kuwait" },
              { flag: "🇴🇲", name: "Oman" },
              { flag: "🇬🇧", name: "UK" },
              { flag: "🇺🇸", name: "USA" },
              { flag: "🇨🇦", name: "Canada" },
              { flag: "🇦🇺", name: "Australia" },
            ].map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--surface)", border: "1px solid var(--border2)", padding: "0.75rem 1.25rem", borderRadius: "100px", fontSize: "0.95rem", fontWeight: 500, color: "var(--ink)" }}>
                <span style={{ fontSize: "1.2rem" }}>{c.flag}</span> {c.name}
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
            <div>
              <div className="footer-logo">
                <img src="/logo-light.svg" alt="Remivo" style={{ height: 32, width: "auto", marginBottom: 8 }} />
              </div>
              <p className="footer-desc">
                Remivo helps overseas Indians compare remittance
                providers instantly — so more money reaches home.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: "1.25rem" }}>
                {["🇦🇪", "🇸🇦", "🇶🇦", "🇰🇼", "🇴🇲"].map((flag) => (
                  <span key={flag} style={{ fontSize: "1.1rem" }}>{flag}</span>
                ))}
              </div>
            </div>

            {[
              {
                heading: "Product",
                links: ["Compare rates", "Rate alerts", "Savings calculator", "Provider reviews", "FX intelligence"],
              },
              {
                heading: "Company",
                links: ["About", "Blog", "Careers", "Press", "Contact"],
              },
              {
                heading: "Legal",
                links: ["Privacy policy", "Terms of service", "Disclaimer", "Cookie policy"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <div className="footer-heading">{col.heading}</div>
                <div className="footer-links">
                  {col.links.map((l) => (
                    <a key={l} href="#" onClick={(e) => e.preventDefault()} className="footer-link">{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="footer-bottom">
            <div style={{ fontSize: "0.75rem", color: "#536553", marginBottom: "1.5rem", maxWidth: "900px", lineHeight: 1.6 }}>
              <strong>Disclaimer:</strong> Remivo is an independent comparison platform. We do not provide money transfer services. Rates shown are indicative and may vary by provider. Always confirm the final rate and fees directly with the provider before initiating a transfer.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "1rem" }}>
              <span className="footer-copy">
                © 2024 Remivo. All rights reserved.
              </span>
              <div className="footer-flags">
                {[
                  { flag: "🇦🇪", code: "UAE" },
                  { flag: "🇸🇦", code: "KSA" },
                  { flag: "🇶🇦", code: "Qatar" },
                  { flag: "🇮🇳", code: "India" },
                ].map((f) => (
                  <span key={f.code} className="flag-chip">
                    {f.flag} {f.code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

import React from 'react';

/**
 * Academic Monograph Emblem / Logo
 */
export const MonographLogo: React.FC<{ className?: string; size?: number }> = ({
  className = "w-8 h-8",
  size = 32
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="PaperLens Monograph Emblem"
  >
    <rect width="40" height="40" rx="10" fill="#064E3B" />
    <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" stroke="#10B981" strokeOpacity="0.4" />
    
    {/* Open Manuscript Pages */}
    <path
      d="M10 28.5C13.5 27 17 27.5 20 29.5V13.5C17 11.5 13.5 11 10 12.5V28.5Z"
      fill="#D1FAE5"
      fillOpacity="0.25"
      stroke="#34D399"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M30 28.5C26.5 27 23 27.5 20 29.5V13.5C23 11.5 26.5 11 30 12.5V28.5Z"
      fill="#D1FAE5"
      fillOpacity="0.15"
      stroke="#34D399"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    
    {/* Page text lines */}
    <line x1="13" y1="17" x2="17.5" y2="16.5" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="13" y1="20.5" x2="17.5" y2="20" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="13" y1="24" x2="16.5" y2="23.5" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" />
    
    {/* Analytical Lens Arc */}
    <circle cx="23.5" cy="20.5" r="4.5" stroke="#F59E0B" strokeWidth="1.5" fill="#451A03" fillOpacity="0.4" />
    <line x1="26.8" y1="23.8" x2="29.5" y2="26.5" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * Editorial Research Synthesis Hero Graphic
 * Depicts multi-paper comparative analysis, connected evidence nodes, and citations.
 */
export const ResearchHeroIllustration: React.FC<{ className?: string }> = ({
  className = "w-full max-w-lg h-auto"
}) => (
  <svg
    viewBox="0 0 540 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Multi-Paper Research Analysis Illustration"
  >
    <defs>
      {/* Background radial glow */}
      <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
        <stop offset="65%" stopColor="#059669" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#0C1014" stopOpacity="0" />
      </radialGradient>

      {/* Foil manuscript gradient */}
      <linearGradient id="folioGradA" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1E252F" />
        <stop offset="100%" stopColor="#141920" />
      </linearGradient>
      <linearGradient id="folioGradB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#252F3C" />
        <stop offset="100%" stopColor="#192029" />
      </linearGradient>
      <linearGradient id="foilEdge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
      </linearGradient>
    </defs>

    {/* Soft ambient background glow */}
    <ellipse cx="270" cy="160" rx="220" ry="120" fill="url(#heroGlow)" />

    {/* Connecting Knowledge Network Rays */}
    <g strokeDasharray="3 3" opacity="0.4">
      <line x1="160" y1="120" x2="270" y2="80" stroke="#34D399" strokeWidth="1" />
      <line x1="270" y1="80" x2="380" y2="120" stroke="#34D399" strokeWidth="1" />
      <line x1="160" y1="120" x2="270" y2="210" stroke="#F59E0B" strokeWidth="1" />
      <line x1="380" y1="120" x2="270" y2="210" stroke="#F59E0B" strokeWidth="1" />
    </g>

    {/* Paper A (Left: Baseline / Empirical Study) */}
    <g transform="translate(60, 80)">
      <rect x="0" y="0" width="150" height="180" rx="8" fill="url(#folioGradA)" stroke="#323E4F" strokeWidth="1.2" />
      <rect x="0" y="0" width="150" height="6" rx="3" fill="url(#foilEdge)" />
      {/* Header pill */}
      <rect x="16" y="18" width="55" height="12" rx="3" fill="#064E3B" fillOpacity="0.7" stroke="#10B981" strokeWidth="0.8" />
      <text x="21" y="27" fill="#6EE7B7" fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="600">STUDY I</text>
      {/* Title lines */}
      <line x1="16" y1="40" x2="115" y2="40" stroke="#F1F5F9" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="48" x2="90" y2="48" stroke="#F1F5F9" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {/* Abstract lines */}
      <line x1="16" y1="62" x2="134" y2="62" stroke="#677B96" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="70" x2="134" y2="70" stroke="#677B96" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="78" x2="105" y2="78" stroke="#677B96" strokeWidth="1.2" strokeLinecap="round" />
      {/* Highlighted Evidence Passage */}
      <rect x="14" y="92" width="122" height="42" rx="4" fill="#064E3B" fillOpacity="0.4" stroke="#059669" strokeWidth="0.8" />
      <line x1="22" y1="104" x2="124" y2="104" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="112" x2="110" y2="112" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="120" x2="80" y2="120" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
      {/* Citation tag */}
      <text x="16" y="152" fill="#94A3B8" fontSize="8" fontFamily="'JetBrains Mono', monospace">p. 5, §Results</text>
    </g>

    {/* Paper B (Right: Transformer Architecture Study) */}
    <g transform="translate(330, 80)">
      <rect x="0" y="0" width="150" height="180" rx="8" fill="url(#folioGradA)" stroke="#323E4F" strokeWidth="1.2" />
      <rect x="0" y="0" width="150" height="6" rx="3" fill="#EA580C" fillOpacity="0.8" />
      {/* Header pill */}
      <rect x="16" y="18" width="60" height="12" rx="3" fill="#431407" fillOpacity="0.7" stroke="#EA580C" strokeWidth="0.8" />
      <text x="21" y="27" fill="#FDBA74" fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="600">STUDY II</text>
      {/* Title lines */}
      <line x1="16" y1="40" x2="120" y2="40" stroke="#F1F5F9" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="48" x2="85" y2="48" stroke="#F1F5F9" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {/* Body lines */}
      <line x1="16" y1="62" x2="134" y2="62" stroke="#677B96" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="70" x2="134" y2="70" stroke="#677B96" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="78" x2="115" y2="78" stroke="#677B96" strokeWidth="1.2" strokeLinecap="round" />
      {/* Divergent / Qualification Passage */}
      <rect x="14" y="92" width="122" height="42" rx="4" fill="#431407" fillOpacity="0.35" stroke="#EA580C" strokeWidth="0.8" />
      <line x1="22" y1="104" x2="124" y2="104" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="112" x2="105" y2="112" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="120" x2="70" y2="120" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
      {/* Citation tag */}
      <text x="16" y="152" fill="#94A3B8" fontSize="8" fontFamily="'JetBrains Mono', monospace">p. 8, §Discussion</text>
    </g>

    {/* Centerpiece: Cross-Paper Synthesis Monograph & Lens */}
    <g transform="translate(195, 30)">
      {/* Elevated central synthesis card */}
      <rect x="0" y="0" width="150" height="210" rx="10" fill="url(#folioGradB)" stroke="#10B981" strokeWidth="1.5" filter="drop-shadow(0 12px 24px rgba(0,0,0,0.5))" />
      {/* Top Banner */}
      <rect x="1" y="1" width="148" height="28" rx="9" fill="#064E3B" fillOpacity="0.6" />
      <text x="16" y="19" fill="#D1FAE5" fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="700" letterSpacing="0.05em">SYNTHESIS & PROVENANCE</text>

      {/* Consensus badge */}
      <g transform="translate(16, 42)">
        <rect width="118" height="24" rx="4" fill="#064E3B" fillOpacity="0.4" stroke="#059669" strokeWidth="0.8" />
        <circle cx="12" cy="12" r="4" fill="#10B981" />
        <path d="M10 12L11.5 13.5L14 10.5" stroke="#0C1014" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="22" y="15" fill="#6EE7B7" fontSize="8" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="600">Empirical Agreement</text>
      </g>

      {/* Divergence badge */}
      <g transform="translate(16, 74)">
        <rect width="118" height="24" rx="4" fill="#431407" fillOpacity="0.3" stroke="#EA580C" strokeWidth="0.8" />
        <circle cx="12" cy="12" r="4" fill="#F97316" />
        <line x1="12" y1="9.5" x2="12" y2="12.5" stroke="#0C1014" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="12" cy="14.5" r="0.6" fill="#0C1014" />
        <text x="22" y="15" fill="#FDBA74" fontSize="8" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="600">Tension / Regimes</text>
      </g>

      {/* Synthesis lines */}
      <line x1="16" y1="116" x2="134" y2="116" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="126" x2="134" y2="126" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="136" x2="110" y2="136" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />

      {/* Verified Page Citations Indicator */}
      <rect x="16" y="156" width="118" height="38" rx="6" fill="#12171D" stroke="#323E4F" strokeWidth="0.8" />
      <text x="26" y="172" fill="#10B981" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="600">✓ VERIFIED CITATIONS</text>
      <text x="26" y="184" fill="#94A3B8" fontSize="7.5" fontFamily="'JetBrains Mono', monospace">pp. 4, 5 • Micro-F1</text>
    </g>

    {/* Connected Synthesis Beams */}
    <path d="M210 170 C 235 170, 245 135, 270 135" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />
    <path d="M330 170 C 305 170, 295 135, 270 135" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />
  </svg>
);

/**
 * Empty Corpus Folio Graphic for initial state / upload zone
 */
export const EmptyCorpusIllustration: React.FC<{ className?: string }> = ({
  className = "w-36 h-36 mx-auto"
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="No Research Papers Folio"
  >
    <circle cx="80" cy="80" r="70" fill="#12171D" stroke="#252F3D" strokeWidth="1.5" strokeDasharray="4 4" />
    
    {/* Open Folio */}
    <path
      d="M45 105C56 100 68 101 80 108V52C68 45 56 44 45 49V105Z"
      fill="#1A2129"
      stroke="#10B981"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M115 105C104 100 92 101 80 108V52C92 45 104 44 115 49V105Z"
      fill="#161C24"
      stroke="#10B981"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    
    {/* Page spine & binding */}
    <line x1="80" y1="52" x2="80" y2="108" stroke="#34D399" strokeWidth="1.5" />
    
    {/* Text line representations */}
    <line x1="53" y1="62" x2="72" y2="60" stroke="#4A5B73" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="53" y1="70" x2="72" y2="68" stroke="#4A5B73" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="53" y1="78" x2="68" y2="76" stroke="#4A5B73" strokeWidth="1.2" strokeLinecap="round" />
    
    <line x1="88" y1="60" x2="107" y2="62" stroke="#4A5B73" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="88" y1="68" x2="107" y2="70" stroke="#4A5B73" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="88" y1="76" x2="103" y2="78" stroke="#4A5B73" strokeWidth="1.2" strokeLinecap="round" />
    
    {/* Add PDF badge */}
    <circle cx="80" cy="118" r="14" fill="#064E3B" stroke="#10B981" strokeWidth="1.2" />
    <path d="M80 112V124M74 118H86" stroke="#E2E8F0" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

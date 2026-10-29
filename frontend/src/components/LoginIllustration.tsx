import React from 'react';

export const LoginIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center w-full select-none ${className}`}>
      <svg
        viewBox="0 0 500 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[460px] drop-shadow-sm"
      >
        {/* ================= BACKGROUND CARDS & FRAMES ================= */}
        {/* Top-Left Soft Blue Texture Backdrop */}
        <rect
          x="35"
          y="40"
          width="190"
          height="130"
          rx="6"
          fill="#CBE1FB"
          className="dark:fill-[#1E3A5F]/60"
        />

        {/* Top-Right Thin Border Frame */}
        <rect
          x="260"
          y="75"
          width="200"
          height="145"
          rx="6"
          stroke="#93C5FD"
          strokeWidth="1.5"
          strokeOpacity="0.8"
          fill="#F8FAFC"
          fillOpacity="0.3"
          className="dark:stroke-[#2563EB]/40 dark:fill-slate-900/30"
        />

        {/* Bottom-Center Thin Border Frame */}
        <rect
          x="100"
          y="230"
          width="195"
          height="140"
          rx="6"
          stroke="#93C5FD"
          strokeWidth="1.5"
          strokeOpacity="0.8"
          fill="#F8FAFC"
          fillOpacity="0.3"
          className="dark:stroke-[#2563EB]/40 dark:fill-slate-900/30"
        />

        {/* Floating Soft Blue Accent Squares */}
        <rect
          x="385"
          y="245"
          width="36"
          height="36"
          rx="5"
          fill="#DBEAFE"
          className="dark:fill-[#1E293B]"
        />
        <rect
          x="295"
          y="380"
          width="28"
          height="28"
          rx="4"
          fill="#DBEAFE"
          className="dark:fill-[#1E293B]"
        />

        {/* ================= 1. WOMAN WITH STRIPED SHIRT & PHONE (TOP LEFT) ================= */}
        <g id="figure-woman">
          {/* Torso - Blue Shirt with Curved Shoulders */}
          <path
            d="M 40 205 C 45 150 72 120 115 115 C 158 120 185 150 190 205 Z"
            fill="#2563EB"
          />

          {/* Clean White Breton Stripes */}
          <path
            d="M 54 138 C 76 135 154 135 176 138"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 47 155 C 72 152 158 152 183 155"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 43 172 C 70 169 160 169 187 172"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 41 189 C 70 186 160 186 189 189"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Torso Contour Outline */}
          <path
            d="M 40 205 C 45 150 72 120 115 115 C 158 120 185 150 190 205"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Neck */}
          <path
            d="M 106 108 L 106 122 C 106 126 124 126 124 122 L 124 108"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="2.2"
          />

          {/* Head & Face */}
          <ellipse
            cx="115"
            cy="92"
            rx="18"
            ry="22"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="2.5"
          />

          {/* Black Bob Hair */}
          <path
            d="M 94 92 C 92 68 108 55 125 57 C 142 59 146 72 139 94 C 137 88 133 76 117 76 C 103 76 98 84 94 92 Z"
            fill="#111827"
          />
          <path
            d="M 94 92 C 92 106 100 114 103 116"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 139 94 C 140 104 135 112 131 115"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Friendly Eyes & Smile */}
          <circle cx="109" cy="91" r="2.2" fill="#111827" />
          <circle cx="122" cy="91" r="2.2" fill="#111827" />
          <path
            d="M 112 100 Q 115 104 119 100"
            stroke="#111827"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Arms holding phone */}
          <path
            d="M 44 205 C 50 178 72 168 105 172 L 135 172 C 158 170 180 180 188 205"
            fill="none"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Smartphone */}
          <rect
            x="126"
            y="155"
            width="22"
            height="36"
            rx="4"
            fill="#111827"
          />
          <rect
            x="129"
            y="158"
            width="16"
            height="26"
            rx="2"
            fill="#93C5FD"
          />
        </g>

        {/* ================= 2. MAN WITH BEARD & TABLET (TOP RIGHT) ================= */}
        <g id="figure-man">
          {/* Torso - Terracotta Coral Red Shirt */}
          <path
            d="M 285 240 C 290 190 315 158 352 154 C 392 150 430 180 460 240 Z"
            fill="#E8503A"
          />

          {/* White Collar Accent */}
          <path
            d="M 344 154 C 348 164 360 164 364 154"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Torso Outline */}
          <path
            d="M 285 240 C 290 190 315 158 352 154 C 392 150 430 180 460 240"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Neck */}
          <path
            d="M 347 142 L 347 155 C 347 160 361 160 361 155 L 361 142"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="2.2"
          />

          {/* Head & Face */}
          <ellipse
            cx="354"
            cy="126"
            rx="18"
            ry="21"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="2.5"
          />

          {/* Dark Full Beard & Mustache */}
          <path
            d="M 338 124 C 337 146 348 152 354 152 C 361 152 371 146 370 124 C 366 133 360 136 354 136 C 348 136 342 133 338 124 Z"
            fill="#111827"
          />

          {/* Eyes & Friendly Smile */}
          <circle cx="348" cy="120" r="2.2" fill="#111827" />
          <circle cx="361" cy="120" r="2.2" fill="#111827" />
          <path
            d="M 352 129 Q 355 131 358 129"
            stroke="#111827"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Hair */}
          <path
            d="M 337 124 C 334 105 348 98 358 98 C 370 98 373 108 370 124 C 368 112 361 108 354 108 C 346 108 340 114 337 124 Z"
            fill="#111827"
          />

          {/* Arms holding tablet */}
          <path
            d="M 288 240 C 293 216 312 208 340 212 L 380 212 C 412 210 436 220 458 240"
            fill="none"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Tablet Device */}
          <rect
            x="334"
            y="200"
            width="52"
            height="34"
            rx="4"
            fill="#111827"
          />
          <rect
            x="337"
            y="203"
            width="46"
            height="28"
            rx="2"
            fill="#BFDBFE"
          />
        </g>

        {/* ================= 3. CITIZEN AT DESKTOP WITH GOVCONNECT (BOTTOM) ================= */}
        <g id="figure-desktop">
          {/* Shoulders / Clean White Top with Dark Outline */}
          <path
            d="M 115 395 C 120 342 142 312 178 308 C 210 308 226 332 234 395 Z"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Clean Collar Line */}
          <path
            d="M 166 310 C 172 320 184 320 190 310"
            fill="none"
            stroke="#111827"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Neck */}
          <path
            d="M 172 298 L 172 308 L 186 308 L 186 298"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="2"
          />

          {/* Head */}
          <ellipse
            cx="178"
            cy="282"
            rx="16"
            ry="19"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="2.5"
          />

          {/* Wavy Golden Yellow Hair */}
          <path
            d="M 163 284 C 158 262 170 252 184 252 C 197 252 201 264 196 284 C 193 272 187 266 178 266 C 170 266 166 272 163 284 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          <circle cx="162" cy="274" r="5.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          <circle cx="196" cy="274" r="5.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />

          {/* Profile Facing Monitor */}
          <circle cx="185" cy="280" r="2.2" fill="#111827" />
          <path
            d="M 186 287 Q 189 290 192 287"
            stroke="#111827"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Desktop Monitor Stand */}
          <path
            d="M 270 338 L 270 360 M 256 360 L 284 360"
            stroke="#111827"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Monitor Frame */}
          <rect
            x="226"
            y="262"
            width="88"
            height="66"
            rx="6"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="2.5"
            className="dark:fill-slate-800"
          />

          {/* Screen Inner Display */}
          <rect
            x="232"
            y="268"
            width="76"
            height="50"
            rx="4"
            fill="#F1F5F9"
            className="dark:fill-slate-900"
          />

          {/* GovConnect App Window on Screen */}
          <rect
            x="238"
            y="274"
            width="64"
            height="38"
            rx="4"
            fill="#0A4174"
          />

          {/* Mini GovConnect Emblem & Autofill Lines */}
          <g transform="translate(242, 278)">
            {/* GovConnect Shield Icon */}
            <path
              d="M 8 2 L 14 5 L 14 11 C 14 15 8 18 8 18 C 8 18 2 15 2 11 L 2 5 Z"
              fill="#FFFFFF"
            />
            <path
              d="M 8 4 L 12 6.5 L 12 10.5 C 12 13.5 8 15.5 8 15.5 C 8 15.5 4 13.5 4 10.5 L 4 6.5 Z"
              fill="#0A4174"
            />
            {/* Autofill Simulated Data Rows */}
            <rect x="18" y="4" width="32" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.95" />
            <rect x="18" y="9" width="24" height="3" rx="1.5" fill="#7BBDE8" />
            <rect x="18" y="14" width="28" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="18" y="19" width="18" height="3" rx="1.5" fill="#38BDF8" />
          </g>
        </g>
      </svg>
    </div>
  );
};


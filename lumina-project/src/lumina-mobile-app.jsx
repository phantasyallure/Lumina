import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, Search, Home as HomeIcon, User, LayoutDashboard,
  MessageCircle, Camera, Check, X, LogOut, Pencil, Star, Phone,
  MapPin, Flag, Send, ArrowRight, Lock, Mail, ChevronRight
} from 'lucide-react';
import {
  supabase, signUp, signIn, signOut, getProfile, updateViewerCity,
  fetchLiveListings, submitRating as dbSubmitRating, reportListing,
  fetchMyListing, upsertMyListing, fetchSupportThread, sendSupportMessage,
  subscribeToProviderThread, uploadListingPhoto,
} from './lumina-supabase';

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const TOKENS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .lumina-app-shell{
    width: 100%;
    min-height: 100vh;
    background: #EFEAE0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 12px;
    font-family: var(--font-body);
  }
  .lumina-root{
    --color-navy-900:#0B2545;
    --color-navy-700:#123A63;
    --color-navy-500:#2C5F94;
    --color-navy-100:#E8EEF4;
    --color-bg:#FBFAF6;
    --color-surface:#FFFFFF;
    --color-line:#E6E2D8;
    --color-text:#14213A;
    --color-text-muted:#5B6478;
    --color-text-faint:#9099AB;
    --color-beacon:#E3A72E;
    --color-beacon-soft:#F8E6BA;
    --color-beacon-deep:#B9821B;
    --color-success:#2F7A4F;
    --color-success-soft:#E4F1E8;
    --color-danger:#B3432B;
    --color-danger-soft:#F7E7E1;
    --font-display:'Fraunces', serif;
    --font-body:'Inter', sans-serif;
    --font-mono:'JetBrains Mono', monospace;
    --radius-card:16px;
    --radius-control:12px;
    --radius-pill:999px;

    font-family: var(--font-body);
    color: var(--color-text);
    background: var(--color-bg);
    position: relative;
    width: 100%;
    max-width: 412px;
    margin: 0 auto;
    min-height: 780px;
    height: 780px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 28px;
    border: 1px solid var(--color-line);
    box-shadow: 0 20px 60px rgba(11,37,69,0.18);
  }
  .lumina-root *{ box-sizing: border-box; }
  @media (max-width: 480px){
    .lumina-app-shell{
      padding: 0;
      min-height: 100vh;
      min-height: 100svh;
      min-height: 100dvh;
    }
    .lumina-root{
      width: 100vw;
      min-height: 100vh;
      min-height: 100svh;
      min-height: 100dvh;
      height: 100vh;
      height: 100svh;
      height: 100dvh;
      max-width: none;
      margin: 0;
      border-radius: 0;
      border: none;
      box-shadow: none;
    }
  }
  .lumina-scroll{ flex:1; overflow-y:auto; -ms-overflow-style:none; scrollbar-width:none; }
  .lumina-scroll::-webkit-scrollbar{ display:none; }

  .beacon-glow{
    background: radial-gradient(circle at 50% 30%, rgba(227,167,46,0.55) 0%, rgba(227,167,46,0.0) 70%);
  }
  .btn-primary{
    background: var(--color-beacon);
    color: var(--color-navy-900);
    font-family: var(--font-body);
    font-weight: 700;
    border: none;
    border-radius: var(--radius-control);
    padding: 15px 20px;
    font-size: 15px;
    display:flex; align-items:center; justify-content:center; gap:8px;
    cursor:pointer;
    box-shadow: 0 8px 20px rgba(227,167,46,0.35);
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .btn-primary:active{ transform: scale(0.97); }
  .btn-primary:disabled{ opacity:0.45; box-shadow:none; cursor:not-allowed; }
  .btn-secondary{
    background: var(--color-surface);
    color: var(--color-navy-900);
    font-family: var(--font-body);
    font-weight: 600;
    border: 1.5px solid var(--color-navy-900);
    border-radius: var(--radius-control);
    padding: 13px 20px;
    font-size: 15px;
    display:flex; align-items:center; justify-content:center; gap:8px;
    cursor:pointer;
  }
  .btn-ghost{
    background: transparent;
    color: var(--color-navy-700);
    font-family: var(--font-body);
    font-weight: 600;
    border: none;
    padding: 10px 4px;
    font-size: 14px;
    cursor:pointer;
  }
  .field-label{
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 6px;
    display:block;
  }
  .field-input{
    width:100%;
    font-family: var(--font-body);
    font-size: 15px;
    color: var(--color-text);
    background: var(--color-surface);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius-control);
    padding: 13px 14px;
    outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .field-input:focus{
    border-color: var(--color-beacon);
    box-shadow: 0 0 0 4px rgba(227,167,46,0.18);
  }
  .card{
    background: var(--color-surface);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-card);
    padding: 14px;
  }
  .pill{
    border-radius: var(--radius-pill);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 12.5px;
    padding: 6px 13px;
    display:inline-flex; align-items:center; gap:5px;
  }
  .status-live{ background: var(--color-success-soft); color: var(--color-success); }
  .status-pending{ background: var(--color-beacon-soft); color: var(--color-beacon-deep); }
  .status-rejected{ background: var(--color-danger-soft); color: var(--color-danger); }

  .top-bar{
    display:flex; align-items:center; gap:10px;
    padding: 18px 18px 12px 18px;
    background: var(--color-bg);
    flex-shrink:0;
  }
  .top-bar-title{
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 19px;
    color: var(--color-navy-900);
  }
  .icon-btn{
    width:36px; height:36px; border-radius:var(--radius-pill);
    display:flex; align-items:center; justify-content:center;
    background: var(--color-surface); border:1px solid var(--color-line);
    cursor:pointer; flex-shrink:0;
  }
  .tab-bar{
    display:flex; border-top:1px solid var(--color-line);
    background: var(--color-surface); flex-shrink:0;
    padding: 8px 8px calc(env(safe-area-inset-bottom,0px) + 8px) 8px;
  }
  .tab-item{
    flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;
    padding:6px 0; cursor:pointer; position:relative;
  }
  .tab-label{ font-size:11px; font-weight:600; color: var(--color-text-faint); }
  .tab-label.active{ color: var(--color-navy-900); }
  .tab-indicator{
    position:absolute; top:-9px; width:20px; height:3px; border-radius:3px;
    background: var(--color-beacon);
  }
  .star-row{ display:flex; align-items:center; gap:2px; }
  input::placeholder{ color: var(--color-text-faint); }

  .btn-outline-light{
    background: transparent;
    color: #fff;
    font-family: var(--font-body);
    font-weight: 600;
    border: 1.5px solid rgba(255,255,255,0.45);
    border-radius: var(--radius-control);
    padding: 13px 20px;
    font-size: 15px;
    display:flex; align-items:center; justify-content:center; gap:8px;
    cursor:pointer;
  }
  .btn-outline-light:active{ background: rgba(255,255,255,0.08); }

  .beacon-stage{
    position: relative;
    height: 208px;
    border-radius: var(--radius-card);
    overflow: hidden;
    background: #0B2036;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .beam-rotate{ animation: beamSweepSvg 6s linear infinite; }
  .lamp-pulse{ animation: lampPulse 2.2s ease-in-out infinite; transform-origin: 150px 46px; }
  .glint-flicker{ animation: glintFlicker 3s ease-in-out infinite; }
  @keyframes beamSweepSvg{ from{ transform: rotate(0deg); } to{ transform: rotate(360deg); } }
  @keyframes lampPulse{ 0%,100%{ opacity:0.55; } 50%{ opacity:1; } }
  @keyframes glintFlicker{ 0%,100%{ opacity:0.1; } 50%{ opacity:0.5; } }
`;

/* ============================================================
   DATA — CATEGORIES (custom line-art icons, 1.6px stroke)
   ============================================================ */
const ICON_PROPS = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--color-navy-500)', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

const CatIcon = {
  professional: () => (<svg {...ICON_PROPS}><path d="M14.7 6.3a3 3 0 1 0-4.24 4.24L3 18l1.5 1.5L12 12l0 0" /><path d="M14.7 6.3 17 4l1.5 1.5-2.3 2.3" /><circle cx="18.5" cy="5.5" r="2" /></svg>),
  medical: () => (<svg {...ICON_PROPS}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>),
  job: () => (<svg {...ICON_PROPS}><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></svg>),
  media: () => (<svg {...ICON_PROPS}><path d="M3 10v4h3l5 4V6l-5 4H3z" /><path d="M16 9a3 3 0 0 1 0 6M18.5 7a6.5 6.5 0 0 1 0 10" /></svg>),
  dine: () => (<svg {...ICON_PROPS}><path d="M7 3v7a2 2 0 0 0 2 2v9M7 3v18M5 3v7M9 3v7" /><path d="M17 3c-1.5 0-2 2-2 4s.6 3.5 2 4v10" /></svg>),
  hotel: () => (<svg {...ICON_PROPS}><path d="M3 19V6M3 12h16a2 2 0 0 1 2 2v5" /><path d="M3 8h6a2 2 0 0 1 2 2v2H3" /><circle cx="7" cy="8" r="1.4" /></svg>),
  transport: () => (<svg {...ICON_PROPS}><path d="M4 16V11l2.2-5A2 2 0 0 1 8.1 5h7.8a2 2 0 0 1 1.9 1.3L20 11v5" /><path d="M4 16h16M7 16v2M17 16v2" /><circle cx="7.5" cy="14" r="1.3" /><circle cx="16.5" cy="14" r="1.3" /></svg>),
};

const CATEGORIES = [
  { id: 'professional', name_fr: 'Artisans / Pros', name_en: 'Professional', requires_address: false, icon: 'professional' },
  { id: 'medical', name_fr: 'Santé / Cliniques', name_en: 'Medical', requires_address: true, icon: 'medical' },
  { id: 'job', name_fr: 'Emploi', name_en: 'Job & Recruitment', requires_address: false, icon: 'job' },
  { id: 'media', name_fr: 'Com / Média', name_en: 'Com & Media', requires_address: false, icon: 'media' },
  { id: 'dine', name_fr: 'Restos / Loisirs', name_en: 'Dine & Leisure', requires_address: true, icon: 'dine' },
  { id: 'hotel', name_fr: 'Hôtels / Spas', name_en: 'Hotels & Spa', requires_address: true, icon: 'hotel' },
  { id: 'transport', name_fr: 'Transports / Mobilité', name_en: 'Transport', requires_address: false, icon: 'transport' },
];

/* ============================================================
   DATA — CITIES (58 wilayas)
   ============================================================ */
const CITIES = [
  ['01','Adrar'],['02','Chlef'],['03','Laghouat'],['04','Oum El Bouaghi'],['05','Batna'],
  ['06','Béjaïa'],['07','Biskra'],['08','Béchar'],['09','Blida'],['10','Bouira'],
  ['11','Tamanrasset'],['12','Tébessa'],['13','Tlemcen'],['14','Tiaret'],['15','Tizi Ouzou'],
  ['16','Alger'],['17','Djelfa'],['18','Jijel'],['19','Sétif'],['20','Saïda'],
  ['21','Skikda'],['22','Sidi Bel Abbès'],['23','Annaba'],['24','Guelma'],['25','Constantine'],
  ['26','Médéa'],['27','Mostaganem'],['28',"M'Sila"],['29','Mascara'],['30','Ouargla'],
  ['31','Oran'],['32','El Bayadh'],['33','Illizi'],['34','Bordj Bou Arréridj'],['35','Boumerdès'],
  ['36','El Tarf'],['37','Tindouf'],['38','Tissemsilt'],['39','El Oued'],['40','Khenchela'],
  ['41','Souk Ahras'],['42','Tipaza'],['43','Mila'],['44','Aïn Defla'],['45','Naâma'],
  ['46','Aïn Témouchent'],['47','Ghardaïa'],['48','Relizane'],['49','Timimoun'],['50','Bordj Badji Mokhtar'],
  ['51','Ouled Djellal'],['52','Béni Abbès'],['53','In Salah'],['54','In Guezzam'],['55','Touggourt'],
  ['56','Djanet'],['57',"El M'Ghair"],['58','El Meniaa'],
].map(([wilaya_code, name]) => ({ id: wilaya_code, wilaya_code, name }));

const NEIGHBORHOODS = {
  '16': ['Hydra', 'Bab Ezzouar', 'Kouba', 'El Biar', 'Bir Mourad Raïs', 'Dar El Beïda'],
  '31': ['Es Sénia', 'Bir El Djir', 'Sidi Maârouf', 'El Hamri', 'Miramar'],
  '25': ['Sidi Mabrouk', 'El Khroub', 'Zouaghi', "Boussouf"],
  '09': ['Centre Ville', 'Ouled Yaich', 'Chiffa'],
};
const neighborhoodsFor = (cityId) => NEIGHBORHOODS[cityId] || ['Centre Ville', 'Zone 1', 'Zone 2'];

/* ============================================================
   LISTINGS now come from Supabase (see fetchLiveListings) —
   this local seed data was removed. `seedPhoto` is kept only
   as a placeholder-image generator for new listings that don't
   have a real uploaded photo yet.
   ============================================================ */
const seedPhoto = (seed) => `https://picsum.photos/seed/${seed}/400/300`;

/* ============================================================
   HELPERS
   ============================================================ */
function Stars({ value, size = 14 }) {
  const rounded = Math.round(value);
  return (
    <span className="star-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= rounded ? 'var(--color-beacon)' : 'none'} stroke="var(--color-beacon)" strokeWidth={1.6} />
      ))}
    </span>
  );
}

function PhoneField({ value, onChange, label = 'Numéro de téléphone / Phone number' }) {
  const handle = (e) => {
    let v = e.target.value.replace(/[^\d]/g, '');
    if (v.length > 0 && v[0] === '0') v = v.slice(1);
    onChange(v.slice(0, 9));
  };
  return (
    <div>
      <span className="field-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--color-line)', borderRadius: 'var(--radius-control)', padding: '4px 10px', background: 'var(--color-surface)' }}>
        <span style={{ fontSize: 18 }}>🇩🇿</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--color-text-muted)' }}>+213</span>
        <div style={{ width: 1, height: 20, background: 'var(--color-line)' }} />
        <input
          value={value}
          onChange={handle}
          placeholder="551 23 45 67"
          inputMode="numeric"
          style={{ border: 'none', outline: 'none', flex: 1, fontFamily: 'var(--font-body)', fontSize: 15, padding: '9px 0', background: 'transparent' }}
        />
      </div>
    </div>
  );
}

function ScreenHeader({ title, onBack, right }) {
  return (
    <div className="top-bar">
      {onBack && (
        <div className="icon-btn" onClick={onBack}><ChevronLeft size={18} color="var(--color-navy-900)" /></div>
      )}
      <div className="top-bar-title" style={{ flex: 1 }}>{title}</div>
      {right}
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
export default function LuminaApp() {
  const [stack, setStack] = useState(['welcome']);
  const screen = stack[stack.length - 1];
  const push = (s) => setStack((st) => [...st, s]);
  const pop = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  const resetTo = (s) => setStack([s]);

  // Auth + data now backed by Supabase (see ./lumina-supabase)
  const [viewer, setViewer] = useState(null); // {id, email, city_id}
  const [provider, setProvider] = useState(null); // {id, email}
  const [providerListing, setProviderListing] = useState(null); // the logged-in provider's own listing
  const [listings, setListings] = useState([]);
  const [supportThread, setSupportThread] = useState([]);

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeProvider, setActiveProvider] = useState(null);
  const [pendingRatingFor, setPendingRatingFor] = useState(null);
  const [showRateModal, setShowRateModal] = useState(false);

  const [viewerTab, setViewerTab] = useState('home');
  const [providerTab, setProviderTab] = useState('dashboard');

  // Restore an existing Supabase session on load (refresh / reopen)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user;
      if (!user) return;
      try {
        const profile = await getProfile(user.id);
        if (profile.role === 'provider') {
          setProvider({ id: user.id, email: user.email });
          resetTo('providerHome');
        } else {
          setViewer({ id: user.id, email: user.email, city_id: profile.city_id });
          resetTo('viewerHome');
        }
      } catch { /* no profile row yet — ignore */ }
    });
  }, []);

  // Load live listings for the viewer's current city whenever it changes
  useEffect(() => {
    if (!viewer?.city_id) return;
    fetchLiveListings({ cityId: viewer.city_id }).then(setListings).catch(() => setListings([]));
  }, [viewer?.city_id]);

  // Load the logged-in provider's own listing
  useEffect(() => {
    if (!provider?.id) return;
    fetchMyListing(provider.id).then(setProviderListing).catch(() => setProviderListing(null));
  }, [provider?.id]);

  // Load + subscribe to the provider's support thread
  useEffect(() => {
    if (!provider?.id) return;
    fetchSupportThread(provider.id).then(setSupportThread).catch(() => setSupportThread([]));
    const unsubscribe = subscribeToProviderThread(provider.id, (payload) => {
      setSupportThread((t) => [...t, payload.new]);
    });
    return unsubscribe;
  }, [provider?.id]);

  const handleCall = (listing) => {
    setPendingRatingFor(listing);
    window.open(`tel:${listing.phone}`, '_self');
  };

  const goHomeAfterCall = () => {
    if (pendingRatingFor) {
      setShowRateModal(true);
    }
    setViewerTab('home');
    resetTo('viewerHome');
  };

  const submitRating = async (stars) => {
    if (pendingRatingFor && viewer?.id) {
      try {
        await dbSubmitRating(pendingRatingFor.id, stars, viewer.id);
        // optimistic local bump for instant UI feedback; the DB trigger
        // recalculates the true average server-side
        setListings((ls) => ls.map((l) => l.id === pendingRatingFor.id
          ? { ...l, rating_count: l.rating_count + 1, avg_rating: Math.round(((l.avg_rating * l.rating_count) + stars) / (l.rating_count + 1) * 10) / 10 }
          : l));
      } catch (e) { console.error('Rating failed', e); }
    }
    setShowRateModal(false);
    setPendingRatingFor(null);
  };

  /* ---------- SCREENS ---------- */

  const Welcome = () => (
    <div className="lumina-scroll" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-navy-900)', padding: '30px 24px 26px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '0.08em', color: '#fff' }}>LUMINA</div>
        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.62)', fontSize: 12.5, lineHeight: 1.5 }}>
          Connectez-vous à l'essentiel<br /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>Connect with the essential</span>
        </div>
      </div>

      <div className="beacon-stage" style={{ margin: '18px 0 16px' }}>
        <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#081A33" />
              <stop offset="55%" stopColor="#123A63" />
              <stop offset="100%" stopColor="#3D6FA0" />
            </linearGradient>
            <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2C5F94" />
              <stop offset="100%" stopColor="#071528" />
            </linearGradient>
            <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F8E6BA" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#E3A72E" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#E3A72E" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="lampGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF6E0" />
              <stop offset="45%" stopColor="#E3A72E" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E3A72E" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="towerShade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0B2545" stopOpacity="0.35" />
              <stop offset="45%" stopColor="#0B2545" stopOpacity="0" />
              <stop offset="100%" stopColor="#0B2545" stopOpacity="0.45" />
            </linearGradient>
            <filter id="beamBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>

          <rect x="0" y="0" width="300" height="142" fill="url(#skyGrad)" />
          <circle cx="42" cy="26" r="1" fill="#ffffff90" />
          <circle cx="92" cy="16" r="1.3" fill="#ffffffb0" />
          <circle cx="222" cy="22" r="1" fill="#ffffff80" />
          <circle cx="262" cy="36" r="1.4" fill="#ffffffa0" />
          <circle cx="184" cy="12" r="0.9" fill="#ffffff70" />
          <circle cx="60" cy="50" r="0.9" fill="#ffffff60" />

          <g className="beam-rotate" style={{ transformOrigin: '150px 46px' }}>
            <path d="M150 46 L360 6 L360 86 Z" fill="url(#beamGrad)" filter="url(#beamBlur)" />
          </g>

          <rect x="0" y="142" width="300" height="58" fill="url(#seaGrad)" />
          <path d="M0 151 Q75 147 150 151 T300 151" stroke="#ffffff20" fill="none" strokeWidth="1" />
          <path d="M0 163 Q75 159 150 163 T300 163" stroke="#ffffff16" fill="none" strokeWidth="1" />
          <ellipse className="glint-flicker" cx="150" cy="152" rx="11" ry="3" fill="#E3A72E" />

          <path d="M118 168 L133 148 L150 168 L162 152 L184 168 Z" fill="#071223" />

          <rect x="127" y="150" width="46" height="9" rx="2" fill="#0B2545" />
          <path d="M137 150 L133 76 Q150 70 167 76 L163 150 Z" fill="#FBFAF6" />
          <path d="M136.3 122 L134.3 100 L165.7 100 L163.7 122 Z" fill="#2C5F94" />
          <path d="M137 150 L133 76 Q150 70 167 76 L163 150 Z" fill="url(#towerShade)" />

          <rect x="126" y="68" width="48" height="8" rx="2" fill="#0B2545" />
          <line x1="131" y1="68" x2="131" y2="60" stroke="#0B2545" strokeWidth="1.2" />
          <line x1="150" y1="68" x2="150" y2="60" stroke="#0B2545" strokeWidth="1.2" />
          <line x1="169" y1="68" x2="169" y2="60" stroke="#0B2545" strokeWidth="1.2" />

          <path d="M137 60 L137 45 L163 45 L163 60 Z" fill="#0B2545" opacity="0.88" />
          <path d="M137 45 L150 30 L163 45 Z" fill="#0B2545" />
          <circle cx="150" cy="26" r="1.8" fill="#0B2545" />

          <circle className="lamp-pulse" cx="150" cy="46" r="15" fill="url(#lampGrad)" />
          <circle cx="150" cy="46" r="4" fill="#FFF6E0" />
        </svg>
      </div>

      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.72)', fontSize: 12.5, lineHeight: 1.65, padding: '0 4px' }}>
        Trouvez en quelques secondes un artisan, une clinique, un restaurant ou tout autre service près de chez vous, où que vous soyez en Algérie. Parcourez les catégories et appelez directement — sans détour.
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, margin: '26px 2px 0' }}>
        {[
          { icon: Search, fr: 'Choisissez', en: 'une catégorie' },
          { icon: Phone, fr: 'Appelez', en: 'directement' },
          { icon: Star, fr: 'Notez', en: "l'expérience" },
        ].map((s, i) => (
          <React.Fragment key={s.fr}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <s.icon size={16} color="var(--color-beacon)" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{s.fr}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{s.en}</div>
            </div>
            {i < 2 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.16)', marginTop: 19, flexShrink: 0 }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 22 }}>
        <button className="btn-primary" onClick={() => push('citySelect')}>
          Je cherche un service <ArrowRight size={16} />
        </button>
        <button className="btn-outline-light" onClick={() => push('providerAuth')}>
          Je propose un service
        </button>
      </div>
    </div>
  );

  const CitySelect = () => {
    const [q, setQ] = useState('');
    const filtered = CITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ScreenHeader title="Choisir votre ville" onBack={stack.length > 1 ? pop : null} />
        <div style={{ padding: '0 18px 12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--color-text-faint)" style={{ position: 'absolute', left: 12, top: 14 }} />
            <input className="field-input" style={{ paddingLeft: 36 }} placeholder="Rechercher une ville / wilaya" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="lumina-scroll" style={{ padding: '0 18px 18px' }}>
          {filtered.map((c) => (
            <div key={c.id} onClick={() => {
              if (viewer) {
                setViewer({ ...viewer, city_id: c.id });
                updateViewerCity(viewer.id, c.id).catch((e) => console.error('City update failed', e));
                pop();
              }
              else { push({ screen: 'viewerAuth', cityId: c.id }); }
            }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', borderBottom: '1px solid var(--color-line)', cursor: 'pointer' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-faint)', width: 24 }}>{c.wilaya_code}</span>
              <span style={{ fontSize: 15 }}>{c.name}</span>
              <ChevronRight size={15} color="var(--color-text-faint)" style={{ marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ViewerAuth = ({ cityId }) => {
    const [mode, setMode] = useState('signup');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async () => {
      if (!email.includes('@')) return setErr("Adresse e-mail invalide.");
      if (pw.length < 6) return setErr('Mot de passe : 6 caractères minimum.');
      if (mode === 'signup' && pw !== pw2) return setErr('Les mots de passe ne correspondent pas.');
      setErr('');
      setBusy(true);
      try {
        const resolvedCity = cityId || CITIES[15].id;
        const user = mode === 'signup'
          ? await signUp({ email, password: pw, role: 'viewer', cityId: resolvedCity })
          : await signIn({ email, password: pw });
        const profile = await getProfile(user.id).catch(() => null);
        setViewer({ id: user.id, email: user.email, city_id: profile?.city_id || resolvedCity });
        resetTo('viewerHome');
      } catch (e) {
        setErr(e.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : e.message);
      } finally {
        setBusy(false);
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ScreenHeader title={mode === 'signup' ? 'Créer un compte' : 'Se connecter'} onBack={pop} />
        <div className="lumina-scroll" style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span className="field-label">E-mail</span>
            <input className="field-input" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <span className="field-label">Mot de passe</span>
            <input className="field-input" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          {mode === 'signup' && (
            <div>
              <span className="field-label">Confirmer le mot de passe</span>
              <input className="field-input" type="password" placeholder="••••••••" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
          )}
          {err && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{err}</div>}
          <button className="btn-primary" onClick={submit} disabled={busy} style={{ marginTop: 8 }}>
            {busy ? '...' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
          <button className="btn-ghost" style={{ alignSelf: 'center' }} onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
          </button>
        </div>
      </div>
    );
  };

  const cityName = (id) => CITIES.find((c) => c.id === id)?.name || '';

  const ViewerHome = () => {
    const [q, setQ] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '20px 18px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-navy-900)' }}>LUMINA</div>
            </div>
            <div className="pill" style={{ background: 'var(--color-navy-100)', color: 'var(--color-navy-700)', cursor: 'pointer' }} onClick={() => push('citySelect')}>
              <MapPin size={13} /> {cityName(viewer.city_id)}
            </div>
          </div>
          <div style={{ position: 'relative', marginTop: 16 }}>
            <Search size={16} color="var(--color-text-faint)" style={{ position: 'absolute', left: 12, top: 14 }} />
            <input className="field-input" style={{ paddingLeft: 36 }} placeholder="Rechercher un service..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="lumina-scroll" style={{ padding: '10px 18px 18px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '8px 0 10px' }}>Catégories</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {CATEGORIES.filter((c) => (c.name_fr + c.name_en).toLowerCase().includes(q.toLowerCase())).map((c) => {
              const Icon = CatIcon[c.icon];
              return (
                <div key={c.id} className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
                  onClick={() => { setActiveCategory(c); push('categoryList'); }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--color-navy-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name_fr}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>{c.name_en}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const CategoryList = () => {
    const [hood, setHood] = useState('all');
    const hoods = ['all', ...neighborhoodsFor(viewer.city_id)];
    const items = listings.filter((l) => l.status === 'live' && l.category_id === activeCategory.id && l.city_id === viewer.city_id && (hood === 'all' || l.neighborhood === hood));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ScreenHeader title={activeCategory.name_fr} onBack={pop} />
        <div className="lumina-scroll" style={{ padding: '0 18px 18px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
            {hoods.map((h) => (
              <div key={h} className="pill" onClick={() => setHood(h)} style={{ cursor: 'pointer', flexShrink: 0, background: hood === h ? 'var(--color-navy-900)' : 'var(--color-navy-100)', color: hood === h ? '#fff' : 'var(--color-navy-700)' }}>
                {h === 'all' ? cityName(viewer.city_id) + ' (tout)' : h}
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-faint)', padding: '40px 10px', fontSize: 14 }}>
              Aucun prestataire pour le moment dans cette zone.
            </div>
          )}
          {items.map((l) => (
            <div key={l.id} className="card" style={{ display: 'flex', gap: 12, marginBottom: 10, cursor: 'pointer' }} onClick={() => { setActiveProvider(l); push('providerDetail'); }}>
              <img src={l.photo_url} alt={l.name} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '3px 0 5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stars value={l.avg_rating} size={12} />
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>({l.rating_count})</span>
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>· {l.neighborhood}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ProviderDetail = () => {
    const l = activeProvider;
    const [reported, setReported] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ScreenHeader title="" onBack={pop} />
        <div className="lumina-scroll" style={{ padding: '0 18px 20px' }}>
          <img src={l.photo_url} alt={l.name} style={{ width: '100%', height: 190, objectFit: 'cover', borderRadius: 'var(--radius-card)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 21, marginTop: 14 }}>{l.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Stars value={l.avg_rating} />
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{l.avg_rating} ({l.rating_count} avis)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--color-text-muted)', fontSize: 13.5 }}>
            <MapPin size={14} /> {l.address || l.neighborhood + ', ' + cityName(l.city_id)}
          </div>
          <div style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{l.description}</div>

          <div className="beacon-glow" style={{ marginTop: 22, borderRadius: 'var(--radius-card)', padding: 4 }}>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleCall(l)}>
              <span style={{ fontSize: 17 }}>🇩🇿</span> Appeler · +213 {l.phone.slice(4, 7)} {l.phone.slice(7, 9)} {l.phone.slice(9, 11)} {l.phone.slice(11)}
              <Phone size={16} />
            </button>
          </div>

          <button className="btn-ghost" style={{ marginTop: 14, color: reported ? 'var(--color-text-faint)' : 'var(--color-danger)' }}
            onClick={() => { reportListing(l.id, 'Signalement utilisateur', viewer?.id).catch((e) => console.error('Report failed', e)); setReported(true); }}
            disabled={reported}>
            <Flag size={13} style={{ marginRight: 6, display: 'inline' }} />
            {reported ? 'Signalement envoyé' : 'Signaler cette annonce'}
          </button>
        </div>
      </div>
    );
  };

  const RateModal = () => {
    const [stars, setStars] = useState(0);
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,37,69,0.45)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
        <div style={{ background: 'var(--color-surface)', width: '100%', borderRadius: '20px 20px 0 0', padding: '24px 22px 28px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>Comment s'est passé l'appel ?</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{pendingRatingFor?.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '20px 0' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={30} onClick={() => setStars(i)} style={{ cursor: 'pointer' }}
                fill={i <= stars ? 'var(--color-beacon)' : 'none'} stroke="var(--color-beacon)" strokeWidth={1.6} />
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%' }} disabled={stars === 0} onClick={() => submitRating(stars)}>Envoyer la note</button>
          <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => { setShowRateModal(false); setPendingRatingFor(null); }}>Passer</button>
        </div>
      </div>
    );
  };

  const ViewerProfile = () => {
    const [editing, setEditing] = useState(null);
    const [email, setEmail] = useState(viewer.email);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="top-bar"><div className="top-bar-title">Profil</div></div>
        <div className="lumina-scroll" style={{ padding: '4px 18px 18px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-navy-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} color="var(--color-navy-700)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{viewer.email}</div>
              <div style={{ fontSize: 12.5, color: 'var(--color-text-faint)' }}>Membre · {cityName(viewer.city_id)}</div>
            </div>
          </div>

          {[
            { key: 'email', label: 'E-mail', value: viewer.email },
            { key: 'password', label: 'Mot de passe', value: '••••••••' },
            { key: 'city', label: 'Ville', value: cityName(viewer.city_id) },
          ].map((row) => (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px', borderBottom: '1px solid var(--color-line)' }}>
              <div>
                <div className="field-label" style={{ marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontSize: 14.5 }}>{row.value}</div>
              </div>
              <div className="icon-btn" onClick={() => row.key === 'city' ? push('citySelect') : setEditing(row.key)}>
                <Pencil size={14} color="var(--color-navy-700)" />
              </div>
            </div>
          ))}

          {editing && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <input className="field-input" type={editing === 'password' ? 'password' : 'text'} placeholder={editing === 'password' ? 'Nouveau mot de passe' : 'Nouvel e-mail'}
                value={editing === 'email' ? email : ''} onChange={(e) => editing === 'email' && setEmail(e.target.value)} />
              <button className="btn-secondary" onClick={() => setEditing(null)}><Check size={16} /></button>
            </div>
          )}

          <button className="btn-secondary" style={{ width: '100%', marginTop: 24, borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
            onClick={() => { signOut(); setViewer(null); resetTo('welcome'); }}>
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </div>
    );
  };

  const ViewerShell = () => {
    const body = viewerTab === 'home' ? screen === 'categoryList' ? <CategoryList /> : screen === 'providerDetail' ? <ProviderDetail /> : <ViewerHome /> : <ViewerProfile />;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        <div style={{ flex: 1, minHeight: 0 }}>{body}</div>
        <div className="tab-bar">
          {[
            { key: 'home', label: 'Accueil', icon: HomeIcon },
            { key: 'profile', label: 'Profil', icon: User },
          ].map((t) => (
            <div key={t.key} className="tab-item" onClick={() => { setViewerTab(t.key); resetTo('viewerHome'); }}>
              {viewerTab === t.key && <div className="tab-indicator" />}
              <t.icon size={20} color={viewerTab === t.key ? 'var(--color-navy-900)' : 'var(--color-text-faint)'} />
              <span className={'tab-label' + (viewerTab === t.key ? ' active' : '')}>{t.label}</span>
            </div>
          ))}
        </div>
        {showRateModal && <RateModal />}
      </div>
    );
  };

  /* ---------- PROVIDER TRACK ---------- */

  const ProviderAuth = () => {
    const [mode, setMode] = useState('signup');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async () => {
      if (!email.includes('@')) return setErr('Adresse e-mail invalide.');
      if (pw.length < 6) return setErr('Mot de passe : 6 caractères minimum.');
      if (mode === 'signup' && pw !== pw2) return setErr('Les mots de passe ne correspondent pas.');
      setErr('');
      setBusy(true);
      try {
        const user = mode === 'signup'
          ? await signUp({ email, password: pw, role: 'provider' })
          : await signIn({ email, password: pw });
        setProvider({ id: user.id, email: user.email });
        resetTo('providerHome');
      } catch (e) {
        setErr(e.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : e.message);
      } finally {
        setBusy(false);
      }
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ScreenHeader title={mode === 'signup' ? 'Devenir prestataire' : 'Connexion prestataire'} onBack={pop} />
        <div className="lumina-scroll" style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span className="field-label">E-mail professionnel</span>
            <input className="field-input" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <span className="field-label">Mot de passe</span>
            <input className="field-input" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          {mode === 'signup' && (
            <div>
              <span className="field-label">Confirmer le mot de passe</span>
              <input className="field-input" type="password" placeholder="••••••••" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
          )}
          {err && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{err}</div>}
          <button className="btn-primary" onClick={submit} disabled={busy} style={{ marginTop: 8 }}>{busy ? '...' : mode === 'signup' ? 'Créer mon compte pro' : 'Se connecter'}</button>
          <button className="btn-ghost" style={{ alignSelf: 'center' }} onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    );
  };

  const CreateListing = () => {
    const [name, setName] = useState(providerListing?.name || '');
    const [desc, setDesc] = useState(providerListing?.description || '');
    const [catId, setCatId] = useState(providerListing?.category_id || '');
    const [cityId, setCityId] = useState(providerListing?.city_id || '');
    const [hood, setHood] = useState(providerListing?.neighborhood || '');
    const [address, setAddress] = useState(providerListing?.address || '');
    const [phone, setPhone] = useState(providerListing?.phone?.replace('+213', '') || '');
    const [photo, setPhoto] = useState(providerListing?.photo_url || null); // preview (local blob URL or uploaded URL)
    const [photoFile, setPhotoFile] = useState(null); // pending File to upload on submit
    const [uploading, setUploading] = useState(false);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef(null);

    const cat = CATEGORIES.find((c) => c.id === catId);

    const onPickFile = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { setErr('Merci de choisir une image.'); return; }
      if (file.size > 5 * 1024 * 1024) { setErr('Image trop lourde (5 Mo max).'); return; }
      setErr('');
      setPhotoFile(file);
      setPhoto(URL.createObjectURL(file)); // instant local preview
    };

    const submit = async () => {
      if (!name || !desc || !catId || !cityId || !hood || !phone || phone.length < 8) { setErr('Merci de remplir tous les champs obligatoires.'); return; }
      if (cat?.requires_address && !address) { setErr("L'adresse est requise pour cette catégorie."); return; }
      setErr('');
      setBusy(true);
      try {
        let photoUrl = providerListing?.photo_url || seedPhoto(name || 'new');
        if (photoFile) {
          setUploading(true);
          photoUrl = await uploadListingPhoto(provider.id, photoFile);
          setUploading(false);
        }
        const listing = {
          name, description: desc, category_id: catId, city_id: cityId, neighborhood: hood,
          address: cat?.requires_address ? address : null,
          phone: '+213' + phone,
          photo_url: photoUrl,
        };
        const saved = await upsertMyListing(provider.id, listing);
        setProviderListing(saved);
        resetTo('providerHome');
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
        setUploading(false);
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ScreenHeader title={providerListing ? 'Modifier mon annonce' : 'Créer mon annonce'} onBack={pop} />
        <div className="lumina-scroll" style={{ padding: '4px 20px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
          <div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer', height: 140, borderRadius: 'var(--radius-card)', border: '1.5px dashed var(--color-line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: photo ? undefined : 'var(--color-navy-100)' }}>
            {photo ? <img src={photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
              <><Camera size={22} color="var(--color-navy-500)" /><span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 6 }}>Ajouter une photo</span></>
            )}
            {photo && (
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(11,37,69,0.75)', color: '#fff', borderRadius: 8, padding: '4px 8px', fontSize: 11 }}>
                Changer
              </div>
            )}
          </div>

          <div>
            <span className="field-label">Nom du prestataire / de l'établissement</span>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Atelier Boudiaf — Plomberie" />
          </div>
          <div>
            <span className="field-label">Description</span>
            <textarea className="field-input" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Décrivez votre service en quelques phrases" style={{ resize: 'none' }} />
          </div>
          <div>
            <span className="field-label">Catégorie</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((c) => (
                <div key={c.id} className="pill" onClick={() => setCatId(c.id)} style={{ cursor: 'pointer', background: catId === c.id ? 'var(--color-navy-900)' : 'var(--color-navy-100)', color: catId === c.id ? '#fff' : 'var(--color-navy-700)' }}>{c.name_fr}</div>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label">Ville</span>
            <select className="field-input" value={cityId} onChange={(e) => { setCityId(e.target.value); setHood(''); }}>
              <option value="">Sélectionner une ville</option>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {cityId && (
            <div>
              <span className="field-label">Quartier</span>
              <select className="field-input" value={hood} onChange={(e) => setHood(e.target.value)}>
                <option value="">Sélectionner un quartier</option>
                {neighborhoodsFor(cityId).map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}
          {cat?.requires_address && (
            <div>
              <span className="field-label">Adresse complète</span>
              <input className="field-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Numéro, rue, quartier" />
            </div>
          )}
          <PhoneField value={phone} onChange={setPhone} />
          {err && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{err}</div>}
          <button className="btn-primary" onClick={submit} disabled={busy} style={{ marginTop: 4 }}>
            {uploading ? 'Envoi de la photo...' : busy ? '...' : 'Soumettre pour validation'}
          </button>
        </div>
      </div>
    );
  };

  const StatusPill = ({ status }) => {
    const map = { live: ['status-live', 'En ligne'], pending: ['status-pending', 'En attente'], rejected: ['status-rejected', 'Rejetée'] };
    const [cls, label] = map[status] || map.pending;
    return <span className={'pill ' + cls}>{label}</span>;
  };

  const ProviderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="top-bar"><div className="top-bar-title">Mon espace pro</div></div>
      <div className="lumina-scroll" style={{ padding: '4px 18px 18px' }}>
        {!providerListing ? (
          <div className="card beacon-glow" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Créez votre première annonce</div>
            <div style={{ fontSize: 13.5, color: 'var(--color-text-muted)', marginBottom: 18 }}>Votre annonce sera visible après validation par notre équipe.</div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => push('createListing')}>Créer mon annonce</button>
          </div>
        ) : (
          <>
            <div className="card">
              <div style={{ display: 'flex', gap: 12 }}>
                <img src={providerListing.photo_url} alt={providerListing.name} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{providerListing.name}</div>
                  <div style={{ margin: '5px 0' }}><StatusPill status={providerListing.status} /></div>
                  {providerListing.status === 'live' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Stars value={providerListing.avg_rating} size={12} /><span style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>({providerListing.rating_count} avis)</span></div>
                  )}
                </div>
              </div>
              {providerListing.status === 'rejected' && (
                <div style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)', borderRadius: 10, padding: 10, fontSize: 12.5, marginTop: 12 }}>
                  Motif du refus : {providerListing.rejection_reason || 'aucun motif fourni.'}
                </div>
              )}
              <button className="btn-secondary" style={{ width: '100%', marginTop: 14 }} onClick={() => push('createListing')}>
                <Pencil size={14} /> Modifier l'annonce
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <div className="card" style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>{providerListing.status === 'live' ? providerListing.rating_count * 6 + 12 : 0}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>Vues</div>
              </div>
              <div className="card" style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>{providerListing.avg_rating || '—'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>Note moyenne</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const Support = () => {
    const [msg, setMsg] = useState('');
    const send = async () => {
      if (!msg.trim() || !provider?.id) return;
      const text = msg;
      setMsg('');
      try {
        await sendSupportMessage(provider.id, 'provider', text);
        setSupportThread((t) => [...t, { sender: 'provider', text, created_at: new Date().toISOString() }]);
      } catch (e) { console.error('Message failed', e); }
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="top-bar"><div className="top-bar-title">Support</div></div>
        <div className="lumina-scroll" style={{ padding: '4px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {supportThread.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-faint)', padding: '30px 10px', fontSize: 13 }}>
              Écrivez à l'équipe Lumina si vous avez une question.
            </div>
          )}
          {supportThread.map((m, i) => (
            <div key={m.id || i} style={{ alignSelf: m.sender === 'provider' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{ background: m.sender === 'provider' ? 'var(--color-navy-900)' : 'var(--color-surface)', color: m.sender === 'provider' ? '#fff' : 'var(--color-text)', border: m.sender === 'provider' ? 'none' : '1px solid var(--color-line)', borderRadius: 14, padding: '10px 13px', fontSize: 13.5 }}>{m.text}</div>
              <div style={{ fontSize: 10.5, color: 'var(--color-text-faint)', marginTop: 3, textAlign: m.sender === 'provider' ? 'right' : 'left' }}>
                {m.created_at ? new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: '1px solid var(--color-line)' }}>
          <input className="field-input" placeholder="Écrire un message..." value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
          <div className="icon-btn" style={{ background: 'var(--color-beacon)' }} onClick={send}>
            <Send size={15} color="var(--color-navy-900)" />
          </div>
        </div>
      </div>
    );
  };

  const ProviderProfile = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="top-bar"><div className="top-bar-title">Profil</div></div>
      <div className="lumina-scroll" style={{ padding: '4px 18px 18px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-navy-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="var(--color-navy-700)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{provider.email}</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-faint)' }}>Compte prestataire</div>
          </div>
        </div>
        <button className="btn-secondary" style={{ width: '100%', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
          onClick={() => { signOut(); setProvider(null); setProviderListing(null); resetTo('welcome'); }}>
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );

  const ProviderShell = () => {
    const body = providerTab === 'dashboard' ? <ProviderDashboard /> : providerTab === 'support' ? <Support /> : <ProviderProfile />;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0 }}>{body}</div>
        <div className="tab-bar">
          {[
            { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
            { key: 'support', label: 'Support', icon: MessageCircle },
            { key: 'profile', label: 'Profil', icon: User },
          ].map((t) => (
            <div key={t.key} className="tab-item" onClick={() => setProviderTab(t.key)}>
              {providerTab === t.key && <div className="tab-indicator" />}
              <t.icon size={19} color={providerTab === t.key ? 'var(--color-navy-900)' : 'var(--color-text-faint)'} />
              <span className={'tab-label' + (providerTab === t.key ? ' active' : '')}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ---------- ROUTER ---------- */
  let content;
  if (screen === 'welcome') content = <Welcome />;
  else if (screen === 'citySelect') content = <CitySelect />;
  else if (typeof screen === 'object' && screen.screen === 'viewerAuth') content = <ViewerAuth cityId={screen.cityId} />;
  else if (screen === 'viewerAuth') content = <ViewerAuth cityId={null} />;
  else if (screen === 'viewerHome' || screen === 'categoryList' || screen === 'providerDetail') content = <ViewerShell />;
  else if (screen === 'providerAuth') content = <ProviderAuth />;
  else if (screen === 'createListing') content = <CreateListing />;
  else if (screen === 'providerHome') content = <ProviderShell />;
  else content = <Welcome />;

  // intercept "return to home after call" — simulate app reopen
  useEffect(() => {
    if (pendingRatingFor && screen === 'providerDetail') {
      const t = setTimeout(() => { }, 0);
      return () => clearTimeout(t);
    }
  }, [screen]);

  return (
    <div className="lumina-app-shell">
      <style>{TOKENS_CSS}</style>
      <div className="lumina-root">
        {pendingRatingFor && screen === 'providerDetail' && (
          <div style={{ position: 'absolute', bottom: 90, left: 18, right: 18, zIndex: 40, background: 'var(--color-navy-900)', color: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 30px rgba(11,37,69,0.35)' }}>
            <Phone size={15} color="var(--color-beacon)" />
            <span style={{ fontSize: 12.5, flex: 1 }}>Appel lancé. Revenez à l'accueil pour noter votre expérience.</span>
            <button className="btn-primary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={goHomeAfterCall}>Retour</button>
          </div>
        )}
        {content}
      </div> 
    </div>
  );
}

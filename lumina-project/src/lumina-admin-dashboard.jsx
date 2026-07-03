import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, ListChecks, Tags, Flag, MessageCircle, BarChart3,
  Check, X, Search, Star, ChevronDown, Send, MapPin, AlertCircle, Lock, Mail
} from 'lucide-react';
import {
  supabase, signIn, signOut, getProfile,
  fetchQueue, approveListing, rejectListing,
  fetchOpenReports, resolveReport as dbResolveReport,
  fetchAllSupportThreads, sendSupportMessage,
  subscribeToAdminUpdates,
} from './lumina-supabase';

/* ============================================================
   DESIGN TOKENS (shared with mobile app)
   ============================================================ */
const TOKENS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .lumina-admin{
    --color-navy-900:#0B2545; --color-navy-700:#123A63; --color-navy-500:#2C5F94; --color-navy-100:#E8EEF4;
    --color-bg:#FBFAF6; --color-surface:#FFFFFF; --color-line:#E6E2D8;
    --color-text:#14213A; --color-text-muted:#5B6478; --color-text-faint:#9099AB;
    --color-beacon:#E3A72E; --color-beacon-soft:#F8E6BA; --color-beacon-deep:#B9821B;
    --color-success:#2F7A4F; --color-success-soft:#E4F1E8;
    --color-danger:#B3432B; --color-danger-soft:#F7E7E1;
    --font-display:'Fraunces', serif; --font-body:'Inter', sans-serif; --font-mono:'JetBrains Mono', monospace;
    --radius-card:16px; --radius-control:12px; --radius-pill:999px;
    font-family: var(--font-body); color: var(--color-text); background: var(--color-bg);
    display:flex; min-height:100vh; width:100%;
  }
  .lumina-admin *{ box-sizing:border-box; }
  .a-sidebar{ width:230px; flex-shrink:0; background:var(--color-navy-900); color:#fff; padding:22px 14px; display:flex; flex-direction:column; }
  .a-brand{ display:flex; align-items:center; gap:9px; padding:0 8px 22px; }
  .a-nav-item{ display:flex; align-items:center; gap:11px; padding:11px 12px; border-radius:10px; cursor:pointer; font-size:13.5px; font-weight:500; color:rgba(255,255,255,0.72); margin-bottom:2px; }
  .a-nav-item.active{ background: rgba(227,167,46,0.16); color:#fff; }
  .a-nav-item.active .a-dot{ background:var(--color-beacon); }
  .a-main{ flex:1; min-width:0; display:flex; flex-direction:column; }
  .a-topbar{ display:flex; align-items:center; justify-content:space-between; padding:22px 32px; border-bottom:1px solid var(--color-line); flex-shrink:0; }
  .a-title{ font-family:var(--font-display); font-weight:600; font-size:22px; color:var(--color-navy-900); }
  .a-body{ flex:1; overflow-y:auto; padding:26px 32px 40px; }
  .a-card{ background:var(--color-surface); border:1px solid var(--color-line); border-radius:var(--radius-card); }
  .a-btn-primary{ background:var(--color-beacon); color:var(--color-navy-900); font-weight:700; border:none; border-radius:var(--radius-control); padding:9px 16px; font-size:13.5px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
  .a-btn-secondary{ background:var(--color-surface); color:var(--color-navy-900); font-weight:600; border:1.4px solid var(--color-line); border-radius:var(--radius-control); padding:8px 15px; font-size:13.5px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
  .a-btn-danger{ background:var(--color-danger-soft); color:var(--color-danger); font-weight:600; border:none; border-radius:var(--radius-control); padding:8px 15px; font-size:13.5px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
  .a-input{ font-family:var(--font-body); font-size:13.5px; border:1.4px solid var(--color-line); border-radius:var(--radius-control); padding:9px 12px; outline:none; background:var(--color-surface); }
  .a-input:focus{ border-color:var(--color-beacon); box-shadow:0 0 0 3px rgba(227,167,46,0.16); }
  .a-pill{ border-radius:var(--radius-pill); font-weight:600; font-size:11.5px; padding:4px 11px; display:inline-flex; align-items:center; gap:4px; }
  .a-th{ font-family:var(--font-mono); font-size:10.5px; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-text-faint); text-align:left; padding:9px 14px; border-bottom:1px solid var(--color-line); }
  .a-td{ padding:12px 14px; border-bottom:1px solid var(--color-line); font-size:13.5px; vertical-align:middle; }
  table{ border-collapse:collapse; width:100%; }
`;

/* ============================================================
   REFERENCE DATA — mirrors the categories/cities seeded in
   lumina-schema.sql. Kept static here to avoid a loading spinner
   for data that almost never changes; the queue, reports, and
   support threads below are the live parts, fetched from Supabase.
   ============================================================ */
const CATEGORIES_SEED = [
  { id: 'professional', name_fr: 'Artisans / Pros', name_en: 'Professional', requires_address: false },
  { id: 'medical', name_fr: 'Santé / Cliniques', name_en: 'Medical', requires_address: true },
  { id: 'job', name_fr: 'Emploi', name_en: 'Job & Recruitment', requires_address: false },
  { id: 'media', name_fr: 'Com / Média', name_en: 'Com & Media', requires_address: false },
  { id: 'dine', name_fr: 'Restos / Loisirs', name_en: 'Dine & Leisure', requires_address: true },
  { id: 'hotel', name_fr: 'Hôtels / Spas', name_en: 'Hotels & Spa', requires_address: true },
  { id: 'transport', name_fr: 'Transports / Mobilité', name_en: 'Transport', requires_address: false },
];

const CITIES_SEED = [
  { id: '16', wilaya_code: '16', name: 'Alger' },
  { id: '31', wilaya_code: '31', name: 'Oran' },
  { id: '25', wilaya_code: '25', name: 'Constantine' },
  { id: '09', wilaya_code: '09', name: 'Blida' },
  { id: '19', wilaya_code: '19', name: 'Sétif' },
];

const seedPhoto = (seed) => `https://picsum.photos/seed/${seed}/120/120`;

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Il y a ${hrs} h`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'Hier' : `Il y a ${days} j`;
}

/* ============================================================
   COMPONENTS
   ============================================================ */
function Stars({ value }) {
  const r = Math.round(value);
  return <span style={{ display: 'inline-flex', gap: 1 }}>{[1,2,3,4,5].map((i) => <Star key={i} size={13} fill={i <= r ? 'var(--color-beacon)' : 'none'} stroke="var(--color-beacon)" strokeWidth={1.6} />)}</span>;
}

function unreadCount(thread) {
  let count = 0;
  for (let i = thread.length - 1; i >= 0; i--) {
    if (thread[i].sender === 'admin') break;
    count++;
  }
  return count;
}

function AdminLogin({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    setBusy(true);
    try {
      const user = await signIn({ email, password: pw });
      const profile = await getProfile(user.id);
      if (profile.role !== 'admin') {
        await signOut();
        setErr("Ce compte n'a pas les droits administrateur.");
        return;
      }
      onLoggedIn({ id: user.id, email: user.email });
    } catch (e) {
      setErr(e.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lumina-admin" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <style>{TOKENS_CSS}</style>
      <div className="a-card" style={{ padding: 32, width: 360 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-navy-900)', marginBottom: 4 }}>LUMINA</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-faint)', marginBottom: 22 }}>Connexion administrateur</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.4px solid var(--color-line)', borderRadius: 'var(--radius-control)', padding: '0 10px' }}>
            <Mail size={14} color="var(--color-text-faint)" />
            <input className="a-input" style={{ border: 'none', flex: 1, padding: '10px 0' }} placeholder="admin@lumina.dz" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.4px solid var(--color-line)', borderRadius: 'var(--radius-control)', padding: '0 10px' }}>
            <Lock size={14} color="var(--color-text-faint)" />
            <input className="a-input" type="password" style={{ border: 'none', flex: 1, padding: '10px 0' }} placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          {err && <div style={{ color: 'var(--color-danger)', fontSize: 12.5 }}>{err}</div>}
          <button className="a-btn-primary" style={{ justifyContent: 'center', padding: '11px 16px' }} onClick={submit} disabled={busy}>
            {busy ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LuminaAdmin() {
  const [adminUser, setAdminUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Restore an existing admin session on load
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user;
      if (!user) { setCheckingSession(false); return; }
      try {
        const profile = await getProfile(user.id);
        if (profile.role === 'admin') setAdminUser({ id: user.id, email: user.email });
      } catch { /* no profile — ignore */ }
      setCheckingSession(false);
    });
  }, []);

  if (checkingSession) return null;
  if (!adminUser) return <AdminLogin onLoggedIn={setAdminUser} />;
  return <AdminDashboard adminUser={adminUser} onLogout={() => { signOut(); setAdminUser(null); }} />;
}

function AdminDashboard({ adminUser, onLogout }) {
  const [tab, setTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES_SEED);
  const [cities, setCities] = useState(CITIES_SEED);
  const [supportThreads, setSupportThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const refetchAll = () => {
    fetchQueue().then(setQueue).catch((e) => console.error('Queue fetch failed', e));
    fetchOpenReports().then(setReports).catch((e) => console.error('Reports fetch failed', e));
    fetchAllSupportThreads().then((threads) => {
      setSupportThreads(threads);
      setActiveThread((cur) => cur || threads[0]?.provider_id || null);
    }).catch((e) => console.error('Support fetch failed', e));
  };

  useEffect(() => {
    refetchAll();
    const unsubscribe = subscribeToAdminUpdates({
      onQueueChange: refetchAll,
      onSupportChange: refetchAll,
      onReportChange: refetchAll,
    });
    return unsubscribe;
  }, []);

  const approve = (id) => {
    approveListing(id).then(() => setQueue((q) => q.filter((x) => x.id !== id))).catch((e) => console.error('Approve failed', e));
  };
  const reject = (id) => {
    rejectListing(id, rejectReason).then(() => {
      setQueue((q) => q.filter((x) => x.id !== id));
      setRejectingId(null);
      setRejectReason('');
    }).catch((e) => console.error('Reject failed', e));
  };
  const resolveReport = (id) => {
    dbResolveReport(id).then(() => setReports((r) => r.map((x) => x.id === id ? { ...x, status: 'resolved' } : x))).catch((e) => console.error('Resolve failed', e));
  };

  const nav = [
    { key: 'queue', label: 'File de validation', icon: ListChecks, count: queue.length },
    { key: 'categories', label: 'Catégories & Villes', icon: Tags },
    { key: 'reports', label: 'Signalements', icon: Flag, count: reports.filter(r => r.status === 'open').length },
    { key: 'support', label: 'Support prestataires', icon: MessageCircle, count: supportThreads.reduce((a,t) => a + unreadCount(t.thread), 0) },
    { key: 'analytics', label: 'Analytique', icon: BarChart3 },
  ];


  /* ---------- Review Queue ---------- */
  const Queue = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div className="a-title">File de validation</div>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--color-text-faint)" style={{ position: 'absolute', left: 10, top: 10 }} />
          <input className="a-input" style={{ paddingLeft: 30, width: 220 }} placeholder="Rechercher une annonce" />
        </div>
      </div>
      {queue.length === 0 && (
        <div className="a-card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-faint)' }}>Aucune annonce en attente. La file est à jour.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {queue.map((item) => (
          <div key={item.id} className="a-card" style={{ padding: 16, display: 'flex', gap: 16 }}>
            <img src={item.photo_url || seedPhoto(item.id)} alt={item.name} style={{ width: 76, height: 76, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                <span className="a-pill" style={{ background: 'var(--color-beacon-soft)', color: 'var(--color-beacon-deep)' }}>
                  {categories.find((c) => c.id === item.category_id)?.name_fr || item.category_id}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '5px 0' }}>
                {cities.find((c) => c.id === item.city_id)?.name || item.city_id} · {item.neighborhood} · soumis {timeAgo(item.created_at)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 6 }}>{item.description}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', gap: 14 }}>
                <span>📞 {item.phone}</span>
                {item.address && <span><MapPin size={11} style={{ verticalAlign: -1 }} /> {item.address}</span>}
              </div>
              {rejectingId === item.id && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <input className="a-input" style={{ flex: 1 }} placeholder="Motif du refus (visible par le prestataire)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  <button className="a-btn-danger" disabled={!rejectReason} onClick={() => reject(item.id)}>Confirmer le refus</button>
                  <button className="a-btn-secondary" onClick={() => setRejectingId(null)}>Annuler</button>
                </div>
              )}
            </div>
            {rejectingId !== item.id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button className="a-btn-primary" onClick={() => approve(item.id)}><Check size={14} /> Approuver</button>
                <button className="a-btn-danger" onClick={() => setRejectingId(item.id)}><X size={14} /> Rejeter</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  /* ---------- Categories & Cities ---------- */
  const CategoriesManager = () => (
    <div>
      <div className="a-title" style={{ marginBottom: 18 }}>Catégories & Villes</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <div className="a-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-line)', fontWeight: 700, fontSize: 14 }}>Catégories</div>
          <table>
            <thead><tr><th className="a-th">Nom (FR)</th><th className="a-th">Name (EN)</th><th className="a-th">Adresse requise</th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="a-td">{c.name_fr}</td>
                  <td className="a-td" style={{ color: 'var(--color-text-muted)' }}>{c.name_en}</td>
                  <td className="a-td">
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                      <input type="checkbox" checked={c.requires_address} onChange={() => setCategories((cs) => cs.map((x) => x.id === c.id ? { ...x, requires_address: !x.requires_address } : x))} />
                      <span className="a-pill" style={{ background: c.requires_address ? 'var(--color-navy-100)' : 'var(--color-line)', color: c.requires_address ? 'var(--color-navy-700)' : 'var(--color-text-faint)' }}>{c.requires_address ? 'Oui' : 'Non'}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="a-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-line)', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Villes (wilayas)
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-faint)' }}>58 au total</span>
          </div>
          <table>
            <thead><tr><th className="a-th">Code</th><th className="a-th">Nom</th></tr></thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.id}><td className="a-td" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-faint)' }}>{c.wilaya_code}</td><td className="a-td">{c.name}</td></tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: 12, fontSize: 12, color: 'var(--color-text-faint)' }}>Affichage partiel — liste complète des 58 wilayas gérée en base.</div>
        </div>
      </div>
    </div>
  );

  /* ---------- Reports ---------- */
  const Reports = () => (
    <div>
      <div className="a-title" style={{ marginBottom: 18 }}>Signalements des utilisateurs</div>
      <div className="a-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead><tr><th className="a-th">Annonce</th><th className="a-th">Motif</th><th className="a-th">Signalé par</th><th className="a-th">Statut</th><th className="a-th"></th></tr></thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="a-td" style={{ fontWeight: 600 }}>{r.listings?.name || 'Annonce supprimée'}</td>
                <td className="a-td" style={{ color: 'var(--color-text-muted)', maxWidth: 320 }}>{r.reason}</td>
                <td className="a-td" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.reporter_id ? r.reporter_id.slice(0, 8) : 'Anonyme'}</td>
                <td className="a-td">
                  <span className="a-pill" style={{ background: r.status === 'open' ? 'var(--color-danger-soft)' : 'var(--color-success-soft)', color: r.status === 'open' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {r.status === 'open' ? 'Ouvert' : 'Résolu'}
                  </span>
                </td>
                <td className="a-td">
                  {r.status === 'open' && <button className="a-btn-secondary" onClick={() => resolveReport(r.id)}>Marquer résolu</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ---------- Support ---------- */
  const Support = () => {
    const [msg, setMsg] = useState('');
    const thread = supportThreads.find((t) => t.provider_id === activeThread);
    const send = async () => {
      if (!msg.trim() || !activeThread) return;
      const text = msg;
      setMsg('');
      try {
        await sendSupportMessage(activeThread, 'admin', text);
        setSupportThreads((ts) => ts.map((t) => t.provider_id === activeThread
          ? { ...t, thread: [...t.thread, { sender: 'admin', text, created_at: new Date().toISOString() }] }
          : t));
      } catch (e) { console.error('Send failed', e); }
    };
    return (
      <div>
        <div className="a-title" style={{ marginBottom: 18 }}>Support prestataires</div>
        <div className="a-card" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: 520, overflow: 'hidden' }}>
          <div style={{ borderRight: '1px solid var(--color-line)', overflowY: 'auto' }}>
            {supportThreads.length === 0 && (
              <div style={{ padding: 16, fontSize: 12.5, color: 'var(--color-text-faint)' }}>Aucune conversation pour le moment.</div>
            )}
            {supportThreads.map((t) => {
              const unread = unreadCount(t.thread);
              const last = t.thread[t.thread.length - 1];
              return (
                <div key={t.provider_id} onClick={() => setActiveThread(t.provider_id)} style={{ padding: '13px 16px', cursor: 'pointer', background: activeThread === t.provider_id ? 'var(--color-navy-100)' : 'transparent', borderBottom: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.provider_email}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last ? last.text.slice(0, 34) : ''}</div>
                  </div>
                  {unread > 0 && <span style={{ background: 'var(--color-beacon)', color: 'var(--color-navy-900)', fontSize: 10.5, fontWeight: 700, borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>{unread}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!thread && <div style={{ color: 'var(--color-text-faint)', fontSize: 13, margin: 'auto' }}>Sélectionnez une conversation</div>}
              {thread?.thread.map((m, i) => (
                <div key={m.id || i} style={{ alignSelf: m.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                  <div style={{ background: m.sender === 'admin' ? 'var(--color-navy-900)' : 'var(--color-navy-100)', color: m.sender === 'admin' ? '#fff' : 'var(--color-text)', borderRadius: 12, padding: '9px 12px', fontSize: 13 }}>{m.text}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--color-text-faint)', marginTop: 3, textAlign: m.sender === 'admin' ? 'right' : 'left' }}>{timeAgo(m.created_at)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: '1px solid var(--color-line)' }}>
              <input className="a-input" style={{ flex: 1 }} placeholder="Répondre au prestataire..." value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} disabled={!activeThread} />
              <button className="a-btn-primary" onClick={send} disabled={!activeThread}><Send size={14} /> Envoyer</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Analytics ---------- */
  const Analytics = () => {
    const perCat = [
      { name: 'Professional', value: 34 }, { name: 'Medical', value: 21 }, { name: 'Job', value: 9 },
      { name: 'Media', value: 12 }, { name: 'Dine & Leisure', value: 41 }, { name: 'Hotels & Spa', value: 17 }, { name: 'Transport', value: 15 },
    ];
    const perCity = [{ name: 'Alger', value: 58 }, { name: 'Oran', value: 44 }, { name: 'Constantine', value: 21 }, { name: 'Blida', value: 14 }, { name: 'Sétif', value: 12 }];
    const max1 = Math.max(...perCat.map(d => d.value));
    const max2 = Math.max(...perCity.map(d => d.value));
    return (
      <div>
        <div className="a-title" style={{ marginBottom: 18 }}>Analytique</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {[
            ['149', 'Prestataires actifs'], ['1 284', 'Vues cette semaine'], ['4.6', 'Note moyenne'], [String(queue.length), 'En attente de validation'],
          ].map(([n, l]) => (
            <div key={l} className="a-card" style={{ padding: 18 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--color-navy-900)' }}>{n}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="a-card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Prestataires par catégorie</div>
            {perCat.map((d) => (
              <div key={d.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>{d.name}</span><span style={{ color: 'var(--color-text-faint)' }}>{d.value}</span></div>
                <div style={{ height: 8, background: 'var(--color-navy-100)', borderRadius: 6 }}><div style={{ height: 8, width: `${(d.value/max1)*100}%`, background: 'var(--color-beacon)', borderRadius: 6 }} /></div>
              </div>
            ))}
          </div>
          <div className="a-card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Prestataires par ville</div>
            {perCity.map((d) => (
              <div key={d.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>{d.name}</span><span style={{ color: 'var(--color-text-faint)' }}>{d.value}</span></div>
                <div style={{ height: 8, background: 'var(--color-navy-100)', borderRadius: 6 }}><div style={{ height: 8, width: `${(d.value/max2)*100}%`, background: 'var(--color-navy-500)', borderRadius: 6 }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const panels = { queue: <Queue />, categories: <CategoriesManager />, reports: <Reports />, support: <Support />, analytics: <Analytics /> };
  const activeNav = nav.find((n) => n.key === tab);

  return (
    <div className="lumina-admin">
      <style>{TOKENS_CSS}</style>
      <div className="a-sidebar">
        <div className="a-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.4"><path d="M12 2 9 9h6l-3-7Z" /><path d="M8 9h8l1.5 11a1 1 0 0 1-1 1.1H7.5a1 1 0 0 1-1-1.1L8 9Z" /></svg>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '0.05em' }}>LUMINA</div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', padding: '10px 12px 6px', textTransform: 'uppercase' }}>Admin</div>
        {nav.map((n) => (
          <div key={n.key} className={'a-nav-item' + (tab === n.key ? ' active' : '')} onClick={() => setTab(n.key)}>
            <n.icon size={16} />
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.count > 0 && <span style={{ background: tab === n.key ? 'var(--color-beacon)' : 'rgba(255,255,255,0.15)', color: tab === n.key ? 'var(--color-navy-900)' : '#fff', fontSize: 10.5, fontWeight: 700, borderRadius: 999, padding: '1px 7px' }}>{n.count}</span>}
          </div>
        ))}
      </div>
      <div className="a-main">
        <div className="a-topbar">
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tableau d'administration</div>
            <div className="a-title">{activeNav.label}</div>
          </div>
          <div title={adminUser.email + ' — cliquer pour se déconnecter'} onClick={onLogout} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-navy-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--color-navy-700)', cursor: 'pointer' }}>
            {adminUser.email[0].toUpperCase()}
          </div>
        </div>
        <div className="a-body">{panels[tab]}</div>
      </div>
    </div>
  );
}

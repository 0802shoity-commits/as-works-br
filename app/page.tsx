"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { createClient } from './lib/supabase';

const FEATURES = [
  {
    title: "予約スケジュール",
    desc: "ドラッグ&ドロップで直感的に予約を管理。スタッフごとの空き状況がひと目でわかります。",
    icon: "/karennda.png",
  },
  {
    title: "顧客台帳",
    desc: "来店履歴・車両情報・ペット情報を一元管理。次回アクションの設定で対応漏れを防ぎます。",
    icon: "/kokyakuyoyaku.png",
  },
  {
    title: "WEB予約受付",
    desc: "お客様がスマホから24時間予約可能。空き状況を自動判定し、予約をリアルタイムで反映。",
    icon: "/yoyakugamen.png",
  },
  {
    title: "スタッフ管理",
    desc: "出勤設定、シフト管理、スタッフごとの予約状況を簡単に把握できます。",
    icon: "/shukkin.png",
  },
];

const PLANS = [
  {
    name: "フリープラン",
    price: "¥0",
    period: "",
    features: ["スケジュール管理", "スタッフ出勤管理", "作業カテゴリ設定", "カレンダー表示"],
    cta: "無料で始める",
    accent: false,
  },
  {
    name: "プレミアムプラン",
    price: "¥980",
    period: "/月",
    features: ["フリープランの全機能", "顧客台帳・来店履歴管理", "WEB予約受付", "次回アクション・通知", "作業記録の詳細管理", "30日間無料トライアル"],
    cta: "30日間無料で試す",
    accent: true,
  },
];

const INDUSTRIES = [
  { name: "自動車整備工場", desc: "車検管理・車両情報・ナンバーをまとめて管理", img: "/car-industry.png" },
  { name: "ペットサロン", desc: "犬種・ペット名・トリミング履歴を記録", img: "/pet-industry.png" },
  { name: "美容室・理容室", desc: "お客様の施術履歴・好みを記録して接客向上", img: "/salon-industry.png" },
];

const FAQ = [
  { q: "As-Worksとは何ですか？", a: "小規模サービス業向けの業務管理ツールです。予約スケジュール、顧客台帳、WEB予約受付をひとつのアプリで管理できます。紙やExcelでの管理から移行したい方に最適です。" },
  { q: "どんな業種に対応していますか？", a: "自動車整備工場、ペットサロン、美容室・理容室など、予約制のサービス業に対応しています。業種ごとに管理項目（車種、犬種、施術内容など）をカスタマイズできます。" },
  { q: "無料プランでも使えますか？", a: "はい。スケジュール管理、スタッフ出勤管理、作業カテゴリ設定は無料で使えます。顧客台帳やWEB予約受付はプレミアムプラン（月額¥980）で利用できます。" },
  { q: "スマホから予約を受け付けられますか？", a: "プレミアムプランなら、お客様がスマホから24時間予約できるWEB予約ページを公開できます。予約はリアルタイムでダッシュボードに反映されます。" },
  { q: "解約はいつでもできますか？", a: "はい。月額プランはいつでも解約でき、解約金はかかりません。30日間の無料トライアル期間中にキャンセルすれば料金は発生しません。" },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "As-Works",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "自動車整備工場・ペットサロン・美容室向けの予約管理・顧客台帳SaaS。スケジュール管理、WEB予約受付、顧客台帳をひとつのアプリで。",
  "offers": [
    { "@type": "Offer", "price": "0", "priceCurrency": "JPY", "description": "フリープラン" },
    { "@type": "Offer", "price": "980", "priceCurrency": "JPY", "description": "プレミアムプラン（月額）" }
  ],
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "12" }
};

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage(''); setIsError(false);
    if (isSignUp) {
      if (password.length < 8) { setMessage('パスワードは8文字以上にしてください'); setIsError(true); setLoading(false); return; }
      if (!/[A-Z]/.test(password)) { setMessage('パスワードに大文字を含めてください'); setIsError(true); setLoading(false); return; }
      if (!/[0-9]/.test(password)) { setMessage('パスワードに数字を含めてください'); setIsError(true); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setMessage('Error: ' + error.message); setIsError(true); }
      else if (data.user) { await supabase.from('profiles').insert({ id: data.user.id, name, phone, address }); setMessage('確認メールを送信しました。メール内のリンクをクリックしてください。'); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMessage('メールアドレスまたはパスワードが正しくありません'); setIsError(true); } else { router.push('/dashboard'); }
    }
    setLoading(false);
  };

  const openLoginModal = (signup = false) => { setIsSignUp(signup); setShowLogin(true); setShowEmailForm(false); setMessage(''); };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' };

  return (
    <>
      <Head>
        <title>As-Works | 予約管理・顧客台帳 - 整備工場・ペットサロン・美容室向け</title>
        <meta name="description" content="自動車整備工場・ペットサロン・美容室向けの業務管理ツール。予約スケジュール、顧客台帳、WEB予約受付をひとつのアプリで管理。月額¥980から。" />
        <meta name="keywords" content="予約管理,顧客管理,整備工場,ペットサロン,美容室,SaaS,業務管理,WEB予約" />
        <meta property="og:title" content="As-Works | 予約管理・顧客台帳" />
        <meta property="og:description" content="小規模サービス業向けの予約管理・顧客台帳ツール。月額¥980から。" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </Head>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Noto Sans JP', 'Segoe UI', sans-serif", color: "#1a1a2e" }}>
        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee", padding: "0 40px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0px", fontWeight: "bold", fontSize: "24px" }}>
              <img src="/awwork.png" alt="As-Works" style={{ width: "56px", height: "56px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-4px" }} />
              <span>-Works</span>
            </div>
            <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <a href="#features" style={{ fontSize: "14px", color: "#555", textDecoration: "none" }}>機能</a>
              <a href="#pricing" style={{ fontSize: "14px", color: "#555", textDecoration: "none" }}>料金</a>
              <a href="#faq" style={{ fontSize: "14px", color: "#555", textDecoration: "none" }}>FAQ</a>
              <button onClick={() => openLoginModal(false)} style={{ padding: "8px 24px", borderRadius: "8px", border: "none", background: "#1a1a2e", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>ログイン</button>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 40px 60px", display: "flex", alignItems: "center", gap: "60px" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "42px", fontWeight: "800", lineHeight: 1.3, margin: "0 0 20px", letterSpacing: "-0.5px" }}>
              予約も顧客も、<br />ひとつのアプリで。
            </h1>
            <p style={{ fontSize: "17px", color: "#555", lineHeight: 1.8, margin: "0 0 32px", maxWidth: "480px" }}>
              紙の台帳やExcel管理から卒業。スケジュール、顧客情報、WEB予約をまとめて管理できる、小規模サービス業のための業務ツールです。
            </p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button onClick={() => openLoginModal(true)} style={{ padding: "14px 32px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>無料で始める</button>
              <span style={{ fontSize: "13px", color: "#999" }}>クレジットカード不要</span>
            </div>
            <div style={{ display: "flex", gap: "24px", marginTop: "36px" }}>
              {[["整備工場", "車検・車両管理"], ["ペットサロン", "犬種・トリミング記録"], ["美容室", "施術履歴・予約管理"]].map(([title, sub]) => (
                <div key={title} style={{ fontSize: "13px", color: "#666" }}>
                  <div style={{ fontWeight: "bold", color: "#1a1a2e", marginBottom: "2px" }}>{title}</div>
                  {sub}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: "520px", background: "white", borderRadius: "16px", border: "2px solid #e5e7eb", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", gap: "4px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} /><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} /><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} /></div>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>As-Works ダッシュボード</span>
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", fontSize: "10px", color: "#888" }}>
                  <span style={{ width: "50px" }} />
                  {["9:00","10:00","11:00","12:00","13:00","14:00"].map(t => <span key={t} style={{ flex: 1, textAlign: "center" }}>{t}</span>)}
                </div>
                {[
                  { name: "田中", bars: [{ left: "0%", width: "20%", color: "#4ade80", label: "車検" },{ left: "28%", width: "15%", color: "#60a5fa", label: "洗車" },{ left: "60%", width: "22%", color: "#fb923c", label: "タイヤ交換" }] },
                  { name: "鈴木", bars: [{ left: "5%", width: "25%", color: "#f472b6", label: "コーティング" },{ left: "40%", width: "18%", color: "#fb923c", label: "タイヤ交換" },{ left: "72%", width: "20%", color: "#4ade80", label: "車検" }] },
                  { name: "佐藤", bars: [{ left: "8%", width: "14%", color: "#a78bfa", label: "オイル交換" },{ left: "30%", width: "25%", color: "#4ade80", label: "車検" },{ left: "65%", width: "18%", color: "#60a5fa", label: "洗車" }] },
                ].map(staff => (
                  <div key={staff.name} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ width: "50px", fontSize: "12px", fontWeight: "600", color: "#333", flexShrink: 0 }}>{staff.name}</span>
                    <div style={{ flex: 1, height: "32px", background: "#f8f9fa", borderRadius: "6px", position: "relative" }}>
                      {staff.bars.map((bar, i) => (
                        <div key={i} style={{ position: "absolute", left: bar.left, width: bar.width, height: "100%", background: bar.color, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold", color: "rgba(0,0,0,0.6)" }}>{bar.label}</div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1, background: "#f0fdf4", borderRadius: "8px", padding: "8px 10px", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: "9px", color: "#888", marginBottom: "2px" }}>本日の予約</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#16a34a" }}>8件</div>
                  </div>
                  <div style={{ flex: 1, background: "#f0f0ff", borderRadius: "8px", padding: "8px 10px", border: "1px solid #c7d2fe" }}>
                    <div style={{ fontSize: "9px", color: "#888", marginBottom: "2px" }}>登録顧客</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#6366f1" }}>142名</div>
                  </div>
                  <div style={{ flex: 1, background: "#fffbeb", borderRadius: "8px", padding: "8px 10px", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: "9px", color: "#888", marginBottom: "2px" }}>WEB予約</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#f59e0b" }}>3件</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ background: "#f8f9fb", padding: "80px 40px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", textAlign: "center", margin: "0 0 12px" }}>必要な機能を、シンプルに</h2>
            <p style={{ textAlign: "center", color: "#666", fontSize: "15px", margin: "0 0 48px" }}>小規模店舗の現場で本当に使われる機能だけを搭載</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ background: "white", borderRadius: "16px", padding: "28px", border: "1px solid #eee" }}>
                  <div style={{ width: "100px", height: "100px", borderRadius: "20px", background: "#f0f0ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                    <img src={f.icon} alt="" style={{ width: "150px", height: "150px", objectFit: "cover", mixBlendMode: "multiply" }} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 8px" }}>{f.title}</h3>
                  <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{ padding: "80px 40px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", textAlign: "center", margin: "0 0 12px" }}>料金プラン</h2>
            <p style={{ textAlign: "center", color: "#666", fontSize: "15px", margin: "0 0 48px" }}>まずは無料で、必要になったらアップグレード</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {PLANS.map((plan) => (
                <div key={plan.name} style={{ background: plan.accent ? "linear-gradient(135deg, #1a1a2e, #2d2b55)" : "white", color: plan.accent ? "white" : "#1a1a2e", borderRadius: "20px", padding: "32px", border: plan.accent ? "none" : "2px solid #e5e7eb", position: "relative", overflow: "hidden" }}>
                  {plan.accent && <div style={{ position: "absolute", top: "16px", right: "16px", background: "#f59e0b", color: "#1a1a2e", fontSize: "11px", fontWeight: "bold", padding: "4px 12px", borderRadius: "20px" }}>おすすめ</div>}
                  <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", opacity: plan.accent ? 0.8 : 0.6 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "24px" }}>
                    <span style={{ fontSize: "40px", fontWeight: "800" }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: "15px", opacity: 0.7 }}>{plan.period}</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                        <span style={{ color: plan.accent ? "#10b981" : "#6366f1", fontWeight: "bold" }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => openLoginModal()} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: plan.accent ? "none" : "2px solid #1a1a2e", background: plan.accent ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "white", color: plan.accent ? "white" : "#1a1a2e", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }}>{plan.cta}</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ background: "#f8f9fb", padding: "80px 40px" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", textAlign: "center", margin: "0 0 48px" }}>よくある質問</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {FAQ.map((item, idx) => (
                <div key={idx} style={{ background: "white", borderRadius: "12px", border: "1px solid #eee", overflow: "hidden" }}>
                  <div onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <span style={{ fontSize: "15px", fontWeight: "600" }}>{item.q}</span>
                    <span style={{ fontSize: "18px", color: "#999", transform: openFaq === idx ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                  </div>
                  {openFaq === idx && (
                    <div style={{ padding: "0 24px 18px", fontSize: "14px", color: "#666", lineHeight: 1.8 }}>{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "80px 40px", textAlign: "center" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 16px" }}>業務管理をもっとシンプルに</h2>
          <p style={{ fontSize: "15px", color: "#666", margin: "0 0 32px" }}>まずは無料プランから。30秒で登録完了。</p>
          <button onClick={() => openLoginModal(true)} style={{ padding: "16px 40px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>無料で始める</button>
        </section>

        {/* Login Modal */}
        {showLogin && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowLogin(false)}>
            <div style={{ width: "420px", background: "white", borderRadius: "20px", padding: "36px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "#1a1a2e", margin: 0 }}>{isSignUp ? "アカウント作成" : "ログイン"}</h2>
                <span onClick={() => setShowLogin(false)} style={{ cursor: "pointer", color: "#ccc", fontSize: "24px" }}>×</span>
              </div>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>{isSignUp ? "無料でアカウントを作成" : "As-Worksにログイン"}</p>

              <button onClick={handleGoogle} style={{ width: "100%", padding: "12px", marginBottom: "10px", background: "#fff", border: "2px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#374151" }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Googleでログイン
              </button>
              <button onClick={() => setShowEmailForm(!showEmailForm)} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#fff", border: "2px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#374151" }}>
                メールでログイン
              </button>

              {showEmailForm && (<>
                {message && (<div style={{ background: isError ? "#fff0f0" : "#f0fdf4", border: `1px solid ${isError ? "#fca5a5" : "#86efac"}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: isError ? "#dc2626" : "#16a34a" }}>{message}</div>)}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {isSignUp && (<>
                    <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px" }}>お名前</label><input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="山田 太郎" style={inputStyle} /></div>
                    <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px" }}>電話番号</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="090-0000-0000" style={inputStyle} /></div>
                    <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px" }}>住所</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} required placeholder="東京都渋谷区..." style={inputStyle} /></div>
                  </>)}
                  <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px" }}>メールアドレス</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@email.com" style={inputStyle} /></div>
                  <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px" }}>パスワード</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={isSignUp ? "8文字以上・大文字・数字を含む" : "パスワード"} style={inputStyle} /></div>
                  <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "#9ca3af" : "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "処理中..." : (isSignUp ? "アカウント作成" : "ログイン")}</button>
                </form>
                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>{isSignUp ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"}</span>
                  <span onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }} style={{ fontSize: "12px", color: "#4f46e5", fontWeight: "bold", cursor: "pointer", marginLeft: "6px", textDecoration: "underline" }}>{isSignUp ? "ログイン" : "新規登録"}</span>
                </div>
              </>)}

              <div style={{ marginTop: "16px", fontSize: "10px", color: "#9ca3af", textAlign: "center", lineHeight: 1.6 }}>
                ご利用の際は<a href="/terms" style={{ color: "#4f46e5", textDecoration: "underline" }}>利用規約</a>と<a href="/privacy" style={{ color: "#4f46e5", textDecoration: "underline" }}>プライバシーポリシー</a>に同意したものとみなします
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ borderTop: "1px solid #eee", padding: "40px", background: "#fafafa" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0px", fontWeight: "bold", fontSize: "18px" }}>
              <img src="/awwork.png" alt="As-Works" style={{ width: "40px", height: "40px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-2px" }} />
              <span>-Works</span>
            </div>
            <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "#888" }}>
              <a href="/terms" style={{ color: "#888", textDecoration: "none" }}>利用規約</a>
              <a href="/privacy" style={{ color: "#888", textDecoration: "none" }}>プライバシーポリシー</a>
            </div>
            <div style={{ fontSize: "12px", color: "#aaa" }}>© 2026 As-Works</div>
          </div>
        </footer>
      </div>
    </>
  );
}

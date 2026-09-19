"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    { icon: "📅", title: "予約管理", desc: "ドラッグ&ドロップで直感的にスケジュール管理。スタッフの出勤状況もひと目で把握できます。", color: "#6366f1" },
    { icon: "👤", title: "顧客台帳", desc: "お客様の情報・来店履歴・作業記録を一元管理。次回フォローアップも自動で通知します。", color: "#10b981" },
    { icon: "🌐", title: "WEB予約受付", desc: "お客様がスマホから24時間いつでも予約可能。空き状況を自動判定して受付します。", color: "#f59e0b" },
    { icon: "📊", title: "作業カテゴリ管理", desc: "業種に合わせた作業項目を自由にカスタマイズ。カテゴリごとに色分けして見やすく管理。", color: "#ec4899" },
  ];

  const businesses = [
    { icon: "🚗", name: "自動車整備工場", desc: "車検・点検・修理の予約管理に" },
    { icon: "🐾", name: "ペットサロン", desc: "トリミング・ホテルの予約管理に" },
    { icon: "💇", name: "美容室・理容室", desc: "カット・カラーの予約管理に" },
    { icon: "🏥", name: "クリニック・治療院", desc: "施術・診察の予約管理に" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Segoe UI', 'Hiragino Sans', sans-serif" }}>

      {/* ヘッダー */}
      <header style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0px", fontSize: "22px", fontWeight: "bold", color: "#1a1a2e", whiteSpace: "nowrap" }}>
          <img src="/awwork.png" alt="As-Works" style={{ width: "50px", height: "50px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-4px" }} />
          -Works
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => router.push("/login")} style={{ padding: "10px 24px", borderRadius: "10px", border: "2px solid #6366f1", background: "white", color: "#6366f1", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>ログイン</button>
          <button onClick={() => router.push("/login")} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>無料で始める</button>
        </div>
      </header>

      {/* ヒーロー */}
      <section style={{ padding: "80px 40px", textAlign: "center", background: "linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: "20px", background: "#eef2ff", color: "#6366f1", fontSize: "13px", fontWeight: "bold", marginBottom: "20px" }}>
            🎉 無料プランあり・クレジットカード不要
          </div>
          <h1 style={{ fontSize: "44px", fontWeight: "800", color: "#1a1a2e", lineHeight: "1.3", marginBottom: "20px" }}>
            予約も顧客も、<br />
            <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>これひとつで管理</span>
          </h1>
          <p style={{ fontSize: "18px", color: "#6b7280", lineHeight: "1.8", marginBottom: "40px" }}>
            As-Worksは、自動車整備工場・ペットサロン・美容室など<br />
            サービス業のための業務管理アプリです。
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button onClick={() => router.push("/login")} style={{ padding: "16px 40px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.3)", transition: "transform 0.2s" }}>
              無料で始める →
            </button>
          </div>
        </div>
        {/* ダッシュボードスクリーンショット */}
        <div style={{ marginTop: "60px", maxWidth: "1000px", marginLeft: "auto", marginRight: "auto", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "2px solid #e5e7eb" }}>
          <img src="/screenshot-dashboard.png" alt="As-Works ダッシュボード画面" style={{ width: "100%", display: "block" }} />
        </div>
      </section>

      {/* 対応業種 */}
      <section style={{ padding: "60px 40px", background: "#ffffff" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "40px" }}>こんな業種に対応しています</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", maxWidth: "900px", margin: "0 auto" }}>
          {businesses.map((b, i) => (
            <div key={i} style={{ textAlign: "center", padding: "30px 20px", borderRadius: "16px", border: "2px solid #f0f0f0", background: "#fafafa", transition: "all 0.2s" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>{b.icon}</div>
              <div style={{ fontSize: "15px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "6px" }}>{b.name}</div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 主な機能 */}
      <section style={{ padding: "80px 40px", background: "#f8f9ff" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "12px" }}>主な機能</h2>
        <p style={{ textAlign: "center", fontSize: "15px", color: "#9ca3af", marginBottom: "50px" }}>必要な機能がすべて揃っています</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", maxWidth: "800px", margin: "0 auto" }}>
          {features.map((f, i) => (
            <div key={i} onMouseEnter={() => setHoveredFeature(i)} onMouseLeave={() => setHoveredFeature(null)} style={{ padding: "30px", borderRadius: "16px", background: "white", border: `2px solid ${hoveredFeature === i ? f.color : "#f0f0f0"}`, boxShadow: hoveredFeature === i ? `0 8px 24px ${f.color}20` : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s", cursor: "default" }}>
              <div style={{ fontSize: "36px", marginBottom: "14px" }}>{f.icon}</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "8px" }}>{f.title}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.7" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 料金 */}
      <section style={{ padding: "80px 40px", background: "#ffffff" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "50px" }}>料金プラン</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ padding: "36px", borderRadius: "16px", border: "2px solid #e5e7eb", background: "white" }}>
            <div style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "bold", marginBottom: "8px" }}>FREE</div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "4px" }}>¥0<span style={{ fontSize: "14px", color: "#9ca3af" }}>/月</span></div>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}>個人・お試しに</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#4b5563" }}>
              <div>✓ 予約管理（ドラッグ&ドロップ）</div>
              <div>✓ スタッフ出勤管理</div>
              <div>✓ カテゴリ・項目カスタマイズ</div>
              <div>✓ 一括ブロック設定</div>
            </div>
            <button onClick={() => router.push("/login")} style={{ width: "100%", padding: "12px", marginTop: "24px", borderRadius: "10px", border: "2px solid #6366f1", background: "white", color: "#6366f1", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>無料で始める</button>
          </div>
          <div style={{ padding: "36px", borderRadius: "16px", border: "2px solid #6366f1", background: "linear-gradient(135deg, #fafaff, #f0f0ff)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 12px", borderRadius: "20px", background: "#6366f1", color: "white", fontSize: "11px", fontWeight: "bold" }}>おすすめ</div>
            <div style={{ fontSize: "13px", color: "#6366f1", fontWeight: "bold", marginBottom: "8px" }}>PREMIUM</div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "4px" }}>¥980<span style={{ fontSize: "14px", color: "#9ca3af" }}>/月</span></div>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}>30日間無料トライアル</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#4b5563" }}>
              <div>✓ 無料プランの全機能</div>
              <div>✓ WEB予約受付</div>
              <div>✓ 顧客台帳・来店履歴</div>
              <div>✓ 次回アクション通知</div>
              <div>✓ 作業詳細の記録・編集</div>
            </div>
            <button onClick={() => router.push("/login")} style={{ width: "100%", padding: "12px", marginTop: "24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>30日間無料で試す</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 40px", background: "linear-gradient(135deg, #1a1a2e, #0f3460)", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginBottom: "16px" }}>今すぐ始めましょう</h2>
        <p style={{ fontSize: "15px", color: "#94a3b8", marginBottom: "32px" }}>クレジットカード不要・メールアドレスだけで登録完了</p>
        <button onClick={() => router.push("/login")} style={{ padding: "16px 48px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
          無料アカウントを作成 →
        </button>
      </section>

      {/* フッター */}
      <footer style={{ padding: "30px 40px", background: "#0f172a", textAlign: "center" }}>
        <div style={{ fontSize: "13px", color: "#64748b" }}>© 2026 As-Works. All rights reserved.</div>
      </footer>
    </div>
  );
}
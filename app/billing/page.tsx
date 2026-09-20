"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";

const supabase = createClient();

interface UserPlan {
  plan: "free" | "premium";
  started_at: string | null;
  expires_at: string | null;
}

const PREMIUM_PRICE = 980;

const FREE_FEATURES = [
  { text: "予約管理（基本）", available: true },
  { text: "顧客台帳（50件まで）", available: true },
  { text: "ダッシュボード", available: true },
  { text: "WEB予約ページ", available: false },
  { text: "次回アクション管理", available: false },
  { text: "スタッフ無制限", available: false },
  { text: "顧客無制限", available: false },
  { text: "メッセージ・通知", available: false },
  { text: "優先サポート", available: false },
];

const PREMIUM_FEATURES = [
  { text: "予約管理（フル機能）", available: true },
  { text: "顧客台帳（無制限）", available: true },
  { text: "ダッシュボード", available: true },
  { text: "WEB予約ページ", available: true },
  { text: "次回アクション管理", available: true },
  { text: "スタッフ無制限", available: true },
  { text: "顧客無制限", available: true },
  { text: "メッセージ・通知", available: true },
  { text: "優先サポート", available: true },
];

export default function BillingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<UserPlan>({ plan: "free", started_at: null, expires_at: null });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? "");

      const { data: planData } = await supabase
        .from("user_plans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (planData) {
        setCurrentPlan({
          plan: planData.plan ?? "free",
          started_at: planData.started_at,
          expires_at: planData.expires_at,
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: userEmail }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert("エラーが発生しました。もう一度お試しください。");
    }
    setCheckoutLoading(false);
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert("エラーが発生しました。もう一度お試しください。");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", color: "#fff" }}>
      読み込み中...
    </div>
  );

  const isPremium = currentPlan.plan === "premium";

  return (
    <>
      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-area { background: #fff !important; color: #000 !important; padding: 20px !important; }
          .print-area * { color: #000 !important; border-color: #ccc !important; }
          .print-area h1, .print-area h3 { color: #1a1a2e !important; }
          .plan-card { background: #f8f9fa !important; border: 1px solid #ccc !important; }
          .plan-card span, .plan-card div { color: #333 !important; }
          .plan-label { color: #666 !important; }
        }
      `}</style>

      <div className="print-area" style={{ background: "#0f172a", minHeight: "100vh", padding: "24px", color: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>

          {/* ヘッダー */}
          <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <button onClick={() => router.push("/reservations")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}>←</button>
            <h1 style={{ margin: 0, fontSize: 22 }}>請求管理</h1>
          </div>

          {/* 印刷用ヘッダー */}
          <div style={{ display: "none" }} className="print-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #1a1a2e" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24 }}>請求明細書</h1>
                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>INVOICE</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>As-Works</div>
                <div style={{ fontSize: 12, color: "#666" }}>ビジネス管理システム</div>
              </div>
            </div>
          </div>

          {/* 現在のプランカード */}
          <div className="plan-card" style={{
            background: isPremium
              ? "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)"
              : "#1e293b",
            borderRadius: 14, padding: "28px 32px", marginBottom: 24,
            border: isPremium ? "1px solid #3b82f6" : "1px solid #334155",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="plan-label" style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>現在のプラン</div>
                <div style={{ fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                  {isPremium ? (
                    <span style={{ color: "#60a5fa" }}>⭐ プレミアム</span>
                  ) : (
                    <span>無料プラン</span>
                  )}
                </div>
                {isPremium && currentPlan.expires_at && (
                  <div className="plan-label" style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                    有効期限：{currentPlan.expires_at}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {isPremium ? `¥${PREMIUM_PRICE.toLocaleString()}` : "¥0"}
                </div>
                <div className="plan-label" style={{ fontSize: 13, color: "#94a3b8" }}>/月（税込）</div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="no-print">
              {isPremium ? (
                <button
                  onClick={handleManageSubscription}
                  style={{
                    marginTop: 20, width: "100%", background: "#334155",
                    border: "1px solid #475569", color: "#fff", padding: "14px",
                    borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  サブスクリプションを管理
                </button>
              ) : (
                <button
                  onClick={() => setShowUpgrade(!showUpgrade)}
                  style={{
                    marginTop: 20, width: "100%", background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    border: "none", color: "#fff", padding: "14px", borderRadius: 10,
                    fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
                  }}
                >
                  🚀 プレミアムにアップグレード
                </button>
              )}
            </div>
          </div>

          {/* プラン比較 */}
          {showUpgrade && !isPremium && (
            <div className="no-print" style={{
              background: "#1e293b", borderRadius: 14, padding: "28px 32px",
              marginBottom: 24, border: "1px solid #334155",
            }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 18 }}>プラン比較</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* 無料 */}
                <div style={{ background: "#0f172a", borderRadius: 12, padding: "20px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>無料</div>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>¥0<span style={{ fontSize: 13, color: "#94a3b8" }}>/月</span></div>
                  {FREE_FEATURES.map((f, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "5px 0", color: f.available ? "#e2e8f0" : "#475569", display: "flex", gap: 8 }}>
                      <span>{f.available ? "✅" : "—"}</span>
                      <span style={{ textDecoration: f.available ? "none" : "line-through" }}>{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* プレミアム */}
                <div style={{
                  background: "#0f172a", borderRadius: 12, padding: "20px",
                  border: "2px solid #3b82f6", position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: -10, right: 16, background: "#3b82f6",
                    color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 20,
                  }}>おすすめ</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#60a5fa" }}>プレミアム</div>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>¥{PREMIUM_PRICE.toLocaleString()}<span style={{ fontSize: 13, color: "#94a3b8" }}>/月（税込）</span></div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>30日間無料トライアル</div>
                  {PREMIUM_FEATURES.map((f, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "5px 0", color: "#e2e8f0", display: "flex", gap: 8 }}>
                      <span>✅</span><span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stripe決済ボタン */}
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                style={{
                  marginTop: 20, width: "100%",
                  background: checkoutLoading ? "#334155" : "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none", color: "#fff", padding: "16px",
                  borderRadius: 10, fontSize: 16, fontWeight: 700,
                  cursor: checkoutLoading ? "default" : "pointer",
                  opacity: checkoutLoading ? 0.6 : 1,
                }}
              >
                {checkoutLoading ? "処理中..." : "💳 30日間無料で試す"}
              </button>
              <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 8 }}>
                クレジットカード決済（Stripe）・いつでも解約可能
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="no-print" style={{ marginTop: 24, color: "#64748b", fontSize: 13, lineHeight: 2 }}>
            <div style={{ fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>よくある質問</div>
            <div>Q: プレミアムはいつから使えますか？<br />A: お支払い完了後、すぐにご利用いただけます。</div>
            <div style={{ marginTop: 8 }}>Q: 解約はできますか？<br />A: いつでも解約可能です。次回更新日までご利用いただけます。</div>
            <div style={{ marginTop: 8 }}>Q: 請求明細は確認できますか？<br />A: 「サブスクリプションを管理」から請求履歴を確認できます。</div>
          </div>
        </div>
      </div>
    </>
  );
}

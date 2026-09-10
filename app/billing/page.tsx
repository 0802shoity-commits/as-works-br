"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";

const supabase = createClient();

// ── 型定義 ──────────────────────────────────────────
interface UserPlan {
  plan: "free" | "premium";
  started_at: string | null;
  expires_at: string | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  status: "pending" | "confirmed" | "rejected";
  note: string;
  created_at: string;
  confirmed_at: string | null;
}

// ── 定数 ────────────────────────────────────────────
const PREMIUM_PRICE = 2980;

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

const BANK_INFO = {
  bank: "〇〇銀行",
  branch: "△△支店",
  type: "普通",
  number: "1234567",
  holder: "カ）エーエスワークス",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "確認中",
  confirmed: "確認済み",
  rejected: "差し戻し",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#22c55e",
  rejected: "#ef4444",
};

// ════════════════════════════════════════════════════
export default function BillingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<UserPlan>({ plan: "free", started_at: null, expires_at: null });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferNote, setTransferNote] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  // ── 初期読み込み ──────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      // プラン情報取得
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

      // 支払い履歴取得
      const { data: payData } = await supabase
        .from("payment_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (payData) setPayments(payData);

      setLoading(false);
    })();
  }, []);

  // ── 振込報告を送信 ────────────────────────────────
  const submitTransferReport = async () => {
    if (!userId) return;
    setSubmitting(true);
    await supabase.from("payment_reports").insert({
      user_id: userId,
      amount: PREMIUM_PRICE,
      method: "bank_transfer",
      status: "pending",
      note: `振込日: ${transferDate}\n${transferNote}`.trim(),
    });

    // 支払い履歴を再取得
    const { data } = await supabase
      .from("payment_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setPayments(data);

    setSubmitting(false);
    setShowTransferForm(false);
    setSubmitDone(true);
    setTransferNote("");
    setTimeout(() => setSubmitDone(false), 4000);
  };

  // ── ローディング ──────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", color: "#fff" }}>
      読み込み中...
    </div>
  );

  const isPremium = currentPlan.plan === "premium";

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: "24px", color: "#fff" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <button onClick={() => router.push("/reservations")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}>←</button>
          <h1 style={{ margin: 0, fontSize: 22 }}>請求管理</h1>
        </div>

        {/* 完了メッセージ */}
        {submitDone && (
          <div style={{
            background: "#065f46", border: "1px solid #10b981", borderRadius: 10,
            padding: "14px 20px", marginBottom: 20, fontSize: 14,
          }}>
            ✅ 振込報告を送信しました。確認まで1〜2営業日お待ちください。
          </div>
        )}

        {/* ── 現在のプランカード ───────────────────── */}
        <div style={{
          background: isPremium
            ? "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)"
            : "#1e293b",
          borderRadius: 14, padding: "28px 32px", marginBottom: 24,
          border: isPremium ? "1px solid #3b82f6" : "1px solid #334155",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>現在のプラン</div>
              <div style={{ fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                {isPremium ? (
                  <><span style={{ color: "#60a5fa" }}>⭐ プレミアム</span></>
                ) : (
                  <span>無料プラン</span>
                )}
              </div>
              {isPremium && currentPlan.expires_at && (
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                  有効期限：{currentPlan.expires_at}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>
                {isPremium ? `¥${PREMIUM_PRICE.toLocaleString()}` : "¥0"}
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>/月</div>
            </div>
          </div>

          {!isPremium && (
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

        {/* ── プラン比較 ──────────────────────────── */}
        {showUpgrade && !isPremium && (
          <div style={{
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
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>¥{PREMIUM_PRICE.toLocaleString()}<span style={{ fontSize: 13, color: "#94a3b8" }}>/月</span></div>
                {PREMIUM_FEATURES.map((f, i) => (
                  <div key={i} style={{ fontSize: 13, padding: "5px 0", color: "#e2e8f0", display: "flex", gap: 8 }}>
                    <span>✅</span><span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 振込案内 */}
            <div style={{
              background: "#0c1929", borderRadius: 12, padding: "24px",
              marginTop: 20, border: "1px solid #1e3a5f",
            }}>
              <h4 style={{ margin: "0 0 14px", fontSize: 16, color: "#60a5fa" }}>💳 お支払い方法：銀行振込</h4>
              <div style={{ fontSize: 14, lineHeight: 2 }}>
                <div><span style={bankLabel}>銀行名</span>{BANK_INFO.bank}</div>
                <div><span style={bankLabel}>支店名</span>{BANK_INFO.branch}</div>
                <div><span style={bankLabel}>口座種別</span>{BANK_INFO.type}</div>
                <div><span style={bankLabel}>口座番号</span>{BANK_INFO.number}</div>
                <div><span style={bankLabel}>口座名義</span>{BANK_INFO.holder}</div>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 12, lineHeight: 1.8 }}>
                ※ 振込手数料はお客様のご負担となります。<br />
                ※ 振込確認後、1〜2営業日以内にプレミアムが有効になります。
              </div>

              {!showTransferForm ? (
                <button
                  onClick={() => setShowTransferForm(true)}
                  style={{
                    marginTop: 16, width: "100%", background: "#22c55e",
                    border: "none", color: "#fff", padding: "12px",
                    borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  📨 振込完了を報告する
                </button>
              ) : (
                <div style={{ marginTop: 16, background: "#1e293b", borderRadius: 10, padding: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>振込日</label>
                    <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>振込名義・メモ（任意）</label>
                    <input value={transferNote} onChange={e => setTransferNote(e.target.value)}
                      style={inputStyle} placeholder="例: アイハラ タロウ" />
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
                    金額：¥{PREMIUM_PRICE.toLocaleString()}（税込）
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowTransferForm(false)}
                      style={{ ...btnStyle("#334155"), flex: 1 }}>キャンセル</button>
                    <button onClick={submitTransferReport} disabled={submitting}
                      style={{ ...btnStyle("#22c55e"), flex: 2, opacity: submitting ? 0.6 : 1 }}>
                      {submitting ? "送信中..." : "✅ 報告を送信"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 支払い履歴 ─────────────────────────── */}
        <div style={{
          background: "#1e293b", borderRadius: 14, padding: "24px 28px",
          border: "1px solid #334155",
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>支払い履歴</h3>

          {payments.length === 0 ? (
            <div style={{ textAlign: "center", color: "#475569", padding: "32px 0", fontSize: 14 }}>
              支払い履歴はまだありません
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>日付</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>内容</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>金額</th>
                  <th style={{ textAlign: "center", padding: "8px 12px" }}>ステータス</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #263040" }}>
                    <td style={{ padding: "10px 12px", color: "#94a3b8" }}>
                      {new Date(p.created_at).toLocaleDateString("ja-JP")}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      プレミアムプラン（月額）
                      {p.note && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{p.note}</div>}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                      ¥{p.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span style={{
                        background: (STATUS_COLOR[p.status] ?? "#888") + "22",
                        color: STATUS_COLOR[p.status] ?? "#888",
                        padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      }}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 24, color: "#64748b", fontSize: 13, lineHeight: 2 }}>
          <div style={{ fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>よくある質問</div>
          <div>Q: プレミアムはいつから使えますか？<br />A: 振込確認後、1〜2営業日以内に有効化されます。</div>
          <div style={{ marginTop: 8 }}>Q: 解約はできますか？<br />A: いつでも解約可能です。次回更新日までご利用いただけます。</div>
          <div style={{ marginTop: 8 }}>Q: 領収書は発行されますか？<br />A: ご希望の方はお問い合わせください。</div>
        </div>
      </div>
    </div>
  );
}

// ── スタイル ─────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", background: "#0f172a", border: "1px solid #334155",
  borderRadius: 6, padding: "8px 10px", color: "#fff", fontSize: 14,
  boxSizing: "border-box", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4,
};
const btnStyle = (bg: string): React.CSSProperties => ({
  background: bg, border: "none", color: "#fff", padding: "10px 18px",
  borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
});
const bankLabel: React.CSSProperties = {
  display: "inline-block", width: 90, color: "#94a3b8",
};

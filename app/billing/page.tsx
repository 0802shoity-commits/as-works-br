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

const PREMIUM_PRICE = 29.9;
const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FREE_FEATURES = [
  { text: "Agendamentos (básico)", available: true },
  { text: "Clientes (até 50)", available: true },
  { text: "Painel", available: true },
  { text: "Página de agendamento online", available: false },
  { text: "Próximas ações", available: false },
  { text: "Equipe ilimitada", available: false },
  { text: "Clientes ilimitados", available: false },
  { text: "Mensagens e notificações", available: false },
  { text: "Suporte prioritário", available: false },
];

const PREMIUM_FEATURES = [
  { text: "Agendamentos (completo)", available: true },
  { text: "Clientes (ilimitado)", available: true },
  { text: "Painel", available: true },
  { text: "Página de agendamento online", available: true },
  { text: "Próximas ações", available: true },
  { text: "Equipe ilimitada", available: true },
  { text: "Clientes ilimitados", available: true },
  { text: "Mensagens e notificações", available: true },
  { text: "Suporte prioritário", available: true },
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
      alert("Ocorreu um erro. Tente novamente.");
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
      alert("Ocorreu um erro. Tente novamente.");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", color: "#fff" }}>
      Carregando...
    </div>
  );

  const isPremium = currentPlan.plan === "premium";

  return (
    <>
      {/* 印刷用スタイル */}
      <style>{`
  .no-screen { display: none; }
  @media print {
    body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .no-screen { display: block !important; }
    .print-area { background: #fff !important; color: #000 !important; padding: 20px !important; }
    .print-area * { color: #000 !important; border-color: #ccc !important; background: transparent !important; }
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
            <h1 style={{ margin: 0, fontSize: 22 }}>Faturamento</h1>
          </div>

          {/* 印刷用ヘッダー */}
          <div className="no-screen print-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #1a1a2e" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24 }}>Fatura</h1>
                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>INVOICE</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>As-Works</div>
                <div style={{ fontSize: 12, color: "#666" }}>Sistema de gestão</div>
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
                <div className="plan-label" style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Plano atual</div>
                <div style={{ fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                  {isPremium ? (
                    <span style={{ color: "#60a5fa" }}>⭐ Premium</span>
                  ) : (
                    <span>Plano Grátis</span>
                  )}
                </div>
                {isPremium && currentPlan.expires_at && (
                  <div className="plan-label" style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                    Válido até: {currentPlan.expires_at}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {isPremium ? brl(PREMIUM_PRICE) : "R$ 0"}
                </div>
                <div className="plan-label" style={{ fontSize: 13, color: "#94a3b8" }}>/mês</div>
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
                  Gerenciar assinatura
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
                  🚀 Fazer upgrade para Premium
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
              <h3 style={{ margin: "0 0 20px", fontSize: 18 }}>Comparar planos</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* 無料 */}
                <div style={{ background: "#0f172a", borderRadius: 12, padding: "20px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Grátis</div>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>R$ 0<span style={{ fontSize: 13, color: "#94a3b8" }}>/mês</span></div>
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
                  }}>Recomendado</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#60a5fa" }}>Premium</div>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{brl(PREMIUM_PRICE)}<span style={{ fontSize: 13, color: "#94a3b8" }}>/mês</span></div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>30 dias de teste grátis</div>
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
                {checkoutLoading ? "Processando..." : "💳 Testar grátis por 30 dias"}
              </button>
              <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 8 }}>
                Pagamento com cartão de crédito (Stripe) · cancele quando quiser
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="no-print" style={{ marginTop: 24, color: "#64748b", fontSize: 13, lineHeight: 2 }}>
            <div style={{ fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>Perguntas frequentes</div>
            <div>P: Quando posso usar o Premium?<br />R: Imediatamente após a confirmação do pagamento.</div>
            <div style={{ marginTop: 8 }}>P: Posso cancelar?<br />R: Sim, a qualquer momento. Você continua com acesso até a próxima data de renovação.</div>
            <div style={{ marginTop: 8 }}>P: Onde vejo minhas faturas?<br />R: Em "Gerenciar assinatura" você encontra o histórico de cobranças.</div>
          </div>
        </div>
      </div>
    </>
  );
}

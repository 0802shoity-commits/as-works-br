"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '../lib/supabase';

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
};

export default function UpgradeModal({ open, onClose, userId }: Props) {
  const [step, setStep] = useState<'plan' | 'payment'>('plan');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'paypal' | null>(null);
  const [loading, setLoading] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalError, setPaypalError] = useState(false);
  const [paypalRedirectLoading, setPaypalRedirectLoading] = useState(false);
  const paypalBtnRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);
  const supabase = createClient();

  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const PAYPAL_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;

  const handleClose = () => {
    setStep('plan');
    setSelectedMethod(null);
    setPaypalReady(false);
    setPaypalError(false);
    setPaypalRedirectLoading(false);
    paypalRendered.current = false;
    onClose();
  };

  // PayPal SDK読み込み
  useEffect(() => {
    if (selectedMethod !== 'paypal' || !PAYPAL_CLIENT_ID) return;

    const paypal = (window as any).paypal;
    if (paypal) { setPaypalReady(true); return; }

    const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existingScript) {
      const checkPaypal = setInterval(() => {
        if ((window as any).paypal) { setPaypalReady(true); clearInterval(checkPaypal); }
      }, 500);
      setTimeout(() => { clearInterval(checkPaypal); if (!(window as any).paypal) setPaypalError(true); }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription&currency=BRL`;
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if ((window as any).paypal) { setPaypalReady(true); clearInterval(check); }
      }, 300);
      setTimeout(() => { clearInterval(check); if (!(window as any).paypal) setPaypalError(true); }, 8000);
    };
    script.onerror = () => { setPaypalError(true); };
    document.body.appendChild(script);
  }, [selectedMethod, PAYPAL_CLIENT_ID]);

  // PayPalボタンレンダリング
  useEffect(() => {
    if (selectedMethod !== 'paypal' || !paypalReady || !paypalBtnRef.current || !PAYPAL_PLAN_ID) return;
    if (paypalRendered.current) return;

    const paypal = (window as any).paypal;
    if (!paypal) return;

    paypalRendered.current = true;

    try {
      paypal.Buttons({
        style: { shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' },
        createSubscription: (_data: any, actions: any) => {
          return actions.subscription.create({ plan_id: PAYPAL_PLAN_ID });
        },
        onApprove: async (data: any) => {
          if (userId) {
            await supabase.from('user_plans').upsert(
              { user_id: userId, plan: 'premium', paypal_subscription_id: data.subscriptionID, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            );
          }
          alert('Upgrade para o Plano Premium concluído!');
          handleClose();
          window.location.reload();
        },
        onError: (err: any) => {
          console.error('PayPal button error:', err);
          setPaypalError(true);
        },
      }).render(paypalBtnRef.current);
    } catch (e) {
      console.error('PayPal render error:', e);
      setPaypalError(true);
    }
  }, [selectedMethod, paypalReady, PAYPAL_PLAN_ID, userId]);

  // Stripeチェックアウト
  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert('Não foi possível iniciar o pagamento'); }
    } catch (e) { alert('Ocorreu um erro'); }
    setLoading(false);
  };

  // PayPalサーバーサイドチェックアウト（広告ブロッカー回避用）
  const handlePayPalCheckout = async () => {
    setPaypalRedirectLoading(true);
    try {
      const res = await fetch('/api/paypal-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert('Não foi possível iniciar o pagamento PayPal: ' + (data.error || '')); }
    } catch (e) { alert('Ocorreu um erro'); }
    setPaypalRedirectLoading(false);
  };

  if (!open) return null;

  const radioStyle = (active: boolean, color: string) => ({
    width: '20px', height: '20px', borderRadius: '50%',
    border: `2px solid ${active ? color : '#cbd5e1'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }} onClick={handleClose}>
      <div style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto', background: 'linear-gradient(135deg, #ffffff, #f8fafc)', borderRadius: '20px', padding: '30px', boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)', color: '#1e293b' }} onClick={e => e.stopPropagation()}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>⭐ {step === 'plan' ? 'Escolha seu plano' : 'Forma de pagamento'}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{step === 'plan' ? 'Selecione o plano desejado' : 'Plano Premium R$ 29,90/mês'}</div>
          </div>
          <span onClick={handleClose} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '24px', lineHeight: 1 }}>×</span>
        </div>

        {/* ステップ1: Escolha seu plano */}
        {step === 'plan' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {/* Plano Grátis */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', cursor: 'default' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' }}>Plano Grátis</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#334155', marginBottom: '16px' }}>R$ 0<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mês</span></div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '2' }}>
                  ✓ Painel<br />
                  ✓ Gestão de equipe<br />
                  ✓ Agenda básica<br />
                  <span style={{ color: '#cbd5e1' }}>✗ Gestão de agendamentos</span><br />
                  <span style={{ color: '#cbd5e1' }}>✗ Cadastro de clientes</span><br />
                  <span style={{ color: '#cbd5e1' }}>✗ Agendamento online</span>
                </div>
                <div style={{ marginTop: '16px', padding: '10px', borderRadius: '8px', background: '#f1f5f9', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>Plano atual</div>
              </div>

              {/* プレミアム */}
              <div onClick={() => setStep('payment')} style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', borderRadius: '12px', padding: '20px', border: '2px solid #6366f1', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6366f1', marginBottom: '8px' }}>Premium ✨</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#312e81', marginBottom: '16px' }}>R$ 29,90<span style={{ fontSize: '14px', color: '#6366f1' }}>/mês</span></div>
                <div style={{ fontSize: '12px', color: '#4338ca', lineHeight: '2' }}>
                  ✓ Tudo do plano Grátis<br />
                  ✓ Gestão de agendamentos<br />
                  ✓ Cadastro de clientes<br />
                  ✓ Agendamento online<br />
                  ✓ Campos personalizados
                </div>
                <div style={{ marginTop: '16px', padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>Escolher este plano →</div>
              </div>
            </div>

            <div style={{ background: '#ecfdf5', borderRadius: '12px', padding: '14px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669' }}>🎉 30 dias de teste grátis</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Cancele a qualquer momento durante o teste</div>
            </div>
          </>
        )}

        {/* ステップ2: 支払い方法 */}
        {step === 'payment' && (
          <>
            <button onClick={() => { setStep('plan'); setSelectedMethod(null); paypalRendered.current = false; }} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '12px', marginBottom: '16px' }}>← Voltar aos planos</button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {/* Cartão de crédito */}
              <div onClick={() => setSelectedMethod('card')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: `2px solid ${selectedMethod === 'card' ? '#6366f1' : '#e2e8f0'}`, background: selectedMethod === 'card' ? '#eef2ff' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ width: '80px', height: '28px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src="/crejitto.png" alt="Cartão de crédito" style={{ width: '100px', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Cartão de crédito</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Visa / Mastercard / Elo / AMEX</div>
                </div>
                <div style={radioStyle(selectedMethod === 'card', '#6366f1')}>{selectedMethod === 'card' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1' }} />}</div>
              </div>

              {/* PayPal */}
              <div onClick={() => { setSelectedMethod('paypal'); setPaypalError(false); paypalRendered.current = false; }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: `2px solid ${selectedMethod === 'paypal' ? '#0070ba' : '#e2e8f0'}`, background: selectedMethod === 'paypal' ? '#eff6ff' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                <img src="/paypal-logo-png-1.png" alt="PayPal" style={{ width: '80px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pagar com conta PayPal</div>
                </div>
                <div style={radioStyle(selectedMethod === 'paypal', '#0070ba')}>{selectedMethod === 'paypal' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0070ba' }} />}</div>
              </div>
            </div>

            {/* PayPalボタン */}
            {selectedMethod === 'paypal' && (
              <div style={{ marginBottom: '16px' }}>
                {paypalError ? (
                  // SDK読み込み失敗時 → サーバー経由でPayPalにリダイレクト
                  <button onClick={handlePayPalCheckout} disabled={paypalRedirectLoading} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: paypalRedirectLoading ? '#cbd5e1' : 'linear-gradient(135deg, #0070ba, #003087)', color: 'white', cursor: paypalRedirectLoading ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: paypalRedirectLoading ? 'none' : '0 4px 12px rgba(0,112,186,0.3)' }}>
                    {paypalRedirectLoading ? 'Processando...' : '🅿 Assinar com PayPal'}
                  </button>
                ) : !paypalReady ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
                    <div style={{ marginBottom: '8px' }}>Carregando PayPal...</div>
                    <div style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTopColor: '#0070ba', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <div ref={paypalBtnRef} style={{ borderRadius: '12px', overflow: 'hidden' }} />
                )}
              </div>
            )}

            {/* Cartão de crédito決済ボタン */}
            {selectedMethod === 'card' && (
              <button onClick={handleStripeCheckout} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', cursor: loading ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '15px', marginBottom: '16px', boxShadow: loading ? 'none' : '0 4px 12px rgba(99,102,241,0.3)' }}>
                {loading ? 'Processando...' : '💳 Assinar com cartão'}
              </button>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>A assinatura pode ser cancelada a qualquer momento</div>
      </div>
    </div>
  );
}

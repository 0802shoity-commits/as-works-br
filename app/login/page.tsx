"use client";
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.push('/dashboard');
    };
    checkUser();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f8f9ff, #eef2ff)", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ width: "400px", background: "white", borderRadius: "20px", padding: "40px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0px", fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "8px" }}>
          <img src="/awwork.png" alt="As-Works" style={{ width: "60px", height: "60px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-6px" }} />
          -Works
        </div>
        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "32px" }}>Entre no seu sistema de gestão</p>
        <button onClick={handleGoogleLogin} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "white", fontSize: "15px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#333", transition: "all 0.2s" }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Entrar com Google
        </button>
        <div style={{ marginTop: "24px", fontSize: "11px", color: "#9ca3af", lineHeight: "1.6" }}>
          Ao entrar, você concorda com os <a href="/terms" style={{ color: "#6366f1", textDecoration: "none" }}>Termos de Uso</a> e a <a href="/privacy" style={{ color: "#6366f1", textDecoration: "none" }}>Política de Privacidade</a>.<br />Se você ainda não tem conta, ela será criada automaticamente.
        </div>
      </div>
    </div>
  );
}

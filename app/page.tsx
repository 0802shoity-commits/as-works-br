"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    { icon: "📅", title: "Gestão de agendamentos", desc: "Organize sua agenda de forma intuitiva com arrastar e soltar. Veja a escala da equipe em um piscar de olhos.", color: "#6366f1" },
    { icon: "👤", title: "Cadastro de clientes", desc: "Centralize dados, histórico de visitas e serviços realizados. Receba lembretes automáticos para o próximo contato.", color: "#10b981" },
    { icon: "🌐", title: "Agendamento online", desc: "Seus clientes agendam pelo celular 24 horas por dia. O sistema verifica a disponibilidade automaticamente.", color: "#f59e0b" },
    { icon: "📊", title: "Categorias de serviço", desc: "Personalize os serviços de acordo com o seu negócio. Organize por categorias com cores para facilitar a visualização.", color: "#ec4899" },
  ];

  const businesses = [
    { icon: "🚗", name: "Oficinas mecânicas", desc: "Revisões, manutenção e reparos" },
    { icon: "🐾", name: "Pet shops", desc: "Banho, tosa e hospedagem" },
    { icon: "💇", name: "Salões e barbearias", desc: "Cortes, coloração e tratamentos" },
    { icon: "🏥", name: "Clínicas e consultórios", desc: "Consultas e procedimentos" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Cabeçalho */}
      <header style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0px", fontSize: "22px", fontWeight: "bold", color: "#1a1a2e", whiteSpace: "nowrap" }}>
          <img src="/awwork.png" alt="As-Works" style={{ width: "50px", height: "50px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-4px" }} />
          -Works
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => router.push("/login")} style={{ padding: "10px 24px", borderRadius: "10px", border: "2px solid #6366f1", background: "white", color: "#6366f1", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>Entrar</button>
          <button onClick={() => router.push("/login")} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>Comece grátis</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: "80px 40px", textAlign: "center", background: "linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: "20px", background: "#eef2ff", color: "#6366f1", fontSize: "13px", fontWeight: "bold", marginBottom: "20px" }}>
            🎉 Plano grátis disponível · Sem cartão de crédito
          </div>
          <h1 style={{ fontSize: "44px", fontWeight: "800", color: "#1a1a2e", lineHeight: "1.3", marginBottom: "20px" }}>
            Agendamentos e clientes,<br />
            <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>tudo em um só lugar</span>
          </h1>
          <p style={{ fontSize: "18px", color: "#6b7280", lineHeight: "1.8", marginBottom: "40px" }}>
            O As-Works é o sistema de gestão para negócios de serviços<br />
            como oficinas mecânicas, pet shops e salões de beleza.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button onClick={() => router.push("/login")} style={{ padding: "16px 40px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.3)", transition: "transform 0.2s" }}>
              Comece grátis →
            </button>
          </div>
        </div>
        {/* Captura de tela do painel */}
        <div style={{ marginTop: "60px", maxWidth: "1000px", marginLeft: "auto", marginRight: "auto", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "2px solid #e5e7eb" }}>
          <img src="/screenshot-dashboard.png" alt="Painel do As-Works" style={{ width: "100%", display: "block" }} />
        </div>
      </section>

      {/* Segmentos atendidos */}
      <section style={{ padding: "60px 40px", background: "#ffffff" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "40px" }}>Ideal para o seu tipo de negócio</h2>
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

      {/* Principais recursos */}
      <section style={{ padding: "80px 40px", background: "#f8f9ff" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "12px" }}>Principais recursos</h2>
        <p style={{ textAlign: "center", fontSize: "15px", color: "#9ca3af", marginBottom: "50px" }}>Tudo o que você precisa para gerenciar o seu negócio</p>
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

      {/* Planos */}
      <section style={{ padding: "80px 40px", background: "#ffffff" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "50px" }}>Planos e preços</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ padding: "36px", borderRadius: "16px", border: "2px solid #e5e7eb", background: "white" }}>
            <div style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "bold", marginBottom: "8px" }}>GRÁTIS</div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "4px" }}>R$ 0<span style={{ fontSize: "14px", color: "#9ca3af" }}>/mês</span></div>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}>Para começar e testar</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#4b5563" }}>
              <div>✓ Agenda com arrastar e soltar</div>
              <div>✓ Controle de presença da equipe</div>
              <div>✓ Categorias e serviços personalizáveis</div>
              <div>✓ Bloqueio de horários em massa</div>
            </div>
            <button onClick={() => router.push("/login")} style={{ width: "100%", padding: "12px", marginTop: "24px", borderRadius: "10px", border: "2px solid #6366f1", background: "white", color: "#6366f1", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>Comece grátis</button>
          </div>
          <div style={{ padding: "36px", borderRadius: "16px", border: "2px solid #6366f1", background: "linear-gradient(135deg, #fafaff, #f0f0ff)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 12px", borderRadius: "20px", background: "#6366f1", color: "white", fontSize: "11px", fontWeight: "bold" }}>Recomendado</div>
            <div style={{ fontSize: "13px", color: "#6366f1", fontWeight: "bold", marginBottom: "8px" }}>PREMIUM</div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "4px" }}>R$ 29,90<span style={{ fontSize: "14px", color: "#9ca3af" }}>/mês</span></div>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}>30 dias de teste grátis</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#4b5563" }}>
              <div>✓ Todos os recursos do plano grátis</div>
              <div>✓ Agendamento online</div>
              <div>✓ Cadastro e histórico de clientes</div>
              <div>✓ Lembretes de próximo contato</div>
              <div>✓ Registro detalhado dos serviços</div>
            </div>
            <button onClick={() => router.push("/login")} style={{ width: "100%", padding: "12px", marginTop: "24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>Teste grátis por 30 dias</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 40px", background: "linear-gradient(135deg, #1a1a2e, #0f3460)", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginBottom: "16px" }}>Comece agora mesmo</h2>
        <p style={{ fontSize: "15px", color: "#94a3b8", marginBottom: "32px" }}>Sem cartão de crédito · Cadastro apenas com e-mail</p>
        <button onClick={() => router.push("/login")} style={{ padding: "16px 48px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
          Criar conta grátis →
        </button>
      </section>

      {/* Rodapé */}
      <footer style={{ padding: "30px 40px", background: "#0f172a", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "12px" }}>
          <a href="/terms" style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "none" }}>Termos de Uso</a>
          <a href="/privacy" style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "none" }}>Política de Privacidade</a>
        </div>
        <div style={{ fontSize: "13px", color: "#64748b" }}>© 2026 As-Works. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}

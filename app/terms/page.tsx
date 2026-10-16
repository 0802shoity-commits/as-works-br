"use client";

export default function TermsPage() {
  const h2: React.CSSProperties = { fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" };
  const ul: React.CSSProperties = { paddingLeft: "20px", margin: "8px 0" };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Segoe UI', sans-serif" }}>
      <header style={{ padding: "16px 40px", borderBottom: "1px solid #f0f0f0" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0px", fontSize: "22px", fontWeight: "bold", color: "#1a1a2e", textDecoration: "none", width: "fit-content" }}>
          <img src="/awwork.png" alt="As-Works" style={{ width: "50px", height: "50px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-4px" }} />
          -Works
        </a>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 24px", fontSize: "14px", lineHeight: "2", color: "#4b5563" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "8px" }}>Termos de Uso</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "40px" }}>Última atualização: 16 de outubro de 2026</p>

        <h2 style={h2}>1. Aceitação</h2>
        <p>Estes Termos de Uso (&quot;Termos&quot;) regulam o uso do As-Works (&quot;Serviço&quot;), um sistema online de gestão de agendamentos e clientes. Ao criar uma conta ou utilizar o Serviço, você declara ter lido e concordado com estes Termos e com a nossa Política de Privacidade.</p>

        <h2 style={h2}>2. Cadastro e conta</h2>
        <p>O acesso é feito com uma conta Google. Você se compromete a fornecer informações verdadeiras e é responsável pela segurança e pelo uso da sua conta. É proibido ceder, emprestar ou transferir a conta a terceiros. Podemos suspender contas com informações falsas ou que violem estes Termos.</p>

        <h2 style={h2}>3. O Serviço</h2>
        <p>O As-Works oferece agenda de atendimentos, cadastro de clientes, gestão de equipe e escalas e uma página de agendamento online para os seus clientes. Funcionalidades podem ser alteradas, adicionadas ou descontinuadas para melhorar o Serviço.</p>

        <h2 style={h2}>4. Planos, preços e pagamento</h2>
        <p>O Serviço possui um Plano Grátis e um Plano Premium (R$ 29,90 por mês). O Plano Premium inclui 30 dias de teste grátis; se você cancelar durante o teste, nada será cobrado. Após o teste, a assinatura é cobrada mensalmente, de forma automática, no cartão de crédito, por meio da Stripe ou do PayPal. Eventuais alterações de preço serão comunicadas com antecedência.</p>

        <h2 style={h2}>5. Cancelamento e reembolso</h2>
        <p>Você pode cancelar o Plano Premium a qualquer momento em &quot;Gerenciar assinatura&quot;. Após o cancelamento, os recursos Premium ficam disponíveis até o fim do período já pago e a conta passa para o Plano Grátis. Não há reembolso proporcional por períodos parciais, sem prejuízo dos direitos garantidos pelo Código de Defesa do Consumidor (Lei nº 8.078/1990), incluindo o direito de arrependimento em até 7 dias da contratação, quando aplicável. Para excluir sua conta, use a opção &quot;Excluir conta&quot; nas configurações ou entre em contato conosco.</p>

        <h2 style={h2}>6. Condutas proibidas</h2>
        <p>Não é permitido:</p>
        <ul style={ul}>
          <li>Usar o Serviço para fins ilegais ou contrários à ordem pública</li>
          <li>Prejudicar o funcionamento do Serviço ou de seus servidores</li>
          <li>Coletar ou usar indevidamente dados pessoais de outras pessoas</li>
          <li>Tentar acessar sistemas ou contas sem autorização</li>
          <li>Copiar, revender ou fazer engenharia reversa do Serviço</li>
          <li>Qualquer outra conduta que consideremos abusiva ou inadequada</li>
        </ul>

        <h2 style={h2}>7. Seus dados e os dados dos seus clientes</h2>
        <p>Os dados que você cadastra (clientes, agendamentos, etc.) pertencem a você e são usados apenas para prestar o Serviço. Em relação aos dados pessoais dos seus clientes, você atua como <strong>controlador</strong> e o As-Works como <strong>operador</strong>, nos termos da Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Cabe a você ter uma base legal adequada para tratar esses dados e informar seus clientes sobre o uso deles.</p>

        <h2 style={h2}>8. Limitação de responsabilidade</h2>
        <p>Na máxima extensão permitida pela lei, e salvo em caso de dolo ou culpa grave, o As-Works não se responsabiliza por:</p>
        <ul style={ul}>
          <li>Danos decorrentes de interrupção, suspensão ou encerramento do Serviço</li>
          <li>Perda ou corrupção de dados</li>
          <li>Conflitos entre usuários ou entre usuários e terceiros</li>
          <li>Falhas de serviços de terceiros (Google, Stripe, PayPal, etc.)</li>
        </ul>

        <h2 style={h2}>9. Interrupção e encerramento do Serviço</h2>
        <p>O Serviço pode ser interrompido temporariamente para manutenção, por motivos de força maior ou outras causas inevitáveis. Caso o Serviço seja encerrado definitivamente, os usuários serão avisados com antecedência razoável.</p>

        <h2 style={h2}>10. Propriedade intelectual</h2>
        <p>Todos os direitos sobre o Serviço, incluindo software, marca e conteúdo, pertencem ao As-Works. Nada nestes Termos transfere esses direitos a você.</p>

        <h2 style={h2}>11. Alterações destes Termos</h2>
        <p>Podemos atualizar estes Termos quando necessário. Mudanças relevantes serão comunicadas no próprio Serviço. Ao continuar usando o Serviço após a atualização, você concorda com a nova versão.</p>

        <h2 style={h2}>12. Lei aplicável</h2>
        <p>Estes Termos são regidos pelas leis do Japão, onde o As-Works é operado. Isso não afasta os direitos que a legislação brasileira garante a você como consumidor, inclusive o Código de Defesa do Consumidor e a LGPD, quando aplicáveis.</p>

        <div style={{ marginTop: "40px", padding: "20px", background: "#f8f9ff", borderRadius: "12px", fontSize: "14px", color: "#4b5563", lineHeight: "1.8" }}>
          Contato: asworks.support@gmail.com
        </div>
      </main>

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

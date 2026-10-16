"use client";

type Section = { title: string; content: string; list?: string[]; afterList?: string; contact?: boolean };

export default function PrivacyPage() {
  const sections: Section[] = [
    {
      title: "1. Introdução",
      content: "O As-Works (\"nós\" ou \"Serviço\") respeita a sua privacidade. Esta Política explica como coletamos, usamos, compartilhamos e protegemos dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018). Em relação aos dados da sua conta, o As-Works é o controlador."
    },
    {
      title: "2. Dados que coletamos",
      content: "Podemos coletar os seguintes dados:",
      list: [
        "Nome, e-mail e foto de perfil da sua conta Google",
        "Dados de agendamentos (datas, horários, serviços, profissionais)",
        "Dados dos seus clientes que você cadastra (nome, telefone, endereço, veículo, pet, etc.)",
        "Dados de pagamento do Plano Premium, processados pela Stripe ou pelo PayPal — não armazenamos números de cartão",
        "Registros de acesso (endereço IP, navegador, data e hora), conforme o Marco Civil da Internet"
      ]
    },
    {
      title: "3. Para que usamos os dados e bases legais",
      content: "Usamos os dados para as finalidades abaixo, com base na execução do contrato (art. 7º, V), no cumprimento de obrigação legal (art. 7º, II) e no legítimo interesse (art. 7º, IX) da LGPD:",
      list: [
        "Prestar, manter e melhorar o Serviço",
        "Autenticar usuários e gerenciar contas",
        "Oferecer as funções de agenda e cadastro de clientes",
        "Processar pagamentos do Plano Premium",
        "Responder a solicitações de suporte",
        "Enviar avisos importantes sobre o Serviço",
        "Prevenir fraudes e usos indevidos"
      ]
    },
    {
      title: "4. Compartilhamento com terceiros",
      content: "Compartilhamos dados apenas na medida necessária com os fornecedores que tornam o Serviço possível:",
      list: [
        "Google (login e autenticação)",
        "Supabase (banco de dados e autenticação)",
        "Stripe e PayPal (processamento de pagamentos)",
        "Vercel (hospedagem)"
      ],
      afterList: "Não vendemos dados pessoais. Fora desses casos, só compartilhamos dados mediante ordem legal ou judicial."
    },
    {
      title: "5. Transferência internacional",
      content: "O As-Works é operado a partir do Japão, e nossos fornecedores podem armazenar dados em servidores fora do Brasil (por exemplo, no Japão e nos Estados Unidos). Essas transferências são feitas para executar o contrato com você e com fornecedores que adotam salvaguardas adequadas, conforme o art. 33 da LGPD."
    },
    {
      title: "6. Por quanto tempo guardamos os dados",
      content: "Mantemos os dados enquanto a sua conta estiver ativa. Ao excluir a conta, os dados são apagados em prazo razoável, exceto os que precisamos guardar por obrigação legal — por exemplo, registros de acesso por 6 meses, conforme o Marco Civil da Internet."
    },
    {
      title: "7. Cookies",
      content: "Usamos cookies essenciais para manter você conectado e para o funcionamento do Serviço. Você pode desativá-los no navegador, mas algumas funções podem deixar de funcionar."
    },
    {
      title: "8. Seus direitos (art. 18 da LGPD)",
      content: "Você pode, a qualquer momento:",
      list: [
        "Confirmar se tratamos seus dados e acessá-los",
        "Corrigir dados incompletos, inexatos ou desatualizados",
        "Pedir anonimização, bloqueio ou eliminação de dados desnecessários",
        "Pedir a portabilidade dos dados",
        "Saber com quem compartilhamos seus dados",
        "Revogar consentimento, quando o tratamento se basear nele",
        "Apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD)"
      ],
      afterList: "Para exercer esses direitos, escreva para o contato abaixo. Responderemos em prazo razoável, após confirmar sua identidade."
    },
    {
      title: "9. Segurança",
      content: "Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados, perda ou vazamento:",
      list: [
        "Criptografia das comunicações (SSL/TLS)",
        "Controle de acesso por usuário",
        "Recursos de segurança dos nossos fornecedores",
        "Revisão periódica das medidas de segurança"
      ]
    },
    {
      title: "10. Dados dos seus clientes",
      content: "Quando você cadastra dados dos seus próprios clientes no As-Works, você é o controlador desses dados e nós atuamos como operador, tratando-os apenas para prestar o Serviço. Cabe a você informar seus clientes sobre esse uso e ter uma base legal adequada."
    },
    {
      title: "11. Alterações desta Política",
      content: "Podemos atualizar esta Política em razão de mudanças na lei ou no Serviço. A versão atualizada vale a partir da publicação nesta página, e mudanças relevantes serão comunicadas no Serviço."
    },
    {
      title: "12. Contato e encarregado (DPO)",
      content: "Para dúvidas sobre esta Política ou sobre seus dados, fale com o nosso encarregado pelo tratamento de dados pessoais:",
      contact: true
    }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Segoe UI', sans-serif" }}>
      <header style={{ padding: "16px 40px", borderBottom: "1px solid #f0f0f0" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0px", fontSize: "22px", fontWeight: "bold", color: "#1a1a2e", textDecoration: "none", width: "fit-content" }}>
          <img src="/awwork.png" alt="As-Works" style={{ width: "50px", height: "50px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-4px" }} />
          -Works
        </a>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "8px" }}>Política de Privacidade</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "40px" }}>Última atualização: 16 de outubro de 2026</p>

        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "12px" }}>{section.title}</h2>
            <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.8", marginBottom: section.list ? "12px" : "0" }}>{section.content}</p>
            {section.list && (
              <ul style={{ paddingLeft: "20px", margin: "0 0 8px 0" }}>
                {section.list.map((item, j) => (
                  <li key={j} style={{ fontSize: "14px", color: "#4b5563", lineHeight: "2" }}>{item}</li>
                ))}
              </ul>
            )}
            {section.afterList && (
              <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.8" }}>{section.afterList}</p>
            )}
            {section.contact && (
              <div style={{ marginTop: "12px", padding: "20px", background: "#f8f9ff", borderRadius: "12px", fontSize: "14px", color: "#4b5563", lineHeight: "1.8" }}>
                Serviço: As-Works<br />
                E-mail: asworks.support@gmail.com
              </div>
            )}
          </div>
        ))}
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

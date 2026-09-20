"use client";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. はじめに",
      content: "As-Works（以下「当サービス」）は、お客様の個人情報の保護を重要な責務と考え、個人情報の保護に関する法律（個人情報保護法）およびその他関連法令を遵守します。本プライバシーポリシーは、当サービスにおける個人情報の取り扱いについて定めるものです。"
    },
    {
      title: "2. 取得する個人情報",
      content: "当サービスでは、以下の個人情報を取得します。",
      list: [
        "氏名（Googleアカウントに登録されている名前）",
        "メールアドレス（Googleアカウントのメールアドレス）",
        "プロフィール画像（Googleアカウントのプロフィール画像）",
        "予約情報（予約日時、作業内容、担当スタッフ等）",
        "顧客情報（お客様が登録した顧客の氏名、連絡先、車両情報等）",
        "決済情報（プレミアムプランご利用時、Stripe経由で処理。当サービスではクレジットカード番号を直接保持しません）",
        "アクセスログ（IPアドレス、ブラウザ情報、アクセス日時等）"
      ]
    },
    {
      title: "3. 個人情報の利用目的",
      content: "取得した個人情報は、以下の目的で利用します。",
      list: [
        "当サービスの提供・運営・改善",
        "ユーザー認証およびアカウント管理",
        "予約管理・顧客管理機能の提供",
        "有料プランの決済処理",
        "お問い合わせへの対応",
        "サービスに関する重要なお知らせの送信",
        "利用状況の分析およびサービス改善",
        "不正利用の防止"
      ]
    },
    {
      title: "4. 第三者提供について",
      content: "当サービスでは、以下の外部サービスを利用しており、これらのサービス提供者に対して必要な範囲で個人情報が提供されます。",
      list: [
        "Google（認証・ログイン機能の提供）",
        "Supabase（データベース・認証基盤の提供）",
        "Stripe（決済処理の提供）",
        "Vercel（ホスティング・サーバー運用）"
      ],
      afterList: "上記以外の第三者に対して、法令に基づく場合を除き、お客様の同意なく個人情報を提供することはありません。"
    },
    {
      title: "5. データの保管",
      content: "お客様の個人情報は、Supabaseのクラウドサーバーに保管されます。データは暗号化された通信（SSL/TLS）を通じて送受信され、適切なセキュリティ対策を講じています。なお、サーバーは日本国外に所在する場合があります。"
    },
    {
      title: "6. データの保持期間",
      content: "お客様の個人情報は、アカウントが有効な期間中保持します。アカウント削除のご依頼があった場合、合理的な期間内にすべての個人情報を削除します。ただし、法令により保持が義務付けられている情報については、所定の期間保持した後に削除します。"
    },
    {
      title: "7. Cookieの使用について",
      content: "当サービスでは、ログイン状態の維持およびサービスの正常な動作のためにCookie（クッキー）を使用しています。Cookieはブラウザの設定により無効にすることができますが、その場合、当サービスの一部機能がご利用いただけなくなる場合があります。"
    },
    {
      title: "8. お客様の権利",
      content: "お客様は、ご自身の個人情報について以下の権利を有しています。",
      list: [
        "個人情報の開示を請求する権利",
        "個人情報の訂正・追加・削除を請求する権利",
        "個人情報の利用停止を請求する権利",
        "アカウントの削除を請求する権利"
      ],
      afterList: "上記の請求は、本ポリシー末尾のお問い合わせ先までご連絡ください。本人確認のうえ、合理的な期間内に対応いたします。"
    },
    {
      title: "9. 安全管理措置",
      content: "当サービスは、個人情報の漏洩、滅失、毀損を防止するため、以下の安全管理措置を講じています。",
      list: [
        "SSL/TLSによる通信の暗号化",
        "アクセス権限の適切な管理",
        "外部サービスのセキュリティ機能の活用",
        "定期的なセキュリティ対策の見直し"
      ]
    },
    {
      title: "10. 免責事項",
      content: "当サービスに登録された顧客情報（お客様のエンドユーザーの情報）の管理責任は、当該情報を登録したお客様にあります。お客様は、ご自身の顧客に対して適切なプライバシーポリシーを提示し、必要な同意を取得してください。"
    },
    {
      title: "11. プライバシーポリシーの変更",
      content: "本ポリシーの内容は、法令の変更やサービスの変更に伴い、予告なく改定することがあります。改定後のポリシーは、当サービス上に掲載した時点から効力を生じるものとします。"
    },
    {
      title: "12. お問い合わせ",
      content: "個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。",
      contact: true
    }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Segoe UI', 'Hiragino Sans', sans-serif" }}>
      <header style={{ padding: "16px 40px", borderBottom: "1px solid #f0f0f0" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0px", fontSize: "22px", fontWeight: "bold", color: "#1a1a2e", textDecoration: "none", width: "fit-content" }}>
          <img src="/awwork.png" alt="As-Works" style={{ width: "50px", height: "50px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-4px" }} />
          -Works
        </a>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "8px" }}>プライバシーポリシー</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "40px" }}>最終更新日：2026年9月20日</p>

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
                サービス名：As-Works<br />
                メール：asworks.support@gmail.com
              </div>
            )}
          </div>
        ))}
      </main>

      <footer style={{ padding: "30px 40px", background: "#0f172a", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "12px" }}>
          <a href="/terms" style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "none" }}>利用規約</a>
          <a href="/privacy" style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "none" }}>プライバシーポリシー</a>
          <a href="/tokushoho" style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "none" }}>特定商取引法に基づく表記</a>
        </div>
        <div style={{ fontSize: "13px", color: "#64748b" }}>© 2026 As-Works. All rights reserved.</div>
      </footer>
    </div>
  );
}

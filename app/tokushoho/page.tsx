"use client";

export default function TokushohoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Segoe UI', 'Hiragino Sans', sans-serif" }}>
      <header style={{ padding: "16px 40px", borderBottom: "1px solid #f0f0f0" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0px", fontSize: "22px", fontWeight: "bold", color: "#1a1a2e", textDecoration: "none", width: "fit-content" }}>
          <img src="/awwork.png" alt="As-Works" style={{ width: "50px", height: "50px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-4px" }} />
          -Works
        </a>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "40px" }}>特定商取引法に基づく表記</h1>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px", lineHeight: "1.8" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>販売事業者</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>As-Works<br />※個人名については、請求があった場合に遅滞なく開示いたします。</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>運営責任者</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>請求があった場合に遅滞なく開示いたします。</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>所在地</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>請求があった場合に遅滞なく開示いたします。</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>電話番号</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>請求があった場合に遅滞なく開示いたします。</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>メールアドレス</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>asworks.support@gmail.com</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>販売価格</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>
                フリープラン：無料<br />
                プレミアムプラン：月額980円（税込）
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>支払方法</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>クレジットカード決済（Stripe経由）</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>支払時期</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>プレミアムプランお申し込み時に初回決済。以降、毎月自動更新となります。<br />※30日間の無料トライアル期間中は課金されません。</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>サービス提供時期</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>お申し込み手続き完了後、直ちにご利用いただけます。</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>解約・退会</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>マイページよりいつでも解約可能です。解約後は次回更新日をもってプレミアム機能が停止し、フリープランに移行します。</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>返金ポリシー</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>デジタルサービスの性質上、契約期間途中の解約による日割り返金は行っておりません。ただし、無料トライアル期間中に解約された場合は課金されません。<br />サービスに重大な不具合があり利用できなかった場合は、個別にご相談ください。</td>
            </tr>
            <tr>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: "bold", color: "#374151", width: "200px", verticalAlign: "top" }}>動作環境</th>
              <td style={{ padding: "16px 12px", color: "#4b5563" }}>最新版の Google Chrome、Microsoft Edge、Safari に対応。インターネット接続が必要です。</td>
            </tr>
          </tbody>
        </table>
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


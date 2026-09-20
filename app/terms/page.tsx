"use client";

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Segoe UI', 'Hiragino Sans', sans-serif" }}>
      <header style={{ padding: "16px 40px", borderBottom: "1px solid #f0f0f0" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0px", fontSize: "22px", fontWeight: "bold", color: "#1a1a2e", textDecoration: "none", width: "fit-content" }}>
          <img src="/awwork.png" alt="As-Works" style={{ width: "50px", height: "50px", objectFit: "contain", mixBlendMode: "multiply", marginRight: "-4px" }} />
          -Works
        </a>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 24px", fontSize: "14px", lineHeight: "2", color: "#4b5563" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginBottom: "8px" }}>利用規約</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "40px" }}>最終更新日：2026年9月20日</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第1条（適用）</h2>
        <p>本利用規約（以下「本規約」）は、As-Works（以下「当サービス」）が提供する業務管理サービスの利用条件を定めるものです。ユーザーは本規約に同意の上、当サービスを利用するものとします。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第2条（アカウント登録）</h2>
        <p>ユーザーはGoogleアカウントを使用してログインするものとします。登録情報に虚偽があった場合、当サービスはアカウントを停止できるものとします。アカウントの管理はユーザー自身の責任において行うものとし、第三者への貸与・譲渡は禁止します。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第3条（サービス内容）</h2>
        <p>当サービスは、予約管理、顧客管理、スケジュール管理、WEB予約受付等の機能を提供します。サービスの内容は予告なく変更・追加・廃止される場合があります。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第4条（利用料金と決済）</h2>
        <p>当サービスにはフリープラン（無料）とプレミアムプラン（月額980円・税込）があります。プレミアムプランには30日間の無料トライアル期間があり、トライアル期間中に解約した場合は課金されません。決済はStripeを通じたクレジットカード決済で行われ、毎月自動更新されます。料金は事前の通知をもって変更される場合があります。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第5条（解約と返金）</h2>
        <p>ユーザーはいつでもプレミアムプランを解約できます。解約後は次回更新日をもってプレミアム機能が停止し、フリープランに移行します。デジタルサービスの性質上、契約期間途中の解約による日割り返金は行いません。アカウント自体の削除を希望する場合はお問い合わせください。アカウント削除後、データは合理的な期間内に削除されます。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第6条（禁止事項）</h2>
        <p>ユーザーは以下の行為を行ってはなりません。</p>
        <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
          <li>法令または公序良俗に違反する行為</li>
          <li>当サービスの運営を妨害する行為</li>
          <li>他のユーザーの個人情報を不正に収集・利用する行為</li>
          <li>当サービスのシステムに対する不正アクセス</li>
          <li>当サービスのリバースエンジニアリングや複製</li>
          <li>その他、当サービスが不適切と判断する行為</li>
        </ul>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第7条（データの取り扱い）</h2>
        <p>ユーザーが当サービスに登録したデータ（顧客情報、予約情報等）の所有権はユーザーに帰属します。当サービスはユーザーのデータをサービス提供の目的以外で使用しません。ユーザーは、登録する顧客情報について、自らの責任で必要な同意を取得するものとします。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第8条（免責事項）</h2>
        <p>当サービスは、以下の事項について、当サービスに故意または重大な過失がある場合を除き、一切の責任を負いません。</p>
        <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
          <li>サービスの中断・停止・終了により生じた損害</li>
          <li>データの消失・破損により生じた損害</li>
          <li>ユーザー間またはユーザーと第三者間のトラブル</li>
          <li>外部サービス（Google、Stripe等）の障害に起因する損害</li>
        </ul>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第9条（サービスの中断・終了）</h2>
        <p>当サービスは、システムの保守、天災、その他やむを得ない事由により、予告なくサービスを中断する場合があります。サービスを終了する場合は、合理的な期間をもって事前に通知するものとします。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第10条（知的財産権）</h2>
        <p>当サービスに関する著作権、商標権その他の知的財産権は、当サービスの運営者に帰属します。ユーザーはこれらの権利を侵害する行為を行ってはなりません。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第11条（規約の変更）</h2>
        <p>当サービスは、必要に応じて本規約を変更できるものとします。重要な変更がある場合はサービス上で通知します。変更後の規約は、当サービス上に掲載した時点で効力を生じます。変更後も当サービスの利用を継続した場合、変更後の規約に同意したものとみなします。</p>

        <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1a1a2e", marginTop: "32px", marginBottom: "12px" }}>第12条（準拠法・管轄）</h2>
        <p>本規約は日本法に準拠し、日本法に従って解釈されるものとします。当サービスに関連する紛争については、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。</p>

        <div style={{ marginTop: "40px", padding: "20px", background: "#f8f9ff", borderRadius: "12px", fontSize: "14px", color: "#4b5563", lineHeight: "1.8" }}>
          お問い合わせ：asworks.support@gmail.com
        </div>
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

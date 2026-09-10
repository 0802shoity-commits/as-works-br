"use client";
export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: 'white', padding: '24px 32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', textDecoration: 'none' }}>← ログインに戻る</a>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '12px' }}>🔒 プライバシーポリシー</h1>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px', fontSize: '14px', lineHeight: '2', color: '#333' }}>
        <p style={{ color: '#888', marginBottom: '24px' }}>最終更新日: 2026年6月1日</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>1. 収集する情報</h2>
        <p>当サービスは、サービスの提供にあたり以下の情報を収集します。</p>
        <p style={{ paddingLeft: '16px' }}>
          ・アカウント情報（メールアドレス、氏名、電話番号、住所）<br/>
          ・顧客管理データ（ユーザーが登録する顧客情報、予約情報）<br/>
          ・利用ログ（アクセス日時、操作履歴）<br/>
          ・Google認証を利用する場合、Googleアカウントの基本情報
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>2. 情報の利用目的</h2>
        <p>収集した情報は以下の目的で利用します。</p>
        <p style={{ paddingLeft: '16px' }}>
          ・サービスの提供・運営・改善<br/>
          ・ユーザーサポート・お問い合わせ対応<br/>
          ・サービスに関する通知・ご連絡<br/>
          ・利用状況の分析・統計データの作成（個人を特定しない形式）
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>3. 情報の第三者提供</h2>
        <p>当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。</p>
        <p style={{ paddingLeft: '16px' }}>
          ・ユーザーの同意がある場合<br/>
          ・法令に基づく開示請求があった場合<br/>
          ・人の生命、身体、財産の保護のために必要な場合
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>4. データの保管</h2>
        <p>ユーザーのデータは、Supabase（クラウドデータベースサービス）上に暗号化された状態で安全に保管されます。サーバーは東京リージョンに設置されています。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>5. データの削除</h2>
        <p>ユーザーはいつでも自身のアカウントおよびデータの削除を要求できます。アカウント削除後、関連するデータは30日以内に完全に削除されます。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>6. Cookieの使用</h2>
        <p>当サービスは、認証状態の維持およびサービスの改善のためにCookieを使用します。ユーザーはブラウザの設定によりCookieの使用を制限できますが、一部機能が利用できなくなる場合があります。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>7. セキュリティ</h2>
        <p>当サービスは、ユーザーの情報を保護するため、SSL/TLS暗号化通信、データベースのRow Level Security（RLS）、定期的なセキュリティ監査等の対策を講じています。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>8. ポリシーの変更</h2>
        <p>本ポリシーは、法令の改正やサービスの変更に伴い、予告なく改定される場合があります。重要な変更がある場合は、サービス内で通知します。</p>

        <div style={{ marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '8px', fontSize: '13px', color: '#666' }}>
          お問い合わせ: 当サービスの設定画面内「ヘルプ・お問い合わせ」よりご連絡ください。
        </div>
      </div>
    </div>
  );
}
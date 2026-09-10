"use client";
export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: 'white', padding: '24px 32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', textDecoration: 'none' }}>← ログインに戻る</a>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '12px' }}>📄 利用規約</h1>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px', fontSize: '14px', lineHeight: '2', color: '#333' }}>
        <p style={{ color: '#888', marginBottom: '24px' }}>最終更新日: 2026年6月1日</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第1条（適用）</h2>
        <p>本利用規約（以下「本規約」）は、As-Works（以下「当サービス」）が提供する予約管理サービスの利用条件を定めるものです。ユーザーは本規約に同意の上、当サービスを利用するものとします。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第2条（アカウント登録）</h2>
        <p>ユーザーは正確な情報を提供してアカウントを登録するものとします。登録情報に虚偽があった場合、当サービスはアカウントを停止できるものとします。アカウントの管理はユーザー自身の責任において行うものとし、第三者への貸与・譲渡は禁止します。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第3条（サービス内容）</h2>
        <p>当サービスは、予約管理、顧客管理、スケジュール管理等の機能を提供します。サービスの内容は予告なく変更・追加・廃止される場合があります。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第4条（禁止事項）</h2>
        <p>ユーザーは以下の行為を行ってはなりません。</p>
        <p style={{ paddingLeft: '16px' }}>
          ・法令または公序良俗に違反する行為<br/>
          ・当サービスの運営を妨害する行為<br/>
          ・他のユーザーの個人情報を不正に収集・利用する行為<br/>
          ・当サービスのシステムに対する不正アクセス<br/>
          ・その他、当サービスが不適切と判断する行為
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第5条（データの取り扱い）</h2>
        <p>ユーザーが当サービスに登録したデータ（顧客情報、予約情報等）の所有権はユーザーに帰属します。当サービスはユーザーのデータをサービス提供の目的以外で使用しません。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第6条（免責事項）</h2>
        <p>当サービスは、サービスの中断、データの消失、その他サービスの利用に関連してユーザーに生じた損害について、当サービスに故意または重大な過失がある場合を除き、一切の責任を負いません。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第7条（利用料金）</h2>
        <p>当サービスの利用料金は、別途定める料金表に基づきます。料金は予告の上で変更される場合があります。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第8条（解約）</h2>
        <p>ユーザーはいつでもアカウントを削除し、サービスの利用を終了することができます。解約後のデータは一定期間経過後に削除されます。</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', marginTop: '32px', marginBottom: '12px' }}>第9条（規約の変更）</h2>
        <p>当サービスは、必要に応じて本規約を変更できるものとします。変更後の規約は当サービス上に掲載した時点で効力を生じます。</p>

        <div style={{ marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '8px', fontSize: '13px', color: '#666' }}>
          お問い合わせ: 当サービスの設定画面内「ヘルプ・お問い合わせ」よりご連絡ください。
        </div>
      </div>
    </div>
  );
}
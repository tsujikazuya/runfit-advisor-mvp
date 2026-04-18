import './App.css'

export default function App() {
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>RunFit Advisor MVP</h1>
      <p>陸上競技専門店向けのシューズ選定支援デモです。</p>
      <ul>
        <li>ログイン（簡易）</li>
        <li>顧客情報入力</li>
        <li>動作評価入力</li>
        <li>推薦結果表示（ルールベース）</li>
      </ul>
    </main>
  )
}

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'

type Customer = {
  id: string
  name: string
  age: number
  gender: '男性' | '女性' | 'その他'
  event: string
  level: string
  monthlyKm: number
  injury: string
  usage: '競技用' | 'ジョグ用' | '通学兼用' | '普段履き' | '故障予防'
}

type Questionnaire = {
  customerId: string
  usageScene: 'レース' | '練習' | 'ジョグ' | '通学兼用' | '日常' | '故障予防'
  cushioning: number
  propulsion: number
  stability: number
  lightweight: number
  fit: number
  concern: string
  comment: string
}

type Assessment = {
  customerId: string
  landing: 'ヒール' | 'ミッド' | 'フォア'
  pronation: 'なし' | '軽度' | '中等度' | '強い'
  knee: '安定' | 'やや不安定' | '不安定'
  cadence: '低い' | '標準' | '高い'
  memo: string
}

type Shoe = {
  id: string
  brand: string
  model: string
  stability: number
  cushioning: number
  propulsion: number
  weight: number
  usage: Array<'レース'|'練習'|'ジョグ'|'通学兼用'|'日常'|'故障予防'>
  inventory: 'in'|'low'|'out'
}

type Purchase = {
  customerId: string
  tried: string
  bought?: string
  reason?: string
  memo: string
}

const shoes: Shoe[] = [
  { id:'S001', brand:'ASICS', model:'GEL-KAYANO 31', stability:5, cushioning:4, propulsion:3, weight:290, usage:['練習','ジョグ'], inventory:'in' },
  { id:'S002', brand:'MIZUNO', model:'WAVE RIDER 29', stability:3, cushioning:3, propulsion:3, weight:265, usage:['練習','ジョグ'], inventory:'in' },
  { id:'S003', brand:'NIKE', model:'VAPORFLY 4', stability:1, cushioning:4, propulsion:5, weight:190, usage:['レース'], inventory:'in' },
  { id:'S004', brand:'adidas', model:'BOSTON 13', stability:2, cushioning:3, propulsion:4, weight:235, usage:['練習','レース'], inventory:'in' },
  { id:'S005', brand:'HOKA', model:'CLIFTON 11', stability:3, cushioning:5, propulsion:2, weight:250, usage:['ジョグ','日常','故障予防'], inventory:'in' },
  { id:'S006', brand:'BROOKS', model:'Adrenaline GTS 24', stability:5, cushioning:3, propulsion:2, weight:285, usage:['練習','故障予防'], inventory:'in' },
  { id:'S007', brand:'PUMA', model:'Velocity Nitro 4', stability:3, cushioning:4, propulsion:3, weight:252, usage:['練習','ジョグ','日常'], inventory:'low' },
  { id:'S008', brand:'On', model:'Cloudmonster 3', stability:2, cushioning:4, propulsion:3, weight:275, usage:['ジョグ','日常'], inventory:'in' },
  { id:'S009', brand:'SAUCONY', model:'Endorphin Speed 5', stability:2, cushioning:3, propulsion:5, weight:220, usage:['練習','レース'], inventory:'in' },
  { id:'S010', brand:'New Balance', model:'1080v14', stability:2, cushioning:5, propulsion:2, weight:280, usage:['ジョグ','日常'], inventory:'in' },
  { id:'S011', brand:'ASICS', model:'NOVABLAST 5', stability:2, cushioning:4, propulsion:4, weight:255, usage:['練習','ジョグ'], inventory:'in' },
  { id:'S012', brand:'PUMA', model:'Deviate Nitro Elite 4', stability:1, cushioning:4, propulsion:5, weight:198, usage:['レース'], inventory:'low' },
  { id:'S013', brand:'MIZUNO', model:'WAVE REBELLION PRO 3', stability:2, cushioning:4, propulsion:5, weight:225, usage:['レース'], inventory:'low' },
  { id:'S014', brand:'NIKE', model:'PEGASUS 42', stability:3, cushioning:3, propulsion:3, weight:260, usage:['練習','ジョグ','日常'], inventory:'in' },
  { id:'S015', brand:'HOKA', model:'MACH X 3', stability:2, cushioning:4, propulsion:4, weight:235, usage:['練習','レース'], inventory:'in' }
]

const seedCustomers: Customer[] = [
  { id:'C001', name:'田中 海斗', age:17, gender:'男性', event:'中距離', level:'高校県大会', monthlyKm:280, injury:'右膝前面痛（昨年）', usage:'競技用' },
  { id:'C002', name:'佐藤 美咲', age:33, gender:'女性', event:'市民ラン', level:'サブ4目標', monthlyKm:120, injury:'なし', usage:'ジョグ用' },
]

const usageMap: Record<Customer['usage'], Questionnaire['usageScene']> = {
  競技用:'練習', ジョグ用:'ジョグ', 通学兼用:'通学兼用', 普段履き:'日常', 故障予防:'故障予防'
}

function recommend(customer: Customer, q?: Questionnaire, a?: Assessment) {
  return shoes
    .filter(s => s.inventory !== 'out')
    .map(s => {
      let score = 50
      const reasons: string[] = []
      const cautions: string[] = []

      if (s.usage.includes((q?.usageScene ?? usageMap[customer.usage]))) {
        score += 8; reasons.push('利用シーンに適合')
      }
      if (q) {
        score += 6 - Math.abs(q.cushioning - s.cushioning)
        score += 6 - Math.abs(q.propulsion - s.propulsion)
        score += 6 - Math.abs(q.stability - s.stability)
        if (q.lightweight >= 4 && s.weight <= 235) { score += 6; reasons.push('軽量志向に合致') }
      }
      if (a) {
        if (a.pronation === '中等度' || a.pronation === '強い') {
          if (s.stability >= 4) { score += 10; reasons.push('過回内配慮で安定性高い') }
          else { score -= 8; cautions.push('過回内に対して安定性が不足') }
        }
        if (a.knee !== '安定' && s.stability <= 2) {
          score -= 5; cautions.push('膝の安定性面で注意')
        }
      }
      if (customer.injury.includes('膝') && s.stability >= 4) {
        score += 5; reasons.push('膝の不安に配慮しやすい')
      }
      if (s.inventory === 'low') { score -= 5; cautions.push('在庫少なめ') }

      if (!reasons.length) reasons.push('総合バランスが良く初回提案向き')
      if (!cautions.length) cautions.push('試着で足幅と踵の収まりを確認')

      return { shoe: s, score: Math.round(score), reasons, cautions }
    })
    .sort((x,y)=>y.score-x.score)
    .slice(0,3)
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers)
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  return (
    <div className="shell">
      <header className="header">
        <strong>RunFit Advisor MVP（シューズ選定支援）</strong>
        <nav>
          <Link to="/dashboard">ダッシュボード</Link>
          <Link to="/customers">顧客一覧</Link>
          <Link to="/customers/new">顧客登録</Link>
          <button onClick={()=>setLoggedIn(false)}>ログアウト</button>
        </nav>
      </header>
      <div className="wrap">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard customers={customers} assessments={assessments} purchases={purchases} />} />
          <Route path="/customers" element={<Customers customers={customers} />} />
          <Route path="/customers/new" element={<CustomerNew onAdd={(c)=>setCustomers(prev=>[c,...prev])} />} />
          <Route path="/customers/:id" element={<CustomerDetail customers={customers} questionnaires={questionnaires} assessments={assessments} purchases={purchases} />} />
          <Route path="/customers/:id/analysis/new" element={<Analysis questionnaires={questionnaires} assessments={assessments}
            onSaveQ={(q)=>setQuestionnaires(prev=>upsert(prev, q))} onSaveA={(a)=>setAssessments(prev=>upsert(prev, a))} />} />
          <Route path="/customers/:id/recommendation" element={<Recommendation customers={customers} questionnaires={questionnaires} assessments={assessments} />} />
          <Route path="/customers/:id/purchase" element={<PurchasePage onSave={(p)=>setPurchases(prev=>upsert(prev,p))} purchases={purchases} />} />
        </Routes>
      </div>
    </div>
  )
}

function upsert<T extends { customerId: string }>(arr: T[], item: T) {
  const i = arr.findIndex(x=>x.customerId===item.customerId)
  if (i===-1) return [...arr, item]
  const next = [...arr]; next[i] = item; return next
}

function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="wrap">
      <div className="card" style={{maxWidth:520, margin:'40px auto'}}>
        <h2>スタッフログイン</h2>
        <p className="muted">医療診断ではなく、接客時のシューズ選定支援ツールです。</p>
        <button className="btn" onClick={onLogin}>ログイン（デモ）</button>
      </div>
    </div>
  )
}

function Dashboard({ customers, assessments, purchases }: { customers: Customer[]; assessments: Assessment[]; purchases: Purchase[] }) {
  const buyRate = purchases.length ? Math.round((purchases.filter(p=>p.bought).length / purchases.length) * 100) : 0
  return (
    <section className="grid">
      <article className="card"><h3>今月の分析件数</h3><p className="big">{assessments.length}件</p></article>
      <article className="card"><h3>推薦後購入率</h3><p className="big">{buyRate}%</p></article>
      <article className="card"><h3>登録顧客数</h3><p className="big">{customers.length}名</p></article>
      <article className="card"><h3>最近の顧客</h3>{customers.slice(0,5).map(c=><p key={c.id}>{c.name} / {c.event}</p>)}</article>
    </section>
  )
}

function Customers({ customers }: { customers: Customer[] }) {
  return (
    <section>
      <h2>顧客一覧</h2>
      <div className="grid">
        {customers.map(c=>(
          <article className="card" key={c.id}>
            <h3>{c.name}</h3>
            <p>{c.id} / {c.age}歳 / {c.gender}</p>
            <p>{c.event}・{c.level}</p>
            <p>用途: {c.usage}</p>
            <Link to={`/customers/${c.id}`}>詳細へ</Link>
          </article>
        ))}
      </div>
    </section>
  )
}

function CustomerNew({ onAdd }: { onAdd: (c: Customer) => void }) {
  const nav = useNavigate()
  const [f, setF] = useState<Omit<Customer,'id'>>({ name:'', age:18, gender:'男性', event:'', level:'', monthlyKm:100, injury:'なし', usage:'ジョグ用' })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const id = `C${String(Date.now()).slice(-4)}`
    onAdd({ id, ...f }); nav(`/customers/${id}`)
  }
  return (
    <section><h2>顧客新規登録</h2>
      <form className="form card" onSubmit={submit}>
        <label>氏名<input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label>
        <label>年齢<input type="number" value={f.age} onChange={e=>setF({...f,age:Number(e.target.value)})}/></label>
        <label>性別<select value={f.gender} onChange={e=>setF({...f,gender:e.target.value as Customer['gender']})}><option>男性</option><option>女性</option><option>その他</option></select></label>
        <label>競技種目<input required value={f.event} onChange={e=>setF({...f,event:e.target.value})}/></label>
        <label>競技レベル<input required value={f.level} onChange={e=>setF({...f,level:e.target.value})}/></label>
        <label>月間走行距離<input type="number" value={f.monthlyKm} onChange={e=>setF({...f,monthlyKm:Number(e.target.value)})}/></label>
        <label>故障歴<input value={f.injury} onChange={e=>setF({...f,injury:e.target.value})}/></label>
        <label>利用目的<select value={f.usage} onChange={e=>setF({...f,usage:e.target.value as Customer['usage']})}><option>競技用</option><option>ジョグ用</option><option>通学兼用</option><option>普段履き</option><option>故障予防</option></select></label>
        <button className="btn">登録</button>
      </form>
    </section>
  )
}

function CustomerDetail({ customers, questionnaires, assessments, purchases }: { customers: Customer[]; questionnaires: Questionnaire[]; assessments: Assessment[]; purchases: Purchase[] }) {
  const { id } = useParams()
  const c = customers.find(x=>x.id===id)
  if (!c) return <p>顧客が見つかりません</p>
  const q = questionnaires.find(x=>x.customerId===id)
  const a = assessments.find(x=>x.customerId===id)
  const p = purchases.find(x=>x.customerId===id)
  return (
    <section className="grid">
      <article className="card"><h3>{c.name} ({c.id})</h3><p>{c.age}歳 / {c.gender}</p><p>{c.event} / {c.level}</p><p>故障歴: {c.injury}</p></article>
      <article className="card"><h3>最新問診</h3><p>{q ? `${q.usageScene} / クッション${q.cushioning} / 安定${q.stability}` : '未入力'}</p></article>
      <article className="card"><h3>最新動作評価</h3><p>{a ? `接地 ${a.landing} / 過回内 ${a.pronation} / 膝 ${a.knee}` : '未入力'}</p></article>
      <article className="card"><h3>購入履歴</h3><p>{p ? `${p.bought ?? '未購入'} / ${p.memo}` : '未記録'}</p></article>
      <div className="row">
        <Link className="btn" to={`/customers/${c.id}/analysis/new`}>分析開始</Link>
        <Link className="btn ghost" to={`/customers/${c.id}/recommendation`}>推薦結果</Link>
      </div>
    </section>
  )
}

function Analysis({ questionnaires, assessments, onSaveQ, onSaveA }: { questionnaires: Questionnaire[]; assessments: Assessment[]; onSaveQ:(q:Questionnaire)=>void; onSaveA:(a:Assessment)=>void }) {
  const { id } = useParams()
  const nav = useNavigate()
  if (!id) return null
  const q0 = questionnaires.find(x=>x.customerId===id) ?? { customerId:id, usageScene:'練習', cushioning:3, propulsion:3, stability:3, lightweight:3, fit:3, concern:'', comment:'' }
  const a0 = assessments.find(x=>x.customerId===id) ?? { customerId:id, landing:'ミッド', pronation:'なし', knee:'安定', cadence:'標準', memo:'' }
  const [q, setQ] = useState<Questionnaire>(q0)
  const [a, setA] = useState<Assessment>(a0)
  const save = (e: FormEvent) => { e.preventDefault(); onSaveQ({...q, customerId:id}); onSaveA({...a, customerId:id}); nav(`/customers/${id}/recommendation`) }

  return (
    <section>
      <h2>分析入力</h2>
      <form className="form card" onSubmit={save}>
        <h3>問診</h3>
        <label>利用シーン<select value={q.usageScene} onChange={e=>setQ({...q,usageScene:e.target.value as Questionnaire['usageScene']})}><option>レース</option><option>練習</option><option>ジョグ</option><option>通学兼用</option><option>日常</option><option>故障予防</option></select></label>
        <div className="row">
          <label>クッション<select value={q.cushioning} onChange={e=>setQ({...q,cushioning:Number(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
          <label>反発<select value={q.propulsion} onChange={e=>setQ({...q,propulsion:Number(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
          <label>安定<select value={q.stability} onChange={e=>setQ({...q,stability:Number(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
        </div>
        <label>悩み<textarea rows={2} value={q.concern} onChange={e=>setQ({...q,concern:e.target.value})}/></label>

        <h3>動作評価</h3>
        <div className="row">
          <label>接地<select value={a.landing} onChange={e=>setA({...a,landing:e.target.value as Assessment['landing']})}><option>ヒール</option><option>ミッド</option><option>フォア</option></select></label>
          <label>過回内<select value={a.pronation} onChange={e=>setA({...a,pronation:e.target.value as Assessment['pronation']})}><option>なし</option><option>軽度</option><option>中等度</option><option>強い</option></select></label>
          <label>膝安定<select value={a.knee} onChange={e=>setA({...a,knee:e.target.value as Assessment['knee']})}><option>安定</option><option>やや不安定</option><option>不安定</option></select></label>
        </div>
        <label>スタッフ所見<textarea rows={2} value={a.memo} onChange={e=>setA({...a,memo:e.target.value})}/></label>

        <button className="btn">保存して推薦へ</button>
      </form>
    </section>
  )
}

function Recommendation({ customers, questionnaires, assessments }: { customers: Customer[]; questionnaires: Questionnaire[]; assessments: Assessment[] }) {
  const { id } = useParams()
  if (!id) return null
  const c = customers.find(x=>x.id===id); if (!c) return <p>顧客なし</p>
  const q = questionnaires.find(x=>x.customerId===id)
  const a = assessments.find(x=>x.customerId===id)
  const recs = useMemo(()=>recommend(c,q,a),[c,q,a])

  return (
    <section>
      <h2>シューズ推薦結果（上位3足）</h2>
      <p className="muted">※ 医療診断ではなく、シューズ選定支援の提案です。</p>
      <div className="grid">
        {recs.map((r,i)=>(
          <article className="card" key={r.shoe.id}>
            <h3>{i+1}位: {r.shoe.brand} {r.shoe.model}</h3>
            <p className="big">スコア {r.score}</p>
            <p>在庫: {r.shoe.inventory}</p>
            <h4>理由</h4><ul>{r.reasons.map(x=><li key={x}>{x}</li>)}</ul>
            <h4>注意点</h4><ul>{r.cautions.map(x=><li key={x}>{x}</li>)}</ul>
          </article>
        ))}
      </div>
      <div className="row" style={{marginTop:12}}>
        <Link className="btn" to={`/customers/${id}/purchase`}>購入記録へ</Link>
      </div>
    </section>
  )
}

function PurchasePage({ purchases, onSave }: { purchases: Purchase[]; onSave:(p:Purchase)=>void }) {
  const { id } = useParams()
  const nav = useNavigate()
  if (!id) return null
  const p0 = purchases.find(x=>x.customerId===id) ?? { customerId:id, tried:'', bought:'', reason:'', memo:'' }
  const [f, setF] = useState<Purchase>(p0)
  const submit = (e: FormEvent) => { e.preventDefault(); onSave({...f, customerId:id}); nav(`/customers/${id}`) }
  return (
    <section>
      <h2>購入記録</h2>
      <form className="form card" onSubmit={submit}>
        <label>試着したシューズID<input value={f.tried} onChange={e=>setF({...f,tried:e.target.value})} placeholder="S001,S004,S009"/></label>
        <label>購入したシューズID<input value={f.bought ?? ''} onChange={e=>setF({...f,bought:e.target.value})} placeholder="S009"/></label>
        <label>未購入理由<input value={f.reason ?? ''} onChange={e=>setF({...f,reason:e.target.value})}/></label>
        <label>スタッフ所感<textarea rows={3} value={f.memo} onChange={e=>setF({...f,memo:e.target.value})}/></label>
        <button className="btn">保存</button>
      </form>
    </section>
  )
}

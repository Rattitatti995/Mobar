'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bottle, Check, GlassWater, Minus, Plus, Search, ShoppingCart, Wine } from 'lucide-react'
import { hasSupabase, supabase } from '@/lib/supabase'

type BottleRow = { id:string; ingredient:string; brand:string|null; bottle_size_ml:number; remaining_ml:number; low_at_ml:number }
type RecipeIngredient = { ingredient:string; amount_ml:number }
type Cocktail = { id:string; name:string; description:string|null; ingredients:RecipeIngredient[] }

const demoBottles:BottleRow[] = [
 {id:'1',ingredient:'Vodka',brand:'Absolut',bottle_size_ml:700,remaining_ml:510,low_at_ml:150},
 {id:'2',ingredient:'Gin',brand:"Gordon's",bottle_size_ml:700,remaining_ml:185,low_at_ml:150},
 {id:'3',ingredient:'White rum',brand:'Bacardi',bottle_size_ml:700,remaining_ml:430,low_at_ml:150},
 {id:'4',ingredient:'Tequila',brand:'Olmeca',bottle_size_ml:700,remaining_ml:90,low_at_ml:150},
 {id:'5',ingredient:'Triple sec',brand:'Cointreau',bottle_size_ml:700,remaining_ml:260,low_at_ml:120},
 {id:'6',ingredient:'Lemon juice',brand:null,bottle_size_ml:500,remaining_ml:320,low_at_ml:100},
 {id:'7',ingredient:'Sugar syrup',brand:null,bottle_size_ml:500,remaining_ml:280,low_at_ml:100},
]
const demoCocktails:Cocktail[] = [
 {id:'1',name:'Long Island Iced Tea',description:'Fem brennevin, sitrus og cola.',ingredients:[{ingredient:'Vodka',amount_ml:15},{ingredient:'Gin',amount_ml:15},{ingredient:'White rum',amount_ml:15},{ingredient:'Tequila',amount_ml:15},{ingredient:'Triple sec',amount_ml:15},{ingredient:'Lemon juice',amount_ml:25},{ingredient:'Sugar syrup',amount_ml:15}]},
 {id:'2',name:'Tom Collins',description:'Gin, sitron, sukker og soda.',ingredients:[{ingredient:'Gin',amount_ml:50},{ingredient:'Lemon juice',amount_ml:25},{ingredient:'Sugar syrup',amount_ml:15}]},
 {id:'3',name:'Daiquiri',description:'Ren, syrlig romklassiker.',ingredients:[{ingredient:'White rum',amount_ml:60},{ingredient:'Lemon juice',amount_ml:30},{ingredient:'Sugar syrup',amount_ml:20}]},
]

export default function Home(){
 const [bottles,setBottles]=useState<BottleRow[]>(demoBottles)
 const [cocktails,setCocktails]=useState<Cocktail[]>(demoCocktails)
 const [tab,setTab]=useState<'drinks'|'bar'|'shopping'>('drinks')
 const [query,setQuery]=useState('')
 const [notice,setNotice]=useState('')
 const [loading,setLoading]=useState(true)

 useEffect(()=>{(async()=>{
  if(!supabase){setLoading(false);return}
  const [{data:b},{data:c}] = await Promise.all([
   supabase.from('bar_bottles').select('*').order('ingredient'),
   supabase.from('bar_cocktails').select('id,name,description,bar_recipe_ingredients(ingredient,amount_ml)').order('name')
  ])
  if(b?.length) setBottles(b as BottleRow[])
  if(c?.length) setCocktails(c.map((x:any)=>({id:x.id,name:x.name,description:x.description,ingredients:x.bar_recipe_ingredients||[]})))
  setLoading(false)
 })()},[])

 const totals=useMemo(()=>Object.fromEntries(bottles.map(b=>[b.ingredient,(bottles.filter(x=>x.ingredient===b.ingredient).reduce((s,x)=>s+Number(x.remaining_ml),0))])),[bottles])
 const canMake=(c:Cocktail)=>c.ingredients.every(i=>(totals[i.ingredient]||0)>=i.amount_ml)
 const filtered=cocktails.filter(c=>c.name.toLowerCase().includes(query.toLowerCase()))
 const low=bottles.filter(b=>Number(b.remaining_ml)<=Number(b.low_at_ml))

 async function makeDrink(c:Cocktail){
  if(!canMake(c)){setNotice('Du mangler nok innhold til denne drinken.');return}
  if(supabase && hasSupabase){
   const {error}=await supabase.rpc('make_cocktail',{p_cocktail_id:c.id})
   if(error){setNotice(error.message);return}
   const {data}=await supabase.from('bar_bottles').select('*').order('ingredient')
   if(data) setBottles(data as BottleRow[])
  } else {
   setBottles(prev=>{
    const next=prev.map(x=>({...x}))
    for(const ing of c.ingredients){let left=ing.amount_ml; for(const b of next.filter(x=>x.ingredient===ing.ingredient).sort((a,b)=>a.remaining_ml-b.remaining_ml)){const take=Math.min(left,b.remaining_ml);b.remaining_ml-=take;left-=take;if(left<=0)break}}
    return next
   })
  }
  setNotice(`${c.name} registrert. Lageret er oppdatert.`)
  setTimeout(()=>setNotice(''),2800)
 }

 return <main>
  <header><div className="brand"><div className="logo"><Wine size={25}/></div><div><b>BareBar</b><small>cocktails & inventory</small></div></div><div className="mode">{hasSupabase?'SUPABASE':'DEMO'}</div></header>
  <nav>
   <button className={tab==='drinks'?'active':''} onClick={()=>setTab('drinks')}><GlassWater/>Drinker</button>
   <button className={tab==='bar'?'active':''} onClick={()=>setTab('bar')}><Bottle/>Min bar</button>
   <button className={tab==='shopping'?'active':''} onClick={()=>setTab('shopping')}><ShoppingCart/>Handleliste{low.length>0&&<i>{low.length}</i>}</button>
  </nav>
  <section className="hero"><p>DIN HJEMMEBAR</p><h1>Hva skal vi lage?</h1><span>Oppskrifter som faktisk vet hvor mye som er igjen i flaskene.</span></section>
  {notice&&<div className="notice"><Check size={18}/>{notice}</div>}
  {tab==='drinks'&&<section className="content"><div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Søk etter cocktail..."/></div><div className="sectionTitle"><h2>Cocktails</h2><span>{filtered.filter(canMake).length} kan lages nå</span></div><div className="grid">{filtered.map(c=><article className="card" key={c.id}><div className="drinkIcon"><GlassWater/></div><div className="cardbody"><div className="cardtop"><h3>{c.name}</h3><span className={canMake(c)?'ready':'missing'}>{canMake(c)?'KAN LAGES':'MANGLER'}</span></div><p>{c.description}</p><div className="ingredients">{c.ingredients.map(i=><span key={i.ingredient} className={(totals[i.ingredient]||0)<i.amount_ml?'bad':''}>{i.ingredient} <b>{i.amount_ml} ml</b></span>)}</div><button className="make" disabled={!canMake(c)} onClick={()=>makeDrink(c)}>Lag drinken <span>− trekk fra lager</span></button></div></article>)}</div></section>}
  {tab==='bar'&&<section className="content"><div className="sectionTitle"><div><p className="eyebrow">BEHOLDNING</p><h2>Min bar</h2></div><span>{bottles.length} flasker</span></div><div className="bottlegrid">{bottles.map(b=>{const pct=Math.max(0,Math.round(b.remaining_ml/b.bottle_size_ml*100));return <article className="bottle" key={b.id}><div className="bottlehead"><Bottle/><div><h3>{b.brand||b.ingredient}</h3><p>{b.brand?b.ingredient:'Ingrediens'}</p></div>{b.remaining_ml<=b.low_at_ml&&<AlertTriangle className="warn"/>}</div><div className="meter"><i style={{width:`${pct}%`}}/></div><div className="amount"><strong>{Math.round(b.remaining_ml)} ml</strong><span>av {b.bottle_size_ml} ml · {pct}%</span></div><div className="quick"><button onClick={()=>setBottles(x=>x.map(v=>v.id===b.id?{...v,remaining_ml:Math.max(0,v.remaining_ml-10)}:v))}><Minus/>10 ml</button><button onClick={()=>setBottles(x=>x.map(v=>v.id===b.id?{...v,remaining_ml:Math.min(v.bottle_size_ml,v.remaining_ml+10)}:v))}><Plus/>10 ml</button></div></article>})}</div></section>}
  {tab==='shopping'&&<section className="content"><div className="sectionTitle"><div><p className="eyebrow">PÅFYLL</p><h2>Handleliste</h2></div><span>{low.length} varer</span></div>{low.length===0?<div className="empty"><Check/><h3>Baren er godt fylt</h3><p>Ingenting er under lavgrensen.</p></div>:<div className="shopping">{low.map(b=><div key={b.id}><AlertTriangle/><div><h3>{b.brand||b.ingredient}</h3><p>{Math.round(b.remaining_ml)} ml igjen · grense {b.low_at_ml} ml</p></div><strong>KJØP</strong></div>)}</div>}</section>}
  <footer>{loading?'Henter lager...':<>BareBar · {hasSupabase?'Live database':'Demo uten database'}</>}</footer>
 </main>
}

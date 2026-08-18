'use client'

import {FormEvent,useEffect,useMemo,useState} from 'react'
import {AlertTriangle,BarChart3,ChevronDown,Edit3,FlaskConical,GlassWater,Heart,History,LogOut,Minus,Plus,Search,ShoppingCart,Sparkles,Trash2,Wine,X} from 'lucide-react'
import {supabase} from '@/lib/supabase'
import {COCKTAIL_CATALOG,CatalogCocktail} from '@/lib/cocktailCatalog'

type Bottle={id:string;ingredient:string;brand:string|null;bottle_size_ml:number;remaining_ml:number;low_at_ml:number;is_open:boolean;purchase_price:number|null;abv:number|null;barcode:string|null}
type Ingredient={ingredient:string;amount_ml:number}
type Cocktail={id:string;name:string;description:string|null;instructions:string|null;glass:string|null;garnish:string|null;image_url:string|null;is_favorite:boolean;ingredients:Ingredient[]}
type Pour={id:string;cocktail_name:string;made_at:string}
type MissingRow={ingredient:string;needed:number;have:number;add_ml:number;brand:string;bottle_size_ml:number;price:string;abv:string;selected:boolean}

const ING=['Vodka','Gin','White rum','Dark rum','Spiced rum','Tequila','Bourbon','Whiskey','Scotch','Brandy','Cognac','Triple sec','Cointreau','Grand Marnier','Vermouth sweet','Vermouth dry','Campari','Aperol','Amaretto','Kahlúa','Baileys','Malibu','Jägermeister','Angostura bitters','Lemon juice','Lime juice','Orange juice','Pineapple juice','Cranberry juice','Grapefruit juice','Tomato juice','Sugar syrup','Grenadine','Cola','Soda water','Tonic water','Ginger beer','Ginger ale','Cream','Milk','Coffee','Espresso','Mint','Egg white','Prosecco','Coconut cream','Peach schnapps']
const EMPTY={ingredient:'',brand:'',bottle_size_ml:'700',remaining_ml:'700',low_at_ml:'150',purchase_price:'',abv:'',barcode:'',is_open:true}

export default function Page(){
 const [bottles,setBottles]=useState<Bottle[]>([])
 const [cocktails,setCocktails]=useState<Cocktail[]>([])
 const [pours,setPours]=useState<Pour[]>([])
 const [tab,setTab]=useState<'drinks'|'bar'|'shop'|'stats'>('drinks')
 const [q,setQ]=useState('')
 const [msg,setMsg]=useState('')
 const [bOpen,setBOpen]=useState(false)
 const [cOpen,setCOpen]=useState(false)
 const [bf,setBf]=useState(EMPTY)
 const [custom,setCustom]=useState('')
 const [expanded,setExpanded]=useState<Record<string,boolean>>({})
 const [cn,setCn]=useState(''),[cd,setCd]=useState(''),[ci,setCi]=useState(''),[cg,setCg]=useState(''),[cglass,setCglass]=useState('')
 const [recipe,setRecipe]=useState<Ingredient[]>([{ingredient:'',amount_ml:40}])
 const [missingCocktail,setMissingCocktail]=useState<Cocktail|null>(null)
 const [missingRows,setMissingRows]=useState<MissingRow[]>([])
 const [editBottle,setEditBottle]=useState<Bottle|null>(null)
 const [editForm,setEditForm]=useState({remaining_ml:'',bottle_size_ml:'',low_at_ml:'',purchase_price:'',abv:'',brand:'',barcode:'',is_open:true})

 async function load(){
  const [{data:bd},{data:cdat},{data:pd}]=await Promise.all([
   supabase.from('bar_bottles').select('*').order('ingredient'),
   supabase.from('bar_cocktails').select('id,name,description,instructions,glass,garnish,image_url,is_favorite,bar_recipe_ingredients(ingredient,amount_ml)').order('name'),
   supabase.from('bar_pours').select('id,cocktail_name,made_at').order('made_at',{ascending:false}).limit(200)
  ])
  setBottles((bd||[]) as Bottle[])
  setCocktails((cdat||[]).map((x:any)=>({...x,ingredients:x.bar_recipe_ingredients||[]})))
  setPours((pd||[]) as Pour[])
 }
 useEffect(()=>{load()},[])

 const totals=useMemo(()=>Object.fromEntries([...new Set(bottles.map(x=>x.ingredient))].map(i=>[i,bottles.filter(x=>x.ingredient===i).reduce((s,x)=>s+Number(x.remaining_ml),0)])),[bottles])
 const pricePerMl=useMemo(()=>Object.fromEntries([...new Set(bottles.map(x=>x.ingredient))].map(i=>{const x=bottles.filter(v=>v.ingredient===i&&v.purchase_price);return[i,x.length?x.reduce((s,z)=>s+Number(z.purchase_price)/Number(z.bottle_size_ml),0)/x.length:0]})),[bottles])
 const abvByIng=useMemo(()=>Object.fromEntries([...new Set(bottles.map(x=>x.ingredient))].map(i=>{const x=bottles.filter(v=>v.ingredient===i&&v.abv!==null);return[i,x.length?x.reduce((s,z)=>s+Number(z.abv),0)/x.length:0]})),[bottles])
 const count=(x:{ingredients:Ingredient[]})=>x.ingredients.length?Math.max(0,Math.min(...x.ingredients.map(i=>Math.floor((totals[i.ingredient]||0)/i.amount_ml)))):0
 const missing=(x:{ingredients:Ingredient[]})=>x.ingredients.filter(i=>(totals[i.ingredient]||0)<i.amount_ml).map(i=>({...i,missing_ml:Math.max(0,i.amount_ml-(totals[i.ingredient]||0))}))
 const cost=(x:{ingredients:Ingredient[]})=>x.ingredients.reduce((s,i)=>s+(pricePerMl[i.ingredient]||0)*i.amount_ml,0)
 const abv=(x:{ingredients:Ingredient[]})=>{const vol=x.ingredients.reduce((s,i)=>s+i.amount_ml,0);return vol?x.ingredients.reduce((s,i)=>s+i.amount_ml*((abvByIng[i.ingredient]||0)/100),0)/vol*100:0}
 const filtered=cocktails.filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase()))
 const suggestions=useMemo(()=>{const s=new Set(cocktails.map(x=>x.name.toLowerCase()));return q?COCKTAIL_CATALOG.filter(x=>x.name.toLowerCase().includes(q.toLowerCase())).slice(0,8).map(x=>({...x,saved:s.has(x.name.toLowerCase())})):[]},[q,cocktails])
 const groups=useMemo(()=>{const m=new Map<string,Bottle[]>();bottles.forEach(x=>{const k=[x.ingredient,(x.brand||''),x.bottle_size_ml].join('|').toLowerCase();m.set(k,[...(m.get(k)||[]),x])});return [...m.entries()]},[bottles])
 const low=bottles.filter(x=>Number(x.remaining_ml)<=Number(x.low_at_ml))
 const unlocks=useMemo(()=>{const out:Record<string,number>={};for(const d of COCKTAIL_CATALOG){const m=d.ingredients.filter(i=>(totals[i.ingredient]||0)<i.amount_ml);if(m.length===1)out[m[0].ingredient]=(out[m[0].ingredient]||0)+1}return Object.entries(out).sort((a,b)=>b[1]-a[1]).slice(0,5)},[totals])
 const top=useMemo(()=>{const m:Record<string,number>={};pours.forEach(x=>m[x.cocktail_name]=(m[x.cocktail_name]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5)},[pours])
 const flash=(s:string)=>{setMsg(s);setTimeout(()=>setMsg(''),2800)}

 async function addCatalog(x:CatalogCocktail){
  if(cocktails.some(y=>y.name.toLowerCase()===x.name.toLowerCase())){setQ(x.name);return}
  const{data,error}=await supabase.from('bar_cocktails').insert({name:x.name,description:x.description}).select('id').single()
  if(error||!data)return flash(error?.message||'Kunne ikke lagre')
  const{error:e}=await supabase.from('bar_recipe_ingredients').insert(x.ingredients.map(i=>({...i,cocktail_id:data.id})))
  if(e)return flash(e.message)
  await load();setQ(x.name);flash(`${x.name} lagt til`)
 }
 async function make(x:Cocktail){const{error}=await supabase.rpc('make_cocktail',{p_cocktail_id:x.id});if(error)return flash(error.message);await load();flash(`${x.name} laget · lageret er oppdatert`)}
 async function favorite(x:Cocktail){await supabase.from('bar_cocktails').update({is_favorite:!x.is_favorite}).eq('id',x.id);await load()}

 function openMissing(x:Cocktail){
  const rows=missing(x).map(i=>{
   const existing=bottles.find(b=>b.ingredient===i.ingredient)
   return {ingredient:i.ingredient,needed:i.amount_ml,have:totals[i.ingredient]||0,add_ml:existing?Math.max(Math.ceil(i.missing_ml),100):700,brand:existing?.brand||'',bottle_size_ml:existing?.bottle_size_ml||700,price:existing?.purchase_price?.toString()||'',abv:existing?.abv?.toString()||'',selected:true}
  })
  setMissingCocktail(x);setMissingRows(rows)
 }
 async function addMissingIngredients(){
  const chosen=missingRows.filter(r=>r.selected&&r.add_ml>0)
  if(!chosen.length)return flash('Velg minst én ingrediens')
  const rows=chosen.map(r=>({ingredient:r.ingredient,brand:r.brand||null,bottle_size_ml:Math.max(r.bottle_size_ml,r.add_ml),remaining_ml:r.add_ml,low_at_ml:150,is_open:true,purchase_price:r.price?Number(r.price):null,abv:r.abv?Number(r.abv):null}))
  const{error}=await supabase.from('bar_bottles').insert(rows)
  if(error)return flash(error.message)
  setMissingCocktail(null);setMissingRows([]);await load();flash(`${chosen.length} ingrediens${chosen.length===1?'':'er'} lagt til i baren`)
 }

 async function addBottle(e:FormEvent){e.preventDefault();const ing=bf.ingredient==='__other__'?custom.trim():bf.ingredient;if(!ing)return;const{error}=await supabase.from('bar_bottles').insert({ingredient:ing,brand:bf.brand||null,bottle_size_ml:+bf.bottle_size_ml,remaining_ml:+bf.remaining_ml,low_at_ml:+bf.low_at_ml,is_open:bf.is_open,purchase_price:bf.purchase_price?+bf.purchase_price:null,abv:bf.abv?+bf.abv:null,barcode:bf.barcode||null});if(error)return flash(error.message);setBf(EMPTY);setCustom('');setBOpen(false);await load();flash('Flasken er registrert')}
 async function adjust(x:Bottle,d:number){const v=Math.max(0,Math.min(+x.bottle_size_ml,+x.remaining_ml+d));await supabase.from('bar_bottles').update({remaining_ml:v,is_open:true}).eq('id',x.id);await load()}
 async function toggleOpen(x:Bottle){await supabase.from('bar_bottles').update({is_open:!x.is_open}).eq('id',x.id);await load()}
 async function delBottle(id:string){await supabase.from('bar_bottles').delete().eq('id',id);await load()}
 function openEdit(x:Bottle){setEditBottle(x);setEditForm({remaining_ml:String(x.remaining_ml),bottle_size_ml:String(x.bottle_size_ml),low_at_ml:String(x.low_at_ml),purchase_price:x.purchase_price?.toString()||'',abv:x.abv?.toString()||'',brand:x.brand||'',barcode:x.barcode||'',is_open:x.is_open})}
 async function saveEdit(e:FormEvent){
  e.preventDefault();if(!editBottle)return
  const size=Number(editForm.bottle_size_ml),remaining=Number(editForm.remaining_ml)
  if(size<=0||remaining<0||remaining>size)return flash('Sjekk flaske- og restmengde')
  const{error}=await supabase.from('bar_bottles').update({brand:editForm.brand||null,bottle_size_ml:size,remaining_ml:remaining,low_at_ml:Math.max(0,Number(editForm.low_at_ml)),purchase_price:editForm.purchase_price?Number(editForm.purchase_price):null,abv:editForm.abv?Number(editForm.abv):null,barcode:editForm.barcode||null,is_open:editForm.is_open}).eq('id',editBottle.id)
  if(error)return flash(error.message)
  setEditBottle(null);await load();flash('Flasken er oppdatert')
 }

 async function addOwn(e:FormEvent){e.preventDefault();if(!cn||!recipe.some(x=>x.ingredient&&x.amount_ml>0))return;const{data,error}=await supabase.from('bar_cocktails').insert({name:cn,description:cd||null,instructions:ci||null,garnish:cg||null,glass:cglass||null}).select('id').single();if(error||!data)return flash(error?.message||'Kunne ikke lagre');await supabase.from('bar_recipe_ingredients').insert(recipe.filter(x=>x.ingredient&&x.amount_ml>0).map(x=>({...x,cocktail_id:data.id})));setCn('');setCd('');setCi('');setCg('');setCglass('');setRecipe([{ingredient:'',amount_ml:40}]);setCOpen(false);await load()}

 return <main>
  <header><div className="brand"><div className="logo"><Wine/></div><div><b>MoBar</b><small>inventory intelligence</small></div></div><button className="logout" onClick={()=>supabase.auth.signOut()}><LogOut/>Logg ut</button></header>
  <nav><button className={tab==='drinks'?'active':''} onClick={()=>setTab('drinks')}><GlassWater/>Drinker</button><button className={tab==='bar'?'active':''} onClick={()=>setTab('bar')}><FlaskConical/>Min bar</button><button className={tab==='shop'?'active':''} onClick={()=>setTab('shop')}><ShoppingCart/>Handleliste</button><button className={tab==='stats'?'active':''} onClick={()=>setTab('stats')}><BarChart3/>Innsikt</button></nav>
  <section className="hero"><p>MOBAR INVENTORY INTELLIGENCE</p><h1>Baren som vet hva som faktisk er igjen.</h1><span>Ikke bare «du har gin». MoBar vet hvor mye, hvor mange drinker det holder til, hva som går tomt først og hva ett kjøp låser opp.</span></section>
  {msg&&<div className="notice">{msg}</div>}

  {tab==='drinks'&&<section className="content">
   <div className="searchwrap"><div className="search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Søk drink, f.eks. Long Island…"/>{q&&<button onClick={()=>setQ('')}><X/></button>}</div>{suggestions.length>0&&<div className="suggestions">{suggestions.map(x=><button key={x.name} onClick={()=>addCatalog(x)}><GlassWater/><span><b>{x.name}</b><small>{x.description}</small></span><em>{x.saved?'I samlingen':'Legg til'}</em></button>)}</div>}</div>
   <div className="sectionTitle"><div><h2>{q?'Søkeresultater':'Mine cocktails'}</h2><span>{cocktails.filter(x=>count(x)>0).length} kan lages nå</span></div><button className="addbtn" onClick={()=>setCOpen(true)}><Plus/>Egen cocktail</button></div>
   <div className="grid">{filtered.map(x=>{const n=count(x),miss=missing(x),kr=cost(x),pct=abv(x);return <article className={'card smartcard '+(!n?'cardclickable':'')} key={x.id} onClick={()=>!n&&openMissing(x)}>
    <div className="drinkIcon"><GlassWater/></div><div className="cardbody"><div className="cardtop"><h3>{x.name}</h3><button className={'heart '+(x.is_favorite?'on':'')} onClick={e=>{e.stopPropagation();favorite(x)}}><Heart/></button></div><p>{x.description}</p>
    <div className="smartline"><strong>{n>0?`${n} ${n===1?'drink':'drinker'} mulig`:`Mangler ${miss.length}`}</strong>{pct>0&&<span>≈ {pct.toFixed(1)}% ABV</span>}{kr>0&&<span>≈ {kr.toFixed(0)} kr</span>}</div>
    {miss.length>0&&<div className="missingline">{miss.slice(0,3).map(i=><span key={i.ingredient}>{i.ingredient} +{Math.ceil(i.missing_ml)} ml</span>)}</div>}
    <div className="ingredients">{x.ingredients.map((i,n)=><span key={n} className={(totals[i.ingredient]||0)<i.amount_ml?'bad':''}>{i.ingredient} <b>{i.amount_ml} ml</b></span>)}</div>
    {(x.glass||x.garnish||x.instructions)&&<details className="recipeDetails" onClick={e=>e.stopPropagation()}><summary>Oppskrift</summary>{x.glass&&<p><b>Glass:</b> {x.glass}</p>}{x.garnish&&<p><b>Garnityr:</b> {x.garnish}</p>}{x.instructions&&<p>{x.instructions}</p>}</details>}
    {n>0?<button className="make" onClick={e=>{e.stopPropagation();make(x)}}>Lag drinken <span>· trekk automatisk fra flaskene</span></button>:<button className="missingbtn" onClick={e=>{e.stopPropagation();openMissing(x)}}><Plus/>Se og legg til det som mangler</button>}
    </div></article>})}</div>
   {filtered.length===0&&<div className="empty"><Search/><h3>Ingen lagrede treff</h3><p>Velg et forslag over for å legge drinken til.</p></div>}
  </section>}

  {tab==='bar'&&<section className="content"><div className="sectionTitle"><div><h2>Min bar</h2><span>{bottles.length} flasker · {groups.length} typer · {Math.round(bottles.reduce((s,x)=>s+Number(x.remaining_ml),0)/10)/100} L igjen</span></div><button className="addbtn" onClick={()=>setBOpen(true)}><Plus/>Ny flaske</button></div><div className="bottlegrid">{groups.map(([k,list])=>{const first=list[0],total=list.reduce((s,x)=>s+Number(x.remaining_ml),0),cap=list.length*Number(first.bottle_size_ml),open=expanded[k]||list.length===1;return <article className="bottle" key={k}><div className="bottlehead"><FlaskConical/><div><h3>{first.brand||first.ingredient}</h3><p>{first.ingredient} · {list.length} {list.length===1?'flaske':'flasker'}</p></div><button className="expandbtn" onClick={()=>setExpanded(v=>({...v,[k]:!open}))}><ChevronDown className={open?'rotated':''}/></button></div><div className="meter"><i style={{width:`${Math.round(total/cap*100)}%`}}/></div><div className="amount"><strong>{Math.round(total)} ml</strong><span>av {cap} ml totalt</span></div>{open&&<div className="individuals">{[...list].sort((a,z)=>Number(z.is_open)-Number(a.is_open)).map((x,i)=><div className="individual individual-v2" key={x.id}><div><b>Flaske {i+1} · {x.is_open?'åpen':'uåpnet'}</b><span>{Math.round(+x.remaining_ml)} / {x.bottle_size_ml} ml{x.abv?` · ${x.abv}%`:''}{x.purchase_price?` · ${x.purchase_price} kr`:' · pris ikke satt'}</span></div>{+x.remaining_ml<=+x.low_at_ml&&<AlertTriangle className="warn"/>}<button onClick={()=>adjust(x,-10)}><Minus/></button><button onClick={()=>adjust(x,10)}><Plus/></button><button className="statebtn" onClick={()=>toggleOpen(x)}>{x.is_open?'Lukk':'Åpne'}</button><button className="editbtn" title="Rediger flaske" onClick={()=>openEdit(x)}><Edit3/></button><button className="iconbtn" onClick={()=>delBottle(x.id)}><Trash2/></button></div>)}</div>}</article>})}</div></section>}

  {tab==='shop'&&<section className="content"><div className="sectionTitle"><div><h2>Smart handleliste</h2><span>Prioritert etter hva du faktisk får igjen for å kjøpe</span></div></div>{unlocks.length>0&&<div className="unlockbox"><Sparkles/><div><b>Størst effekt per kjøp</b>{unlocks.map(([i,n])=><p key={i}><strong>{i}</strong> låser opp {n} {n===1?'ny cocktail':'nye cocktails'}</p>)}</div></div>}<div className="shopping">{low.map(x=><div key={x.id}><AlertTriangle/><div><h3>{x.brand||x.ingredient}</h3><p>{Math.round(+x.remaining_ml)} ml igjen · terskel {x.low_at_ml} ml</p></div><strong>KJØP 1 × {x.bottle_size_ml} ml</strong></div>)}</div>{low.length===0&&<div className="empty"><h3>Alt ser greit ut</h3><p>Ingen flasker er under handlegrensen.</p></div>}</section>}

  {tab==='stats'&&<section className="content"><div className="statsgrid"><article><History/><b>{pours.length}</b><span>drinker registrert</span></article><article><FlaskConical/><b>{Math.round(bottles.reduce((s,x)=>s+Number(x.remaining_ml),0)} ml</b><span>totalt på lager</span></article><article><GlassWater/><b>{cocktails.filter(x=>count(x)>0).length}</b><span>cocktails du kan lage nå</span></article><article><Heart/><b>{cocktails.filter(x=>x.is_favorite).length}</b><span>favoritter</span></article></div><div className="insightgrid"><div><h2>Mest laget</h2>{top.length?top.map(([name,n],i)=><p key={name}><span>#{i+1} {name}</span><strong>{n}</strong></p>):<p>Ingen historikk ennå.</p>}</div><div><h2>Siste serveringer</h2>{pours.slice(0,8).map(x=><p key={x.id}><span>{x.cocktail_name}</span><small>{new Date(x.made_at).toLocaleString('nb-NO')}</small></p>)}</div></div></section>}

  {missingCocktail&&<div className="modalback"><div className="modal wide missingmodal"><button className="close" onClick={()=>setMissingCocktail(null)}><X/></button><p className="eyebrow">MANGLER TIL OPPSKRIFTEN</p><h2>{missingCocktail.name}</h2><p className="modalintro">Legg til det du mangler direkte i baren. Mengdene kan endres før du lagrer.</p><div className="missingrows">{missingRows.map((r,i)=><div className={'missingrow '+(r.selected?'selected':'')} key={r.ingredient}><label className="missingcheck"><input type="checkbox" checked={r.selected} onChange={e=>setMissingRows(v=>v.map((x,n)=>n===i?{...x,selected:e.target.checked}:x))}/><span><b>{r.ingredient}</b><small>Har {Math.round(r.have)} ml · trenger {r.needed} ml</small></span></label><div className="missingfields"><label>Legg til, ml<input type="number" min="1" value={r.add_ml} onChange={e=>setMissingRows(v=>v.map((x,n)=>n===i?{...x,add_ml:Number(e.target.value)}:x))}/></label><label>Flaskestørrelse<input type="number" min="1" value={r.bottle_size_ml} onChange={e=>setMissingRows(v=>v.map((x,n)=>n===i?{...x,bottle_size_ml:Number(e.target.value)}:x))}/></label><label>Merke<input value={r.brand} placeholder="Valgfritt" onChange={e=>setMissingRows(v=>v.map((x,n)=>n===i?{...x,brand:e.target.value}:x))}/></label><label>Pris, kr<input type="number" min="0" value={r.price} placeholder="Valgfritt" onChange={e=>setMissingRows(v=>v.map((x,n)=>n===i?{...x,price:e.target.value}:x))}/></label><label>ABV, %<input type="number" min="0" max="100" step="0.1" value={r.abv} placeholder="Valgfritt" onChange={e=>setMissingRows(v=>v.map((x,n)=>n===i?{...x,abv:e.target.value}:x))}/></label></div></div>)}</div><button className="savebtn" onClick={addMissingIngredients}>Legg valgte ingredienser i beholdningen</button></div></div>}

  {editBottle&&<div className="modalback"><form className="modal" onSubmit={saveEdit}><button type="button" className="close" onClick={()=>setEditBottle(null)}><X/></button><p className="eyebrow">REDIGER FLASKE</p><h2>{editBottle.brand||editBottle.ingredient}</h2><p className="modalintro">{editBottle.ingredient}. Pris og øvrige detaljer kan endres når som helst.</p><label>Merke<input value={editForm.brand} onChange={e=>setEditForm({...editForm,brand:e.target.value})}/></label><div className="formrow"><label>Flaskestørrelse, ml<input type="number" min="1" value={editForm.bottle_size_ml} onChange={e=>setEditForm({...editForm,bottle_size_ml:e.target.value})}/></label><label>Igjen, ml<input type="number" min="0" value={editForm.remaining_ml} onChange={e=>setEditForm({...editForm,remaining_ml:e.target.value})}/></label></div><div className="formrow"><label>Pris, kr<input type="number" min="0" step="0.01" placeholder="f.eks. 399" value={editForm.purchase_price} onChange={e=>setEditForm({...editForm,purchase_price:e.target.value})}/></label><label>ABV, %<input type="number" min="0" max="100" step="0.1" value={editForm.abv} onChange={e=>setEditForm({...editForm,abv:e.target.value})}/></label></div><label>Strekkode<input value={editForm.barcode} onChange={e=>setEditForm({...editForm,barcode:e.target.value})}/></label><label>Handlegrense, ml<input type="number" min="0" value={editForm.low_at_ml} onChange={e=>setEditForm({...editForm,low_at_ml:e.target.value})}/></label><label className="checklabel"><input type="checkbox" checked={editForm.is_open} onChange={e=>setEditForm({...editForm,is_open:e.target.checked})}/> Flasken er åpnet</label><button className="savebtn">Lagre endringer</button></form></div>}

  {bOpen&&<div className="modalback"><form className="modal" onSubmit={addBottle}><button type="button" className="close" onClick={()=>setBOpen(false)}><X/></button><h2>Legg til fysisk flaske</h2><label>Ingrediens<select value={bf.ingredient} onChange={e=>setBf({...bf,ingredient:e.target.value})} required><option value="">Velg…</option>{ING.map(i=><option key={i}>{i}</option>)}<option value="__other__">Annet…</option></select></label>{bf.ingredient==='__other__'&&<label>Egen ingrediens<input value={custom} onChange={e=>setCustom(e.target.value)} required/></label>}<label>Merke<input value={bf.brand} onChange={e=>setBf({...bf,brand:e.target.value})} placeholder="f.eks. Gordon's"/></label><div className="formrow"><label>Flaske, ml<input type="number" value={bf.bottle_size_ml} onChange={e=>setBf({...bf,bottle_size_ml:e.target.value})}/></label><label>Igjen, ml<input type="number" value={bf.remaining_ml} onChange={e=>setBf({...bf,remaining_ml:e.target.value})}/></label></div><div className="formrow"><label>Pris, kr<input type="number" value={bf.purchase_price} onChange={e=>setBf({...bf,purchase_price:e.target.value})}/></label><label>ABV, %<input type="number" step="0.1" value={bf.abv} onChange={e=>setBf({...bf,abv:e.target.value})}/></label></div><label>Strekkode<input value={bf.barcode} onChange={e=>setBf({...bf,barcode:e.target.value})}/></label><label className="checklabel"><input type="checkbox" checked={bf.is_open} onChange={e=>setBf({...bf,is_open:e.target.checked})}/> Flasken er åpnet</label><label>Handlegrense, ml<input type="number" value={bf.low_at_ml} onChange={e=>setBf({...bf,low_at_ml:e.target.value})}/></label><p className="formhint">Like flasker grupperes visuelt, men lagres separat. MoBar bruker åpne flasker først.</p><button className="savebtn">Lagre flaske</button></form></div>}

  {cOpen&&<div className="modalback"><form className="modal wide" onSubmit={addOwn}><button type="button" className="close" onClick={()=>setCOpen(false)}><X/></button><h2>Ny cocktail</h2><label>Navn<input value={cn} onChange={e=>setCn(e.target.value)} required/></label><label>Beskrivelse<input value={cd} onChange={e=>setCd(e.target.value)}/></label><div className="formrow"><label>Glass<input value={cglass} onChange={e=>setCglass(e.target.value)} placeholder="Highball"/></label><label>Garnityr<input value={cg} onChange={e=>setCg(e.target.value)} placeholder="Sitronbåt"/></label></div><label>Fremgangsmåte<textarea value={ci} onChange={e=>setCi(e.target.value)} placeholder="Fyll glasset med is…"/></label>{recipe.map((x,i)=><div className="reciperow" key={i}><select value={x.ingredient} onChange={e=>setRecipe(v=>v.map((r,n)=>n===i?{...r,ingredient:e.target.value}:r))}><option value="">Ingrediens…</option>{[...new Set([...bottles.map(x=>x.ingredient),...ING])].sort().map(v=><option key={v}>{v}</option>)}</select><input type="number" value={x.amount_ml} onChange={e=>setRecipe(v=>v.map((r,n)=>n===i?{...r,amount_ml:+e.target.value}:r))}/><button type="button" className="iconbtn" onClick={()=>setRecipe(v=>v.filter((_,n)=>n!==i))}><X/></button></div>)}<button type="button" className="secondary" onClick={()=>setRecipe(v=>[...v,{ingredient:'',amount_ml:20}])}><Plus/>Ingrediens</button><button className="savebtn">Lagre cocktail</button></form></div>}
 </main>
}

'use client'

import {FormEvent,useEffect,useMemo,useState} from 'react'
import type {Session} from '@supabase/supabase-js'
import {AlertTriangle,BarChart3,Dice5,Edit3,FlaskConical,GlassWater,Heart,Home,LogOut,Minus,Plus,RefreshCw,Search,ShoppingCart,Sparkles,Trash2,X} from 'lucide-react'
import {supabase} from '@/lib/supabase'

type Bottle={id:string;ingredient:string;brand:string|null;bottle_size_ml:number;remaining_ml:number;low_at_ml:number;is_open:boolean;purchase_price:number|null;abv:number|null;barcode:string|null}
type Ingredient={ingredient:string;amount_ml:number}
type Cocktail={id:string;name:string;description:string|null;instructions:string|null;glass:string|null;garnish:string|null;image_url:string|null;is_favorite:boolean;source?:string|null;external_id?:string|null;ingredients:Ingredient[]}
type Pour={id:string;cocktail_name:string;made_at:string}
type Tab='home'|'inspire'|'drinks'|'bar'|'shop'|'stats'
type Filter='all'|'makeable'|'almost'|'favorites'

type BottleForm={ingredient:string;brand:string;bottle_size_ml:string;remaining_ml:string;low_at_ml:string;purchase_price:string;abv:string;barcode:string;is_open:boolean}
const EMPTY_BOTTLE:BottleForm={ingredient:'',brand:'',bottle_size_ml:'700',remaining_ml:'700',low_at_ml:'150',purchase_price:'',abv:'',barcode:'',is_open:true}
const CORE_INGREDIENTS=['Akevitt','Amaretto','Angostura bitters','Aperol','Baileys','Bourbon','Brandy','Campari','Cognac','Cointreau','Coconut cream','Coffee','Cola','Cream','Cranberry juice','Dark rum','Egg white','Espresso','Gin','Ginger ale','Ginger beer','Grand Marnier','Grapefruit juice','Grenadine','Jägermeister','Kahlúa','Lemon juice','Lime juice','Malibu','Milk','Mint','Orange juice','Peach schnapps','Pineapple juice','Prosecco','Scotch','Soda water','Spiced rum','Sugar syrup','Tequila','Tomato juice','Tonic water','Triple sec','Vermouth dry','Vermouth sweet','Vodka','Whiskey','White rum']
const nb=(a:string,b:string)=>a.localeCompare(b,'nb',{sensitivity:'base'})

export default function Page(){
 const [session,setSession]=useState<Session|null>(null)
 const [authLoading,setAuthLoading]=useState(true)
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [signup,setSignup]=useState(false)
 const [authBusy,setAuthBusy]=useState(false)
 const [authMsg,setAuthMsg]=useState('')
 const [bottles,setBottles]=useState<Bottle[]>([])
 const [cocktails,setCocktails]=useState<Cocktail[]>([])
 const [pours,setPours]=useState<Pour[]>([])
 const [loading,setLoading]=useState(true)
 const [syncing,setSyncing]=useState(false)
 const [tab,setTab]=useState<Tab>('home')
 const [filter,setFilter]=useState<Filter>('all')
 const [q,setQ]=useState('')
 const [detail,setDetail]=useState<Cocktail|null>(null)
 const [notice,setNotice]=useState('')
 const [limit,setLimit]=useState(60)
 const [bottleModal,setBottleModal]=useState(false)
 const [editingBottle,setEditingBottle]=useState<Bottle|null>(null)
 const [bottleForm,setBottleForm]=useState<BottleForm>(EMPTY_BOTTLE)
 const [cocktailModal,setCocktailModal]=useState(false)
 const [customName,setCustomName]=useState('')
 const [customDescription,setCustomDescription]=useState('')
 const [customInstructions,setCustomInstructions]=useState('')
 const [customGlass,setCustomGlass]=useState('')
 const [customGarnish,setCustomGarnish]=useState('')
 const [customRecipe,setCustomRecipe]=useState<Ingredient[]>([{ingredient:'',amount_ml:40}])

 const flash=(s:string)=>{setNotice(s);window.setTimeout(()=>setNotice(''),3600)}

 useEffect(()=>{
  supabase.auth.getSession().then(({data})=>{setSession(data.session);setAuthLoading(false)})
  const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setAuthLoading(false)})
  return()=>subscription.unsubscribe()
 },[])

 async function load(){
  if(!session)return
  setLoading(true)
  const[{data:bd,error:be},{data:cd,error:ce},{data:pd,error:pe}]=await Promise.all([
   supabase.from('bar_bottles').select('*'),
   supabase.from('bar_cocktails').select('id,name,description,instructions,glass,garnish,image_url,is_favorite,source,external_id,bar_recipe_ingredients(ingredient,amount_ml)').order('name'),
   supabase.from('bar_pours').select('id,cocktail_name,made_at').order('made_at',{ascending:false}).limit(300)
  ])
  if(be||ce||pe)flash(be?.message||ce?.message||pe?.message||'Kunne ikke laste data')
  setBottles(((bd||[]) as Bottle[]).sort((a,b)=>nb(a.ingredient,b.ingredient)||nb(a.brand||'',b.brand||'')))
  setCocktails((cd||[]).map((x:any)=>({...x,ingredients:(x.bar_recipe_ingredients||[]).map((r:any)=>({ingredient:r.ingredient,amount_ml:Number(r.amount_ml)}))})))
  setPours((pd||[]) as Pour[])
  setLoading(false)
 }

 async function syncCatalog(force=false){
  if(!session||syncing)return
  const key=`mobar:cocktaildb:sync:${session.user.id}`
  const last=Number(localStorage.getItem(key)||0)
  if(!force&&last&&Date.now()-last<24*60*60*1000)return
  setSyncing(true)
  const{data,error}=await supabase.functions.invoke('sync-cocktaildb')
  setSyncing(false)
  if(error||!data?.ok){flash(`CocktailDB-synk feilet: ${error?.message||data?.error||'ukjent feil'}`);return}
  localStorage.setItem(key,String(Date.now()))
  await load()
  flash(`${data.cocktails||0} drinker synkronisert fra TheCocktailDB`)
 }

 useEffect(()=>{if(session){load().then(()=>syncCatalog(false))}else{setBottles([]);setCocktails([]);setPours([])}},[session])
 useEffect(()=>{setLimit(60)},[q,filter])

 async function submitAuth(e:FormEvent){
  e.preventDefault();setAuthBusy(true);setAuthMsg('')
  const result=signup?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}}):await supabase.auth.signInWithPassword({email,password})
  setAuthBusy(false)
  if(result.error)setAuthMsg(result.error.message)
  else if(signup&&!result.data.session)setAuthMsg('Konto opprettet. Bekreft e-posten før du logger inn.')
 }

 const totals=useMemo(()=>{const m:Record<string,number>={};for(const b of bottles)m[b.ingredient]=(m[b.ingredient]||0)+Number(b.remaining_ml);return m},[bottles])
 const priced=useMemo(()=>{const m=new Map<string,number[]>();for(const b of bottles){if(b.purchase_price&&Number(b.purchase_price)>0&&Number(b.bottle_size_ml)>0){m.set(b.ingredient,[...(m.get(b.ingredient)||[]),Number(b.purchase_price)/Number(b.bottle_size_ml)])}}return new Map([...m].map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length]))},[bottles])
 const abvs=useMemo(()=>{const m=new Map<string,number[]>();for(const b of bottles){if(b.abv!==null&&Number(b.abv)>0)m.set(b.ingredient,[...(m.get(b.ingredient)||[]),Number(b.abv)])}return new Map([...m].map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length]))},[bottles])
 const servings=(c:Cocktail)=>c.ingredients.length?Math.max(0,Math.min(...c.ingredients.map(i=>Math.floor((totals[i.ingredient]||0)/Number(i.amount_ml))))):0
 const missing=(c:Cocktail)=>c.ingredients.filter(i=>(totals[i.ingredient]||0)<Number(i.amount_ml))
 const priceInfo=(c:Cocktail)=>{let cost=0;const miss:string[]=[];for(const i of c.ingredients){const p=priced.get(i.ingredient);if(!p)miss.push(i.ingredient);else cost+=p*Number(i.amount_ml)}return{cost,missing:[...new Set(miss)].sort(nb)}}
 const drinkAbv=(c:Cocktail)=>{const vol=c.ingredients.reduce((s,i)=>s+Number(i.amount_ml),0);if(!vol)return 0;return c.ingredients.reduce((s,i)=>s+Number(i.amount_ml)*(abvs.get(i.ingredient)||0)/100,0)/vol*100}
 const makeable=useMemo(()=>cocktails.filter(c=>c.ingredients.length&&servings(c)>0).sort((a,b)=>servings(b)-servings(a)||nb(a.name,b.name)),[cocktails,totals])
 const almost=useMemo(()=>cocktails.filter(c=>c.ingredients.length&&servings(c)===0&&missing(c).length===1).sort((a,b)=>nb(a.name,b.name)),[cocktails,totals])
 const filtered=useMemo(()=>cocktails.filter(c=>{
  const query=q.trim().toLowerCase();if(query&&!(c.name.toLowerCase().includes(query)||c.ingredients.some(i=>i.ingredient.toLowerCase().includes(query))))return false
  if(filter==='makeable')return servings(c)>0
  if(filter==='almost')return servings(c)===0&&missing(c).length<=2
  if(filter==='favorites')return c.is_favorite
  return true
 }).sort((a,b)=>{const sa=servings(a),sb=servings(b);if(sa!==sb)return sb-sa;return nb(a.name,b.name)}),[cocktails,q,filter,totals])
 const ingredientOptions=useMemo(()=>[...new Set([...CORE_INGREDIENTS,...bottles.map(b=>b.ingredient),...cocktails.flatMap(c=>c.ingredients.map(i=>i.ingredient))])].sort(nb),[bottles,cocktails])
 const lowGroups=useMemo(()=>{const m=new Map<string,Bottle[]>();for(const b of bottles){if(Number(b.remaining_ml)<=Number(b.low_at_ml))m.set(b.ingredient,[...(m.get(b.ingredient)||[]),b])}return[...m.entries()].sort((a,b)=>nb(a[0],b[0]))},[bottles])
 const smartBuys=useMemo(()=>{const m:Record<string,number>={};for(const c of cocktails){if(servings(c)>0)continue;const miss=missing(c);if(miss.length===1)m[miss[0].ingredient]=(m[miss[0].ingredient]||0)+1}return Object.entries(m).sort((a,b)=>b[1]-a[1]||nb(a[0],b[0])).slice(0,12)},[cocktails,totals])
 const topPours=useMemo(()=>{const m:Record<string,number>={};for(const p of pours)m[p.cocktail_name]=(m[p.cocktail_name]||0)+1;return Object.entries(m).sort((a,b)=>b[1]-a[1]||nb(a[0],b[0])).slice(0,8)},[pours])

 function openNewBottle(ingredient=''){setEditingBottle(null);setBottleForm({...EMPTY_BOTTLE,ingredient});setBottleModal(true)}
 function openBottleEdit(b:Bottle){setEditingBottle(b);setBottleForm({ingredient:b.ingredient,brand:b.brand||'',bottle_size_ml:String(b.bottle_size_ml),remaining_ml:String(b.remaining_ml),low_at_ml:String(b.low_at_ml),purchase_price:b.purchase_price?.toString()||'',abv:b.abv?.toString()||'',barcode:b.barcode||'',is_open:b.is_open});setBottleModal(true)}
 async function saveBottle(e:FormEvent){
  e.preventDefault();const size=Number(bottleForm.bottle_size_ml),remaining=Number(bottleForm.remaining_ml)
  if(!bottleForm.ingredient.trim()||size<=0||remaining<0||remaining>size)return flash('Sjekk ingrediens, flaskestørrelse og restmengde')
  const row={ingredient:bottleForm.ingredient.trim(),brand:bottleForm.brand.trim()||null,bottle_size_ml:size,remaining_ml:remaining,low_at_ml:Math.max(0,Number(bottleForm.low_at_ml)||0),purchase_price:bottleForm.purchase_price?Number(bottleForm.purchase_price):null,abv:bottleForm.abv?Number(bottleForm.abv):null,barcode:bottleForm.barcode.trim()||null,is_open:bottleForm.is_open}
  const{error}=editingBottle?await supabase.from('bar_bottles').update(row).eq('id',editingBottle.id):await supabase.from('bar_bottles').insert(row)
  if(error)return flash(error.message);setBottleModal(false);setEditingBottle(null);await load();flash(editingBottle?'Flasken er oppdatert':'Flasken er lagt til')
 }
 async function adjustBottle(b:Bottle,delta:number){const next=Math.max(0,Math.min(Number(b.bottle_size_ml),Number(b.remaining_ml)+delta));await supabase.from('bar_bottles').update({remaining_ml:next,is_open:true}).eq('id',b.id);await load()}
 async function toggleBottle(b:Bottle){await supabase.from('bar_bottles').update({is_open:!b.is_open}).eq('id',b.id);await load()}
 async function deleteBottle(b:Bottle){if(!window.confirm(`Slette ${b.brand||b.ingredient}?`))return;await supabase.from('bar_bottles').delete().eq('id',b.id);await load()}

 async function toggleFavorite(c:Cocktail){await supabase.from('bar_cocktails').update({is_favorite:!c.is_favorite}).eq('id',c.id);await load();setDetail(d=>d?.id===c.id?{...d,is_favorite:!c.is_favorite}:d)}
 async function makeDrink(c:Cocktail){
  const price=priceInfo(c);const{error}=await supabase.rpc('make_cocktail',{p_cocktail_id:c.id});if(error)return flash(error.message)
  setDetail(null);await load();flash(price.missing.length?`${c.name} laget · lager oppdatert · pris mangler på ${price.missing.join(', ')}`:`${c.name} laget · kostpris ≈ ${price.cost.toLocaleString('nb-NO',{minimumFractionDigits:2,maximumFractionDigits:2})} kr`)
 }

 async function saveCustomCocktail(e:FormEvent){
  e.preventDefault();const recipe=customRecipe.filter(r=>r.ingredient.trim()&&Number(r.amount_ml)>0);if(!customName.trim()||!recipe.length)return flash('Cocktailen må ha navn og minst én ingrediens')
  const{data,error}=await supabase.from('bar_cocktails').insert({name:customName.trim(),description:customDescription.trim()||null,instructions:customInstructions.trim()||null,glass:customGlass.trim()||null,garnish:customGarnish.trim()||null,source:'custom'}).select('id').single();if(error||!data)return flash(error?.message||'Kunne ikke lagre cocktailen')
  const{error:re}=await supabase.from('bar_recipe_ingredients').insert(recipe.map(r=>({cocktail_id:data.id,ingredient:r.ingredient.trim(),amount_ml:Number(r.amount_ml)})));if(re)return flash(re.message)
  setCocktailModal(false);setCustomName('');setCustomDescription('');setCustomInstructions('');setCustomGlass('');setCustomGarnish('');setCustomRecipe([{ingredient:'',amount_ml:40}]);await load();flash('Cocktailen er lagret')
 }

 function DrinkCard({c,compact=false}:{c:Cocktail;compact?:boolean}){const n=servings(c),miss=missing(c),price=priceInfo(c);return <article className={`drinkcard ${compact?'compact':''}`} onClick={()=>setDetail(c)}>{c.image_url?<img className="drinkimage" src={c.image_url} alt="" loading="lazy"/>:<div className="drinkimage fallback"><GlassWater/></div>}<div className="drinkbody"><div className="drinkhead"><div><h3>{c.name}</h3>{!compact&&<p>{c.description||'Cocktail'}</p>}</div><button className={`heart ${c.is_favorite?'on':''}`} onClick={e=>{e.stopPropagation();toggleFavorite(c)}} aria-label="Favoritt"><Heart/></button></div><div className="badges"><span className={n>0?'ok':miss.length<=2?'near':'bad'}>{n>0?`${n} ${n===1?'drink':'drinker'} mulig`:`Mangler ${miss.length}`}</span>{drinkAbv(c)>0&&<span>≈ {drinkAbv(c).toFixed(0)}% ABV</span>}{price.missing.length===0&&price.cost>0?<span>≈ {price.cost.toFixed(0)} kr</span>:<span className="price-missing">Pris mangler</span>}</div></div></article>}

 if(authLoading)return <div className="splash"><img src="/mobar-mark.svg" alt="MoBar"/><span>Laster MoBar…</span></div>
 if(!session)return <div className="authscreen"><div className="authwrap"><section className="authhero"><img src="/mobar-logo.svg" alt="MoBar"/><p className="eyebrow">COCKTAILS · BEHOLDNING · HANDLELISTE</p><h1>Vet hva du kan lage.<br/>Og hva du snart er tom for.</h1><p>MoBar holder orden på faktiske flaskemengder, cocktailoppskrifter og kostpris. TheCocktailDB leverer katalogen, så vi slipper å late som 40 hardkodede drinker er hele cocktailverdenen.</p></section><form className="authcard" onSubmit={submitAuth}><p className="eyebrow">{signup?'NY KONTO':'VELKOMMEN TILBAKE'}</p><h2>{signup?'Opprett konto':'Logg inn'}</h2><label>E-post<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label>Passord<input type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete={signup?'new-password':'current-password'}/></label>{authMsg&&<div className="authmsg">{authMsg}</div>}<button className="primary full" disabled={authBusy}>{authBusy?'Jobber…':signup?'Opprett konto':'Logg inn'}</button><button type="button" className="textbtn" onClick={()=>{setSignup(!signup);setAuthMsg('')}}>{signup?'Har konto? Logg inn':'Ny her? Opprett konto'}</button></form></div></div>

 return <main>
  <header className="topbar"><button className="brand" onClick={()=>setTab('home')}><img src="/mobar-mark.svg" alt=""/><span><b>MoBar</b><small>cocktail inventory</small></span></button><div className="topstats"><span><b>{makeable.length}</b> kan lages</span><span><b>{bottles.length}</b> flasker</span><span><b>{cocktails.length}</b> oppskrifter</span></div><div className="headbuttons"><button className="syncbtn" onClick={()=>syncCatalog(true)} disabled={syncing}><RefreshCw className={syncing?'spin':''}/>{syncing?'Synker…':'Synk'}</button><button className="logout" onClick={()=>supabase.auth.signOut()}><LogOut/>Logg ut</button></div></header>
  <nav className="nav"><button className={tab==='home'?'active':''} onClick={()=>setTab('home')}><Home/>Hjem</button><button className={tab==='inspire'?'active':''} onClick={()=>setTab('inspire')}><Sparkles/>Inspirasjon</button><button className={tab==='drinks'?'active':''} onClick={()=>setTab('drinks')}><GlassWater/>Drinker</button><button className={tab==='bar'?'active':''} onClick={()=>setTab('bar')}><FlaskConical/>Min bar</button><button className={tab==='shop'?'active':''} onClick={()=>setTab('shop')}><ShoppingCart/>Handleliste</button><button className={tab==='stats'?'active':''} onClick={()=>setTab('stats')}><BarChart3/>Innsikt</button></nav>
  {notice&&<div className="notice">{notice}</div>}
  {syncing&&<div className="syncbar"><RefreshCw className="spin"/> Henter oppdatert cocktailkatalog fra TheCocktailDB…</div>}

  {tab==='home'&&<><section className="hero"><div><p className="eyebrow">MOBAR · THECOCKTAILDB</p><h1>Hva har du lyst på?</h1><p>MoBar sammenligner oppskriftene med den faktiske mengden i flaskene dine.</p><div className="actions"><button className="primary" onClick={()=>{const pool=makeable.length?makeable:cocktails;if(pool.length)setDetail(pool[Math.floor(Math.random()*pool.length)])}}><Dice5/>Overrask meg</button><button className="secondary" onClick={()=>{setFilter('makeable');setTab('drinks')}}>Se det jeg kan lage</button><button className="secondary" onClick={()=>openNewBottle()}><Plus/>Ny flaske</button></div></div><div className="heroMetric"><small>AKKURAT NÅ</small><strong>{makeable.length}</strong><span>cocktails kan lages</span><p>{almost.length} er én ingrediens unna</p></div></section><section className="content"><div className="metrics"><article><FlaskConical/><div><b>{(bottles.reduce((s,b)=>s+Number(b.remaining_ml),0)/1000).toFixed(1)} L</b><span>på lager</span></div></article><article><GlassWater/><div><b>{makeable.length}</b><span>kan lages</span></div></article><article><Sparkles/><div><b>{almost.length}</b><span>én ting unna</span></div></article><article><AlertTriangle/><div><b>{lowGroups.length}</b><span>bør fylles på</span></div></article></div><SectionTitle kicker="KLAR TIL Å LAGES" title="Du har alt du trenger"/><div className="drinkgrid">{makeable.slice(0,6).map(c=><DrinkCard key={c.id} c={c}/>)}</div>{!loading&&!makeable.length&&<Empty title="Ingen komplette drinker ennå" text={cocktails.length?'Legg inn flere ingredienser i Min bar.':'Cocktailkatalogen synkroniseres fra TheCocktailDB.'}/>}<div className="twocol"><div><SectionTitle kicker="NESTEN DER" title="Én ingrediens unna"/><div className="stack">{almost.slice(0,6).map(c=><DrinkCard key={c.id} c={c} compact/>)}</div></div><div><SectionTitle kicker="SMART HANDLELISTE" title="Mest effekt per kjøp"/><div className="smartlist">{smartBuys.slice(0,6).map(([i,n],idx)=><button key={i} onClick={()=>setTab('shop')}><b>#{idx+1}</b><span><strong>{i}</strong><small>låser opp {n} {n===1?'cocktail':'cocktails'}</small></span><Plus/></button>)}</div></div></div></section></>}

  {tab==='inspire'&&<section className="content page"><div className="pagehero"><p className="eyebrow">INSPIRASJON</p><h1>La barskapet bestemme.</h1><p>{makeable.length?`${makeable.length} drinker kan lages akkurat nå.`:'Ingen komplette drinker ennå, men du kan fortsatt bla i katalogen.'}</p><button className="primary big" onClick={()=>{const pool=makeable.length?makeable:cocktails;if(pool.length)setDetail(pool[Math.floor(Math.random()*pool.length)])}}><Dice5/>Gi meg noe tilfeldig</button></div><SectionTitle kicker="FORSLAG" title="Basert på beholdningen din"/><div className="drinkgrid">{(makeable.length?makeable:cocktails).slice(0,18).map(c=><DrinkCard key={c.id} c={c}/>)}</div></section>}

  {tab==='drinks'&&<section className="content page"><div className="pagehero small"><p className="eyebrow">THECOCKTAILDB + EGNE OPPSKRIFTER</p><h1>Alle drinker</h1><p>{cocktails.length} oppskrifter tilgjengelig.</p></div><div className="search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Søk på drink eller ingrediens…"/>{q&&<button onClick={()=>setQ('')}><X/></button>}</div><div className="filters"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Alle <b>{cocktails.length}</b></button><button className={filter==='makeable'?'active':''} onClick={()=>setFilter('makeable')}>Kan lages <b>{makeable.length}</b></button><button className={filter==='almost'?'active':''} onClick={()=>setFilter('almost')}>Nesten</button><button className={filter==='favorites'?'active':''} onClick={()=>setFilter('favorites')}>Favoritter <b>{cocktails.filter(c=>c.is_favorite).length}</b></button><button className="addcocktail" onClick={()=>setCocktailModal(true)}><Plus/>Egen cocktail</button></div><div className="resultline">{filtered.length} treff</div><div className="drinkgrid">{filtered.slice(0,limit).map(c=><DrinkCard key={c.id} c={c}/>)}</div>{limit<filtered.length&&<button className="loadmore" onClick={()=>setLimit(v=>v+60)}>Vis flere ({filtered.length-limit} igjen)</button>}</section>}

  {tab==='bar'&&<section className="content page"><div className="pagehero small"><p className="eyebrow">BEHOLDNING</p><h1>Min bar</h1><p>{bottles.length} fysiske flasker · {(bottles.reduce((s,b)=>s+Number(b.remaining_ml),0)/1000).toFixed(1)} liter registrert.</p><button className="primary" onClick={()=>openNewBottle()}><Plus/>Ny flaske</button></div><div className="bottlegrid">{groupBottles(bottles).map(({key,list})=>{const first=list[0],total=list.reduce((s,b)=>s+Number(b.remaining_ml),0),cap=list.reduce((s,b)=>s+Number(b.bottle_size_ml),0);return <article className="bottle" key={key}><div className="bottlehead"><FlaskConical/><div><h3>{first.ingredient}</h3><p>{first.brand||'Uten merke'} · {list.length} {list.length===1?'flaske':'flasker'}</p></div></div><div className="meter"><i style={{width:`${cap?Math.min(100,total/cap*100):0}%`}}/></div><div className="amount"><strong>{Math.round(total)} ml</strong><span>av {Math.round(cap)} ml</span></div><div className="individuals">{[...list].sort((a,b)=>Number(b.is_open)-Number(a.is_open)||Number(a.remaining_ml)-Number(b.remaining_ml)).map((b,i)=><div className="individual" key={b.id}><div><b>Flaske {i+1} · {b.is_open?'åpen':'lukket'}</b><span>{Math.round(Number(b.remaining_ml))} / {b.bottle_size_ml} ml{b.purchase_price?` · ${b.purchase_price} kr`:' · pris ikke satt'}{b.abv?` · ${b.abv}%`:''}</span></div><div className="bottleactions"><button onClick={()=>adjustBottle(b,-10)} title="-10 ml"><Minus/></button><button onClick={()=>adjustBottle(b,10)} title="+10 ml"><Plus/></button><button className="state" onClick={()=>toggleBottle(b)}>{b.is_open?'Lukk':'Åpne'}</button><button onClick={()=>openBottleEdit(b)} title="Rediger"><Edit3/></button><button className="danger" onClick={()=>deleteBottle(b)} title="Slett"><Trash2/></button></div></div>)}</div></article>})}</div>{!bottles.length&&<Empty title="Baren er tom" text="Legg inn første flaske for å begynne."/>}</section>}

  {tab==='shop'&&<section className="content page"><div className="pagehero small"><p className="eyebrow">HANDLELISTE</p><h1>Kjøp det som gir mest mening</h1><p>Lav beholdning og ingredienser som låser opp flest nye drinker.</p></div>{smartBuys.length>0&&<div className="unlock"><Sparkles/><div><b>Størst effekt akkurat nå</b>{smartBuys.slice(0,8).map(([i,n])=><p key={i}><strong>{i}</strong> låser opp {n} {n===1?'drink':'drinker'}</p>)}</div></div>}<SectionTitle kicker="LAV BEHOLDNING" title="På tide å fylle på"/><div className="shopping">{lowGroups.map(([ingredient,list])=><div key={ingredient}><AlertTriangle/><span><b>{ingredient}</b><small>{Math.round(list.reduce((s,b)=>s+Number(b.remaining_ml),0))} ml igjen</small></span><strong>KJØP {list[0].bottle_size_ml} ML</strong></div>)}</div>{!lowGroups.length&&<Empty title="Ingenting haster" text="Ingen flasker er under handlegrensen akkurat nå."/>}</section>}

  {tab==='stats'&&<section className="content page"><div className="pagehero small"><p className="eyebrow">INNSIKT</p><h1>Hva skjer i baren?</h1></div><div className="metrics"><article><GlassWater/><div><b>{pours.length}</b><span>drinker registrert</span></div></article><article><FlaskConical/><div><b>{bottles.length}</b><span>flasker</span></div></article><article><Sparkles/><div><b>{makeable.length}</b><span>kan lages</span></div></article><article><Heart/><div><b>{cocktails.filter(c=>c.is_favorite).length}</b><span>favoritter</span></div></article></div><div className="insightgrid"><article><h2>Mest laget</h2>{topPours.length?topPours.map(([name,n],i)=><p key={name}><span>#{i+1} {name}</span><b>{n}</b></p>):<p>Ingen historikk ennå.</p>}</article><article><h2>Siste serveringer</h2>{pours.slice(0,12).map(p=><p key={p.id}><span>{p.cocktail_name}</span><small>{new Date(p.made_at).toLocaleString('nb-NO')}</small></p>)}</article></div></section>}

  {detail&&<CocktailModal cocktail={detail} totals={totals} servings={servings(detail)} missing={missing(detail)} price={priceInfo(detail)} abv={drinkAbv(detail)} onClose={()=>setDetail(null)} onFavorite={()=>toggleFavorite(detail)} onMake={()=>makeDrink(detail)} onAddIngredient={i=>{setDetail(null);openNewBottle(i)}}/>}
  {bottleModal&&<BottleModal form={bottleForm} setForm={setBottleForm} options={ingredientOptions} editing={Boolean(editingBottle)} onClose={()=>{setBottleModal(false);setEditingBottle(null)}} onSubmit={saveBottle}/>} 
  {cocktailModal&&<CustomCocktailModal name={customName} setName={setCustomName} description={customDescription} setDescription={setCustomDescription} instructions={customInstructions} setInstructions={setCustomInstructions} glass={customGlass} setGlass={setCustomGlass} garnish={customGarnish} setGarnish={setCustomGarnish} recipe={customRecipe} setRecipe={setCustomRecipe} options={ingredientOptions} onClose={()=>setCocktailModal(false)} onSubmit={saveCustomCocktail}/>} 
  <footer>Cocktaildata og bilder leveres av TheCocktailDB · Lagerdata lagres i din private MoBar-konto.</footer>
 </main>
}

function groupBottles(bottles:Bottle[]){const m=new Map<string,Bottle[]>();for(const b of bottles){const key=[b.ingredient,b.brand||'',b.bottle_size_ml].join('|').toLowerCase();m.set(key,[...(m.get(key)||[]),b])}return [...m.entries()].map(([key,list])=>({key,list})).sort((a,b)=>nb(a.list[0].ingredient,b.list[0].ingredient)||nb(a.list[0].brand||'',b.list[0].brand||''))}
function SectionTitle({kicker,title}:{kicker:string;title:string}){return <div className="sectiontitle"><p className="eyebrow">{kicker}</p><h2>{title}</h2></div>}
function Empty({title,text}:{title:string;text:string}){return <div className="empty"><GlassWater/><h3>{title}</h3><p>{text}</p></div>}

function CocktailModal({cocktail,totals,servings,missing,price,abv,onClose,onFavorite,onMake,onAddIngredient}:{cocktail:Cocktail;totals:Record<string,number>;servings:number;missing:Ingredient[];price:{cost:number;missing:string[]};abv:number;onClose:()=>void;onFavorite:()=>void;onMake:()=>void;onAddIngredient:(i:string)=>void}){return <div className="modalback" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal drinkmodal"><button className="close" onClick={onClose}><X/></button><div className="detailhero">{cocktail.image_url?<img src={cocktail.image_url} alt=""/>:<div className="detailfallback"><GlassWater/></div>}<div><p className="eyebrow">{cocktail.source==='cocktaildb'?'THECOCKTAILDB':'EGEN OPPSKRIFT'}</p><h2>{cocktail.name}</h2><p>{cocktail.description}</p><div className="badges"><span className={servings>0?'ok':'bad'}>{servings>0?`${servings} ${servings===1?'drink':'drinker'} mulig`:`Mangler ${missing.length}`}</span>{abv>0&&<span>≈ {abv.toFixed(0)}% ABV</span>}</div></div></div><div className="detailgrid"><div><h3>Ingredienser</h3>{cocktail.ingredients.map(i=>{const have=totals[i.ingredient]||0,ok=have>=i.amount_ml;return <div className="ingredientrow" key={`${cocktail.id}-${i.ingredient}`}><i className={ok?'yes':'no'}/><span><b>{i.ingredient}</b><small>{Math.round(have)} ml på lager</small></span><strong>{Number(i.amount_ml).toFixed(Number(i.amount_ml)%1?1:0)} ml</strong></div>})}</div><div><h3>Slik lager du den</h3>{cocktail.glass&&<p><b>Glass:</b> {cocktail.glass}</p>}{cocktail.garnish&&<p><b>Garnityr:</b> {cocktail.garnish}</p>}<p className="instructions">{cocktail.instructions||'Bland ingrediensene og server kald.'}</p><div className={price.missing.length?'pricebox missing':'pricebox'}>{price.missing.length?<><b>Kostpris kan ikke beregnes</b><span>Pris mangler på {price.missing.join(', ')}</span></>:<><b>Kostpris ≈ {price.cost.toLocaleString('nb-NO',{minimumFractionDigits:2,maximumFractionDigits:2})} kr</b><span>Beregnet fra registrerte flaskepriser.</span></>}</div></div></div><div className="modalactions"><button className="secondary" onClick={onFavorite}><Heart/> {cocktail.is_favorite?'Fjern favoritt':'Favoritt'}</button>{servings>0?<button className="primary" onClick={onMake}><GlassWater/>Lag drinken{price.missing.length?' · pris mangler':` · ≈ ${price.cost.toFixed(2)} kr`}</button>:<div className="missingactions">{missing.slice(0,3).map(i=><button className="secondary" key={i.ingredient} onClick={()=>onAddIngredient(i.ingredient)}><Plus/>{i.ingredient}</button>)}</div>}</div></div></div>}

function BottleModal({form,setForm,options,editing,onClose,onSubmit}:{form:BottleForm;setForm:(v:BottleForm)=>void;options:string[];editing:boolean;onClose:()=>void;onSubmit:(e:FormEvent)=>void}){return <div className="modalback"><form className="modal formmodal" onSubmit={onSubmit}><button type="button" className="close" onClick={onClose}><X/></button><p className="eyebrow">{editing?'REDIGER FLASKE':'NY FLASKE'}</p><h2>{editing?'Oppdater flasken':'Legg til i baren'}</h2><label>Ingrediens<input list="ingredient-list" required value={form.ingredient} onChange={e=>setForm({...form,ingredient:e.target.value})} placeholder="f.eks. Akevitt"/><datalist id="ingredient-list">{options.map(i=><option value={i} key={i}/>)}</datalist></label><label>Merke<input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} placeholder="f.eks. Smirnoff"/></label><div className="formrow"><label>Flaskestørrelse, ml<input type="number" min="1" required value={form.bottle_size_ml} onChange={e=>setForm({...form,bottle_size_ml:e.target.value})}/></label><label>Igjen, ml<input type="number" min="0" required value={form.remaining_ml} onChange={e=>setForm({...form,remaining_ml:e.target.value})}/></label></div><div className="formrow"><label>Pris, kr<input type="number" min="0" step="0.01" value={form.purchase_price} onChange={e=>setForm({...form,purchase_price:e.target.value})}/></label><label>ABV, %<input type="number" min="0" max="100" step="0.1" value={form.abv} onChange={e=>setForm({...form,abv:e.target.value})}/></label></div><label>Strekkode<input value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})}/></label><label>Handlegrense, ml<input type="number" min="0" value={form.low_at_ml} onChange={e=>setForm({...form,low_at_ml:e.target.value})}/></label><label className="check"><input type="checkbox" checked={form.is_open} onChange={e=>setForm({...form,is_open:e.target.checked})}/> Flasken er åpnet</label><button className="primary full">{editing?'Lagre endringer':'Lagre flaske'}</button></form></div>}

function CustomCocktailModal({name,setName,description,setDescription,instructions,setInstructions,glass,setGlass,garnish,setGarnish,recipe,setRecipe,options,onClose,onSubmit}:{name:string;setName:(v:string)=>void;description:string;setDescription:(v:string)=>void;instructions:string;setInstructions:(v:string)=>void;glass:string;setGlass:(v:string)=>void;garnish:string;setGarnish:(v:string)=>void;recipe:Ingredient[];setRecipe:(v:Ingredient[])=>void;options:string[];onClose:()=>void;onSubmit:(e:FormEvent)=>void}){return <div className="modalback"><form className="modal formmodal wide" onSubmit={onSubmit}><button type="button" className="close" onClick={onClose}><X/></button><p className="eyebrow">EGEN OPPSKRIFT</p><h2>Ny cocktail</h2><label>Navn<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Beskrivelse<input value={description} onChange={e=>setDescription(e.target.value)}/></label><div className="formrow"><label>Glass<input value={glass} onChange={e=>setGlass(e.target.value)}/></label><label>Garnityr<input value={garnish} onChange={e=>setGarnish(e.target.value)}/></label></div><label>Fremgangsmåte<textarea value={instructions} onChange={e=>setInstructions(e.target.value)}/></label><h3>Ingredienser</h3><datalist id="recipe-ingredients">{options.map(i=><option value={i} key={i}/>)}</datalist>{recipe.map((r,i)=><div className="reciperow" key={i}><input list="recipe-ingredients" value={r.ingredient} onChange={e=>setRecipe(recipe.map((x,n)=>n===i?{...x,ingredient:e.target.value}:x))} placeholder="Ingrediens"/><input type="number" min="0.1" step="0.1" value={r.amount_ml} onChange={e=>setRecipe(recipe.map((x,n)=>n===i?{...x,amount_ml:Number(e.target.value)}:x))}/><span>ml</span><button type="button" onClick={()=>setRecipe(recipe.filter((_,n)=>n!==i))}><X/></button></div>)}<button type="button" className="secondary" onClick={()=>setRecipe([...recipe,{ingredient:'',amount_ml:20}])}><Plus/>Ingrediens</button><button className="primary full">Lagre cocktail</button></form></div>}

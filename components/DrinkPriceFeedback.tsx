'use client'

import {useEffect,useRef} from 'react'
import {supabase} from '@/lib/supabase'
import {COCKTAIL_CATALOG} from '@/lib/cocktailCatalog'

type RecipeIngredient={ingredient:string;amount_ml:number}
type PriceResult={cost:number;missing:string[]}|null

export default function DrinkPriceFeedback(){
 const pricesRef=useRef<Map<string,number>>(new Map())
 const recipesRef=useRef<Map<string,RecipeIngredient[]>>(new Map())
 const pendingRef=useRef<{name:string;result:PriceResult}|null>(null)
 const activeNameRef=useRef('')

 useEffect(()=>{
  let disposed=false
  let refreshTimer:number|undefined

  const formatKr=(value:number)=>value.toLocaleString('nb-NO',{minimumFractionDigits:2,maximumFractionDigits:2})

  async function refreshData(){
   const [{data:bottles},{data:saved}]=await Promise.all([
    supabase.from('bar_bottles').select('ingredient,bottle_size_ml,purchase_price'),
    supabase.from('bar_cocktails').select('name,bar_recipe_ingredients(ingredient,amount_ml)')
   ])
   if(disposed)return

   const priceBuckets=new Map<string,number[]>()
   for(const bottle of bottles||[]){
    const price=Number((bottle as any).purchase_price)
    const size=Number((bottle as any).bottle_size_ml)
    if(!Number.isFinite(price)||price<=0||!Number.isFinite(size)||size<=0)continue
    const key=String((bottle as any).ingredient||'').trim().toLowerCase()
    if(!key)continue
    priceBuckets.set(key,[...(priceBuckets.get(key)||[]),price/size])
   }
   pricesRef.current=new Map([...priceBuckets.entries()].map(([key,values])=>[key,values.reduce((a,b)=>a+b,0)/values.length]))

   const recipes=new Map<string,RecipeIngredient[]>()
   for(const cocktail of COCKTAIL_CATALOG){recipes.set(cocktail.name.trim().toLowerCase(),cocktail.ingredients)}
   for(const cocktail of saved||[]){
    const row=cocktail as any
    recipes.set(String(row.name||'').trim().toLowerCase(),(row.bar_recipe_ingredients||[]) as RecipeIngredient[])
   }
   recipesRef.current=recipes
  }

  function calculate(name:string):PriceResult{
   const recipe=recipesRef.current.get(name.trim().toLowerCase())
   if(!recipe?.length)return null
   const missing:string[]=[]
   let cost=0
   for(const item of recipe){
    const ppm=pricesRef.current.get(item.ingredient.trim().toLowerCase())
    if(!ppm){missing.push(item.ingredient);continue}
    cost+=ppm*Number(item.amount_ml)
   }
   return {cost,missing:[...new Set(missing)]}
  }

  function decorate(){
   const modal=document.querySelector<HTMLElement>('.drinkdetail')
   if(!modal){activeNameRef.current='';return}
   const name=modal.querySelector('h2')?.textContent?.trim()||''
   if(!name)return
   const result=calculate(name)
   if(!result)return

   for(const el of Array.from(modal.querySelectorAll<HTMLElement>('.statusrow .meta'))){
    if(el.textContent?.includes('kr'))el.style.display='none'
   }

   const actions=modal.querySelector<HTMLElement>('.detailactions')
   if(!actions)return
   let box=modal.querySelector<HTMLElement>('.drink-price-feedback')
   if(!box){box=document.createElement('div');box.className='drink-price-feedback';actions.before(box)}

   if(result.missing.length===0){
    box.className='drink-price-feedback complete'
    box.innerHTML=`<div><span>KOSTPRIS</span><strong>≈ ${formatKr(result.cost)} kr</strong></div><small>Beregnet fra flaskeprisene du har registrert.</small>`
   }else{
    box.className='drink-price-feedback missing-price'
    box.innerHTML=`<div><span>KOSTPRIS MANGLER</span><strong>${result.missing.length} ${result.missing.length===1?'pris':'priser'} mangler</strong></div><small>Legg inn pris på ${result.missing.join(', ')} under Min bar.</small>`
   }

   const button=actions.querySelector<HTMLButtonElement>('.primary')
   if(button&&button.textContent?.includes('Lag drinken')){
    let addon=button.querySelector<HTMLElement>('.drink-price-addon')
    if(!addon){addon=document.createElement('span');addon.className='drink-price-addon';button.appendChild(addon)}
    addon.textContent=result.missing.length===0?` · ≈ ${formatKr(result.cost)} kr`:' · pris mangler'
   }
  }

  async function refreshAndDecorate(){await refreshData();decorate()}

  const click=(event:Event)=>{
   const target=event.target as HTMLElement|null
   const button=target?.closest<HTMLButtonElement>('.drinkdetail .detailactions .primary')
   if(!button||!button.textContent?.includes('Lag drinken'))return
   const modal=button.closest<HTMLElement>('.drinkdetail')
   const name=modal?.querySelector('h2')?.textContent?.trim()||''
   if(name)pendingRef.current={name,result:calculate(name)}
  }
  document.addEventListener('click',click,true)

  const observer=new MutationObserver(()=>{
   const modal=document.querySelector<HTMLElement>('.drinkdetail')
   const name=modal?.querySelector('h2')?.textContent?.trim()||''
   if(name&&name!==activeNameRef.current){
    activeNameRef.current=name
    if(refreshTimer)window.clearTimeout(refreshTimer)
    refreshTimer=window.setTimeout(()=>{refreshAndDecorate()},20)
   }else if(name){decorate()}

   const pending=pendingRef.current
   if(pending){
    const notice=document.querySelector<HTMLElement>('.notice')
    if(notice&&notice.textContent?.includes(pending.name)&&notice.textContent.includes('beholdningen er oppdatert')&&!notice.dataset.priceAdded){
     notice.dataset.priceAdded='true'
     if(pending.result?.missing.length===0)notice.textContent+=` · kostpris ≈ ${formatKr(pending.result.cost)} kr`
     else if(pending.result)notice.textContent+=` · kostpris mangler (${pending.result.missing.join(', ')})`
     pendingRef.current=null
    }
   }
  })
  observer.observe(document.body,{childList:true,subtree:true,characterData:true})
  refreshData()

  return()=>{
   disposed=true
   if(refreshTimer)window.clearTimeout(refreshTimer)
   observer.disconnect()
   document.removeEventListener('click',click,true)
  }
 },[])

 return null
}

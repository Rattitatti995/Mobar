'use client'

import {useEffect} from 'react'
import {supabase} from '@/lib/supabase'

type VinoProduct={
 source_product_id:string|null
 name:string|null
 brand:string|null
 ingredient:string|null
 bottle_size_ml:number|null
 abv:number|null
 market_price:number|null
 image:string|null
 product_type:string|null
}

function setReactInputValue(input:HTMLInputElement,value:string){
 const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set
 setter?.call(input,value)
 input.dispatchEvent(new Event('input',{bubbles:true}))
 input.dispatchEvent(new Event('change',{bubbles:true}))
}
function labelInput(form:HTMLFormElement,prefix:string){
 const label=[...form.querySelectorAll('label')].find(l=>l.textContent?.trim().startsWith(prefix))
 return label?.querySelector('input') as HTMLInputElement|null
}
function barcodeInput(form:HTMLFormElement){
 const label=[...form.querySelectorAll('label')].find(l=>l.textContent?.trim().startsWith('Strekkode'))
 return label?.querySelector('input') as HTMLInputElement|null
}
function setIngredient(form:HTMLFormElement,value:string|null){
 if(!value)return
 const original=[...form.querySelectorAll<HTMLInputElement>('input')].find(i=>i.getAttribute('list')==='ingredient-list')
 if(original)setReactInputValue(original,value)
 const search=form.querySelector<HTMLInputElement>('.ingredient-search')
 if(search)search.value=value
}
function fillForm(form:HTMLFormElement,p:VinoProduct){
 if(p.ingredient)setIngredient(form,p.ingredient)
 const brand=labelInput(form,'Merke')
 if(brand&&p.brand)setReactInputValue(brand,p.brand)
 else if(brand&&p.name&&!brand.value)setReactInputValue(brand,p.name)
 const size=labelInput(form,'Flaskestørrelse')
 const remaining=labelInput(form,'Igjen')
 if(size&&p.bottle_size_ml){
  setReactInputValue(size,String(p.bottle_size_ml))
  const editing=/oppdater/i.test(form.querySelector('h2')?.textContent||'')
  if(remaining&&!editing)setReactInputValue(remaining,String(p.bottle_size_ml))
 }
 const abv=labelInput(form,'ABV')
 if(abv&&p.abv!==null&&p.abv!==undefined)setReactInputValue(abv,String(p.abv))
 const price=labelInput(form,'Pris')
 if(price&&p.market_price!==null&&p.market_price!==undefined&&!price.value)setReactInputValue(price,String(Number(p.market_price).toFixed(2)))
}
function productMeta(p:VinoProduct){
 const bits:string[]=[]
 if(p.bottle_size_ml)bits.push(`${Math.round(p.bottle_size_ml/10)} cl`)
 if(p.abv!==null&&p.abv!==undefined)bits.push(`${p.abv}%`)
 if(p.market_price!==null&&p.market_price!==undefined)bits.push(`${Number(p.market_price).toLocaleString('nb-NO',{minimumFractionDigits:2,maximumFractionDigits:2})} kr`)
 if(p.product_type)bits.push(p.product_type)
 if(p.source_product_id)bits.push(`nr. ${p.source_product_id}`)
 return bits.join(' · ')
}

export default function VinmonopoletProductLinker(){
 useEffect(()=>{
  let disposed=false

  function setStatus(form:HTMLFormElement,text:string,state:'busy'|'ok'|'warn'|'error'='ok'){
   const status=form.querySelector<HTMLElement>('.barcode-lookup-status')
   if(!status)return
   status.textContent=text
   status.dataset.state=state
  }

  async function chooseProduct(form:HTMLFormElement,p:VinoProduct,panel:HTMLElement){
   const input=barcodeInput(form)
   const barcode=(input?.value||'').replace(/\D/g,'')
   if(barcode.length<6){setStatus(form,'Skann eller skriv inn strekkoden først.','warn');return}
   fillForm(form,p)
   const{error}=await supabase.from('barcode_product_cache').insert({
    barcode,source:'vinmonopolet',source_product_id:p.source_product_id,
    product_name:p.name||p.brand||p.ingredient||'Vinmonopolvare',ingredient:p.ingredient,
    brand:p.brand||p.name,bottle_size_ml:p.bottle_size_ml,abv:p.abv,market_price:p.market_price,image_url:p.image,
   })
   if(error&&error.code!=='23505')setStatus(form,`Varen ble funnet, men MoBar klarte ikke å lære strekkoden: ${error.message}`,'warn')
   else{
    const filled=[p.ingredient&&'type',p.brand&&'merke',p.bottle_size_ml&&'størrelse',p.abv!==null&&p.abv!==undefined&&'ABV',p.market_price!==null&&p.market_price!==undefined&&'pris'].filter(Boolean).join(', ')
    setStatus(form,`Koblet strekkoden til ${p.name||'Vinmonopolvaren'}${filled?` · fylte inn ${filled}`:''}. MoBar vil kjenne denne strekkoden automatisk neste gang.`,'ok')
   }
   panel.dataset.linked='true'
   panel.querySelector<HTMLElement>('.vino-search-area')!.hidden=true
   const results=panel.querySelector<HTMLElement>('.vino-results');if(results)results.innerHTML=''
  }

  async function runSearch(form:HTMLFormElement,panel:HTMLElement){
   const input=panel.querySelector<HTMLInputElement>('.vino-query')
   const results=panel.querySelector<HTMLElement>('.vino-results')
   const button=panel.querySelector<HTMLButtonElement>('.vino-do-search')
   const q=input?.value.trim()||''
   if(!results||!button)return
   if(q.length<2){results.innerHTML='<span class="vino-empty">Skriv minst to tegn.</span>';return}
   button.disabled=true;button.textContent='Søker…';results.innerHTML='<span class="vino-empty">Søker i Vinmonopolet…</span>'
   const{data,error}=await supabase.functions.invoke('search-vinmonopolet',{body:{query:q}})
   button.disabled=false;button.textContent='Søk';results.innerHTML=''
   if(error||!data?.ok){const msg=document.createElement('span');msg.className='vino-empty';msg.textContent=`Vinmonopolet-søket feilet: ${error?.message||data?.error||'ukjent feil'}`;results.appendChild(msg);return}
   const products=(data.results||[]) as VinoProduct[]
   if(!products.length){const msg=document.createElement('span');msg.className='vino-empty';msg.textContent='Ingen treff. Prøv et kortere produktnavn.';results.appendChild(msg);return}
   for(const p of products){
    const option=document.createElement('button');option.type='button';option.className='vino-result'
    const name=document.createElement('strong');name.textContent=p.name||p.brand||'Ukjent Vinmonopolvare'
    const meta=document.createElement('span');meta.textContent=productMeta(p)||'Vinmonopolet'
    option.append(name,meta);option.onclick=()=>chooseProduct(form,p,panel);results.appendChild(option)
   }
  }

  function prefillQuery(form:HTMLFormElement,panel:HTMLElement){
   const query=panel.querySelector<HTMLInputElement>('.vino-query');if(!query||query.value.trim())return
   const brand=labelInput(form,'Merke')?.value?.trim()||''
   const ingredient=form.querySelector<HTMLInputElement>('.ingredient-search')?.value?.trim()||''
   query.value=brand||ingredient
  }

  function ensurePanel(form:HTMLFormElement){
   const status=form.querySelector<HTMLElement>('.barcode-lookup-status')
   const code=barcodeInput(form)
   if(!status||!code)return
   let panel=form.querySelector<HTMLElement>('.vinmonopolet-linker')
   if(!panel){
    panel=document.createElement('div');panel.className='vinmonopolet-linker';panel.hidden=true
    panel.innerHTML='<button type="button" class="vino-open">Søk i Vinmonopolet</button><div class="vino-search-area" hidden><div class="vino-search-row"><input class="vino-query" type="search" autocomplete="off" placeholder="F.eks. Baileys Original, Gordon’s Gin…"><button type="button" class="vino-do-search">Søk</button></div><div class="vino-results"></div></div>'
    status.after(panel)
    const open=panel.querySelector<HTMLButtonElement>('.vino-open')!,area=panel.querySelector<HTMLElement>('.vino-search-area')!,query=panel.querySelector<HTMLInputElement>('.vino-query')!,search=panel.querySelector<HTMLButtonElement>('.vino-do-search')!
    open.onclick=()=>{area.hidden=!area.hidden;if(!area.hidden){prefillQuery(form,panel!);window.setTimeout(()=>query.focus(),0)}}
    search.onclick=()=>runSearch(form,panel!);query.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch(form,panel!)}})
   }
   const barcode=code.value.replace(/\D/g,'')
   const text=status.textContent||''
   const fromOpenFoodFacts=/Open Food Facts/i.test(text)
   const needsOfficial=/kjenner ikke|kunne ikke avgjøre flasketypen|fyll inn varen|velg riktig type/i.test(text)
   const authoritativeFound=/Vare funnet fra (?!Open Food Facts)|Koblet strekkoden/i.test(text)
   if(panel.dataset.linked==='true')panel.hidden=false
   else panel.hidden=barcode.length<6||authoritativeFound||(!needsOfficial&&!fromOpenFoodFacts)
   if(!panel.hidden&&fromOpenFoodFacts)prefillQuery(form,panel)
  }

  function enhance(){if(disposed)return;for(const form of [...document.querySelectorAll<HTMLFormElement>('form.formmodal')]){if(form.querySelector('#ingredient-list'))ensurePanel(form)}}
  const observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true,characterData:true});enhance()
  return()=>{disposed=true;observer.disconnect()}
 },[])
 return null
}

'use client'

import {useEffect} from 'react'
import {supabase} from '@/lib/supabase'

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

function norm(value:any){
 return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('nb-NO').replace(/[^a-z0-9]+/g,' ').trim()
}

function cleanProductName(value:any){
 return String(value||'')
  .replace(/\b\d+(?:[.,]\d+)?\s*%\s*(?:vol\.?|alc\.?)?/gi,'')
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:ml|cl|l)\b/gi,'')
  .replace(/\s+/g,' ')
  .replace(/[-,]\s*$/g,'')
  .trim()
}

function ruleIngredient(product:any){
 const text=`${product?.name||''} ${product?.brand||''} ${product?.categories||''}`.toLocaleLowerCase('nb-NO')
 const rules:[RegExp,string][]=[
  [/(pisang ambon|banana liqueur|bananlikør)/,'Pisang Ambon'],[/\bmidori\b|melon liqueur|melonlikør/,'Midori'],[/passo[aã]|passion fruit liqueur|pasjonsfruktlikør/,'Passoa'],
  [/\bchambord\b|raspberry liqueur|bringebærlikør/,'Chambord raspberry liqueur'],[/\bdrambuie\b/,'Drambuie'],[/\bfrangelico\b|hazelnut liqueur|hasselnøttlikør/,'Frangelico'],
  [/southern comfort/,'Southern Comfort'],[/\bgalliano\b/,'Galliano'],[/licor 43/,'Licor 43'],[/green chartreuse/,'Green Chartreuse'],[/yellow chartreuse/,'Yellow Chartreuse'],[/\bchartreuse\b/,'Chartreuse'],
  [/(baileys|irish cream)/,'Baileys'],[/(aquavit|akvavit|akevitt)/,'Akevitt'],[/\bvodka\b/,'Vodka'],[/sloe gin/,'Sloe gin'],[/\bgin\b/,'Gin'],
  [/spiced rum/,'Spiced rum'],[/blackstrap rum/,'blackstrap rum'],[/gold rum/,'Gold rum'],[/(dark rum|black rum)/,'Dark rum'],[/(white rum|light rum|bacardi carta blanca)/,'White rum'],[/\brum\b/,'White rum'],
  [/\btequila\b/,'Tequila'],[/\bmezcal\b/,'Mezcal'],[/\bbourbon\b/,'Bourbon'],[/(scotch|scotch whisky)/,'Scotch'],[/(whisky|whiskey)/,'Whiskey'],
  [/\bcognac\b/,'Cognac'],[/\bbrandy\b/,'Brandy'],[/cointreau/,'Cointreau'],[/grand marnier/,'Grand Marnier'],
  [/(blue cura[cç]ao)/,'Blue Curacao'],[/(triple sec|orange cura[cç]ao)/,'Triple sec'],[/campari/,'Campari'],[/aperol/,'Aperol'],[/amaretto|disaronno/,'Amaretto'],
  [/(kahlua|kahlúa|coffee liqueur|kaffelikør)/,'Kahlúa'],[/(jägermeister|jagermeister)/,'Jägermeister'],[/malibu/,'Malibu'],[/peach schnapps|ferskenlikør/,'Peach schnapps'],
  [/(dry vermouth|tørr vermut)/,'Vermouth dry'],[/(sweet vermouth|rosso vermouth|rød vermut)/,'Vermouth sweet'],[/(vermouth|vermut)/,'Vermouth sweet'],
  [/(lime juice|limejuice|limesaft)/,'Lime juice'],[/(lemon juice|lemonjuice|sitronsaft)/,'Lemon juice'],[/(orange juice|appelsinjuice)/,'Orange juice'],
  [/(pineapple juice|ananasjuice)/,'Pineapple juice'],[/(cranberry juice|tranebærjuice)/,'Cranberry juice'],[/(grapefruit juice|grapefruktjuice)/,'Grapefruit juice'],
  [/(tomato juice|tomatjuice)/,'Tomato juice'],[/(ginger beer|ingefærøl)/,'Ginger beer'],[/ginger ale/,'Ginger ale'],[/(tonic water|\btonic\b)/,'Tonic water'],
  [/(soda water|club soda|sparkling water|kullsyrevann)/,'Soda water'],[/\bcola\b|coca[- ]?cola|pepsi/,'Cola'],[/(saft|cordial|squash)/,'Saft'],
  [/\bsambuca\b/,'Sambuca'],[/maraschino liqueur/,'Maraschino liqueur'],[/benedictine/,'Benedictine'],[/st[. ]?germain|elderflower liqueur/,'St. Germain'],
  [/creme de cacao|crème de cacao/,'Creme de Cacao'],[/creme de cassis|crème de cassis/,'Creme de Cassis'],[/creme de menthe|crème de menthe/,'Green Creme de Menthe'],
  [/\babsinthe\b/,'Absinthe'],[/\bcachaca\b|cachaça/,'Cachaca'],[/\bpisco\b/,'Pisco'],[/\bouzo\b/,'Ouzo'],[/\bpernod\b/,'Pernod'],[/\bricard\b/,'Ricard'],
 ]
 for(const [re,value] of rules)if(re.test(text))return value
 return ''
}

function ingredientFromOptions(form:HTMLFormElement,product:any){
 const list=form.querySelector<HTMLDataListElement>('#ingredient-list')
 if(!list)return ''
 const hay=norm(`${product?.name||''} ${product?.brand||''} ${product?.categories||''}`)
 if(!hay)return ''
 const options=[...list.querySelectorAll('option')].map(o=>o.value.trim()).filter(Boolean)
 const ranked=options
  .map(value=>({value,n: norm(value)}))
  .filter(x=>x.n.length>=3&&(` ${hay} `.includes(` ${x.n} `)||hay.includes(x.n)))
  .sort((a,b)=>b.n.length-a.n.length)
 return ranked[0]?.value||''
}

function lookupIngredient(form:HTMLFormElement,product:any){
 if(product?.ingredient)return String(product.ingredient)
 const byRule=ruleIngredient(product)
 if(byRule)return byRule
 const byOptions=ingredientFromOptions(form,product)
 if(byOptions)return byOptions
 const text=`${product?.name||''} ${product?.categories||''}`.toLocaleLowerCase('nb-NO')
 if(/(liqueur|liquor|likør|likor|schnapps)/.test(text))return 'Likør'
 if(/\bcider\b/.test(text))return 'Cider'
 if(/\bbeer\b|\bøl\b/.test(text))return 'Beer'
 if(/\b(red|white|rose|rosé|sparkling) wine\b|\bvin\b/.test(text))return 'Wine'
 return cleanProductName(product?.name||product?.brand)
}

function lookupBrand(product:any,ingredient:string){
 if(product?.brand)return String(product.brand).split(',')[0].trim()
 const name=cleanProductName(product?.name)
 if(!name)return ''
 if(ingredient&&norm(name)===norm(ingredient))return name
 if(ingredient){
  const words=new Set(norm(ingredient).split(/\s+/).filter(Boolean))
  const remaining=name.split(/\s+/).filter(word=>!words.has(norm(word))&&!/^(original|premium|dry|liqueur|likør|vodka|gin|rum)$/i.test(word))
  if(remaining.length)return remaining.slice(0,3).join(' ')
 }
 return name
}

export default function BottleFormUsability(){
 useEffect(()=>{
  let stream:MediaStream|null=null
  let scanTimer:number|undefined
  let disposed=false

  function closeScanner(){
   if(scanTimer)window.clearInterval(scanTimer)
   scanTimer=undefined
   stream?.getTracks().forEach(t=>t.stop())
   stream=null
   document.querySelector('.barcode-scanner-overlay')?.remove()
  }

  function setLookupStatus(form:HTMLFormElement,text:string,state:'busy'|'ok'|'warn'|'error'='ok'){
   const el=form.querySelector<HTMLElement>('.barcode-lookup-status')
   if(!el)return
   el.textContent=text
   el.dataset.state=state
  }

  function setIngredient(form:HTMLFormElement,value:string){
   if(!value)return
   const original=[...form.querySelectorAll<HTMLInputElement>('input')].find(i=>i.getAttribute('list')==='ingredient-list')
   if(original)setReactInputValue(original,value)
   const search=form.querySelector<HTMLInputElement>('.ingredient-search')
   if(search)search.value=value
   form.querySelector<HTMLElement>('.ingredient-results')?.setAttribute('hidden','')
  }

  async function lookupBarcode(input:HTMLInputElement){
   const form=input.closest('form') as HTMLFormElement|null
   if(!form)return
   const barcode=input.value.replace(/\D/g,'')
   if(barcode.length<6){setLookupStatus(form,'Skriv inn eller skann en gyldig strekkode.','warn');return}
   setLookupStatus(form,'Slår opp varen…','busy')
   const{data,error}=await supabase.functions.invoke('lookup-barcode',{body:{barcode}})
   if(error||!data?.ok){
    setLookupStatus(form,`Kunne ikke slå opp varen: ${error?.message||data?.error||'ukjent feil'}. Strekkoden blir fortsatt lagret hvis du lagrer flasken.`,'error')
    return
   }
   if(!data.found){
    const kassStatus=String(data.kassalapp_status||'')
    const vinoStatus=String(data.vinmonopolet_status||'')
    const kassProblem=kassStatus.startsWith('http_')||kassStatus==='exception'
    const vinoProblem=vinoStatus.startsWith('http_')||vinoStatus==='exception'
    const problems=[
     vinoProblem&&`Vinmonopolet-oppslaget feilet (${data.vinmonopolet_error||vinoStatus})`,
     kassProblem&&`Kassalapp-oppslaget feilet (${data.kassalapp_error||kassStatus})`,
    ].filter(Boolean).join(' og ')
    const sources=[data.vinmonopolet_configured&&'Vinmonopolet',data.kassalapp_configured&&'Kassalapp','Open Food Facts'].filter(Boolean).join(', ')
    const dbText=problems?`${problems}. De øvrige kildene kjenner heller ikke varen.`:`${sources} kjenner ikke varen ennå.`
    setLookupStatus(form,`${dbText} Dette er en ukjent strekkode, så kontroller eller fyll inn varen før du lagrer. Når den er lagret, lærer MoBar strekkoden til neste gang.`,kassProblem||vinoProblem?'error':'warn')
    return
   }
   const p=data.product||{}
   const ingredient=lookupIngredient(form,p)
   const inferredBrand=lookupBrand(p,ingredient)
   if(ingredient)setIngredient(form,ingredient)
   const brand=labelInput(form,'Merke')
   if(brand&&inferredBrand)setReactInputValue(brand,inferredBrand)
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
   let priceFilled=false
   if(price&&!price.value&&data.source==='mobar'&&p.purchase_price!==null&&p.purchase_price!==undefined){
    setReactInputValue(price,String(p.purchase_price));priceFilled=true
   }
   if(price&&!price.value&&(data.source==='kassalapp'||data.source==='vinmonopolet')&&Number(p.market_price)>0){
    setReactInputValue(price,String(Number(p.market_price).toFixed(2)));priceFilled=true
   }
   const source=data.source==='mobar'?'tidligere registrert flaske i MoBar':data.source==='vinmonopolet'?'Vinmonopolet':data.source==='kassalapp'?'Kassalapp':'Open Food Facts'
   const filled=[ingredient&&'type',inferredBrand&&'merke',p.bottle_size_ml&&'størrelse',p.abv!==null&&p.abv!==undefined&&'ABV',priceFilled&&'pris'].filter(Boolean).join(', ')
   const priceNumber=Number(p.market_price)
   const marketHint=data.source==='vinmonopolet'&&priceNumber>0?` Prisfeltet er satt til Vinmonopolets pris, ca. ${priceNumber.toLocaleString('nb-NO',{minimumFractionDigits:2,maximumFractionDigits:2})} kr. Du kan endre den hvis du betalte noe annet.`:data.source==='kassalapp'&&priceNumber>0?` Prisfeltet er satt til laveste registrerte butikkpris, ca. ${priceNumber.toLocaleString('nb-NO',{minimumFractionDigits:2,maximumFractionDigits:2})} kr${p.market_store?` hos ${p.market_store}`:''}. Du kan endre den hvis du betalte noe annet.`:''
   const kassStatus=String(data.kassalapp_status||'')
   const vinoStatus=String(data.vinmonopolet_status||'')
   const fallbackProblems=data.source==='openfoodfacts'?[
    (vinoStatus.startsWith('http_')||vinoStatus==='exception')&&`Vinmonopolet feilet (${data.vinmonopolet_error||vinoStatus})`,
    (kassStatus.startsWith('http_')||kassStatus==='exception')&&`Kassalapp feilet (${data.kassalapp_error||kassStatus})`,
   ].filter(Boolean):[]
   const upstreamFallback=fallbackProblems.length?` ${fallbackProblems.join(' og ')}, så MoBar brukte Open Food Facts som reserve.`:''
   if(!ingredient){
    const name=p.name?` (${p.name})`:''
    setLookupStatus(form,`Varen ble funnet i ${source}${name}, men kilden manglet nok produkttekst til å sette type automatisk. Kontroller varen før du lagrer.${marketHint}${upstreamFallback}`,'warn')
   }else{
    setLookupStatus(form,`Vare funnet fra ${source}${filled?` · fylte inn ${filled}`:''}. Kontroller opplysningene før du lagrer.${marketHint}${upstreamFallback}`,(upstreamFallback?'warn':'ok'))
   }
  }

  async function openScanner(input:HTMLInputElement){
   closeScanner()
   const Detector=(window as any).BarcodeDetector
   if(!Detector){
    window.alert('Denne nettleseren støtter ikke direkte strekkodeskanning. Du kan fortsatt skrive inn strekkoden og trykke «Slå opp».')
    return
   }
   try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})
    const overlay=document.createElement('div')
    overlay.className='barcode-scanner-overlay'
    overlay.innerHTML='<div class="barcode-scanner"><div class="scanner-head"><div><b>Skann strekkode</b><span>Hold EAN/UPC-koden innenfor rammen</span></div><button type="button" aria-label="Lukk">×</button></div><div class="scanner-video-wrap"><video playsinline autoplay muted></video><i></i></div><p>Når koden finnes, slår MoBar automatisk opp varen.</p></div>'
    document.body.appendChild(overlay)
    const video=overlay.querySelector('video') as HTMLVideoElement
    const close=overlay.querySelector('button') as HTMLButtonElement
    close.onclick=closeScanner
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeScanner()})
    video.srcObject=stream
    await video.play()
    const detector=new Detector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf']})
    let busy=false
    scanTimer=window.setInterval(async()=>{
     if(busy||video.readyState<2)return
     busy=true
     try{
      const codes=await detector.detect(video)
      const value=codes?.[0]?.rawValue?.trim()
      if(value){
       setReactInputValue(input,value)
       if(navigator.vibrate)navigator.vibrate(80)
       closeScanner()
       await lookupBarcode(input)
      }
     }catch{}
     finally{busy=false}
    },250)
   }catch(err:any){
    closeScanner()
    const denied=err?.name==='NotAllowedError'
    window.alert(denied?'Kameratilgang ble avslått. Tillat kamera for mobar.vercel.app i nettleseren og prøv igjen.':'Kunne ikke starte kameraet. Du kan fortsatt skrive strekkoden manuelt og trykke «Slå opp».')
   }
  }

  function enhanceIngredient(form:HTMLFormElement){
   const input=[...form.querySelectorAll<HTMLInputElement>('input')].find(i=>i.getAttribute('list')==='ingredient-list')
   if(!input)return
   const label=input.closest('label')
   const list=form.querySelector<HTMLDataListElement>('#ingredient-list')
   if(!label||!list||label.querySelector('.ingredient-picker'))return
   const base=[...list.querySelectorAll('option')].map(o=>o.value).filter(Boolean)
   const options=[...new Set(['Saft','Likør','Cider','Beer','Wine',...base])].sort((a,b)=>a.localeCompare(b,'nb',{sensitivity:'base'}))
   input.required=false
   input.classList.add('ingredient-react-input')
   input.style.display='none'

   const picker=document.createElement('div')
   picker.className='ingredient-picker'
   const search=document.createElement('input')
   search.type='search'
   search.className='ingredient-search'
   search.placeholder='Søk flasketype, f.eks. vodka, saft eller akevitt…'
   search.autocomplete='off'
   search.value=input.value
   search.setAttribute('aria-label','Søk flasketype / ingrediens')
   const results=document.createElement('div')
   results.className='ingredient-results'
   results.hidden=true

   const choose=(value:string)=>{
    setReactInputValue(input,value)
    search.value=value
    results.hidden=true
   }
   const render=()=>{
    const q=search.value.trim().toLocaleLowerCase('nb-NO')
    const matches=options.filter(v=>!q||v.toLocaleLowerCase('nb-NO').includes(q)).slice(0,18)
    results.innerHTML=''
    for(const value of matches){
     const button=document.createElement('button')
     button.type='button'
     button.textContent=value
     button.onclick=()=>choose(value)
     results.appendChild(button)
    }
    const exact=options.some(v=>v.toLocaleLowerCase('nb-NO')===q)
    if(q&&!exact){
     const custom=document.createElement('button')
     custom.type='button'
     custom.className='custom-option'
     custom.textContent=`Bruk «${search.value.trim()}» som ny type`
     custom.onclick=()=>choose(search.value.trim())
     results.appendChild(custom)
    }
    if(!results.children.length){
     const empty=document.createElement('span')
     empty.textContent='Ingen treff'
     results.appendChild(empty)
    }
    results.hidden=false
   }
   search.onfocus=render
   search.oninput=render
   search.onkeydown=e=>{
    if(e.key==='Escape')results.hidden=true
    if(e.key==='Enter'){
     const first=results.querySelector<HTMLButtonElement>('button')
     if(first){e.preventDefault();first.click()}
    }
   }
   picker.append(search,results)
   input.before(picker)
   picker.addEventListener('focusout',()=>window.setTimeout(()=>{if(!picker.contains(document.activeElement))results.hidden=true},100))

   const help=document.createElement('span')
   help.className='field-help'
   help.textContent='Skriv noen bokstaver og velg riktig type. Det hindrer dubletter og skrivefeil.'
   label.appendChild(help)
  }

  function enhanceBarcode(form:HTMLFormElement){
   const labels=[...form.querySelectorAll('label')]
   const label=labels.find(l=>l.textContent?.trim().startsWith('Strekkode'))
   const input=label?.querySelector('input') as HTMLInputElement|null
   if(!label||!input||label.querySelector('.barcode-row'))return
   input.inputMode='numeric'
   const row=document.createElement('div')
   row.className='barcode-row'
   input.before(row)
   row.appendChild(input)

   const lookup=document.createElement('button')
   lookup.type='button'
   lookup.className='lookup-barcode-btn'
   lookup.textContent='Slå opp'
   lookup.onclick=()=>lookupBarcode(input)
   row.appendChild(lookup)

   const scan=document.createElement('button')
   scan.type='button'
   scan.className='scan-barcode-btn'
   scan.innerHTML='<span class="scan-icon">▣</span><span>Skann</span>'
   scan.onclick=()=>openScanner(input)
   row.appendChild(scan)

   input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupBarcode(input)}})
   const status=document.createElement('span')
   status.className='barcode-lookup-status'
   status.textContent='Skann en kode, eller skriv den inn og trykk «Slå opp». MoBar prøver å fylle ut varen automatisk.'
   label.appendChild(status)
  }

  function enhance(){
   if(disposed)return
   for(const form of [...document.querySelectorAll<HTMLFormElement>('form.formmodal')]){
    if(!form.querySelector('#ingredient-list'))continue
    enhanceIngredient(form)
    enhanceBarcode(form)
   }
  }

  const observer=new MutationObserver(enhance)
  observer.observe(document.body,{childList:true,subtree:true})
  enhance()
  return()=>{disposed=true;observer.disconnect();closeScanner()}
 },[])
 return null
}

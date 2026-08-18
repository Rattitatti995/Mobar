'use client'

import {useEffect} from 'react'

function setReactInputValue(input:HTMLInputElement,value:string){
 const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set
 setter?.call(input,value)
 input.dispatchEvent(new Event('input',{bubbles:true}))
 input.dispatchEvent(new Event('change',{bubbles:true}))
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

  async function openScanner(input:HTMLInputElement){
   closeScanner()
   const Detector=(window as any).BarcodeDetector
   if(!Detector){
    window.alert('Denne nettleseren støtter ikke direkte strekkodeskanning. Bruk Chrome på Android, eller skriv inn strekkoden manuelt.')
    return
   }
   try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})
    const overlay=document.createElement('div')
    overlay.className='barcode-scanner-overlay'
    overlay.innerHTML='<div class="barcode-scanner"><div class="scanner-head"><div><b>Skann strekkode</b><span>Hold EAN/UPC-koden innenfor rammen</span></div><button type="button" aria-label="Lukk">×</button></div><div class="scanner-video-wrap"><video playsinline autoplay muted></video><i></i></div><p>Skanningen stopper automatisk når en kode blir funnet.</p></div>'
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
      }
     }catch{}
     finally{busy=false}
    },250)
   }catch(err:any){
    closeScanner()
    const denied=err?.name==='NotAllowedError'
    window.alert(denied?'Kameratilgang ble avslått. Tillat kamera for mobar.vercel.app i nettleseren og prøv igjen.':'Kunne ikke starte kameraet. Du kan fortsatt skrive strekkoden manuelt.')
   }
  }

  function enhanceIngredient(form:HTMLFormElement){
   const input=[...form.querySelectorAll<HTMLInputElement>('input')].find(i=>i.getAttribute('list')==='ingredient-list')
   if(!input)return
   const label=input.closest('label')
   const list=form.querySelector<HTMLDataListElement>('#ingredient-list')
   if(!label||!list||label.querySelector('.ingredient-picker'))return
   const options=[...list.querySelectorAll('option')].map(o=>o.value).filter(Boolean).sort((a,b)=>a.localeCompare(b,'nb',{sensitivity:'base'}))
   const picker=document.createElement('div')
   picker.className='ingredient-picker'
   const select=document.createElement('select')
   select.setAttribute('aria-label','Flasketype / ingrediens')
   select.innerHTML='<option value="">Velg type…</option>'+options.map(v=>`<option value="${v.replaceAll('&','&amp;').replaceAll('"','&quot;')}">${v}</option>`).join('')+'<option value="__other__">Annen type…</option>'
   const exact=options.find(v=>v.toLocaleLowerCase('nb-NO')===input.value.trim().toLocaleLowerCase('nb-NO'))
   if(exact){select.value=exact;input.style.display='none'}else if(input.value.trim()){select.value='__other__'}else{input.style.display='none'}
   select.onchange=()=>{
    if(select.value==='__other__'){
     input.style.display='block'
     input.placeholder='Skriv ny flasketype'
     input.focus()
     if(options.includes(input.value))setReactInputValue(input,'')
    }else{
     input.style.display='none'
     setReactInputValue(input,select.value)
    }
   }
   picker.appendChild(select)
   input.before(picker)
   const title=document.createElement('span')
   title.className='field-help'
   title.textContent='Velg fra listen for å unngå doble ingredienser og skrivefeil.'
   label.appendChild(title)
  }

  function enhanceBarcode(form:HTMLFormElement){
   const labels=[...form.querySelectorAll('label')]
   const label=labels.find(l=>l.childNodes[0]?.textContent?.trim()==='Strekkode' || l.textContent?.trim().startsWith('Strekkode'))
   const input=label?.querySelector('input') as HTMLInputElement|null
   if(!label||!input||label.querySelector('.barcode-row'))return
   const row=document.createElement('div')
   row.className='barcode-row'
   input.before(row)
   row.appendChild(input)
   const button=document.createElement('button')
   button.type='button'
   button.className='scan-barcode-btn'
   button.innerHTML='<span class="scan-icon">▣</span><span>Skann</span>'
   button.onclick=()=>openScanner(input)
   row.appendChild(button)
   const help=document.createElement('span')
   help.className='field-help'
   help.textContent='Bruk kameraet eller skriv inn EAN/UPC manuelt.'
   label.appendChild(help)
  }

  function enhance(){
   if(disposed)return
   for(const form of [...document.querySelectorAll<HTMLFormElement>('form.formmodal')]){
    const heading=form.querySelector('h2')?.textContent||''
    if(!/flaske/i.test(heading))continue
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

'use client'

import {useEffect} from 'react'

const collator=new Intl.Collator('nb-NO',{sensitivity:'base',numeric:true})

export default function AlphabeticalUi(){
 useEffect(()=>{
  let queued=false
  let sorting=false

  function sortSelect(select:HTMLSelectElement){
   const options=Array.from(select.options)
   const texts=options.map(o=>o.textContent?.trim()||'')
   const looksLikeIngredientSelect=texts.includes('Vodka')&&(texts.includes('Gin')||texts.includes('Ingrediens…'))
   if(!looksLikeIngredientSelect)return

   if(!options.some(o=>(o.textContent?.trim()||'').toLocaleLowerCase('nb-NO')==='akevitt')){
    const option=document.createElement('option')
    option.value='Akevitt'
    option.textContent='Akevitt'
    select.appendChild(option)
   }

   const current=Array.from(select.options)
   const first=current.filter(o=>o.value==='')
   const last=current.filter(o=>o.value==='__other__'||(o.textContent?.trim()||'').toLocaleLowerCase('nb-NO').startsWith('annet'))
   const regular=current
    .filter(o=>!first.includes(o)&&!last.includes(o))
    .sort((a,b)=>collator.compare(a.textContent?.trim()||'',b.textContent?.trim()||''))
   const wanted=[...first,...regular,...last]
   if(wanted.every((o,i)=>select.options[i]===o))return
   wanted.forEach(o=>select.appendChild(o))
  }

  function sortChildren(container:Element,selector:string,label:(el:Element)=>string){
   const nodes=Array.from(container.querySelectorAll(`:scope > ${selector}`))
   if(nodes.length<2)return
   const sorted=[...nodes].sort((a,b)=>collator.compare(label(a),label(b)))
   if(sorted.every((node,i)=>nodes[i]===node))return
   sorted.forEach(node=>container.appendChild(node))
  }

  function apply(){
   if(sorting)return
   sorting=true
   document.querySelectorAll('select').forEach(el=>sortSelect(el as HTMLSelectElement))

   document.querySelectorAll('.bottlegrid').forEach(grid=>sortChildren(grid,'article.bottle',el=>{
    const p=el.querySelector('.bottlehead p')?.textContent?.trim()||''
    const ingredient=p.split('·')[0]?.trim()
    return ingredient||el.querySelector('h3')?.textContent?.trim()||''
   }))

   document.querySelectorAll('.shopping').forEach(list=>sortChildren(list,'div',el=>el.querySelector('h3')?.textContent?.trim()||el.textContent?.trim()||''))

   sorting=false
  }

  function queueApply(){
   if(queued)return
   queued=true
   requestAnimationFrame(()=>{queued=false;apply()})
  }

  apply()
  const observer=new MutationObserver(queueApply)
  observer.observe(document.body,{childList:true,subtree:true})
  return()=>observer.disconnect()
 },[])

 return null
}

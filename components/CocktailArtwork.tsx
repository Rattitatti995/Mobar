'use client'

import {useEffect,useRef} from 'react'
import {supabase} from '@/lib/supabase'

export default function CocktailArtwork(){
 const images=useRef(new Map<string,string>())
 useEffect(()=>{
  let cancelled=false
  let timer:number|undefined

  async function load(){
   const{data}=await supabase.from('bar_cocktails').select('name,image_url').not('image_url','is',null).limit(1000)
   if(cancelled)return
   images.current=new Map((data||[]).filter(x=>x.image_url).map(x=>[x.name.trim().toLowerCase(),x.image_url as string]))
   decorate()
  }

  function apply(el:HTMLElement|undefined|null,name:string){
   if(!el||el.dataset.cocktailArt==='1')return
   const url=images.current.get(name.trim().toLowerCase())
   if(!url)return
   el.dataset.cocktailArt='1'
   el.classList.add('has-cocktail-image')
   el.style.backgroundImage=`linear-gradient(180deg,rgba(10,9,8,.08),rgba(10,9,8,.45)),url("${url.replaceAll('"','%22')}")`
  }

  function decorate(){
   document.querySelectorAll<HTMLElement>('.drinkcard').forEach(card=>{
    const name=card.querySelector('h3')?.textContent?.trim()
    if(name)apply(card.querySelector<HTMLElement>('.drinkart'),name)
   })
   const detail=document.querySelector<HTMLElement>('.drinkdetail')
   const name=detail?.querySelector('h2')?.textContent?.trim()
   if(detail&&name)apply(detail.querySelector<HTMLElement>('.detailart'),name)
  }

  const observer=new MutationObserver(()=>{
   if(timer)window.clearTimeout(timer)
   timer=window.setTimeout(decorate,20)
  })
  observer.observe(document.body,{childList:true,subtree:true})
  load()
  return()=>{cancelled=true;if(timer)window.clearTimeout(timer);observer.disconnect()}
 },[])
 return null
}

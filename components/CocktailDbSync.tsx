'use client'

import {useEffect} from 'react'
import {supabase} from '@/lib/supabase'

const ONE_DAY=24*60*60*1000

export default function CocktailDbSync(){
 useEffect(()=>{
  let cancelled=false
  async function sync(){
   const{data}=await supabase.auth.getUser()
   const user=data.user
   if(!user||cancelled)return
   const key=`mobar:cocktaildb:sync:${user.id}`
   const last=Number(localStorage.getItem(key)||0)
   if(last&&Date.now()-last<ONE_DAY)return

   const{data:result,error}=await supabase.functions.invoke('sync-cocktaildb')
   if(cancelled)return
   if(error||!result?.ok){
    console.error('CocktailDB sync failed',error||result)
    return
   }
   localStorage.setItem(key,String(Date.now()))
   const reloadKey=`mobar:cocktaildb:reload:${user.id}`
   if(sessionStorage.getItem(reloadKey)!=='1'){
    sessionStorage.setItem(reloadKey,'1')
    window.location.reload()
   }
  }
  sync()
  return()=>{cancelled=true}
 },[])
 return null
}

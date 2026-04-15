import { BACKEND_URL } from "@/config";


export const getMe=async ()=>{
   const res=  await fetch(`${BACKEND_URL}/api/auth/me`, {credentials:'include'}) ;
   const data=await res.json();
   return data;
}
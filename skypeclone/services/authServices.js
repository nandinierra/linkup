

export const getMe=async ()=>{
   const res=  await fetch("http://localhost:4000/auth/me", {credentials:'include'}) ;
   const data=await res.json();
   return data;
} 
import {NextResponse} from "next/server" 
export function proxy(request){
   // console.log("middle ware logic")
     const token= request.cookies.get("jwt_token")?.value;  
    //  console.log("token", token)
     const {pathname}=request.nextUrl; 
     const isAuthPage=pathname==="/login"  || pathname==="/signup"  
     const homePage = pathname==="/" ;
     if(isAuthPage&&token){
        return NextResponse.redirect(new URL("/", request.url));
     }
     if(homePage && !token){
        return NextResponse.redirect(new URL("/login", request.url));
     }
     return NextResponse.next()
    
} 
 export const config={
         matcher:["/:path*"]
     }



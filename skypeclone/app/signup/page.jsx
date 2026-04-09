"use client"

import {useState} from "react"
import {useRouter} from "next/navigation"
const Signup=()=>{
    const router=useRouter();
   const [name, setName]=useState("")
   const [password, setPassword]=useState("")
   const [email, setEmail]=useState("")
    const subitSignupForm=async (e)=>{
        e.preventDefault()
         try{
          const details={name, email, password}
          const options={
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            credentials:"include",
            body: JSON.stringify(details)

          }
          const url="http://localhost:4000/auth/register";
          const response=await fetch(url, options);
          console.log(response)
          if(response.ok){
              router.push("/")
          }

         }catch(err){
            console.log("error", err.message)
         }
    }



    return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div className="w-full max-w-6xl">
      {/* Header */}
      <div className="text-center ">
        <div className="flex justify-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div> 

        <div>
        <h1 className="text-4xl font-bold text-white mb-2">Skype Clone</h1>
        <p className="text-slate-400 text-lg">Connect with the world, anywhere.</p> 
        </div>  

        </div>

      </div>
/
      {/* Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-white text-center mb-8">Create your account</h2>
        
        {/* Form */}
        <form  onSubmit={subitSignupForm}
        className="space-y-6">
          {/* Name and Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <input
                  onChange={e=>setName(e.target.value)}
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input 
                onChange={e=>setEmail(e.target.value)}
                  type="email"
                  placeholder="john@example.com"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Password Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg> 
                </div>
                <input 
                  onChange={e=>setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Password Strength Indicator */}
              {/* <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  <div className="h-1 flex-1 bg-blue-500 rounded"></div>
                  <div className="h-1 flex-1 bg-blue-500 rounded"></div>
                  <div className="h-1 flex-1 bg-slate-600 rounded"></div>
                </div>
                <p className="text-xs text-slate-400">
                  Strength: <span className="text-blue-400 font-medium">Strong</span>
                  <span className="ml-2">8+ characters</span>
                </p>
              </div>  */}

            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Create Account Button */}
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
            Create Account
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800/50 text-slate-400">Or sign up with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 12.3c0-6.3-5.1-11.4-11.4-11.4S.7 6 .7 12.3c0 5.7 4.2 10.4 9.6 11.2v-7.9H7.5v-3.3h2.8V9.9c0-2.8 1.7-4.3 4.2-4.3 1.2 0 2.5.2 2.5.2v2.7h-1.4c-1.4 0-1.8.9-1.8 1.8v2.1h3l-.5 3.3h-2.5v7.9c5.5-.8 9.7-5.5 9.7-11.2z" fill="#1877F2"/>
              </svg>
              Microsoft
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Login
            </a>
          </div>
        </form>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-500">
        <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-slate-400 transition-colors">Cookie Settings</a>
      </div>
    </div>
  </div>
);
}

export default Signup
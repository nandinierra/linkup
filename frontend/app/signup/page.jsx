"use client"

import {useState} from "react"
import {useRouter} from "next/navigation"
import { BACKEND_URL } from "@/config"

const Signup=()=>{
    const router=useRouter();
   const [name, setName]=useState("")
    const [phoneNumber, setPhoneNumber]=useState("")
    const [password, setPassword]=useState("")
    const [email, setEmail]=useState("")
    const subitSignupForm=async (e)=>{
        e.preventDefault()
         try{
          const details={name, email, password, phoneNumber}
          const options={
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            credentials:"include",
            body: JSON.stringify(details)

          }
          const url=`${BACKEND_URL}/api/auth/register`; // Using /api/ prefix reliably
          const response=await fetch(url, options);
          console.log(response)
          if(response.ok){
              router.push("/login") // Push to login after successful register
          } else {
              const error = await response.json();
              alert(error.message || "Signup failed");
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

        <div className="ml-4 text-left">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">Link Up</h1>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Connect with the world</p> 
        </div>  

        </div>
      </div>

      {/* Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-10 max-w-3xl mx-auto shadow-2xl">
        <h2 className="text-2xl font-black text-white text-center mb-8 uppercase tracking-widest">Create Profile</h2>
        
        {/* Form */}
        <form onSubmit={subitSignupForm} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Full Identity</label>
              <div className="relative">
                <input
                  onChange={e=>setName(e.target.value)}
                  type="text"
                  placeholder="e.g. Satoshi Nakamoto"
                  className="w-full bg-slate-700/30 border border-slate-600/50 rounded-2xl px-6 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Email Address</label>
              <input 
                onChange={e=>setEmail(e.target.value)}
                type="email"
                placeholder="satoshi@bitcoin.com"
                className="w-full bg-slate-700/30 border border-slate-600/50 rounded-2xl px-6 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Phone Number</label>
              <input 
                onChange={e=>setPhoneNumber(e.target.value)}
                type="text"
                placeholder="+91 98765 43210"
                className="w-full bg-slate-700/30 border border-slate-600/50 rounded-2xl px-6 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Secret Password</label>
              <input 
                onChange={e=>setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-700/30 border border-slate-600/50 rounded-2xl px-6 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Verify Secret</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-700/30 border border-slate-600/50 rounded-2xl px-6 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
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
          {/* <div className="grid grid-cols-2 gap-4">
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
          </div> */}

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
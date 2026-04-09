'use client'
import {useState} from "react"
import {useRouter} from "next/navigation"
const Login =()=>{ 
    const router=useRouter()
     const [password, setPassword]=useState("");
     const [email, setEmail] = useState("");
  
   const submitLoginForm=async (e)=>{
    e.preventDefault()
    try{
      const details={email,password} 
      const options={
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        credentials:"include",
        body:JSON.stringify(details)
      }
      const url="http://localhost:4000/auth/login"
      const response=await fetch(url, options);
      const data=await response.json();
      if(response.ok){
        router.push("/")
      }
    }catch(err){
        console.log(err.message)
    }
   }


   return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative circles in background */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 right-40 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-slate-600/20 rounded-full blur-2xl"></div>
      
      {/* Subtle line decorations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 900" fill="none">
          <path d="M-100 200 Q 300 150 600 180 T 1300 200" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2"/>
          <path d="M-100 600 Q 400 550 800 580 T 1300 600" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2"/>
        </svg>
      </div>

      {/* Login Card */}
      <form  onSubmit={submitLoginForm}
       className="relative w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700/50">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-9 h-9 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Skype Clone
          </h1>
          <p className="text-slate-400 text-center mb-8 text-sm">
            Welcome back! Please enter your details.
          </p>

          {/* Email Input */}
          <div className="mb-5">
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input 
              onChange={e=>setEmail(e.target.value)}
              value={email}
                type="email"
                placeholder="name@company.com"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 pl-12 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-slate-300 text-sm font-medium">
                Password
              </label>
              <a
                href="#"
                className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input 
              onChange={e=>setPassword(e.target.value)}
              value={password}
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 pl-12 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 mb-6">
            Sign In
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800/50 text-slate-400 uppercase text-xs tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button className="bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 transition-colors duration-200 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </button>
            <button className="bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 transition-colors duration-200 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-slate-400 text-sm">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
            >
              Sign Up
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider">
            Secure Communication Powered by WebRTC Technology
          </p>
          <div className="flex justify-center gap-4 text-slate-600 text-xs">
            <a href="#" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </a>
            <span>|</span>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Security
            </a>
          </div>
        </div>

      </form>
    </div>
  );
}

export default Login
"use client";
import { User, Mail, Camera } from "lucide-react";

const ProfileCard = ({ user, onEdit }) => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-500/30">
            <img
              src={user?.profilePic || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=0D8ABC&color=fff`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <button 
            className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onEdit}
          >
            <Camera size={16} />
          </button>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
          <p className="text-gray-400 text-sm">Skype User</p>
        </div>

        <div className="w-full space-y-3 mt-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <User className="text-blue-400" size={18} />
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Display Name</p>
              <p className="text-sm text-gray-200">{user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <Mail className="text-blue-400" size={18} />
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Email Address</p>
              <p className="text-sm text-gray-200">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;

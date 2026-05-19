import React, { useState } from 'react';
import { Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import Barcode from 'react-barcode';
import { UserCredentials } from '../types';

interface ProfileBadgeProps {
  credentials: UserCredentials;
}

const ProfileBadge: React.FC<ProfileBadgeProps> = ({ credentials }) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const toggleFlip = (id: string) => {
    const tg = window.Telegram?.WebApp;
    if (activeCardId === id) {
      setActiveCardId(null);
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    } else {
      setActiveCardId(id);
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    }
  };

  const togglePassword = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPassword(!showPassword);
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  };

  const cards = [
    { id: 'email', label: 'Work Email', value: credentials.email, icon: <Mail size={20} /> },
    { id: 'login', label: 'Login ID', value: credentials.login, icon: <User size={20} /> },
    { id: 'password', label: 'Password', value: credentials.password || '******', icon: <Lock size={20} /> },
  ];

  const activeCard = cards.find(c => c.id === activeCardId);

  return (
    <div className="flex flex-col items-center w-full mt-4 space-y-6">
      
      {/* Hero Photo */}
      <div className="w-72 h-72 z-10 shrink-0 rounded-full bg-white border-8 border-white shadow-xl overflow-hidden relative group">
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
           <img src="/photo.png" alt="Roman Boichenko" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Horizontally Scrollable Pills */}
      <div className="w-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-4 pl-6 pr-6 py-4 min-h-[120px]" style={{ scrollPaddingLeft: '24px', scrollPaddingRight: '24px' }}>
        {cards.map((card) => (
          <div 
            key={card.id} 
            className="snap-center shrink-0 w-[85%] h-24 relative"
          >
             <div
               onClick={() => toggleFlip(card.id)}
               className={`absolute inset-0 w-full h-full cursor-pointer shadow-lg rounded-[2rem] bg-white border-2 border-slate-100 flex flex-col justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${activeCardId === card.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
             >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-[#D40511] flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div className="flex-1 overflow-hidden pr-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{card.label}</p>
                    
                    {card.id === 'password' ? (
                      <div className="flex items-center justify-between">
                         <div className="py-1 -my-1 px-1 -mx-1 overflow-hidden">
                           <p className={`text-lg font-black text-slate-800 tracking-wider transition-all duration-300 ${!showPassword ? 'blur-[4px] opacity-70' : ''}`}>
                             {card.value}
                           </p>
                         </div>
                         <button 
                           onClick={togglePassword}
                           className="p-3 -mr-2 -my-3 rounded-full text-slate-400 hover:text-slate-600 active:bg-slate-50 transition-all z-10"
                         >
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                      </div>
                    ) : (
                      <p className={`${card.id === 'email' ? 'text-sm' : 'text-lg'} font-black text-slate-800 truncate`}>
                        {card.value}
                      </p>
                    )}
                  </div>
                </div>
             </div>
          </div>
        ))}
        {/* Spacer to prevent last pill from being clipped */}
        <div className="shrink-0 w-1" aria-hidden="true" />
      </div>

      {/* Full-screen barcode overlay — blur layer is always mounted for instant GPU compositing */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300 ${activeCardId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ willChange: 'opacity' }}
      >
         {/* Backdrop */}
         <div 
           className="absolute inset-0 bg-[#F2F4F8]/80 backdrop-blur-sm"
           style={{ willChange: 'opacity' }}
           onClick={() => setActiveCardId(null)}
         />
         
         {/* Barcode card */}
         <div
            onClick={() => setActiveCardId(null)}
            className={`w-full max-w-sm bg-white rounded-[2rem] shadow-2xl z-10 cursor-pointer relative border-2 border-[#D40511] flex flex-col items-center justify-between py-8 px-6 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${activeCardId ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}`}
            style={{ height: '55vh', maxHeight: '400px' }}
         >
             <p className="text-sm font-black text-[#D40511] uppercase tracking-widest leading-none mt-2">
               {activeCard?.label} Barcode
             </p>
             <div className="w-full flex-1 mt-6 mb-4 flex items-center justify-center overflow-hidden">
                {activeCard && (
                  <Barcode 
                    value={activeCard.value} 
                    displayValue={false} 
                    width={2} 
                    height={200} 
                    margin={0} 
                    background="transparent" 
                    lineColor="#0f172a" 
                  />
                )}
             </div>
         </div>
      </div>

    </div>
  );
};

export default ProfileBadge;

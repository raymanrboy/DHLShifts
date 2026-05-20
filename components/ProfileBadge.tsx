import React, { useMemo, useState } from 'react';
import { Mail, User, Lock, Eye, EyeOff, Pencil } from 'lucide-react';
import Barcode from 'react-barcode';
import { UserProfile } from '../types';
import { haptic } from '../utils';

interface ProfileBadgeProps {
  profile: UserProfile;
  photoUrl: string | null;
  onEditProfile: () => void;
}

const ProfileBadge: React.FC<ProfileBadgeProps> = ({ profile, photoUrl, onEditProfile }) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const toggleFlip = (id: string) => {
    if (activeCardId === id) {
      setActiveCardId(null);
      haptic.impact('light');
    } else {
      setActiveCardId(id);
      haptic.impact('medium');
    }
  };

  const togglePassword = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPassword(!showPassword);
    haptic.impact('medium');
  };

  const cards = useMemo(() => [
    { id: 'email', label: 'Work Email dhl.com', value: profile.email.split('@')[0], barcodeValue: profile.email.toLowerCase(), icon: <Mail size={20} /> },
    { id: 'login', label: 'Login ID', value: profile.login, icon: <User size={20} /> },
    { id: 'password', label: 'Password', value: profile.password || '******', icon: <Lock size={20} /> },
  ], [profile]);

  const activeCard = cards.find(c => c.id === activeCardId);

  return (
    <div className="flex flex-col items-center w-full mt-4 space-y-6">

      {/* Hero Photo */}
      <div className="relative">
        <div className="w-72 h-72 z-10 shrink-0 rounded-full bg-white border-8 border-white shadow-xl overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={96} className="text-slate-300" />
            )}
          </div>
        </div>
        {/* Edit button */}
        <button
          onClick={() => { haptic.impact('light'); onEditProfile(); }}
          className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#D40511] text-white shadow-lg flex items-center justify-center active:scale-90 transition-all border-3 border-white z-20"
        >
          <Pencil size={16} />
        </button>
      </div>

      {/* Horizontally Scrollable Pills */}
      <div
        className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-4 py-4 min-h-[120px]"
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          paddingLeft: '16px',
          paddingRight: '16px',
          scrollPaddingLeft: '16px',
          scrollPaddingRight: '16px'
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className="snap-center shrink-0 h-24 relative"
            style={{ width: 'calc(100vw - 120px)' }}
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
        <div className="shrink-0 w-1" aria-hidden="true" />
      </div>

      {/* Full-screen barcode overlay */}
      {activeCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300 opacity-100">
           <div
             className="absolute inset-0 bg-[#F2F4F8]/80 backdrop-blur-sm"
             onClick={() => setActiveCardId(null)}
           />
           <div
              onClick={() => setActiveCardId(null)}
              className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl z-10 cursor-pointer relative border-2 border-[#D40511] flex flex-col items-center justify-between py-8 px-6 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform scale-100 translate-y-0"
              style={{ height: '55vh', maxHeight: '400px' }}
           >
               <p className="text-sm font-black text-[#D40511] uppercase tracking-widest leading-none mt-2">
                 {activeCard?.id === 'email' ? 'Work Email' : activeCard?.label} Barcode
               </p>
               <div className="w-full flex-1 mt-6 mb-4 flex items-center justify-center overflow-hidden">
                  {activeCard && (
                    <Barcode
                      value={'barcodeValue' in activeCard ? (activeCard as any).barcodeValue : activeCard.value}
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
      )}

    </div>
  );
};

export default ProfileBadge;

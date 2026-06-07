import React, { useState, useRef } from 'react';
import { Camera, Mail, User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { resizePhoto, haptic } from '../utils';
import { useTranslation, translations, Translations } from '../i18n';

interface ProfileSetupProps {
  initialProfile: UserProfile | null;
  initialPhoto: string | null;
  tgAvatarUrl: string | null;
  onSave: (profile: UserProfile, photo: string | null) => void;
  onCancel?: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({
  initialProfile,
  initialPhoto,
  tgAvatarUrl,
  onSave,
  onCancel,
}) => {
  const { language } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<Language>(initialProfile?.language || 'EN');
  
  const t = (key: keyof Translations) => translations[selectedLang][key];
  
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [login, setLogin] = useState(initialProfile?.login || '');
  const [password, setPassword] = useState(initialProfile?.password || '');
  const [photo, setPhoto] = useState<string | null>(initialPhoto || null);
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayPhoto = photo || tgAvatarUrl;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const base64 = await resizePhoto(file);
      setPhoto(base64);
      haptic.notification('success');
    } catch {
      haptic.notification('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!email.trim() || !login.trim()) {
      haptic.notification('warning');
      return;
    }
    haptic.notification('success');
    onSave({ 
      email: email.trim().toUpperCase(), 
      login: login.trim(), 
      password: password || undefined,
      language: selectedLang
    }, photo);
  };

  const isEditing = !!initialProfile;

  return (
    <div 
      className="min-h-screen bg-transparent text-black pb-16 overflow-x-hidden font-sans"
      style={{
        paddingTop: 'calc(var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, env(safe-area-inset-top, 24px))) + 64px)'
      }}
    >
      <div className="max-w-md mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {onCancel && (
            <button 
              onClick={onCancel} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 text-black active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#D40511]">
              {isEditing ? t('editProfile') : t('setupProfile')}
            </h1>
            <p className="text-xs font-bold text-black/50 uppercase tracking-widest mt-0.5">
              DHL Digital ID
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex bg-white/30 rounded-2xl p-1 mb-8 shadow-sm">
           {(['PL', 'EN', 'UA'] as Language[]).map((lang) => (
              <button 
                key={lang}
                onClick={() => { haptic.selection(); setSelectedLang(lang); }}
                className={`flex-1 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${selectedLang === lang ? 'bg-white text-slate-800 shadow-md scale-105 z-10' : 'text-black/60 hover:bg-white/10'}`}
              >
                {lang}
              </button>
           ))}
        </div>

        {/* Photo Upload */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-44 h-44 rounded-full bg-white border-8 border-white shadow-xl overflow-hidden group active:scale-95 transition-all"
          >
            {displayPhoto ? (
              <img src={displayPhoto} alt="Фото" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <User size={64} className="text-slate-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <Camera size={32} className="text-white" />
            </div>
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#D40511] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Input Fields */}
        <div className="space-y-3">
          {/* Email */}
          <div className="bg-white rounded-[1.5rem] shadow-lg p-4 border-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#D40511] flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('workEmailLabel')} @DHL.COM
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="NAME.SURNAME@DHL.COM"
                  className="w-full text-sm font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-300 placeholder:font-bold"
                />
              </div>
            </div>
          </div>

          {/* Login */}
          <div className="bg-white rounded-[1.5rem] shadow-lg p-4 border-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#D40511] flex items-center justify-center shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('loginLabel')}
                </label>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="jpii71"
                  className="w-full text-lg font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-300 placeholder:font-bold"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="bg-white rounded-[1.5rem] shadow-lg p-4 border-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#D40511] flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('passwordOptional')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 text-lg font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleSave}
            disabled={!email.trim() || !login.trim()}
            className="w-full h-16 rounded-2xl bg-[#D40511] text-white font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg shadow-red-500/20 border-b-4 border-red-800 disabled:opacity-40 disabled:active:scale-100"
          >
            {t('saveProfile')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileSetup;


import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  ImageIcon, 
  Settings, 
  User, 
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  X,
  Monitor,
  FolderOpen,
  Info,
  ChevronRight,
  Sliders,
  Database,
  Cpu,
  Zap,
  Check,
  Video,
  Layers,
  Scissors,
  Image as ImageIconLucide,
  Home,
  Clock,
  ExternalLink,
  ChevronDown,
  Bell,
  Search,
  Command,
  Plus,
  Crown,
  Activity,
  Share2,
  Github,
  Globe,
  Box,
  PenTool,
  Coffee,
  Menu,
  AlertCircle,
  EyeOff,
  Eye,
  Focus,
  Maximize,
  Minimize,
  Wind,
  Navigation,
  Smartphone,
  MapPin,
  Camera as CameraIcon,
  Shirt,
  UserCheck,
  Palette,
  ShieldCheck,
  Type,
  Key,
  Edit3,
  Heart
} from 'lucide-react';
import { PoseStyle, Environment, HistoryItem, CameraAngle, ModelType, ImageQuality } from './types';
import { generateFashionImage, extractGarment } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'projects' | 'extract'>('studio');
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [pose, setPose] = useState<PoseStyle>(PoseStyle.TOAN_THAN);
  const [isCustomPose, setIsCustomPose] = useState<boolean>(false);
  const [customPoseText, setCustomPoseText] = useState<string>('');
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>(CameraAngle.MEDIUM_SHOT);
  const [environment, setEnvironment] = useState<Environment>(Environment.STUDIO);
  const [hiddenIdentity, setHiddenIdentity] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [useCustomBackgroundStyle, setUseCustomBackgroundStyle] = useState<boolean>(true);
  const [useCustomBackgroundPrompt, setUseCustomBackgroundPrompt] = useState<boolean>(false);
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState<string>('');
  
  // New States for Model and Quality
  const [modelType, setModelType] = useState<ModelType>(ModelType.NORMAL);
  const [imageQuality, setImageQuality] = useState<ImageQuality>(ImageQuality.K1);

  // Error Handling States
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [customErrorMessage, setCustomErrorMessage] = useState("");

  // Mobile States
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileInputOpen, setIsMobileInputOpen] = useState(false);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);

  const [extractSourceImage, setExtractSourceImage] = useState<string | null>(null);
  const [extractDescription, setExtractDescription] = useState<string>('');
  const [extractResultImage, setExtractResultImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const fileInputGarment = useRef<HTMLInputElement>(null);
  const fileInputModel = useRef<HTMLInputElement>(null);
  const fileInputBackground = useRef<HTMLInputElement>(null);
  const fileInputExtract = useRef<HTMLInputElement>(null);

  const colors = {
    bg: '#0E0E0E',
    panel: '#1A1A1A',
    primary: '#FF8C32',
    hover: '#FFA85C',
    text: '#F2F2F2',
    subText: '#9CA3AF',
    border: '#2A2A2A',
    accent: '#D4AF37', 
    success: '#28a745' 
  };

  const handleError = (err: any) => {
    const errMsg = err.message || "";
    if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      setCustomErrorMessage(
        modelType === ModelType.PRO 
        ? "Lỗi Quota Pro: Bạn đã hết lượt sử dụng Nano Banana Pro hoặc dự án thanh toán đã vượt giới hạn. Vui lòng kiểm tra lại cấu hình API Key hoặc nạp thêm tiền tại Google AI Studio."
        : "Lỗi Quota (429): Bạn đã vượt quá giới hạn sử dụng API của Gemini. Vui lòng đợi một lát rồi thử lại."
      );
    } else if (errMsg.includes("Requested entity was not found")) {
      setCustomErrorMessage("Lỗi xác thực: Không tìm thấy API Key hoặc dự án. Nếu bạn đang dùng Nano Banana Pro, hãy đảm bảo đã chọn một API Key hợp lệ.");
    } else {
      setCustomErrorMessage(errMsg || "Có lỗi xảy ra trong quá trình xử lý. Vui lòng kiểm tra lại ảnh đầu vào và thử lại.");
    }
    setShowErrorModal(true);
  };

  const handleProKeySetup = async () => {
    try {
      if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }
      setModelType(ModelType.PRO);
    } catch (err) {
      console.error("Key selection failed", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'garment' | 'model' | 'background' | 'extract') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'garment') setGarmentImage(reader.result as string);
        else if (type === 'model') setModelImage(reader.result as string);
        else if (type === 'background') setBackgroundImage(reader.result as string);
        else if (type === 'extract') setExtractSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!garmentImage || !modelImage) {
      setCustomErrorMessage("Vui lòng tải lên ảnh trang phục và ảnh người mẫu.");
      setShowErrorModal(true);
      return;
    }

    if (isCustomPose && !customPoseText.trim()) {
      setCustomErrorMessage("Vui lòng nhập mô tả dáng đứng tùy chỉnh.");
      setShowErrorModal(true);
      return;
    }

    if (modelType === ModelType.PRO) {
       const hasKey = await (window as any).aistudio.hasSelectedApiKey();
       if (!hasKey) {
         setCustomErrorMessage("Phiên bản Nano Banana Pro yêu cầu bạn phải chọn API Key cá nhân để tiếp tục. Hãy nhấn vào 'Dùng Nano Banana Pro' một lần nữa để thiết lập.");
         setShowErrorModal(true);
         return;
       }
    }

    setIsGenerating(true);
    setIsMobileInspectorOpen(false); 
    try {
      const finalPose = isCustomPose ? customPoseText : pose;
      const result = await generateFashionImage(
        garmentImage, 
        modelImage, 
        backgroundImage, 
        finalPose, 
        cameraAngle, 
        environment, 
        hiddenIdentity, 
        useCustomBackgroundStyle,
        useCustomBackgroundPrompt,
        customBackgroundPrompt,
        modelType,
        imageQuality
      );
      if (!result) throw new Error("No response from AI");
      setResultImage(result);
      setHistory([{ id: Date.now().toString(), imageUrl: result, timestamp: Date.now() }, ...history]);
    } catch (err: any) {
      handleError(err);
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleExtract = async () => {
    if (!extractSourceImage) {
      setCustomErrorMessage("Vui lòng tải lên ảnh người mẫu mặc trang phục.");
      setShowErrorModal(true);
      return;
    }

    if (modelType === ModelType.PRO) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setCustomErrorMessage("Phiên bản Nano Banana Pro yêu cầu bạn phải chọn API Key cá nhân để tiếp tục. Hãy nhấn vào 'Dùng Nano Banana Pro' một lần nữa để thiết lập.");
        setShowErrorModal(true);
        return;
      }
    }

    setIsExtracting(true);
    setIsMobileInputOpen(false); 
    try {
      const result = await extractGarment(extractSourceImage, extractDescription, modelType, imageQuality);
      if (!result) throw new Error("No response from AI");
      setExtractResultImage(result);
      setHistory([{ id: Date.now().toString(), imageUrl: result, timestamp: Date.now() }, ...history]);
    } catch (err: any) {
      handleError(err);
    } finally { setIsExtracting(false); }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `elite-luxury-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-quicksand select-none text-[12px]" style={{ backgroundColor: colors.bg, color: colors.text }}>
      
      {/* ELITE LUXURY HEADER */}
      <header className="h-12 border-b flex items-center justify-between px-4 lg:px-6 z-[100] relative shrink-0" style={{ backgroundColor: '#000', borderColor: colors.border }}>
        <div className="flex items-center space-x-2 lg:space-x-4">
          <button 
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <Menu size={18} />
          </button>
          
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-2 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-500" style={{ backgroundColor: colors.primary }}></div>
            <div className="relative border p-1.5 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: colors.panel, borderColor: colors.accent + '40' }}>
              <Crown className="text-[#D4AF37]" size={16} fill="currentColor" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] leading-none" style={{ color: colors.text }}>Elite Studio AI</h1>
            <div className="flex items-center mt-0.5 space-x-2">
              <span className="text-[6px] lg:text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded border" style={{ color: colors.primary, backgroundColor: colors.primary + '05', borderColor: colors.primary + '20' }}>{modelType === ModelType.PRO ? 'PRO VERSION ACTIVE' : 'Absolute Hair Lock v2.5'}</span>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3 border px-3 py-1 rounded-lg w-72 transition-all" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
          <Search size={12} style={{ color: colors.subText }} />
          <input type="text" placeholder="Tìm kiếm tài nguyên..." className="bg-transparent border-none outline-none text-[10px] font-medium w-full placeholder-gray-700" style={{ color: colors.subText }} />
          <div className="flex items-center space-x-1 px-1 py-0.5 rounded border" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
            <Command size={8} style={{ color: colors.subText }} />
            <span className="text-[7px] font-bold" style={{ color: colors.subText }}>K</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="flex items-center space-x-1 lg:space-x-2">
            <button className="relative p-1.5 rounded-lg border transition-all hover:bg-white/5" style={{ backgroundColor: colors.panel, borderColor: colors.border, color: colors.subText }}>
              <Bell size={14} />
              <div className="absolute top-1 right-1 w-1 h-1 rounded-full" style={{ backgroundColor: colors.primary }}></div>
            </button>
            <button 
              onClick={() => setIsMobileInputOpen(!isMobileInputOpen)}
              className="lg:hidden p-1.5 rounded-lg border transition-all hover:bg-white/5" 
              style={{ backgroundColor: colors.panel, borderColor: colors.border, color: colors.primary }}
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="hidden md:block h-5 w-px" style={{ backgroundColor: colors.border }}></div>
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="text-right hidden md:block">
              <p className="text-[9px] font-black uppercase tracking-widest group-hover:text-orange-500 transition-colors">Văn Tặng</p>
              <p className="text-[7px] font-bold uppercase" style={{ color: colors.subText }}>System Administrator</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black text-black shadow-lg border relative" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, borderColor: colors.accent + '40' }}>VT</div>
          </div>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden relative">
        
        {/* SIDEBAR NAVIGATION */}
        <aside 
          className={`
            fixed lg:relative inset-y-0 left-0 z-[150] lg:z-50
            w-72 border-r flex flex-col transition-transform duration-300 transform
            ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            shrink-0
          `} 
          style={{ backgroundColor: '#000', borderColor: colors.border }}
        >
          <div className="lg:hidden flex justify-end p-4">
            <button onClick={() => setIsMobileNavOpen(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
          </div>
          <div className="p-5">
             <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-4 px-2 border-l-2" style={{ color: colors.subText, borderColor: colors.primary }}>Dashboard</p>
             <nav className="space-y-1">
                {[
                  { id: 'studio', label: 'Studio AI', icon: Home },
                  { id: 'extract', label: 'Tách Trang Phục', icon: Scissors },
                  { id: 'projects', label: 'Dự Án Đã Tạo', icon: Clock }
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsMobileNavOpen(false); }} 
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center space-x-3 group ${activeTab === item.id ? 'text-black font-bold' : ''}`}
                    style={{ backgroundColor: activeTab === item.id ? colors.primary : 'transparent', color: activeTab === item.id ? '#000' : colors.subText }}
                  >
                    <item.icon size={14} className={activeTab === item.id ? 'text-black' : 'group-hover:text-white transition-colors'} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
             </nav>
          </div>

          <div className="mt-auto p-5 space-y-4">
             {/* APP NOTICE */}
             <div className="border rounded-xl p-3 relative overflow-hidden group shadow-lg bg-orange-900/5 border-orange-500/20">
                <p className="text-[10px] font-black uppercase mb-1.5 tracking-widest flex items-center text-orange-400">
                   <Coffee size={12} className="mr-2" /> Bản thử nghiệm
                </p>
                <p className="text-[9px] font-medium leading-relaxed italic text-orange-100/60">
                  Ứng dụng đang trong giai đoạn phát triển. Một số chức năng AI có thể phản hồi chậm hoặc không chính xác. Nếu bạn thích ứng dụng này, có thể mời mình ly Cafe qua STK TPBANK 64663598888
                </p>
             </div>

             <div className="border rounded-xl p-3 relative overflow-hidden group shadow-inner" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                <p className="text-[7px] font-black uppercase mb-1 tracking-widest flex items-center" style={{ color: colors.accent }}>
                   <Activity size={10} className="mr-2" /> Neural Link Status
                </p>
                <div className="flex items-center space-x-2">
                   <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                   <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: colors.subText }}>Active v2.5.0-HAIR-LOCKED</span>
                </div>
             </div>
          </div>
        </aside>

        {/* INPUT ASIDE (Left) */}
        {activeTab !== 'projects' && (
          <aside 
            className={`
              fixed lg:relative inset-y-0 left-0 lg:left-auto z-[140] lg:z-40
              w-80 border-r flex flex-col transition-transform duration-300 transform
              ${isMobileInputOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              overflow-y-auto shrink-0
            `}
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          >
            <header className="h-10 border-b flex items-center justify-between px-6 shrink-0" style={{ backgroundColor: '#111', borderColor: colors.border }}>
              <span className="text-[9px] font-black uppercase tracking-widest flex items-center" style={{ color: colors.primary }}>
                {activeTab === 'extract' ? 'Module Tách Vải' : 'Dữ Liệu Đầu Vào'}
              </span>
              <button onClick={() => setIsMobileInputOpen(false)} className="lg:hidden text-white/50 hover:text-white"><X size={14} /></button>
            </header>
            
            <div className="flex-grow p-5 space-y-5 custom-scrollbar">
              {/* SHARED ENGINE & QUALITY SELECTION */}
              {(activeTab === 'studio' || activeTab === 'extract') && (
                <div className="space-y-4">
                  {/* ENGINE SELECTION */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest px-1" style={{ color: colors.accent }}>Công Cụ Tạo Ảnh</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setModelType(ModelType.NORMAL)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${modelType === ModelType.NORMAL ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_15px_rgba(255,140,50,0.2)]' : 'bg-white/5 border-transparent opacity-50'}`}
                      >
                        <Zap size={14} className={modelType === ModelType.NORMAL ? 'text-orange-500' : 'text-gray-500'} />
                        <span className={`text-[8px] font-black uppercase mt-1 ${modelType === ModelType.NORMAL ? 'text-orange-500' : 'text-gray-500'}`}>Normal</span>
                      </button>
                      <button 
                        onClick={handleProKeySetup}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${modelType === ModelType.PRO ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-white/5 border-transparent opacity-50'}`}
                      >
                        <Crown size={14} className={modelType === ModelType.PRO ? 'text-accent' : 'text-gray-500'} />
                        <span className={`text-[8px] font-black uppercase mt-1 ${modelType === ModelType.PRO ? 'text-accent' : 'text-gray-500'}`}>Banana Pro</span>
                      </button>
                    </div>
                  </div>

                  {/* QUALITY SELECTION (Only for PRO) */}
                  {modelType === ModelType.PRO && (
                    <div className="flex flex-col space-y-2 animate-in slide-in-from-top-4 duration-300">
                      <label className="text-[8px] font-black uppercase tracking-widest px-1" style={{ color: colors.accent }}>Chất Lượng (Pro Only)</label>
                      <div className="flex items-center space-x-2">
                        {Object.values(ImageQuality).map(q => (
                          <button 
                            key={q}
                            onClick={() => setImageQuality(q)}
                            className={`flex-grow py-2 rounded-lg border text-[9px] font-black transition-all ${imageQuality === q ? 'bg-accent text-black border-accent' : 'bg-white/5 border-transparent text-gray-500'}`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-white/5 my-2"></div>
                </div>
              )}

              {activeTab === 'studio' && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest px-1" style={{ color: colors.subText }}>Trang Phục Nguồn</label>
                    <div 
                      onClick={() => fileInputGarment.current?.click()} 
                      className="group relative h-36 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-dot-pattern"
                      style={{ backgroundColor: colors.panel, borderColor: garmentImage ? colors.primary + '50' : colors.border }}
                    >
                      <input type="file" ref={fileInputGarment} onChange={(e) => handleFileChange(e, 'garment')} className="hidden" accept="image/*" />
                      {garmentImage ? (
                        <img src={garmentImage} alt="Garment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                         <div className="flex flex-col items-center opacity-20 group-hover:opacity-100 group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                           <ImageIcon size={18} />
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest px-1" style={{ color: colors.subText }}>Người Mẫu (KHÓA TÓC)</label>
                    <div 
                      onClick={() => fileInputModel.current?.click()} 
                      className="group relative h-36 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-dot-pattern"
                      style={{ backgroundColor: colors.panel, borderColor: modelImage ? colors.primary + '50' : colors.border }}
                    >
                      <input type="file" ref={fileInputModel} onChange={(e) => handleFileChange(e, 'model')} className="hidden" accept="image/*" />
                      {modelImage ? (
                        <img src={modelImage} alt="Model" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="flex flex-col items-center opacity-20 group-hover:opacity-100 group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                          <User size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex flex-col space-y-2 transition-opacity ${useCustomBackgroundPrompt ? 'opacity-30 pointer-events-none' : ''}`}>
                    <label className="text-[8px] font-black uppercase tracking-widest px-1 italic" style={{ color: colors.accent }}>Bối Cảnh Cố Định (Tuỳ chọn)</label>
                    <div 
                      onClick={() => fileInputBackground.current?.click()} 
                      className="group relative h-36 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-dot-pattern"
                      style={{ backgroundColor: colors.panel, borderColor: backgroundImage ? colors.accent + '50' : colors.border }}
                    >
                      <input type="file" ref={fileInputBackground} onChange={(e) => handleFileChange(e, 'background')} className="hidden" accept="image/*" />
                      {backgroundImage ? (
                        <>
                          <img src={backgroundImage} alt="Background" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setBackgroundImage(null); }}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/80 rounded border text-white hover:bg-red-600 transition-colors"
                            style={{ borderColor: colors.border }}
                          >
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center opacity-30 group-hover:opacity-100 group-hover:scale-110 group-hover:text-accent transition-all duration-300">
                          <Monitor size={18} className="mb-1" />
                          <span className="text-[7px] font-black uppercase tracking-tighter">Optional Background</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: colors.accent }}>Bối Cảnh Theo Mô Tả</label>
                      <div 
                        onClick={() => setUseCustomBackgroundPrompt(!useCustomBackgroundPrompt)}
                        className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer ${useCustomBackgroundPrompt ? 'bg-orange-500' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${useCustomBackgroundPrompt ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </div>
                     <textarea
                        value={customBackgroundPrompt}
                        onChange={(e) => setCustomBackgroundPrompt(e.target.value)}
                        placeholder="Ví dụ: trên du thuyền sang trọng lúc hoàng hôn..."
                        rows={3}
                        disabled={!useCustomBackgroundPrompt}
                        className="w-full bg-black border rounded-xl px-4 py-2.5 text-[10px] outline-none transition-all placeholder:text-gray-700 disabled:opacity-30 disabled:pointer-events-none"
                        style={{ borderColor: useCustomBackgroundPrompt ? colors.primary + '40' : colors.border, color: colors.text }}
                      />
                  </div>
                </div>
              )}

              {activeTab === 'extract' && (
                <>
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest px-1" style={{ color: colors.subText }}>Ảnh Chụp Bộ Đồ</label>
                      <div 
                        onClick={() => fileInputExtract.current?.click()} 
                        className="group relative h-52 border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden shadow-inner bg-dot-pattern"
                        style={{ backgroundColor: colors.panel, borderColor: extractSourceImage ? colors.primary + '40' : colors.border }}
                      >
                        <input type="file" ref={fileInputExtract} onChange={(e) => handleFileChange(e, 'extract')} className="hidden" accept="image/*" />
                        {extractSourceImage ? (
                          <img src={extractSourceImage} alt="Source" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="flex flex-col items-center opacity-20 group-hover:opacity-100 group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                            <User size={24} className="mb-2" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Tải Lên</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest flex justify-between px-1" style={{ color: colors.subText }}>
                        <span>Phân Tách Bộ Đồ</span>
                        <PenTool size={10} style={{ color: colors.primary }} />
                      </label>
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={extractDescription}
                          onChange={(e) => setExtractDescription(e.target.value)}
                          placeholder="Ví dụ: Áo và Quần, Áo và Váy..."
                          className="w-full bg-black border rounded-xl px-4 py-2.5 text-[10px] outline-none transition-all placeholder:text-gray-700"
                          style={{ borderColor: colors.border, color: colors.text }}
                        />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] w-0 bg-orange-500 transition-all group-focus-within:w-[80%]"></div>
                      </div>
                      <p className="text-[7px] text-gray-600 font-bold italic px-1">* AI sẽ dựa vào đây để không gộp chung các phần đồ.</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleExtract} 
                    disabled={isExtracting || !extractSourceImage} 
                    className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isExtracting ? 'opacity-50 grayscale' : 'shadow-xl active:scale-95'}`}
                    style={{ backgroundColor: colors.primary, color: '#000' }}
                  >
                    {isExtracting ? <RefreshCw className="animate-spin" size={14} /> : <Scissors size={14} />}
                    <span>{isExtracting ? 'Đang Tách...' : modelType === ModelType.PRO ? 'PRO EXTRACT' : 'Bắt Đầu Tách'}</span>
                  </button>
                </>
              )}
            </div>
          </aside>
        )}

        {/* MAIN DISPLAY AREA */}
        <main className="flex-grow flex flex-col relative overflow-hidden" style={{ backgroundColor: colors.bg }}>
          
          <div className="px-4 lg:px-6 pt-6 pb-2 shrink-0">
             <div className="border rounded-2xl p-4 lg:p-6 flex items-center justify-between relative overflow-hidden group shadow-[0_16px_40px_rgba(0,0,0,0.7)] bg-[radial-gradient(ellipse_at_top,rgba(255,140,50,0.1)_0%,transparent_60%)]" style={{ backgroundColor: '#111', borderColor: colors.primary+'20' }}>
                <div className="relative z-10 w-full">
                   <h2 className="text-sm lg:text-base font-black uppercase tracking-[0.2em] mb-1.5 flex items-center">
                      <Crown size={14} className="mr-2 lg:mr-3 shrink-0" style={{ color: colors.accent }} fill="currentColor" />
                      Elite Workspace | <span style={{ color: colors.primary }} className="ml-2 uppercase">{modelType === ModelType.PRO ? 'NANO BANANA PRO ENGAGED' : 'ABSOLUTE HAIR LOCK ACTIVE'}</span>
                   </h2>
                   <p className="text-[8px] lg:text-[9px] font-bold uppercase tracking-widest max-w-lg leading-relaxed italic" style={{ color: colors.subText }}>
                      {activeTab === 'studio' ? `Hệ thống Synthesis đang thực thi lệnh "KHÓA CẤU TRÚC TÓC TUYỆT ĐỐI". Mọi đặc điểm nhận dạng về mái tóc từ ảnh tham chiếu sẽ được bảo tồn nguyên bản.` : activeTab === 'extract' ? 'Module tách trang phục chuyên dụng. AI sẽ phân tích cấu trúc vải chính xác nhất.' : 'Thư viện bản render của bạn.'}
                   </p>
                </div>
                <Cpu size={32} className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/10 group-hover:text-primary/20 transition-colors duration-500" />
             </div>
          </div>

          <div className="flex-grow relative flex items-center justify-center overflow-auto p-4 lg:p-6">
            {activeTab === 'projects' ? (
              <div className="w-full h-full overflow-y-auto px-2 lg:px-6 py-4 custom-scrollbar">
                <header className="mb-8 border-b pb-4 flex items-center justify-between" style={{ borderColor: colors.border }}>
                    <h2 className="text-sm lg:text-lg font-black uppercase tracking-[0.2em] flex items-center">
                        <Layers size={18} className="mr-4" style={{ color: colors.primary }} /> Bộ Sưu Tập Pixel
                    </h2>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6 pb-20">
                  {history.length === 0 ? (
                    <div className="col-span-full h-80 flex flex-col items-center justify-center text-gray-800 opacity-20 italic">
                      <FolderOpen size={48} className="mb-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Kho Lưu Trữ Trống</span>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="group relative border p-1 rounded-2xl aspect-[9/16] transition-all duration-500 hover:border-orange-500/30 shadow-xl" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                        <img src={item.imageUrl} alt="Project" className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute bottom-3 right-3 flex opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <button onClick={() => downloadImage(item.imageUrl)} className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center hover:bg-orange-500 hover:text-white"><Download size={16} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {((activeTab === 'studio' && !resultImage && !isGenerating) || (activeTab === 'extract' && !extractResultImage && !isExtracting)) ? (
                  <div className="flex flex-col items-center">
                    <Sparkles size={40} className="text-white/5 mb-8" />
                    <p className="text-[9px] font-black uppercase tracking-[1em] text-white/5 pl-[1em] italic text-center">Waiting_System_Input</p>
                  </div>
                ) : (isGenerating || isExtracting) ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-full max-w-[280px] lg:w-72 aspect-[9/16] bg-black border rounded-[40px] relative overflow-hidden flex items-center justify-center" style={{ borderColor: colors.primary + '20' }}>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-600/10 to-transparent animate-scan"></div>
                      <div className="flex flex-col items-center relative z-10 px-6">
                        <RefreshCw className="animate-spin text-orange-500 mb-6" size={32} />
                        <span className="text-[8px] font-black text-orange-500 tracking-[0.3em] uppercase italic text-center mb-2">{modelType === ModelType.PRO ? 'PRO ENGINE RENDERING...' : 'Analyzing Geometry...'}</span>
                        <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-500 animate-loading-bar"></div>
                        </div>
                        <span className="text-[6px] font-bold text-gray-600 tracking-widest mt-2 uppercase italic">{modelType === ModelType.PRO ? `GENERATING ${imageQuality} RESOLUTION` : 'FORCE-LOCKING HAIR SILHOUETTE'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative group animate-in zoom-in-95 duration-500 max-h-full">
                    <div className="p-1 lg:p-2 border rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.9)] relative z-10 overflow-hidden" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                      <img 
                        src={(activeTab === 'studio' ? resultImage : extractResultImage)!} 
                        alt="Elite Render" 
                        className="w-[280px] lg:w-[340px] aspect-[9/16] object-cover rounded-[34px]" 
                      />
                    </div>
                    
                    <div className="absolute -right-12 lg:-right-16 top-1/2 -translate-y-1/2 flex flex-col space-y-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <button onClick={() => downloadImage((activeTab === 'studio' ? resultImage : extractResultImage)!)} className="w-10 lg:w-12 h-10 lg:h-12 bg-white text-black rounded-xl flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-2xl">
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => activeTab === 'studio' ? setResultImage(null) : setExtractResultImage(null)} 
                        className="w-10 lg:w-12 h-10 lg:h-12 bg-black/80 rounded-xl flex items-center justify-center border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* MOBILE TOGGLE FOR INSPECTOR */}
          {!isGenerating && activeTab === 'studio' && !isMobileInspectorOpen && (
            <button 
              onClick={() => setIsMobileInspectorOpen(true)}
              className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl z-50 flex items-center justify-center text-black"
              style={{ backgroundColor: colors.primary }}
            >
              <Sliders size={24} />
            </button>
          )}
        </main>

        {/* INSPECTOR PANEL (Right) */}
        {activeTab === 'studio' && (
          <aside 
            className={`
              fixed lg:relative inset-y-0 right-0 z-[140] lg:z-40
              w-96 flex flex-col transition-transform duration-300 transform
              ${isMobileInspectorOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
              shadow-[-12px_0_35px_rgba(0,0,0,0.6)] overflow-hidden
            `}
            style={{ backgroundColor: '#000', borderLeft: `1px solid ${colors.border}` }}
          >
            <header className="h-10 border-b flex items-center justify-between px-6 shrink-0" style={{ backgroundColor: '#111', borderColor: colors.border }}>
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center" style={{ color: colors.subText }}>
                <Sliders size={16} className="mr-3" style={{ color: colors.primary }} /> THÔNG SỐ PIXEL
              </span>
              <button onClick={() => setIsMobileInspectorOpen(false)} className="lg:hidden text-white/50 hover:text-white"><X size={14} /></button>
            </header>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* HIDDEN IDENTITY TOGGLE SECTION */}
              <section className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center" style={{ color: colors.subText }}>
                    <EyeOff size={16} className="mr-3" style={{ color: colors.primary }} /> CHẾ ĐỘ HIỂN THỊ
                  </h4>
                </div>
                <div 
                  onClick={() => setHiddenIdentity(!hiddenIdentity)}
                  className={`group relative flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-500 ${hiddenIdentity ? 'shadow-[0_0_20px_rgba(255,140,50,0.15)] bg-white/5' : 'bg-transparent'}`}
                  style={{ borderColor: hiddenIdentity ? colors.primary + '40' : colors.border }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${hiddenIdentity ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-gray-600'}`}>
                      {hiddenIdentity ? <Smartphone size={24} /> : <UserCheck size={24} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: hiddenIdentity ? colors.text : colors.subText }}>Hidden Identity</span>
                      <span className="text-[8px] font-bold uppercase opacity-50 tracking-tighter">{hiddenIdentity ? 'Face Obscured Mode' : 'Natural Face Mode'}</span>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${hiddenIdentity ? 'bg-orange-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 ${hiddenIdentity ? 'left-7' : 'left-1'}`} />
                  </div>
                </div>
              </section>

              {/* POSES SECTION */}
              <section className="animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center" style={{ color: colors.subText }}>
                    <Wind size={16} className="mr-3" style={{ color: colors.primary }} /> DÁNG ĐỨNG (POSES)
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(PoseStyle).map(p => {
                    const isSelected = !isCustomPose && pose === p;
                    return (
                      <button 
                        key={p} 
                        onClick={() => { setPose(p); setIsCustomPose(false); }} 
                        className={`
                          group relative px-4 py-4 rounded-2xl text-[9px] font-black uppercase text-left border transition-all duration-500 overflow-hidden
                          ${isSelected ? 'text-white border-orange-500 shadow-[0_10px_30px_rgba(255,140,50,0.2)]' : 'text-gray-500 hover:border-white/20 hover:bg-white/5'}
                        `}
                        style={{ 
                          backgroundColor: isSelected ? 'transparent' : 'transparent', 
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                      >
                        {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent pointer-events-none" />}
                        <div className="relative z-10 flex flex-col space-y-2">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                              {p.includes('Cận') ? <Focus size={16} /> : p.includes('Toàn thân') ? <Maximize size={16} /> : p.includes('Quyến rũ') ? <Heart size={16} /> : <User size={16} />}
                           </div>
                           <span className="leading-tight">{p}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                            <Check size={10} strokeWidth={4} className="text-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                  
                  {/* CUSTOM POSE BUTTON */}
                  <button 
                    onClick={() => setIsCustomPose(true)}
                    className={`
                      group relative px-4 py-4 rounded-2xl text-[9px] font-black uppercase text-left border transition-all duration-500 overflow-hidden
                      ${isCustomPose ? 'text-white border-orange-500 shadow-[0_10px_30px_rgba(255,140,50,0.2)]' : 'text-gray-500 hover:border-white/20 hover:bg-white/5'}
                    `}
                    style={{ 
                      backgroundColor: 'transparent', 
                      borderColor: isCustomPose ? colors.primary : colors.border,
                    }}
                  >
                    {isCustomPose && <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent pointer-events-none" />}
                    <div className="relative z-10 flex flex-col space-y-2">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${isCustomPose ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                          <Edit3 size={16} />
                       </div>
                       <span className="leading-tight">Tự Nhập Dáng</span>
                    </div>
                    {isCustomPose && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                        <Check size={10} strokeWidth={4} className="text-black" />
                      </div>
                    )}
                  </button>
                </div>

                {/* CUSTOM POSE INPUT FIELD */}
                {isCustomPose && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                    <textarea
                      value={customPoseText}
                      onChange={(e) => setCustomPoseText(e.target.value)}
                      placeholder="Mô tả dáng đứng bạn muốn (ví dụ: đang nhảy, tung tăng, quay lưng đi xa...)"
                      rows={3}
                      className="w-full bg-black border rounded-xl px-4 py-3 text-[10px] outline-none transition-all placeholder:text-gray-700"
                      style={{ borderColor: colors.primary + '60', color: colors.text }}
                    />
                    <p className="text-[7px] text-gray-600 font-bold italic px-1 mt-1">* Mô tả chi tiết để AI hiểu chính xác tư thế mong muốn.</p>
                  </div>
                )}
              </section>

              {/* CAMERA ANGLE SECTION */}
              <section className="animate-in fade-in slide-in-from-right-12 duration-900">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center" style={{ color: colors.subText }}>
                    <Focus size={16} className="mr-3" style={{ color: colors.primary }} /> GÓC MÁY HẬU KỲ
                  </h4>
                </div>
                <div className="flex flex-col space-y-3">
                  {Object.values(CameraAngle).map(angle => {
                    const isSelected = cameraAngle === angle;
                    return (
                      <button 
                        key={angle} 
                        onClick={() => setCameraAngle(angle)} 
                        className={`
                          group relative w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-500
                          ${isSelected ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/5 shadow-[inset_0_0_20px_rgba(255,140,50,0.1)]' : 'bg-transparent'}
                        `}
                        style={{ 
                          borderColor: isSelected ? colors.primary : colors.border,
                          transform: isSelected ? 'scale(1.02)' : 'none'
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-600 group-hover:bg-white/10 group-hover:text-white'}`}>
                            {angle.includes('MS') ? <Minimize size={18} /> : angle.includes('FS') ? <Maximize size={18} /> : <Camera size={18} />}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                              {angle.split(':')[0]}
                            </span>
                            <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter mt-0.5 max-w-[200px] leading-tight">
                              {angle.split(':')[1]?.trim() || ''}
                            </span>
                          </div>
                        </div>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_12px_#FF8C32]"></div>}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* BACKGROUND STYLE OVERRIDE SECTION - VISIBLE ONLY WITH CUSTOM BACKGROUND */}
              {backgroundImage && (
                <section className="animate-in fade-in slide-in-from-right-16 duration-1000">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center" style={{ color: colors.subText }}>
                      <Palette size={16} className="mr-3" style={{ color: colors.primary }} /> PHONG CÁCH NỀN
                    </h4>
                  </div>
                  <div 
                    onClick={() => setUseCustomBackgroundStyle(!useCustomBackgroundStyle)}
                    className={`group relative flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-500 ${useCustomBackgroundStyle ? 'shadow-[0_0_20px_rgba(255,140,50,0.15)] bg-white/5' : 'bg-transparent'}`}
                    style={{ borderColor: useCustomBackgroundStyle ? colors.primary + '40' : colors.border }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${useCustomBackgroundStyle ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-gray-600'}`}>
                        {useCustomBackgroundStyle ? <ImageIconLucide size={24} /> : <Sparkles size={24} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: useCustomBackgroundStyle ? colors.text : colors.subText }}>{useCustomBackgroundStyle ? 'Dùng Style Gốc' : 'Style Studio 8K'}</span>
                        <span className="text-[8px] font-bold uppercase opacity-50 tracking-tighter">{useCustomBackgroundStyle ? 'Theo style ảnh nền tải lên' : 'AI tự tạo style chuyên nghiệp'}</span>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${useCustomBackgroundStyle ? 'bg-orange-500' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 ${useCustomBackgroundStyle ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>
                  <p className="text-[7px] text-gray-600 font-bold italic px-1 mt-2">* Bật để AI sao chép phong cách từ ảnh nền. Tắt để AI áp dụng phong cách Studio chuyên nghiệp.</p>
                </section>
              )}

              {/* ENVIRONMENT SECTION */}
              <section className={`animate-in fade-in slide-in-from-right-16 duration-1000 ${backgroundImage || useCustomBackgroundPrompt ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center" style={{ color: colors.subText }}>
                    <Navigation size={16} className="mr-3" style={{ color: colors.primary }} /> BỐI CẢNH (ENV)
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(Environment).map(env => {
                    const isSelected = environment === env;
                    return (
                      <button 
                        key={env} 
                        onClick={() => setEnvironment(env)} 
                        className={`
                          group relative px-4 py-4 rounded-2xl text-[9px] font-black uppercase text-left border transition-all duration-500 overflow-hidden
                          ${isSelected ? 'text-white border-orange-500 shadow-[0_10px_30px_rgba(255,140,50,0.2)]' : 'text-gray-500 hover:border-white/20 hover:bg-white/5'}
                        `}
                        style={{ 
                          backgroundColor: isSelected ? 'transparent' : 'transparent', 
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                      >
                        {isSelected && <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent pointer-events-none" />}
                        <div className="relative z-10 flex flex-col space-y-2">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                              {env.includes('Studio') ? <Box size={16} /> : env.includes('Đường phố') ? <MapPin size={16} /> : <ImageIconLucide size={16} />}
                           </div>
                           <span className="leading-tight">{env}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check size={10} strokeWidth={4} className="text-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="p-6 border-t shrink-0" style={{ backgroundColor: '#0a0a0a', borderColor: colors.border }}>
              <button 
                onClick={handleGenerate} 
                disabled={isGenerating || !garmentImage || !modelImage} 
                className={`
                  w-full group/render relative flex items-center justify-center space-x-4 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.5em] transition-all duration-700 overflow-hidden
                  ${isGenerating ? 'opacity-40 grayscale' : 'text-black shadow-[0_15px_40px_rgba(40,167,69,0.3)] hover:scale-[1.02] active:scale-95'}
                `}
                style={{ backgroundColor: colors.success }}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/render:translate-x-[100%] transition-transform duration-1000"></div>
                {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} fill="currentColor" />}
                <span className="relative z-10 uppercase tracking-[0.3em]">{isGenerating ? 'SYNTHESIZING...' : modelType === ModelType.PRO ? 'PRO RENDER START' : 'START RENDER'}</span>
              </button>
            </div>
          </aside>
        )}
        
        {/* OVERLAYS FOR MOBILE DRAWERS */}
        {(isMobileNavOpen || isMobileInputOpen || isMobileInspectorOpen) && (
          <div 
            onClick={() => { setIsMobileNavOpen(false); setIsMobileInputOpen(false); setIsMobileInspectorOpen(false); }}
            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-md z-[130] animate-in fade-in duration-500"
          />
        )}
      </div>

      {/* ERROR MODAL */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-6">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500"
            onClick={() => setShowErrorModal(false)}
          />
          <div 
            className="relative w-full max-w-sm border rounded-[2.5rem] p-10 text-center shadow-[0_32px_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500"
            style={{ backgroundColor: '#111', borderColor: colors.primary + '40' }}
          >
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              <AlertCircle size={36} className="text-red-500" />
            </div>
            <h3 className="text-base font-black uppercase tracking-[0.2em] mb-4 text-white">
              System Notification
            </h3>
            <p className="text-[13px] font-bold leading-relaxed mb-10 italic text-gray-400">
              "{customErrorMessage}"
            </p>
            {modelType === ModelType.PRO && (
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="block text-[10px] text-accent hover:underline mb-6 font-bold uppercase tracking-widest"
              >
                Kiểm tra tài liệu thanh toán Google AI Studio
              </a>
            )}
            <button 
              onClick={() => setShowErrorModal(false)}
              className="w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,140,50,0.3)]"
              style={{ backgroundColor: colors.primary, color: '#000' }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan { 
          0% { transform: translateY(-100%); opacity: 0; } 
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; } 
        }
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-loading-bar { animation: loading-bar 10s linear infinite; }
        .animate-scan { animation: scan 7s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF8C32; }
        button { outline: none !important; -webkit-tap-highlight-color: transparent; }

        .bg-dot-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0);
          background-size: 20px 20px;
        }
        
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
        .fade-in { animation-name: fadeIn; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .slide-in-from-right-4 { animation-name: slideInRight4; }
        .slide-in-from-right-8 { animation-name: slideInRight8; }
        .slide-in-from-right-12 { animation-name: slideInRight12; }
        .slide-in-from-right-16 { animation-name: slideInRight16; }
        .slide-in-from-top-4 { animation-name: slideInTop4; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInRight4 { from { transform: translateX(1rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInRight8 { from { transform: translateX(2rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInRight12 { from { transform: translateX(3rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInRight16 { from { transform: translateX(4rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInTop4 { from { transform: translateY(-1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;

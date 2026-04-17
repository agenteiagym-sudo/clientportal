import React, { useState } from 'react';
import { 
  Utensils, CheckCircle2, AlertCircle, Image as ImageIcon, 
  Sparkles, Calendar, ChefHat, Clock, Beef, Zap, Droplets, X,
  Printer, Share2, Trash2, Edit
} from 'lucide-react';
import { UserProfile, WeeklyMenu, DailyMenu } from '../../types';
import { Card } from '../ui/Card';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { encryptData } from '../../lib/encryption';
import { supabase } from '../../lib/supabase';
import { robustJSONRepair } from '../../lib/jsonUtils';

interface WeeklyMenuRendererProps {
  content: string;
  menuId?: string;
  onUpdate?: () => void;
  isAdmin?: boolean;
}

function WeeklyMenuRenderer({ content, menuId, onUpdate, isAdmin }: WeeklyMenuRendererProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [generatingDayImage, setGeneratingDayImage] = useState(false);
  let menuData: any = null;

  try {
    menuData = robustJSONRepair(content);
  } catch (e) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">Menú en formato de texto</p>
            <p className="text-[10px] text-amber-700">Este menú está en formato de texto plano o tiene errores de formato. Para usar las funciones interactivas, el administrador debe corregirlo.</p>
          </div>
        </div>
        <div className="prose prose-zinc prose-sm max-w-none bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
          <div className="whitespace-pre-wrap text-zinc-700 leading-relaxed font-medium">
            {content}
          </div>
        </div>
      </div>
    );
  }

  if (!menuData || !menuData.days) return null;

  const days = menuData.days;
  const dayImageUrl = days[activeDay]?.imageUrl || days[activeDay]?.image_url || null;

  async function handleGenerateDayImage() {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
    const currentDay = days[activeDay];
    setGeneratingDayImage(true);
    try {
      const prompt = `Genera una imagen artística y profesional de un menú saludable para el día ${currentDay.day}.
      El menú incluye:
      ${currentDay.meals ? currentDay.meals.map((m: any) => `- ${m.type}: ${m.plate}`).join('\n') : `- Desayuno: ${currentDay.breakfast}\n- Almuerzo: ${currentDay.lunch}\n- Cena: ${currentDay.dinner}`}
      
      Estilo: Fotografía gastronómica minimalista, luz natural, colores vibrantes, presentación elegante en platos modernos. 
      La imagen debe evocar salud, energía y nutrición deportiva de alto nivel. 
      Incluye elementos visuales de los ingredientes principales mencionados.
      Formato 1:1. No incluyas texto en la imagen.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let generatedImageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (generatedImageUrl && menuId && onUpdate) {
        const updatedDays = [...days];
        updatedDays[activeDay] = { ...currentDay, imageUrl: generatedImageUrl };
        const updatedMenuData = { ...menuData, days: updatedDays };
        
        const encryptedContent = await encryptData(JSON.stringify(updatedMenuData));
        const { error } = await supabase
          .from('weekly_menus')
          .update({ content: encryptedContent })
          .eq('id', menuId);

        if (error) throw error;
        
        onUpdate();
        toast.success(`¡Imagen del ${currentDay.day} generada y guardada!`);
      } else if (!generatedImageUrl) {
        throw new Error('La IA no generó una imagen válida.');
      }
    } catch (error: any) {
      console.error('Error generating day image:', error);
      toast.error('Error al generar la imagen: ' + (error.message || 'Ocurrió un problema técnico.'));
    } finally {
      setGeneratingDayImage(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
      <div className="flex overflow-x-auto no-scrollbar border-b border-zinc-100 bg-zinc-50/50 p-2 gap-1">
        {days.map((dayObj: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setActiveDay(idx)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
              activeDay === idx 
                ? 'bg-zinc-900 text-white shadow-md' 
                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
            )}
          >
            {dayObj.day}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center px-2 bg-zinc-50/50 p-3 rounded-2xl border border-zinc-100">
          <div className="flex items-center gap-2">
            <ChefHat size={16} className="text-zinc-400" />
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-tight">Menú del {days[activeDay].day}</h4>
          </div>
          {isAdmin && (
            <button
              onClick={handleGenerateDayImage}
              disabled={generatingDayImage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-bold hover:bg-amber-100 transition-all disabled:opacity-50 shadow-sm"
            >
              {generatingDayImage ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-amber-600 border-t-transparent" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={14} />
                  <span>Generar Imagen</span>
                </>
              )}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {dayImageUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl overflow-hidden border border-zinc-100 shadow-md"
              >
                <img src={dayImageUrl} alt={`Menú ${days[activeDay].day}`} className="w-full h-auto" referrerPolicy="no-referrer" />
              </motion.div>
            )}

            {days[activeDay].meals ? (
              days[activeDay].meals.map((meal: any, mIdx: number) => (
                <div key={mIdx} className="group relative bg-zinc-50 p-4 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-white rounded-xl border border-zinc-100 text-zinc-400 group-hover:text-zinc-900 transition-colors">
                      {meal.type === 'Desayuno' && <Clock size={16} />}
                      {meal.type === 'Almuerzo' && <Beef size={16} />}
                      {meal.type === 'Merienda' && <Zap size={16} />}
                      {meal.type === 'Cena' && <Droplets size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{meal.type}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 mb-2">{meal.plate}</h4>
                      
                      <div className="space-y-3">
                        <div className="bg-white/50 p-3 rounded-xl border border-zinc-100/50">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Ingredientes</span>
                          <p className="text-xs text-zinc-600 leading-relaxed">{meal.ingredients}</p>
                        </div>
                        
                        {meal.instructions && (
                          <div className="bg-white/50 p-3 rounded-xl border border-zinc-100/50">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Preparación</span>
                            <p className="text-xs text-zinc-500 italic leading-relaxed">{meal.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback for old structure
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['breakfast', 'lunch', 'dinner', 'snacks'].map((type) => {
                  const content = days[activeDay][type];
                  if (!content) return null;
                  return (
                    <div key={type} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1 capitalize">
                        {type === 'breakfast' ? 'Desayuno' : type === 'lunch' ? 'Almuerzo' : type === 'dinner' ? 'Cena' : 'Meriendas'}
                      </span>
                      <p className="text-sm font-bold text-zinc-900">{content}</p>
                      {days[activeDay].preparation && type === 'lunch' && (
                        <div className="mt-3 pt-3 border-t border-zinc-200/50">
                           <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Preparación</span>
                           <p className="text-xs text-zinc-500 italic">{days[activeDay].preparation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

interface MenuViewProps {
  menu: WeeklyMenu[];
  onUpdateMenu?: (menuId: string, dailyMenus: DailyMenu[]) => void;
  profile: UserProfile | null;
}

export const MenuView = ({ menu, onUpdateMenu, profile }: MenuViewProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingMenu, setIsEditingMenu] = useState<string | null>(null);
  const [editedMenuContent, setEditedMenuContent] = useState('');
  
  const isAdmin = profile?.role === 'admin' || profile?.role === 'nutritionist' || profile?.role === 'manager';

  // Sincronización: El cliente solo ve menús aprobados
  // El admin ve todos para poder aprobarlos
  const filteredMenus = menu.filter(m => isAdmin ? true : m.is_approved);
  
  const latestMenu = [...filteredMenus].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  if (!latestMenu) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <Utensils size={48} className="mb-4 opacity-20" />
        <p className="font-medium">Aún no tienes un menú aprobado.</p>
        <p className="text-sm">Tu nutricionista lo publicará pronto.</p>
      </div>
    );
  }

  const handleParseMenu = async (menuItem: WeeklyMenu) => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      let parts: any[] = [];
      const isBase64Image = menuItem.content.startsWith('data:image/');
      
      const prompt = `Convert this weekly menu into a structured JSON array of 7 daily menus. 
      Each object should have: day, breakfast, lunch, dinner, snacks, preparation.
      IMPORTANT: Return the days in order from Monday to Sunday (Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo).
      If the input is an image, extract the text first.
      If the input is text, use it directly.`;

      if (isBase64Image) {
        const [mimeInfo, base64Data] = menuItem.content.split(';base64,');
        const mimeType = mimeInfo.replace('data:', '');
        parts = [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ];
      } else {
        const truncatedContent = menuItem.content.length > 50000 
          ? menuItem.content.substring(0, 50000) + "... [Truncated]" 
          : menuItem.content;
        parts = [{ text: `${prompt}\n\nMenu content:\n${truncatedContent}` }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                breakfast: { type: Type.STRING },
                lunch: { type: Type.STRING },
                dinner: { type: Type.STRING },
                snacks: { type: Type.STRING },
                preparation: { type: Type.STRING }
              },
              required: ["day", "breakfast", "lunch", "dinner"]
            }
          }
        }
      });

      const dailyMenus = JSON.parse(response.text || "[]");
      if (onUpdateMenu) {
        onUpdateMenu(menuItem.id, dailyMenus);
      }
      toast.success('Menú digitalizado con éxito');
    } catch (err) {
      console.error('Error parsing menu:', err);
      toast.error('Error al procesar el menú');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleApproval = async (menuId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('weekly_menus')
        .update({ is_approved: !currentStatus })
        .eq('id', menuId);
      
      if (error) throw error;
      toast.success(currentStatus ? 'Menú desaprobado' : 'Menú aprobado con éxito');
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const updateMenuContent = async (menuId: string) => {
    try {
      const encrypted = await encryptData(editedMenuContent);
      const { error } = await supabase
        .from('weekly_menus')
        .update({ content: encrypted })
        .eq('id', menuId);
      
      if (error) throw error;
      setIsEditingMenu(null);
      toast.success('Contenido actualizado');
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Tu Plan Nutricional</h3>
            {latestMenu.is_approved ? (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 size={12} /> Aprobado
              </span>
            ) : (
              <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-amber-100 flex items-center gap-1">
                <Clock size={12} /> Pendiente
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 font-medium">Actualizado el {new Date(latestMenu.created_at).toLocaleDateString()}</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => toggleApproval(latestMenu.id, latestMenu.is_approved)}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                latestMenu.is_approved ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
              )}
            >
              <CheckCircle2 size={16} />
              {latestMenu.is_approved ? 'Desaprobar' : 'Aprobar Menú'}
            </button>
            <button
              onClick={() => handleParseMenu(latestMenu)}
              disabled={isGenerating}
              className="flex-1 md:flex-none px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={16} />}
              Digitalizar
            </button>
          </div>
        )}
      </div>

      {latestMenu.banner_url && (
        <div className="rounded-3xl overflow-hidden border border-zinc-100 shadow-sm">
          <img src={latestMenu.banner_url} alt="Banner Menú" className="w-full h-auto" referrerPolicy="no-referrer" />
        </div>
      )}

      <div className="relative group">
        {isAdmin && isEditingMenu === latestMenu.id ? (
          <div className="space-y-4">
            <textarea
              value={editedMenuContent}
              onChange={(e) => setEditedMenuContent(e.target.value)}
              className="w-full h-96 bg-white border border-zinc-200 rounded-2xl p-6 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => updateMenuContent(latestMenu.id)}
                className="bg-zinc-900 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-zinc-800"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setIsEditingMenu(null)}
                className="bg-zinc-100 text-zinc-600 px-6 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <WeeklyMenuRenderer 
              content={latestMenu.content} 
              menuId={latestMenu.id}
              onUpdate={() => {}} // Supabase realtime handles this
              isAdmin={isAdmin}
            />
            {isAdmin && (
              <button 
                onClick={() => {
                  setIsEditingMenu(latestMenu.id);
                  setEditedMenuContent(latestMenu.content);
                }}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-zinc-200 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
              >
                <Edit size={18} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

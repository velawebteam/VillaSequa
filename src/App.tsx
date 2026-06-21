/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Property, View, SearchFilters } from './types';
import { mockProperties } from './data/mockProperties';
import { getFavorites, toggleFavorite } from './lib/favorites';
import { 
  Search, 
  Heart, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize2, 
  Phone, 
  Mail, 
  Menu, 
  X,
  ArrowRight,
  ChevronRight,
  Star,
  CheckCircle2,
  Instagram,
  Facebook,
  Linkedin,
  LayoutGrid,
  Euro
} from 'lucide-react';
import Lenis from 'lenis';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import CustomCursor from './components/CustomCursor';

// --- Shared Components ---

const Navbar = ({ onViewChange, currentView, favoritesCount }: { onViewChange: (v: View) => void, currentView: View, favoritesCount: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { label: 'Início', value: 'home' as View },
    { label: 'Imóveis', value: 'listing' as View },
    { label: 'Serviços', value: 'services' as View },
    { label: 'Sobre Nós', value: 'about' as View },
    { label: 'Contacto', value: 'contact' as View },
  ];

  // We should force a background if we are not on the home view (which has a hero image)
  const shouldShowBg = isScrolled || currentView !== 'home';

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${shouldShowBg ? 'bg-white shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => onViewChange('home')}>
            <img 
              src="/villasequa-logo.png" 
              alt="Villassequa Logo" 
              className={`h-10 w-auto object-contain transition-all duration-300 ${shouldShowBg ? '' : 'brightness-0 invert opacity-90'}`}
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <button
                key={item.value}
                onClick={() => onViewChange(item.value)}
                className={`relative text-[10px] uppercase tracking-[0.2em] font-bold transition-colors group ${
                  currentView === item.value 
                    ? 'text-brand-secondary' 
                    : shouldShowBg ? 'text-brand-primary' : 'text-white'
                }`}
              >
                {item.label}
                <motion.span 
                  className="absolute -bottom-1 left-0 right-0 h-[1px] bg-brand-secondary origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  animate={{ scaleX: currentView === item.value ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </button>
            ))}
            <button 
              onClick={() => onViewChange('favorites')}
              className={`relative p-2 rounded-none transition-colors hover:bg-black/5 ${shouldShowBg ? 'text-brand-primary' : 'text-white'}`}
            >
              <Heart size={18} className={currentView === 'favorites' ? 'fill-brand-secondary text-brand-secondary' : ''} />
              <AnimatePresence>
                {favoritesCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-brand-secondary text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold"
                  >
                    {favoritesCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange('listing')}
              className="bg-brand-secondary text-white px-6 py-2.5 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-brand-secondary/90 transition-all shadow-md"
            >
              Ver Imóveis
            </motion.button>
          </div>

          {/* Mobile Right Icons */}
          <div className="md:hidden flex items-center space-x-2">
             <button 
              onClick={() => onViewChange('favorites')}
              className={`relative p-3 transition-transform active:scale-95 ${shouldShowBg ? 'text-brand-primary' : 'text-white'}`}
            >
              <Heart size={22} className={currentView === 'favorites' ? 'fill-brand-secondary text-brand-secondary' : ''} />
              <AnimatePresence>
                {favoritesCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2 right-2 bg-brand-secondary text-white text-[9px] w-4 h-4 flex items-center justify-center font-bold rounded-full border border-white"
                  >
                    {favoritesCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className={`p-3 transition-transform active:scale-90 ${shouldShowBg ? 'text-brand-primary' : 'text-white'}`}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-primary/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 flex flex-col pt-24 px-8 pb-12 md:hidden shadow-2xl"
            >
              <div className="flex flex-col gap-6">
                {menuItems.map((item, i) => (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (i * 0.1) }}
                    key={item.value}
                    onClick={() => {
                      onViewChange(item.value);
                      setIsOpen(false);
                    }}
                    className={`text-3xl font-serif text-left border-b border-gray-50 pb-4 flex justify-between items-center group ${
                      currentView === item.value ? 'text-brand-secondary' : 'text-brand-primary'
                    }`}
                  >
                    {item.label}
                    <ArrowRight size={20} className={`transition-transform ${currentView === item.value ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                  </motion.button>
                ))}
              </div>
              
              <div className="mt-auto space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-muted mb-4">Redes Sociais</p>
                  <div className="flex gap-4">
                     <a href="#" className="w-10 h-10 border border-gray-100 flex items-center justify-center rounded-none text-brand-primary hover:bg-brand-secondary hover:text-white transition-all"><Instagram size={18} /></a>
                     <a href="#" className="w-10 h-10 border border-gray-100 flex items-center justify-center rounded-none text-brand-primary hover:bg-brand-secondary hover:text-white transition-all"><Facebook size={18} /></a>
                  </div>
                </motion.div>

                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => {
                    onViewChange('listing');
                    setIsOpen(false);
                  }}
                  className="bg-brand-secondary text-white w-full py-5 rounded-none text-xs uppercase tracking-[0.2em] font-bold shadow-xl active:scale-95 transition-all"
                >
                  Explorar Imóveis
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = ({ onViewChange }: { onViewChange: (v: View) => void }) => {
  return (
    <footer className="bg-brand-primary text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center cursor-pointer mb-6" onClick={() => onViewChange('home')}>
              <img 
                src="/villasequa-logo.png" 
                alt="Villassequa Logo" 
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Líderes no mercado imobiliário do Algarve, proporcionando um serviço premium e personalizado para compradores e vendedores exigentes.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand-secondary transition-colors"><Instagram size={18} /></a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand-secondary transition-colors"><Facebook size={18} /></a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand-secondary transition-colors"><Linkedin size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-6">Links Rápidos</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><button onClick={() => onViewChange('home')} className="hover:text-white transition-colors">Início</button></li>
              <li><button onClick={() => onViewChange('listing')} className="hover:text-white transition-colors">Imóveis</button></li>
              <li><button onClick={() => onViewChange('services')} className="hover:text-white transition-colors">Serviços</button></li>
              <li><button onClick={() => onViewChange('about')} className="hover:text-white transition-colors">Sobre Nós</button></li>
              <li><button onClick={() => onViewChange('contact')} className="hover:text-white transition-colors">Contacto</button></li>
              <li><button onClick={() => onViewChange('favorites')} className="hover:text-white transition-colors">Favoritos</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-6">Serviços</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>Compra de Imóveis</li>
              <li>Venda e Avaliação</li>
              <li>Arrendamentos</li>
              <li>Gestão de Propriedades</li>
              <li>Investimento Imobiliário</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-6">Contacto</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-brand-secondary mt-1 shrink-0" />
                <span>Av. 5 de Outubro, 123<br />8000-001 Faro, Algarve</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-brand-secondary shrink-0" />
                <span>+351 289 123 456</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-brand-secondary shrink-0" />
                <span>geral@villassequa.pt</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Villassequa Imobiliária. Todos os direitos reservados.
          </p>
          <div className="flex space-x-8 text-xs text-white/40">
            <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos e Condições</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const PropertyCard = ({ property, onSelect, onToggleFavorite, isFav, ...props }: { 
  property: Property, 
  onSelect: (p: Property) => void,
  onToggleFavorite: (id: string) => void,
  isFav: boolean
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.5 }}
      className="group bg-white rounded-none overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      <div className="relative h-64 overflow-hidden">
        <motion.img 
          src={property.images[0]} 
          alt={property.title}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-4 left-4 flex gap-2">
          {property.featured && (
            <motion.span 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-brand-secondary text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider"
            >
              Destaque
            </motion.span>
          )}
          <span className="bg-white/90 backdrop-blur-sm text-brand-primary text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
            {property.status}
          </span>
        </div>

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(property.id);
          }}
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${isFav ? 'bg-brand-secondary text-white' : 'bg-white/70 text-brand-primary hover:bg-white'}`}
        >
          <Heart size={18} className={isFav ? 'fill-current' : ''} />
        </motion.button>

        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:block hidden transition-all duration-500 ease-out">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(property)}
            className="w-full bg-white text-brand-primary py-2.5 rounded-none text-sm font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-brand-secondary hover:text-white transition-colors"
          >
            Ver Detalhes <ArrowRight size={16} />
          </motion.button>
        </div>

        {/* Mobile Call to Action */}
        <div className="md:hidden absolute bottom-3 right-3">
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="bg-white/90 backdrop-blur-sm p-2 shadow-lg text-brand-primary"
          >
            <ArrowRight size={18} />
          </motion.div>
        </div>
      </div>

      <motion.div 
        className="p-6 cursor-pointer" 
        onClick={() => onSelect(property)}
        layout
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-brand-secondary text-sm font-semibold uppercase tracking-wider">{property.type}</span>
          <span className="text-xl font-bold text-brand-primary">
            {property.price.toLocaleString('pt-PT')} €
          </span>
        </div>
        <h3 className="text-lg font-serif font-bold mb-3 line-clamp-1 group-hover:text-brand-secondary transition-colors">
          {property.title}
        </h3>
        <div className="flex items-center text-brand-muted text-sm mb-4">
          <MapPin size={14} className="mr-1 text-brand-secondary" />
          {property.location}
        </div>
        
        <div className="grid grid-cols-3 border-t border-gray-100 pt-4 gap-1">
          <div className="flex items-center gap-1.5 text-brand-muted text-[10px] font-medium uppercase tracking-tight">
            <BedDouble size={14} className="text-brand-secondary shrink-0" />
            <span>{property.bedrooms > 0 ? `${property.bedrooms} Quartos` : '-'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-muted text-[10px] font-medium uppercase tracking-tight">
            <Bath size={14} className="text-brand-secondary shrink-0" />
            <span>{property.bathrooms > 0 ? `${property.bathrooms} Banhos` : '-'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-muted text-[10px] font-medium uppercase tracking-tight">
            <Maximize2 size={14} className="text-brand-secondary shrink-0" />
            <span>{property.area} m²</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Views ---

const HomeView = ({ onSelectProperty, onViewChange, onToggleFavorite, favorites }: { 
  onSelectProperty: (p: Property) => void,
  onViewChange: (v: View) => void,
  onToggleFavorite: (id: string) => void,
  favorites: string[]
}) => {
  const featured = mockProperties.filter(p => p.featured).slice(0, 3);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  
  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        <motion.div 
          style={{ y: heroY }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000" 
            alt="Villassequa Algarve Luxury"
            className="w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-brand-muted/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/60" />
        </motion.div>
        
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
        >
          <div className="max-w-4xl mx-auto text-center transition-all">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-[1.1] mb-10 md:mb-12 tracking-tight"
            >
              Procura casa <span className="text-brand-secondary italic font-normal">no Algarve?</span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center"
            >
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: '#D4C3A3' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange('listing')}
                className="bg-brand-secondary text-white px-8 md:px-12 py-5 rounded-none text-[10px] sm:text-xs uppercase tracking-[0.3em] font-bold shadow-2xl min-w-[200px] sm:min-w-[240px] transition-all"
              >
                Ver seleção
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange('contact')}
                className="bg-white/10 backdrop-blur-xl border border-white/30 text-white px-8 md:px-12 py-5 rounded-none text-[10px] sm:text-xs uppercase tracking-[0.3em] font-bold min-w-[200px] sm:min-w-[240px] transition-all"
              >
                Fale connosco
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Quick Search */}
      <section className="relative z-20 -mt-20 max-w-6xl mx-auto px-4 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white p-2 rounded-none shadow-2xl border border-gray-100 overflow-visible"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 items-center">
            <motion.div 
              whileHover={{ backgroundColor: '#F9FAFB' }}
              className="px-8 py-8 md:border-r border-gray-100 transition-colors cursor-pointer group"
            >
              <label className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary mb-3 block">Localização</label>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-gray-400 group-hover:text-brand-secondary transition-colors" />
                <span className="text-brand-primary font-medium">Todo o Algarve</span>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ backgroundColor: '#F9FAFB' }}
              className="px-8 py-8 md:border-r border-gray-100 transition-colors cursor-pointer group"
            >
              <label className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary mb-3 block">Tipo</label>
              <div className="flex items-center gap-2">
                <LayoutGrid size={18} className="text-gray-400 group-hover:text-brand-secondary transition-colors" />
                <span className="text-brand-primary font-medium">Moradias & Apar.</span>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ backgroundColor: '#F9FAFB' }}
              className="px-8 py-8 md:border-r border-gray-100 transition-colors cursor-pointer group"
            >
              <label className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary mb-3 block">Preço Máx.</label>
              <div className="flex items-center gap-2">
                <Euro size={18} className="text-gray-400 group-hover:text-brand-secondary transition-colors" />
                <span className="text-brand-primary font-medium">Qualquer valor</span>
              </div>
            </motion.div>
            <div className="p-4">
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: '#0c2e7a' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange('listing')}
                className="w-full bg-brand-primary text-white h-16 flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-lg"
              >
                <Search size={18} /> Pesquisar
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Confidence Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        className="py-32 bg-brand-accent/30 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-5xl md:text-6xl font-serif font-bold text-brand-primary mb-4 tracking-tighter">15+</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-bold">Anos de Experiência</p>
            </motion.div>
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-5xl md:text-6xl font-serif font-bold text-brand-primary mb-4 tracking-tighter">800+</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-bold">Imóveis Vendidos</p>
            </motion.div>
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-5xl md:text-6xl font-serif font-bold text-brand-primary mb-4 tracking-tighter">1.2k</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-bold">Clientes Felizes</p>
            </motion.div>
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="text-5xl md:text-6xl font-serif font-bold text-brand-primary mb-4 tracking-tighter">100%</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted font-bold">Transparência</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Featured Properties */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-xl"
            >
              <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Portefólio Premiado</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-primary tracking-tight">Imóveis em Destaque</h2>
            </motion.div>
            <motion.button 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange('listing')}
              className="group flex items-center gap-2 text-brand-primary font-bold hover:text-brand-secondary transition-all"
            >
              Ver Todas as Listagens <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <PropertyCard 
                  property={p} 
                  onSelect={onSelectProperty} 
                  onToggleFavorite={onToggleFavorite}
                  isFav={favorites.includes(p.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Selling Section */}
      <section className="py-24 bg-brand-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-secondary/10 -skew-x-12 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Vender o seu imóvel?</span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 leading-tight tracking-tight">
                Receba uma avaliação <span className="text-brand-secondary italic">gratuita</span> do seu imóvel em 24h.
              </h2>
              <p className="text-white/80 text-lg mb-10 leading-relaxed font-light">
                Sabemos o valor real do seu património. Utilizamos dados atualizados de mercado e a nossa vasta experiência local para garantir o melhor preço na venda.
              </p>
              <ul className="space-y-6 mb-12">
                {[
                  'Estratégia de Marketing Personalizada',
                  'Fotografia Profissional e Vídeo 4K',
                  'Filtragem Rigorosa de Compradores'
                ].map((item, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="flex items-center gap-4 text-white font-light text-lg"
                  >
                    <div className="bg-brand-secondary/20 p-1">
                      <CheckCircle2 className="text-brand-secondary" size={20} />
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: '#D4C3A3' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange('contact')}
                className="bg-brand-secondary text-white px-12 py-5 rounded-none font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl transition-all"
              >
                Solicitar Avaliação <ArrowRight size={18} />
              </motion.button>
            </motion.div>
            <div className="relative">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="relative z-10 rounded-none overflow-hidden shadow-2xl aspect-[4/5]"
              >
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000" 
                  alt="Serviço Premium"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: -30 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute -bottom-10 -left-10 bg-white p-10 rounded-none shadow-2xl max-w-xs md:block hidden z-20 border-l-4 border-brand-secondary"
              >
                <div className="flex gap-1 text-brand-secondary mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="text-brand-primary font-serif text-lg italic mb-6 leading-relaxed">
                  "Excederam todas as expetativas na venda da nossa moradia em Vilamoura."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-accent rounded-full flex items-center justify-center font-bold text-brand-primary">JS</div>
                  <div>
                    <div className="font-bold text-brand-primary text-sm uppercase tracking-wider">João Santos</div>
                    <div className="text-[10px] text-brand-muted uppercase tracking-widest">Proprietário</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Testemunhos</span>
          <h2 className="text-4xl font-serif font-bold text-brand-primary mb-12">O que dizem os nossos clientes</h2>
          
          <div className="relative p-12 bg-gray-50 rounded-3xl">
            <p className="text-xl md:text-2xl font-serif italic text-brand-primary leading-relaxed mb-8">
              "Comprar casa no Algarve parecia um desafio complexo até contactarmos a Villassequa. Sentimos que as nossas necessidades foram realmente ouvidas e o acompanhamento jurídico foi impecável."
            </p>
            <div>
              <div className="font-bold text-brand-primary uppercase tracking-widest">John & Sarah Miller</div>
              <div className="text-brand-secondary text-sm">Investidores internacionais</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact CTA */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-accent/30 p-12 rounded-none flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-brand-primary mb-4">Pronto para encontrar o seu lugar?</h2>
              <p className="text-gray-600 text-lg">A nossa equipa está disponível para o ajudar em cada passo do processo.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <a href="tel:+351289123456" className="bg-brand-primary text-white font-bold py-5 px-10 rounded-none flex items-center justify-center gap-3 shadow-lg hover:bg-brand-primary/90 transition-all whitespace-nowrap">
                <Phone size={20} /> +351 289 123 456
              </a>
              <button className="bg-white border border-brand-primary text-brand-primary font-bold py-5 px-10 rounded-none hover:bg-gray-50 transition-all">
                Falar com consultor
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  useEffect(() => {
    setFavorites(getFavorites());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProperty]);

  const handleToggleFavorite = (id: string) => {
    const newFavs = toggleFavorite(id);
    setFavorites(newFavs);
  };

  const handleSelectProperty = (p: Property) => {
    setSelectedProperty(p);
    setCurrentView('detail');
  };

  // Smooth Scroll Initialization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const handleViewChange = (v: View) => {
    setCurrentView(v);
    setSelectedProperty(null);
  };

  return (
    <div className="min-h-screen bg-white selection:bg-brand-secondary/30 md:cursor-none">
      <CustomCursor />
      <Navbar 
        onViewChange={handleViewChange} 
        currentView={currentView} 
        favoritesCount={favorites.length}
      />
      
      <AnimatePresence mode="wait">
        <motion.main 
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen"
        >
          {currentView === 'home' && (
            <HomeView 
              onSelectProperty={handleSelectProperty} 
              onViewChange={handleViewChange}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
            />
          )}

          {currentView === 'listing' && (
            <ListingView 
              onSelectProperty={handleSelectProperty}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
              initialFilters={searchFilters}
            />
          )}

          {currentView === 'detail' && selectedProperty && (
            <DetailView 
              property={selectedProperty}
              onToggleFavorite={handleToggleFavorite}
              isFav={favorites.includes(selectedProperty.id)}
              onViewChange={handleViewChange}
            />
          )}

          {currentView === 'favorites' && (
            <FavoritesView 
              onSelectProperty={handleSelectProperty}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
              onViewChange={handleViewChange}
            />
          )}

          {currentView === 'services' && (
            <ServicesView onViewChange={handleViewChange} />
          )}

          {currentView === 'about' && (
            <AboutView onViewChange={handleViewChange} />
          )}
          
          {currentView === 'contact' && (
            <ContactView properties={mockProperties} />
          )}
        </motion.main>
      </AnimatePresence>

      <Footer onViewChange={handleViewChange} />
    </div>
  );
}

// --- Placeholder for other views to keep App.tsx functional ---

const ListingView = ({ onSelectProperty, onToggleFavorite, favorites, initialFilters }: { 
  onSelectProperty: (p: Property) => void,
  onToggleFavorite: (id: string) => void,
  favorites: string[],
  initialFilters: SearchFilters
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  
  const filtered = mockProperties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'Todos' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-primary mb-4">Explorar Imóveis</h1>
          <p className="text-gray-500 max-w-2xl">Os melhores imóveis no Algarve. Use os filtros para encontrar a propriedade ideal para si.</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-none shadow-sm mb-12 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Localização ou referência..." 
              className="w-full pl-12 pr-4 py-4 sm:py-3 bg-gray-50 rounded-none outline-none border border-transparent focus:border-brand-secondary transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <select 
              className="flex-1 sm:flex-none px-6 py-4 sm:py-3 bg-gray-50 rounded-none border border-transparent focus:border-brand-secondary outline-none cursor-pointer text-sm font-bold uppercase tracking-widest"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option>Todos</option>
              <option>Apartamento</option>
              <option>Vivenda</option>
              <option>Terreno</option>
              <option>Comercial</option>
            </select>
          </div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 sm:border-l border-gray-100 sm:pl-4 flex items-center justify-center sm:justify-start">
            {filtered.length} resultados
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, index) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <PropertyCard 
                  property={p} 
                  onSelect={onSelectProperty} 
                  onToggleFavorite={onToggleFavorite}
                  isFav={favorites.includes(p.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const DetailView = ({ property, onToggleFavorite, isFav, onViewChange }: { 
  property: Property, 
  onToggleFavorite: (id: string) => void,
  isFav: boolean,
  onViewChange: (v: View) => void
}) => {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => onViewChange('listing')}
          className="flex items-center gap-2 text-brand-primary mb-8 hover:text-brand-secondary transition-colors font-semibold"
        >
          <ArrowRight size={20} className="rotate-180" /> Voltar à Listagem
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="relative rounded-none overflow-hidden mb-10 group bg-gray-100 shadow-xl">
               <img 
                src={property.images[0]} 
                alt={property.title} 
                className="w-full h-auto aspect-video object-cover"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 border-b border-gray-100 pb-12">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-brand-primary mb-4 leading-tight">
                  {property.title}
                </h1>
                <div className="flex items-center text-brand-muted text-sm uppercase tracking-widest font-bold">
                  <MapPin size={16} className="mr-2 text-brand-secondary" />
                  {property.location}
                </div>
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleFavorite(property.id)}
                className={`p-5 rounded-none border transition-all shadow-lg ${isFav ? 'bg-brand-secondary border-brand-secondary text-white' : 'border-gray-200 text-brand-primary hover:border-brand-primary'}`}
              >
                <Heart size={28} className={isFav ? 'fill-current' : ''} />
              </motion.button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-10 bg-gray-50 rounded-none mb-16 border border-gray-100">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary">Preço</span>
                <span className="text-2xl font-bold text-brand-primary leading-none">{property.price.toLocaleString('pt-PT')} €</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary">Área Útil</span>
                <span className="text-2xl font-bold text-brand-primary leading-none">{property.area} m²</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary">Quartos</span>
                <span className="text-2xl font-bold text-brand-primary leading-none">{property.bedrooms}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary">Referência</span>
                <span className="text-2xl font-bold text-brand-primary leading-none">#{property.id}A</span>
              </div>
            </div>

            <div className="mb-16">
              <h3 className="text-2xl font-serif font-bold mb-8 border-l-4 border-brand-secondary pl-6">Descrição</h3>
              <p className="text-gray-600 leading-relaxed text-lg font-light">
                {property.description}
              </p>
            </div>

            <div className="mb-16">
              <h3 className="text-2xl font-serif font-bold mb-8 border-l-4 border-brand-secondary pl-6">Características</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {property.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-5 bg-white border border-gray-100 rounded-none shadow-sm transition-all hover:bg-gray-50">
                    <CheckCircle2 size={18} className="text-brand-secondary" />
                    <span className="text-sm font-medium text-brand-primary uppercase tracking-wider">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <div className="bg-brand-primary p-8 md:p-12 rounded-none text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/10 -translate-y-1/2 translate-x-1/2 rotate-45" />
                <h3 className="text-3xl font-serif font-bold mb-8 relative z-10">Solicitar Informações</h3>
                <form className="space-y-6 relative z-10" onSubmit={(e) => {
                  e.preventDefault();
                  alert('Mensagem enviada com sucesso! A nossa equipa entrará em contacto brevemente.');
                }}>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Imóvel de Interesse</label>
                    <input 
                      type="text" 
                      value={property.title}
                      readOnly
                      className="w-full bg-white/5 border border-white/10 rounded-none p-4 text-gray-400 outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Nome Completo" 
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-none p-4 placeholder:text-gray-400 outline-none focus:border-brand-secondary transition-all"
                    />
                  </div>
                  <div>
                    <input 
                      type="email" 
                      placeholder="Email" 
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-none p-4 placeholder:text-gray-400 outline-none focus:border-brand-secondary transition-all"
                    />
                  </div>
                  <div>
                    <input 
                      type="tel" 
                      placeholder="Telefone" 
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-none p-4 placeholder:text-gray-400 outline-none focus:border-brand-secondary transition-all"
                    />
                  </div>
                  <div>
                    <textarea 
                      rows={4}
                      placeholder="Tenho interesse neste imóvel..." 
                      className="w-full bg-white/10 border border-white/20 rounded-none p-4 placeholder:text-gray-400 outline-none focus:border-brand-secondary transition-all resize-none"
                    />
                  </div>
                  <button className="w-full bg-brand-secondary text-white py-5 rounded-none font-bold text-lg hover:shadow-xl hover:shadow-brand-secondary/20 transition-all flex items-center justify-center gap-2">
                    Marcar Visita <ChevronRight size={20} />
                  </button>
                  <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest leading-loose">
                    Ao enviar, concorda com a nossa política de privacidade.
                  </p>
                </form>
              </div>
              
              <div className="mt-8 p-6 sm:p-8 border border-gray-100 rounded-none bg-gray-50 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                <div className="w-20 h-20 rounded-full bg-brand-accent overflow-hidden border-2 border-white shadow-md">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" alt="Consultor" className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-bold text-brand-primary text-lg">Ricardo Viseu</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary mb-3">Consultor Sénior Algarve</div>
                  <a href="tel:+351912345678" className="bg-white px-6 py-3 border border-gray-100 shadow-sm text-brand-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary hover:text-white transition-all">
                    <Phone size={14} /> +351 912 345 678
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FavoritesView = ({ onSelectProperty, onToggleFavorite, favorites, onViewChange }: { 
  onSelectProperty: (p: Property) => void,
  onToggleFavorite: (id: string) => void,
  favorites: string[],
  onViewChange: (v: View) => void
}) => {
  const favoriteProperties = mockProperties.filter(p => favorites.includes(p.id));

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-primary mb-4">Os Meus Favoritos</h1>
          <p className="text-gray-500 max-w-2xl">Os imóveis que guardou para ver com mais calma.</p>
        </div>

        {favoriteProperties.length === 0 ? (
          <div className="bg-gray-50 rounded-none p-12 sm:p-24 text-center border border-gray-200">
            <Heart size={48} className="mx-auto text-gray-200 mb-8" />
            <h3 className="text-3xl font-serif font-bold mb-6">Ainda sem favoritos</h3>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-light leading-relaxed">Comece a explorar o nosso portefólio e guarde aqui as casas dos seus sonhos para as encontrar mais facilmente.</p>
            <button 
              onClick={() => onViewChange('listing')}
              className="bg-brand-primary text-white px-12 py-5 rounded-none text-xs uppercase tracking-[0.2em] font-bold hover:bg-brand-secondary transition-all shadow-xl"
            >
              Explorar Imóveis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {favoriteProperties.map((p, index) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <PropertyCard 
                    property={p} 
                    onSelect={onSelectProperty} 
                    onToggleFavorite={onToggleFavorite}
                    isFav={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const ContactView = ({ properties }: { properties: Property[] }) => {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Fale Connosco</span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-primary mb-8">Estamos Aqui Para o Ajudar</h1>
          <p className="text-brand-muted text-lg leading-relaxed">Tem alguma questão sobre um imóvel ou gostaria de uma avaliação? A nossa equipa de especialistas está pronta para responder.</p>
        </div>

        <div className="flex flex-col items-center gap-16">
          <div className="space-y-12 w-full max-w-4xl">
            <div className="text-center">
              <h3 className="text-2xl font-serif font-bold text-brand-primary mb-6">Informações de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-none border border-gray-100 h-full">
                  <div className="w-16 h-16 bg-white flex items-center justify-center text-brand-secondary shadow-sm mb-4">
                    <MapPin size={28} />
                  </div>
                  <div>
                    <div className="font-bold text-brand-primary mb-2">O Nosso Escritório</div>
                    <div className="text-brand-muted text-sm px-4">Av. 5 de Outubro, 123, 8000-001 Faro, Algarve</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-none border border-gray-100 h-full">
                  <div className="w-16 h-16 bg-white flex items-center justify-center text-brand-secondary shadow-sm mb-4">
                    <Phone size={28} />
                  </div>
                  <div>
                    <div className="font-bold text-brand-primary mb-2">Telefone</div>
                    <div className="text-brand-muted text-sm">+351 289 123 456</div>
                    <div className="text-brand-muted/60 text-xs mt-2">Segunda a Sexta, 09h - 18h</div>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-none border border-gray-100 h-full">
                  <div className="w-16 h-16 bg-white flex items-center justify-center text-brand-secondary shadow-sm mb-4">
                    <Mail size={28} />
                  </div>
                  <div>
                    <div className="font-bold text-brand-primary mb-2">Email</div>
                    <div className="text-brand-muted text-sm">geral@villassequa.pt</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto w-full text-center">
              <h3 className="text-2xl font-serif font-bold text-brand-primary mb-6">Horário de Funcionamento</h3>
              <div className="bg-brand-primary p-8 text-white rounded-none">
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span>Segunda — Sexta</span>
                  <span className="font-bold">09:00 - 18:30</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span>Sábado</span>
                  <span className="font-bold">10:00 - 13:00</span>
                </div>
                <div className="flex justify-between py-3">
                  <span>Domingo</span>
                  <span className="text-white/40 italic">Encerrado</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-16 border border-gray-100 shadow-2xl rounded-none w-full max-w-4xl">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-serif font-bold text-brand-primary mb-8">Envie uma Mensagem</h3>
              <form className="space-y-6 text-left" onSubmit={(e) => {
              e.preventDefault();
              alert('Obrigado pelo seu contacto! Responderemos com a maior brevidade possível.');
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Nome</label>
                  <input type="text" placeholder="O seu nome" required className="w-full bg-gray-50 border border-transparent p-4 rounded-none outline-none focus:border-brand-secondary transition-all" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Email</label>
                  <input type="email" placeholder="seu@email.com" required className="w-full bg-gray-50 border border-transparent p-4 rounded-none outline-none focus:border-brand-secondary transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Assunto</label>
                <select className="w-full bg-gray-50 border border-transparent p-4 rounded-none outline-none focus:border-brand-secondary transition-all cursor-pointer appearance-none">
                  <option>Informações Gerais</option>
                  <option>Agendar Visita</option>
                  <option>Avaliação de Imóvel</option>
                  <option>Investimento</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Imóvel de Interesse (Opcional)</label>
                <div className="relative">
                  <select className="w-full bg-gray-50 border border-transparent p-4 rounded-none outline-none focus:border-brand-secondary transition-all cursor-pointer appearance-none text-brand-primary">
                    <option value="">Selecione um imóvel...</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.title}>{p.title} - {p.price.toLocaleString('pt-PT')} €</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted">
                    <ChevronRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Mensagem</label>
                <textarea rows={6} placeholder="Como podemos ajudar?" required className="w-full bg-gray-50 border border-transparent p-4 rounded-none outline-none focus:border-brand-secondary transition-all resize-none"></textarea>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: '#D4C3A3' }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-brand-primary text-white py-5 rounded-none font-bold text-sm uppercase tracking-[0.2em] hover:bg-brand-secondary transition-all shadow-lg"
              >
                Enviar Mensagem
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

const ServicesView = ({ onViewChange }: { onViewChange: (v: View) => void }) => {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Nossa Especialidade</span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-primary mb-8 px-4">Soluções Imobiliárias de Excelência</h1>
          <p className="text-brand-muted text-lg leading-relaxed px-4">Mais do que mediadores, somos os seus parceiros estratégicos no mercado imobiliário do Algarve.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white p-12 rounded-none border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <h3 className="text-3xl font-serif font-bold mb-6">Compra de Imóveis</h3>
            <p className="text-brand-muted mb-10 leading-relaxed">Acompanhamento total desde a pesquisa até à escritura. Seleção personalizada com base no seu estilo de vida e objetivos de investimento.</p>
            <button onClick={() => onViewChange('listing')} className="text-brand-primary font-bold flex items-center gap-2 group-hover:text-brand-secondary transition-colors">
              Explorar Ofertas <ArrowRight size={20} />
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-brand-primary p-12 rounded-none text-white shadow-xl hover:shadow-2xl transition-all group"
          >
            <h3 className="text-3xl font-serif font-bold mb-6">Venda de Imóveis</h3>
            <p className="text-gray-400 mb-10 leading-relaxed">Estratégia de marketing global, fotografia profissional e avaliação precisa para garantir o valor máximo de mercado.</p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
               <div className="flex gap-2">
                 <input type="text" placeholder="Localização do seu imóvel" className="flex-1 bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm focus:border-brand-secondary outline-none transition-all" />
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="bg-brand-secondary text-white px-6 py-3 rounded-none font-bold text-sm"
                 >
                   Pedir Avaliação
                 </motion.button>
               </div>
            </form>
          </motion.div>
          
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, delay: 0.4 }}
             className="bg-gray-50 p-12 rounded-none border border-gray-100 group"
           >
            <h3 className="text-3xl font-serif font-bold mb-6">Arrendamento</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">Gestão profissional e mediação de arrendamentos de curta e longa duração com máxima rentabilidade e segurança jurídica.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white p-12 rounded-none border border-gray-100 shadow-sm group"
          >
            <h3 className="text-3xl font-serif font-bold mb-6">Avaliação de Imóveis</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">Relatórios detalhados baseados em métricas reais e comparativos de mercado. Essencial para tomadas de decisão inteligentes.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const AboutView = ({ onViewChange }: { onViewChange: (v: View) => void }) => {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Nossa História</span>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-primary mb-8 px-0">Confiança, Proximidade, Resultados.</h1>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                A Villassequa nasceu da paixão pelo mercado imobiliário algarvio e da necessidade de oferecer um serviço verdadeiramente premium, onde o cliente não é apenas mais um número, mas sim o centro de toda a operação.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-10">
                Com sede no coração do Algarve, a nossa equipa combina décadas de conhecimento local com uma visão moderna e tecnológica do negócio imobiliário internacional.
              </p>
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-accent/30 rounded-full flex items-center justify-center text-brand-primary">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="font-bold">Honestidade</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-accent/30 rounded-full flex items-center justify-center text-brand-primary">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="font-bold">Rigor</span>
                </div>
                 <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-accent/30 rounded-full flex items-center justify-center text-brand-primary">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="font-bold">Excelência</span>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000" 
                alt="Sobre Villassequa"
                className="rounded-none shadow-2xl"
              />
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -bottom-10 -right-10 bg-brand-secondary p-10 rounded-none text-white shadow-2xl md:block hidden"
              >
                <span className="text-5xl font-serif font-bold block mb-2">15</span>
                <span className="text-xs uppercase tracking-[0.2em] font-bold">Anos de Excelência</span>
              </motion.div>
            </motion.div>
          </div>

        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-brand-primary mb-12">A Nossa Equipa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { name: 'Ana Villassequa', role: 'Fundadora & CEO', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
              { name: 'Ricardo Viseu', role: 'Consultor Sénior', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
              { name: 'Sofia Mendes', role: 'Coordenadora de Marketing', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400' }
            ].map((member, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-none mb-6 grayscale hover:grayscale-0 transition-all duration-700">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3 className="text-xl font-serif font-bold text-brand-primary mb-1">{member.name}</h3>
                <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-brand-primary p-12 md:p-24 rounded-none text-center text-white">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-8">Quer fazer parte da nossa história?</h2>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">Estamos sempre à procura de talentos apaixonados pelo mercado imobiliário e pelo Algarve.</p>
          <button onClick={() => onViewChange('services')} className="bg-brand-secondary text-white px-12 py-5 rounded-none font-bold text-lg shadow-xl hover:shadow-brand-secondary/20 transition-all">
            Falar connosco
          </button>
        </div>
      </div>
    </div>
  );
};

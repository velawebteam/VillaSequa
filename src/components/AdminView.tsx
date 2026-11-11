import React, { useState, useEffect, useRef } from 'react';
import { Property, View, NewsletterTemplate, PROPERTY_FEATURES, ENERGY_RATES } from '../types';
import { getProperties, addProperty, deleteProperty, deleteAllProperties, toggleFeaturedProperty, parsePropertiesXml, saveProperties, exportPropertiesToXml } from '../lib/propertyStore';
import { mockProperties } from '../data/mockProperties';
import { 
  Building2, 
  Lock, 
  User, 
  PlusCircle, 
  List, 
  Upload, 
  Download,
  Trash2, 
  Star, 
  LogOut, 
  Check, 
  ArrowLeft,
  FileCode,
  AlertCircle,
  ImagePlus,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  addPropertyToFirestore, 
  updatePropertyInFirestore, 
  deletePropertyFromFirestore, 
  getPropertiesFromFirestore, 
  deleteAllPropertiesFromFirestore,
  addClientToFirestore,
  getClientsFromFirestore,
  deleteClientFromFirestore,
  getLeadsFromFirestore,
  deleteLeadFromFirestore
} from '../lib/firestoreService';
import { Client, Lead } from '../types';
import { uploadImage } from '../lib/storageService';
import { getWebsiteConfig, updateWebsiteConfig, WebsiteConfig } from '../lib/websiteService';
import { 
  getTemplates, 
  addTemplate, 
  updateTemplate, 
  deleteTemplate, 
  logSentNewsletter 
} from '../lib/newsletterService';


import { 
  Type, 
  Settings, 
  Layout, 
  Palette,
  ExternalLink,
  Save,
  RotateCcw,
  AlignLeft,
  Image as ImageIcon,
  Users,
  Mail as MailIcon,
  Briefcase,
  UserPlus,
  MapPin,
  ArrowRight,
  Euro,
  Phone,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminViewProps {
  onViewChange: (v: View) => void;
  onPropertiesChange: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onViewChange, onPropertiesChange }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [sidebarTab, setSidebarTab] = useState<'imoveis' | 'website' | 'clientes' | 'leads' | 'matching' | 'newsletter'>('imoveis');
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'sync' | 'export' | 'edit' | 'venda' | 'arrendamento' | 'construcao' | 'rascunho' | 'xml'>('add');
  const [prevTab, setPrevTab] = useState<typeof activeTab>('list');
  const [xmlSubTab, setXmlSubTab] = useState<'import' | 'export'>('import');
  const [clientesTab, setClientesTab] = useState<'list' | 'leads' | 'add'>('list');
  const [websitePage, setWebsitePage] = useState<'home' | 'about' | 'services' | 'contact'>('home');
  const [websiteSection, setWebsiteSection] = useState<string>('hero');
  const [previewMode, setPreviewMode] = useState<'editor' | 'split'>('split');
  const [leadsSubTab, setLeadsSubTab] = useState<'info' | 'evaluation' | 'contact' | 'newsletter'>('info');
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [newsletterTab, setNewsletterTab] = useState<'create' | 'list' | 'send'>('list');
  const [editingTemplate, setEditingTemplate] = useState<NewsletterTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templatePreheader, setTemplatePreheader] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedPropIds, setSelectedPropIds] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<NewsletterTemplate | null>(null);



  // Website Config State
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>({});
  const [liveConfig, setLiveConfig] = useState<WebsiteConfig>({});
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');

  // Add Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [location, setLocation] = useState('');
  const [type, setType] = useState<Property['type'] | ''>('Vivenda');
  const [status, setStatus] = useState<Property['status'] | ''>('Novo');
  const [commercialStatus, setCommercialStatus] = useState<Property['commercialStatus'] | ''>('disponível');
  const [publicationStatus, setPublicationStatus] = useState<Property['publicationStatus'] | ''>('publicado');
  const [category, setCategory] = useState<Property['category']>('venda');
  const [bedrooms, setBedrooms] = useState('0');
  const [bathrooms, setBathrooms] = useState('0');
  const [area, setArea] = useState('0');
  const [grossArea, setGrossArea] = useState('0');
  const [landArea, setLandArea] = useState('0');
  const [videoUrl, setVideoUrl] = useState('');
  const [coords, setCoords] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Property['visibility']>('visível');
  const [isFeatured, setIsFeatured] = useState(false);
  const [reference, setReference] = useState('');
  const [isManualReference, setIsManualReference] = useState(false);
  const [energyRate, setEnergyRate] = useState<Property['energyRate'] | ''>('');
  const [editCoords, setEditCoords] = useState('');
  const [navHistory, setNavHistory] = useState<{s: typeof sidebarTab, a: typeof activeTab}[]>([]);
  const prevNavRef = useRef({s: sidebarTab, a: activeTab});
  const isBackNavRef = useRef(false);

  useEffect(() => {
    if (isBackNavRef.current) {
      isBackNavRef.current = false;
      prevNavRef.current = {s: sidebarTab, a: activeTab};
      return;
    }

    if (prevNavRef.current.s !== sidebarTab || prevNavRef.current.a !== activeTab) {
      const p = prevNavRef.current;
      setNavHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && last.s === p.s && last.a === p.a) return prev;
        return [...prev, p];
      });
      prevNavRef.current = {s: sidebarTab, a: activeTab};
    }
  }, [sidebarTab, activeTab]);

  const handleGoBack = () => {
    if (navHistory.length > 0) {
      const last = navHistory[navHistory.length - 1];
      setNavHistory(prev => prev.slice(0, -1));
      isBackNavRef.current = true;
      setSidebarTab(last.s);
      setActiveTab(last.a);
    } else {
      navigate(-1);
    }
  };

  // Function to auto-generate reference based on location initials and count
  const generateReference = (loc: string, isEdit: boolean = false) => {
    if (loc.trim()) {
      const cleanLocation = loc.trim().replace(/[,.-]/g, '');
      const words = cleanLocation.split(/\s+/).filter(Boolean);
      let initials = '';
      
      if (words.length > 1) {
        // Multiple words: take initials of up to 3 words
        initials = words.map(word => word[0]).join('').toUpperCase().slice(0, 3);
      } else if (words.length === 1) {
        // Single word: take first 3 letters
        initials = words[0].slice(0, 3).toUpperCase();
      }
      
      const count = (properties.length + 1).toString().padStart(3, '0');
      const newRef = `${initials}${count}`;
      
      if (isEdit && editingProperty) {
        setEditingProperty({...editingProperty, reference: newRef});
      } else {
        setReference(newRef);
      }
    }
  };
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Client Form State
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientInterest, setClientInterest] = useState<Client['interest']>('compra');
  const [clientSaving, setClientSaving] = useState(false);

  // XML Sync state
  const [xmlInput, setXmlInput] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');

  // Filters state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchRef, setSearchRef] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFeatures, setFilterFeatures] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'imo' && password === '12345') {
      const [allProps, config, allClients, allLeads, allTemplates] = await Promise.all([
        getPropertiesFromFirestore(),
        getWebsiteConfig(),
        getClientsFromFirestore(),
        getLeadsFromFirestore(),
        getTemplates()
      ]);
      setProperties(allProps);
      setWebsiteConfig({}); // Start with empty fields for "changes"
      setLiveConfig(config);
      setClients(allClients);
      setLeads(allLeads);
      setTemplates(allTemplates);

      setIsLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !status || !commercialStatus || !publicationStatus) {
      alert('Por favor, preencha Tipo, Estado, Estado Comercial e Estado de Publicação.');
      return;
    }
    setUploading(true);
    try {
      console.log('Adding property to Firestore...', { title, price, location });
      const savedProp = await addPropertyToFirestore({
        title,
        description,
        price: parseFloat(price) || 350000,
        location,
        type: type as Property['type'],
        status: status as Property['status'],
        commercialStatus: commercialStatus as Property['commercialStatus'],
        publicationStatus: publicationStatus as Property['publicationStatus'],
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseInt(bathrooms) || 0,
        area: parseFloat(area) || 0,
        grossArea: parseFloat(grossArea) || 0,
        landArea: parseFloat(landArea) || 0,
        videoUrl,
        coordinates: (() => {
          const parts = coords.split(',').map(v => parseFloat(v.trim()));
          return { lat: parts[0] || 0, lng: parts[1] || 0 };
        })(),
        images: uploadedImages,
        features: selectedFeatures,
        featured: isFeatured,
        category,
        reference,
        energyRate: energyRate as Property['energyRate'],
        priceOnRequest,
        visibility
      });
      console.log('Property saved successfully:', savedProp.id);
      const allProps = await getPropertiesFromFirestore();
      setProperties(allProps);
      onPropertiesChange();
      setSuccessMsg(`Imóvel "${savedProp.title}" publicado com sucesso!`);
      
      // Reset form only on success
      setTitle('');
      setDescription('');
      setPrice('');
      setPriceOnRequest(false);
      setLocation('');
      setReference('');
      setIsManualReference(false);
      setType('');
      setStatus('');
      setCommercialStatus('');
      setPublicationStatus('');
      setCategory('venda');
      setBedrooms('');
      setBathrooms('');
      setArea('');
      setGrossArea('');
      setLandArea('');
      setVideoUrl('');
      setCoords('');
      setEnergyRate('');
      setSelectedFeatures([]);
      setUploadedImages([]);
      setIsFeatured(false);
      setVisibility('visível');

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error in handleAddSubmit:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('ERRO AO PUBLICAR IMÓVEL: ' + errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Deseja carregar os imóveis de exemplo para a base de dados?')) return;
    setIsSeeding(true);
    try {
      for (const prop of mockProperties) {
        await addPropertyToFirestore(prop);
      }
      const allProps = await getPropertiesFromFirestore();
      setProperties(allProps);
      onPropertiesChange();
      alert('Imóveis de exemplo carregados com sucesso!');
    } catch (err) {
      alert('Erro ao carregar dados de exemplo.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar este imóvel?')) {
      await deletePropertyFromFirestore(id);
      const allProps = await getPropertiesFromFirestore();
      setProperties(allProps);
      onPropertiesChange();
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('ATENÇÃO: Tem a certeza absoluta que deseja ELIMINAR TODOS OS IMÓVEIS do site? Esta ação não pode ser desfeita.')) {
      await deleteAllPropertiesFromFirestore();
      setProperties([]);
      onPropertiesChange();
      alert('Todos os imóveis foram eliminados com sucesso.');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;
    await updatePropertyInFirestore(id, { featured: !prop.featured });
    const allProps = await getPropertiesFromFirestore();
    setProperties(allProps);
    onPropertiesChange();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = parsePropertiesXml(content);
          if (parsed.length > 0) {
            const savePromises = parsed.map(p => addPropertyToFirestore(p));
            Promise.all(savePromises).then(async () => {
              const allProps = await getPropertiesFromFirestore();
              setProperties(allProps);
              onPropertiesChange();
              setSyncSuccess(`Sincronização bem sucedida! ${parsed.length} imóveis importados do CRM.`);
            });
          } else {
            alert('Nenhum imóvel encontrado no XML.');
          }
        } catch (err) {
          alert('Erro ao processar o ficheiro XML.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleXmlTextSync = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = parsePropertiesXml(xmlInput);
      if (parsed.length > 0) {
        const savePromises = parsed.map(p => addPropertyToFirestore(p));
        Promise.all(savePromises).then(async () => {
          const allProps = await getPropertiesFromFirestore();
          setProperties(allProps);
          onPropertiesChange();
          setSyncSuccess(`Sincronização bem sucedida! ${parsed.length} imóveis importados.`);
          setXmlInput('');
        });
      } else {
        alert('Nenhum imóvel válido detetado no XML.');
      }
    } catch (err) {
      alert('Erro ao analisar o texto XML.');
    }
  };

  const handleDownloadXml = () => {
    const xmlData = exportPropertiesToXml(properties);
    const blob = new Blob([xmlData], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `imoveis_export_${new Date().toISOString().slice(0, 10)}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveConfig = async () => {
    setIsConfigLoading(true);
    try {
      await updateWebsiteConfig(websiteConfig);
      const updatedConfig = { ...liveConfig, ...websiteConfig };
      setLiveConfig(updatedConfig);
      setWebsiteConfig({}); // Clear change fields after success
      onPropertiesChange();
      setConfigSuccess('Configurações guardadas com sucesso!');
      setTimeout(() => setConfigSuccess(''), 3000);
    } catch (err) {
      console.error('Error in handleSaveConfig:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('ERRO AO GUARDAR CONFIGURAÇÕES: ' + errorMsg);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientSaving(true);
    try {
      await addClientToFirestore({
        firstName: clientFirstName,
        lastName: clientLastName,
        phone: clientPhone,
        email: clientEmail,
        interest: clientInterest
      });
      const allClients = await getClientsFromFirestore();
      setClients(allClients);
      setClientFirstName('');
      setClientLastName('');
      setClientPhone('');
      setClientEmail('');
      setClientInterest('compra');
      setClientesTab('list');
      alert('Cliente adicionado com sucesso!');
    } catch (err) {
      alert('Erro ao adicionar cliente.');
    } finally {
      setClientSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar este cliente?')) {
      await deleteClientFromFirestore(id);
      const allClients = await getClientsFromFirestore();
      setClients(allClients);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar este lead?')) {
      await deleteLeadFromFirestore(id);
      const allLeads = await getLeadsFromFirestore();
      setLeads(allLeads);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: templateName,
          subject: templateSubject,
          preheader: templatePreheader,
          content: templateContent
        });
        alert('Modelo atualizado com sucesso!');
      } else {
        await addTemplate({
          name: templateName,
          subject: templateSubject,
          preheader: templatePreheader,
          content: templateContent
        });
        alert('Modelo criado com sucesso!');
      }
      const allTemplates = await getTemplates();
      setTemplates(allTemplates);
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateSubject('');
      setTemplatePreheader('');
      setTemplateContent('');
    } catch (err) {
      alert('Erro ao guardar modelo.');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Eliminar este modelo permanentemente?')) {
      await deleteTemplate(id);
      const allTemplates = await getTemplates();
      setTemplates(allTemplates);
    }
  };

  const handleSendNewsletter = async () => {
    if (!selectedTemplateId) return alert('Selecione um modelo.');
    if (selectedLeadIds.length === 0) return alert('Selecione pelo menos um destinatário.');
    
    setIsSending(true);
    try {
      const recipientEmails = leads
        .filter(l => selectedLeadIds.includes(l.id))
        .map(l => l.email);

      await logSentNewsletter({
        templateId: selectedTemplateId,
        propertyIds: selectedPropIds,
        recipientEmails
      });

      alert(`Newsletter enviada com sucesso para ${recipientEmails.length} contactos!`);
      setSelectedPropIds([]);
      setSelectedLeadIds([]);
      setSelectedTemplateId('');
      setNewsletterTab('templates');
    } catch (err) {
      alert('Erro ao enviar newsletter.');
    } finally {
      setIsSending(false);
    }
  };


  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white max-w-md w-full p-8 md:p-12 shadow-2xl rounded-none"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-brand-primary text-brand-secondary rounded-full mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-brand-primary">Painel de Administração</h1>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-2">Área Reservada</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-600 mb-2 block">Utilizador</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                  placeholder="Utilizador..."
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-600 mb-2 block">Palavra-passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3">
                <AlertCircle size={16} /> Utilizador ou palavra-passe incorretos.
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-brand-primary text-white py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-brand-primary/95 transition-all shadow-lg"
            >
              Entrar no Sistema
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-xs text-gray-500 hover:text-brand-primary flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft size={14} /> Sair do BackOffice
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-primary text-white flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="text-brand-secondary" size={24} />
            <span className="font-serif font-bold text-lg tracking-tight">Admin<span className="text-brand-secondary italic">Panel</span></span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Gestão Premium</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="pb-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold px-4">Menu Principal</div>
          
          <button 
            onClick={() => setSidebarTab('imoveis')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-none ${sidebarTab === 'imoveis' ? 'bg-brand-secondary text-white shadow-lg' : 'hover:bg-white/5 text-white/70'}`}
          >
            <Building2 size={18} /> Imóveis
          </button>

          <button 
            onClick={() => setSidebarTab('website')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-none ${sidebarTab === 'website' ? 'bg-brand-secondary text-white shadow-lg' : 'hover:bg-white/5 text-white/70'}`}
          >
            <Layout size={18} /> Website
          </button>

          <button 
            onClick={() => setSidebarTab('clientes')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-none ${sidebarTab === 'clientes' ? 'bg-brand-secondary text-white shadow-lg' : 'hover:bg-white/5 text-white/70'}`}
          >
            <Users size={18} /> Clientes
          </button>

          <button 
            onClick={() => setSidebarTab('leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-none ${sidebarTab === 'leads' ? 'bg-brand-secondary text-white shadow-lg' : 'hover:bg-white/5 text-white/70'}`}
          >
            <MailIcon size={18} /> Leads
          </button>

          <button 
            onClick={() => setSidebarTab('matching')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-none ${sidebarTab === 'matching' ? 'bg-brand-secondary text-white shadow-lg' : 'hover:bg-white/5 text-white/70'}`}
          >
            <Star size={18} /> Matching
          </button>

          <button 
            onClick={() => setSidebarTab('newsletter')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-none ${sidebarTab === 'newsletter' ? 'bg-brand-secondary text-white shadow-lg' : 'hover:bg-white/5 text-white/70'}`}
          >
            <MailIcon size={18} /> Newsletter
          </button>


          <div className="pt-6 pb-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold px-4">Sistema</div>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all text-white/70 hover:bg-white/5"
          >
            <ExternalLink size={18} /> Sair do BackOffice
          </button>


        </nav>

        <div className="p-6 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-secondary rounded-full flex items-center justify-center font-bold text-brand-primary text-xs">V</div>
            <div>
              <p className="text-xs font-bold truncate">vela.web.team</p>
              <p className="text-[9px] text-white/40 uppercase tracking-tighter">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-400 hover:text-brand-primary transition-colors group mr-2"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Voltar</span>
            </button>
            <div className="h-6 w-[1px] bg-gray-200 mr-2"></div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
              {sidebarTab === 'imoveis' ? 'Gestão de Imóveis' : 'Personalização do Website'}
            </h2>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <p className="text-sm font-bold text-brand-primary">
              {sidebarTab === 'imoveis' 
                ? (activeTab === 'add' ? 'Adicionar Novo' : 
                   activeTab === 'list' ? 'Todos os Imóveis' : 
                   activeTab === 'venda' ? 'Compra/Venda' : 
                   activeTab === 'arrendamento' ? 'Arrendamento' : 
                   activeTab === 'construcao' ? 'Nova Construção' : 
                   activeTab === 'sync' ? 'Sincronização CRM' : 
                   activeTab === 'export' ? 'Exportação' : 'Editar Imóvel')
                : sidebarTab === 'leads' ? 'Gestão de Leads'
                : sidebarTab === 'matching' ? 'Matching Inteligente'
                : sidebarTab === 'clientes' ? 'Base de Dados de Clientes'
                : `Website > ${websitePage.charAt(0).toUpperCase() + websitePage.slice(1)} > ${websiteSection.charAt(0).toUpperCase() + websiteSection.slice(1)}`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {sidebarTab === 'website' && (
              <button 
                onClick={handleSaveConfig}
                disabled={isConfigLoading}
                className="bg-brand-secondary text-white px-6 py-3 text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-brand-secondary/90 transition-all shadow-xl disabled:opacity-50"
              >
                {isConfigLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Publicar Alterações no Site
              </button>
            )}
            <div className="bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              v2.5.0
            </div>
          </div>
        </header>

        <div className="p-8">
          {sidebarTab === 'imoveis' && (
            <>
              {/* Tab Navigation for Imoveis */}
              <div className="flex border-b border-gray-200 mb-8 bg-white shadow-sm overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('add')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'add' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <PlusCircle size={18} /> Adição Manual
                </button>
                <button 
                  onClick={() => setActiveTab('list')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'list' || activeTab === 'edit' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <List size={18} /> Todos os Imóveis ({properties.length})
                </button>
                <button 
                  onClick={() => setActiveTab('venda')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'venda' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Compra/Venda ({properties.filter(p => p.category === 'venda').length})
                </button>
                <button 
                  onClick={() => setActiveTab('arrendamento')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'arrendamento' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Arrendamento ({properties.filter(p => p.category === 'arrendamento').length})
                </button>
                <button 
                  onClick={() => setActiveTab('construcao')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'construcao' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Nova Construção ({properties.filter(p => p.category === 'construcao').length})
                </button>
                <button 
                  onClick={() => setActiveTab('rascunho')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'rascunho' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Rascunhos ({properties.filter(p => p.publicationStatus === 'rascunho').length})
                </button>
                <button 
                  onClick={() => setActiveTab('xml')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'xml' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <FileCode size={18} /> XML
                </button>
              </div>

              {/* TAB 1: ADD MANUAL PROPERTY */}
              {activeTab === 'add' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                  <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2">Adicionar Novo Imóvel</h2>
                  <p className="text-gray-500 text-sm mb-8">O imóvel será publicado instantaneamente e ficará visível no site público.</p>

                  {successMsg && (
                    <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-center gap-3">
                      <Check size={20} className="text-emerald-600" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Título do Imóvel</label>
                      <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Luxuosa Moradia V4 em Vilamoura" className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Referência do Imóvel (Auto-gerada)</label>
                      <input 
                        type="text" 
                        required 
                        value={reference} 
                        onChange={(e) => {
                          setReference(e.target.value.toUpperCase());
                          setIsManualReference(true);
                        }} 
                        placeholder="Ex: VIL001" 
                        className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm font-mono" 
                      />
                      <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-tighter">Iniciais da localização + número sequencial. Pode editar manualmente.</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Descrição Completa</label>
                      <textarea rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva as características principais..." className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm resize-none" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Preço (€)</label>
                      <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="450000" className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm mb-2" />
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="priceOnRequest" checked={priceOnRequest} onChange={(e) => setPriceOnRequest(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                        <label htmlFor="priceOnRequest" className="text-[10px] uppercase tracking-widest font-bold text-gray-500 cursor-pointer">Preço sob consulta</label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Categoria</label>
                      <select required value={category} onChange={(e) => setCategory(e.target.value as Property['category'])} className={`w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer ${!category ? 'text-gray-400' : 'text-gray-900'}`}>
                        <option value="">Selecionar Categoria</option>
                        <option value="venda">Compra/Venda</option>
                        <option value="arrendamento">Arrendamento</option>
                        <option value="construcao">Nova Construção</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Localização</label>
                      <input 
                        type="text" 
                        required 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        onBlur={() => generateReference(location)}
                        placeholder="Ex: Quinta do Lago, Algarve" 
                        className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Tipo de Imóvel</label>
                      <select required value={type} onChange={(e) => {
                        const newType = e.target.value as Property['type'];
                        setType(newType);
                        if (newType === 'Nova Construção') {
                          setCategory('construcao');
                        }
                      }} className={`w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer ${type === '' ? 'text-gray-400' : 'text-gray-900'}`}>
                        <option value="">Selecionar</option>
                        <option value="Vivenda">Vivenda</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Nova Construção">Nova Construção</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Estado Comercial</label>
                      <select required value={commercialStatus} onChange={(e) => setCommercialStatus(e.target.value as Property['commercialStatus'])} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer">
                        <option value="">Selecionar</option>
                        <option value="disponível">Disponível</option>
                        <option value="reservado">Reservado</option>
                        <option value="vendido">Vendido</option>
                        <option value="arrendado">Arrendado</option>
                        <option value="indisponível">Indisponível</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Estado de Publicação</label>
                      <select required value={publicationStatus} onChange={(e) => setPublicationStatus(e.target.value as Property['publicationStatus'])} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer">
                        <option value="">Selecionar</option>
                        <option value="publicado">Publicado</option>
                        <option value="rascunho">Rascunho</option>
                        <option value="nao_publicado">Não Publicado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Estado do Imóvel</label>
                      <select required value={status} onChange={(e) => setStatus(e.target.value as Property['status'])} className={`w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer ${status === '' ? 'text-gray-400' : 'text-gray-900'}`}>
                        <option value="">Selecionar</option>
                        <option value="Novo">Novo</option>
                        <option value="Usado">Usado</option>
                        <option value="Em Construção">Em Construção</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Visibilidade</label>
                      <select required value={visibility} onChange={(e) => setVisibility(e.target.value as Property['visibility'])} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer text-gray-900">
                        <option value="visível">Visível (Público)</option>
                        <option value="oculto">Oculto (Admin)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Classe Energética</label>
                      <select value={energyRate} onChange={(e) => setEnergyRate(e.target.value as Property['energyRate'])} className={`w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer ${!energyRate ? 'text-gray-400' : 'text-gray-900'}`}>
                        <option value="">Selecionar</option>
                        {ENERGY_RATES.map(rate => (
                          <option key={rate} value={rate}>{rate}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Quartos</label>
                      <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Banhos</label>
                      <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Área Útil (m²)</label>
                      <input type="number" value={area} onChange={(e) => setArea(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Área Bruta (m²)</label>
                      <input type="number" value={grossArea} onChange={(e) => setGrossArea(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Área do Terreno (m²)</label>
                      <input type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
                    </div>


                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Coordenadas (Latitude, Longitude)</label>
                      <input 
                        type="text" 
                        value={coords} 
                        onChange={(e) => setCoords(e.target.value)} 
                        placeholder="Ex: 37.123456, -8.123456" 
                        className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" 
                      />
                      <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-tighter">Introduza os dois valores separados por uma vírgula.</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-4 block">Características do Imóvel</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-gray-50 p-6 border border-gray-200">
                        {PROPERTY_FEATURES.map((feature) => (
                          <label key={feature} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedFeatures.includes(feature)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFeatures([...selectedFeatures, feature]);
                                } else {
                                  setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
                                }
                              }}
                              className="w-4 h-4 accent-brand-primary cursor-pointer"
                            />
                            <span className="text-xs text-gray-600 group-hover:text-brand-primary transition-colors">{feature}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Link do Vídeo (YouTube)</label>
                      <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm mb-6" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Upload de Imagens</label>
                      <div className="flex flex-col gap-4">
                        <label className="cursor-pointer flex items-center justify-center gap-2 p-8 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-brand-primary hover:bg-gray-100 transition-all text-sm text-gray-500">
                          {uploading ? <Loader2 className="animate-spin text-brand-secondary" /> : <ImagePlus size={24} className="text-brand-secondary" />}
                          <span className="font-bold text-brand-primary">{uploading ? 'A processar...' : 'Selecionar Imagens'}</span>
                          <input type="file" multiple disabled={uploading} accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            setUploading(true);
                            try {
                              const tempId = Date.now().toString();
                              const urls: string[] = [];
                              for (const file of files as File[]) {
                                const url = await uploadImage(file, `properties/${tempId}/${file.name}`);
                                urls.push(url);
                              }
                              setUploadedImages(prev => [...prev, ...urls]);
                            } catch (err) {
                              alert('Erro ao carregar imagens.');
                            } finally {
                              setUploading(false);
                            }
                          }} />
                        </label>
                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            {uploadedImages.map((url, idx) => (
                              <div key={idx} className="relative aspect-square group">
                                <img src={url} alt="Uploaded" className="w-full h-full object-cover border border-gray-200" />
                                <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" id="featuredCheck" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-5 h-5 accent-brand-primary cursor-pointer" />
                      <label htmlFor="featuredCheck" className="text-sm font-bold text-gray-800 cursor-pointer">Destacar este imóvel na homepage</label>
                    </div>

                    <div className="md:col-span-2 pt-4">
                      <button type="submit" disabled={uploading} className={`w-full bg-brand-primary text-white py-5 font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 ${uploading ? 'opacity-70' : 'hover:bg-brand-primary/90'}`}>
                        {uploading ? <Loader2 className="animate-spin" /> : 'Publicar Imóvel Agora'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* TAB 2: LIST & MANAGE PROPERTIES */}
              {(activeTab === 'list' || activeTab === 'venda' || activeTab === 'arrendamento' || activeTab === 'construcao' || activeTab === 'rascunho') && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-brand-primary mb-1">
                        {activeTab === 'list' ? 'Todos os Imóveis' : 
                         activeTab === 'venda' ? 'Imóveis para Compra/Venda' : 
                         activeTab === 'arrendamento' ? 'Imóveis para Arrendamento' : 
                         activeTab === 'rascunho' ? 'Rascunhos em Preparação' : 'Imóveis em Nova Construção'}
                      </h2>
                      <p className="text-gray-500 text-sm">Gerencie os imóveis publicados no site.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-accent/40 px-4 py-2 font-bold text-brand-primary text-sm">
                        Total: {properties.filter(p => {
                          if (activeTab === 'venda') return p.category === 'venda';
                          if (activeTab === 'arrendamento') return p.category === 'arrendamento';
                          if (activeTab === 'construcao') return p.category === 'construcao';
                          if (activeTab === 'rascunho') return p.publicationStatus === 'rascunho';
                          return true;
                        }).length} resultados
                      </div>
                      <button onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center gap-2"><Trash2 size={14} /> Eliminar Lista</button>
                      <button onClick={handleSeed} disabled={isSeeding} className="bg-brand-primary text-brand-secondary px-4 py-2 text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center gap-2">
                        {isSeeding ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />} Restaurar Exemplos
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8 bg-gray-50 p-6 border border-gray-100">
                    <input type="text" placeholder="Nome/Palavras-chave" value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} className="p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary" />
                    <input type="text" placeholder="Referência" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} className="p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary" />
                    <input type="text" placeholder="Localização" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} className="p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary" />
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary">
                      <option value="">Todos os Tipos</option>
                      <option value="Vivenda">Vivenda</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Nova Construção">Nova Construção</option>
                    </select>
                    <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} className="p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary">
                      <option value="">Visibilidade: Todas</option>
                      <option value="visível">Visível</option>
                      <option value="oculto">Oculto</option>
                    </select>
                    <input type="text" placeholder="Características" value={filterFeatures} onChange={(e) => setFilterFeatures(e.target.value)} className="p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary" />
                    <input type="number" placeholder="Preço Mín." value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary" />
                  </div>

                  {properties.some(p => !p.category) && activeTab === 'list' && (
                    <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="text-amber-500" size={20} />
                        <p className="text-sm text-amber-800">
                          Existem imóveis <strong>sem categoria</strong> definida. Edite-os para que apareçam nos painéis corretos.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {properties.filter(p => {
                      // Category/Status Filter
                      if (activeTab === 'venda' && p.category !== 'venda') return false;
                      if (activeTab === 'arrendamento' && p.category !== 'arrendamento') return false;
                      if (activeTab === 'construcao' && p.category !== 'construcao') return false;
                      if (activeTab === 'rascunho' && p.publicationStatus !== 'rascunho') return false;
                      
                      // Search Filters
                      return (p.title.toLowerCase().includes(searchTitle.toLowerCase())) &&
                             (searchRef === '' || (p.reference || '').toLowerCase().includes(searchRef.toLowerCase())) &&
                             (p.location.toLowerCase().includes(searchLocation.toLowerCase())) &&
                             (filterType === '' || p.type === filterType) &&
                             (filterVisibility === '' || p.visibility === filterVisibility) &&
                             (filterFeatures === '' || p.features.some(f => f.toLowerCase().includes(filterFeatures.toLowerCase()))) &&
                             (minPrice === '' || p.price >= Number(minPrice)) &&
                             (maxPrice === '' || p.price <= Number(maxPrice));
                    }).map((property) => (
                      <div key={property.id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50 border border-gray-200 gap-6">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <img src={property.images[0]} alt={property.title} className="w-24 h-20 object-cover shadow-sm shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-secondary text-white px-2 py-0.5">{property.type}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                                property.category === 'venda' ? 'bg-emerald-500 text-white' : 
                                property.category === 'arrendamento' ? 'bg-blue-500 text-white' : 
                                property.category === 'construcao' ? 'bg-orange-500 text-white' : 'bg-gray-400 text-white'
                              }`}>
                                {property.category === 'venda' ? 'Compra/Venda' : 
                                 property.category === 'arrendamento' ? 'Arrendamento' : 
                                 property.category === 'construcao' ? 'Nova Construção' : 'Sem Categoria'}
                              </span>
                              {property.featured && <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 flex items-center gap-1"><Star size={10} className="fill-white" /> Destaque</span>}
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${property.visibility === 'visível' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>{property.visibility}</span>
                            </div>
                            <h3 className="font-serif font-bold text-brand-primary text-lg">{property.title}</h3>
                            <p className="text-xs text-gray-500">
                              {property.location} • {property.reference} • €{property.price.toLocaleString()} {property.category === 'arrendamento' ? '/mês' : ''}
                              {property.priceOnRequest && <span className="ml-2 text-brand-secondary font-bold uppercase text-[9px]">(Sob Consulta)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                          <button onClick={() => { 
                            setPrevTab(activeTab);
                            setEditingProperty(property); 
                            setEditCoords(property.coordinates ? `${property.coordinates.lat}, ${property.coordinates.lng}` : '');
                            setActiveTab('edit'); 
                          }} className="px-4 py-2.5 bg-brand-accent text-brand-primary hover:bg-gray-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all">Editar</button>
                          <button onClick={() => handleToggleFeatured(property.id)} className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${property.featured ? 'bg-amber-100 text-amber-800' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}><Star size={14} className={property.featured ? 'fill-amber-800' : ''} /> {property.featured ? 'Remover Destaque' : 'Destacar'}</button>
                          <button onClick={() => handleDelete(property.id)} className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"><Trash2 size={14} /> Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* EDIT PROPERTY MODAL/TAB */}
              {activeTab === 'edit' && editingProperty && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                  <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2">Editar Imóvel: {editingProperty.title}</h2>
                  <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Criado em:</span>
                      <span className="text-[10px] font-bold text-brand-primary bg-gray-50 px-2 py-1 border border-gray-100">
                        {editingProperty.createdAt ? new Date(editingProperty.createdAt).toLocaleString('pt-PT') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Última atualização:</span>
                      <span className="text-[10px] font-bold text-brand-primary bg-gray-50 px-2 py-1 border border-gray-100">
                        {editingProperty.updatedAt ? new Date(editingProperty.updatedAt).toLocaleString('pt-PT') : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Título</label>
                      <input type="text" value={editingProperty.title} onChange={e => setEditingProperty({...editingProperty, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Descrição</label>
                      <textarea rows={4} value={editingProperty.description} onChange={e => setEditingProperty({...editingProperty, description: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Preço (€)</label>
                      <input type="number" value={editingProperty.price} onChange={e => setEditingProperty({...editingProperty, price: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm mb-2" />
                      <div className="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="editPriceOnRequest" checked={editingProperty.priceOnRequest || false} onChange={(e) => setEditingProperty({...editingProperty, priceOnRequest: e.target.checked})} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                        <label htmlFor="editPriceOnRequest" className="text-[10px] uppercase tracking-widest font-bold text-gray-500 cursor-pointer">Preço sob consulta</label>
                      </div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Localização</label>
                      <input 
                        type="text" 
                        value={editingProperty.location} 
                        onChange={e => setEditingProperty({...editingProperty, location: e.target.value})} 
                        onBlur={() => generateReference(editingProperty.location, true)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" 
                      />
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block mb-1">Quartos</label>
                          <input type="number" value={editingProperty.bedrooms} onChange={e => setEditingProperty({...editingProperty, bedrooms: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block mb-1">Banhos</label>
                          <input type="number" value={editingProperty.bathrooms} onChange={e => setEditingProperty({...editingProperty, bathrooms: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block mb-1">Útil (m²)</label>
                          <input type="number" value={editingProperty.area} onChange={e => setEditingProperty({...editingProperty, area: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block mb-1">Bruta (m²)</label>
                          <input type="number" value={editingProperty.grossArea || 0} onChange={e => setEditingProperty({...editingProperty, grossArea: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block mb-1">Terreno (m²)</label>
                          <input type="number" value={editingProperty.landArea || 0} onChange={e => setEditingProperty({...editingProperty, landArea: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                        </div>
                      </div>


                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Coordenadas (Lat, Lng)</label>
                      <input 
                        type="text" 
                        value={editCoords} 
                        onChange={e => setEditCoords(e.target.value)} 
                        placeholder="37.1234, -8.1234" 
                        className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" 
                      />

                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Referência</label>
                      <input type="text" value={editingProperty.reference || ''} onChange={e => setEditingProperty({...editingProperty, reference: e.target.value.toUpperCase()})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm font-mono mb-2" />

                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Classe Energética</label>
                      <select value={editingProperty.energyRate || ''} onChange={e => setEditingProperty({...editingProperty, energyRate: e.target.value as Property['energyRate']})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm cursor-pointer mb-2">
                        <option value="">Selecionar</option>
                        {ENERGY_RATES.map(rate => (
                          <option key={rate} value={rate}>{rate}</option>
                        ))}
                      </select>
                      
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Tipo de Imóvel</label>
                      <select value={editingProperty.type} onChange={e => {
                        const newType = e.target.value as Property['type'];
                        const updates: any = { type: newType };
                        if (newType === 'Nova Construção') {
                          updates.category = 'construcao';
                        }
                        setEditingProperty({...editingProperty, ...updates});
                      }} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm cursor-pointer">
                        <option value="Vivenda">Vivenda</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Nova Construção">Nova Construção</option>
                      </select>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Categoria</label>
                      <select required value={editingProperty.category || ''} onChange={e => setEditingProperty({...editingProperty, category: e.target.value as Property['category']})} className={`w-full p-3 bg-gray-50 border border-gray-200 text-sm cursor-pointer ${!editingProperty.category ? 'text-red-500 font-bold animate-pulse' : ''}`}>
                        <option value="">-- Selecionar Categoria --</option>
                        <option value="venda">Compra/Venda</option>
                        <option value="arrendamento">Arrendamento</option>
                        <option value="construcao">Nova Construção</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Características do Imóvel</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-gray-50 p-6 border border-gray-200">
                        {PROPERTY_FEATURES.map((feature) => (
                          <label key={feature} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={editingProperty.features.includes(feature)}
                              onChange={(e) => {
                                let newFeatures = [...editingProperty.features];
                                if (e.target.checked) {
                                  newFeatures.push(feature);
                                } else {
                                  newFeatures = newFeatures.filter(f => f !== feature);
                                }
                                setEditingProperty({...editingProperty, features: newFeatures});
                              }}
                              className="w-4 h-4 accent-brand-primary cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-600 group-hover:text-brand-primary transition-colors">{feature}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Link do Vídeo (YouTube)</label>
                      <input type="text" value={editingProperty.videoUrl || ''} onChange={e => setEditingProperty({...editingProperty, videoUrl: e.target.value})} placeholder="https://www.youtube.com/..." className="w-full p-3 bg-gray-50 border border-gray-200 text-sm mb-4" />

                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Galeria de Imagens</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {editingProperty.images.map((img, idx) => (
                              <div key={idx} className="relative group border border-gray-200 p-2">
                                  <img src={img} alt="Imóvel" className="w-full h-24 object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1">
                                      <button onClick={(e) => { e.preventDefault(); const newImages = [...editingProperty.images]; if(idx > 0) { [newImages[idx], newImages[idx-1]] = [newImages[idx-1], newImages[idx]]; setEditingProperty({...editingProperty, images: newImages}); } }} className="bg-white p-1 text-xs">◀</button>
                                      <button onClick={(e) => { e.preventDefault(); const newImages = [...editingProperty.images]; if(idx < newImages.length -1) { [newImages[idx], newImages[idx+1]] = [newImages[idx+1], newImages[idx]]; setEditingProperty({...editingProperty, images: newImages}); } }} className="bg-white p-1 text-xs">▶</button>
                                      <button onClick={(e) => { e.preventDefault(); const newImages = editingProperty.images.filter((_, i) => i !== idx); setEditingProperty({...editingProperty, images: newImages}); }} className="bg-red-500 text-white p-1 text-xs">X</button>
                                  </div>
                              </div>
                          ))}
                          <label className="border-2 border-dashed border-gray-300 h-24 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-brand-primary transition-all">
                              {uploading ? <Loader2 className="animate-spin text-brand-secondary" /> : '+'}
                              <input type="file" multiple accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length === 0) return;
                                  setUploading(true);
                                  try {
                                    const urls: string[] = [];
                                    for (const file of files as File[]) {
                                      const url = await uploadImage(file, `properties/${editingProperty.id}/${file.name}`);
                                      urls.push(url);
                                    }
                                    setEditingProperty({...editingProperty, images: [...editingProperty.images, ...urls]});
                                  } catch (err) { alert('Erro ao carregar imagens.'); } finally { setUploading(false); }
                              }} />
                          </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button disabled={uploading} onClick={async () => { 
                      if (!editingProperty) return;
                      setUploading(true);
                      try {
                        const updatedProp = {
                          ...editingProperty,
                          coordinates: (() => {
                            const parts = editCoords.split(',').map(v => parseFloat(v.trim()));
                            return { lat: parts[0] || 0, lng: parts[1] || 0 };
                          })()
                        };
                        await updatePropertyInFirestore(editingProperty.id, updatedProp);
                        const allProps = await getPropertiesFromFirestore();
                        setProperties(allProps);
                        setActiveTab(prevTab);
                        setEditingProperty(null);
                        onPropertiesChange();
                      } catch (err) { alert('Erro ao atualizar imóvel.'); } finally { setUploading(false); }
                    }} className="bg-brand-primary text-white px-8 py-3 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg">{uploading && <Loader2 className="animate-spin" size={14} />} Guardar Alterações</button>
                    <button onClick={() => { setActiveTab(prevTab); setEditingProperty(null); }} className="bg-gray-200 text-gray-800 px-8 py-3 font-bold text-xs uppercase tracking-widest transition-all">Cancelar</button>
                  </div>
                </motion.div>
              )}

              {/* TAB: XML (IMPORT & EXPORT) */}
              {activeTab === 'xml' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="flex border-b border-gray-200 bg-white shadow-sm">
                    <button 
                      onClick={() => setXmlSubTab('import')}
                      className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${
                        xmlSubTab === 'import' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'
                      }`}
                    >
                      <Upload size={16} /> Importar (Sincronizar CRM)
                    </button>
                    <button 
                      onClick={() => setXmlSubTab('export')}
                      className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${
                        xmlSubTab === 'export' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'
                      }`}
                    >
                      <Download size={16} /> Exportar Base de Dados
                    </button>
                  </div>

                  {xmlSubTab === 'import' ? (
                    <div className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                      <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2">Sincronização CRM</h2>
                      <p className="text-gray-500 text-sm mb-8">Importe a sua base de dados XML para atualizar o catálogo.</p>
                      
                      {syncSuccess && (
                        <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-center gap-3">
                          <Check size={20} className="text-emerald-600" />
                          <span>{syncSuccess}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="border-2 border-dashed border-gray-300 p-10 text-center flex flex-col items-center justify-center bg-gray-50 group hover:border-brand-primary transition-all">
                          <FileCode size={48} className="text-brand-secondary mb-4 group-hover:scale-110 transition-transform" />
                          <label className="cursor-pointer bg-brand-primary text-white px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-md">
                            <span>Escolher Ficheiro XML</span>
                            <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" />
                          </label>
                          <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest">Arraste ou selecione o ficheiro</p>
                        </div>
                        <form onSubmit={handleXmlTextSync} className="flex flex-col">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Ou cole o conteúdo XML diretamente:</label>
                          <textarea rows={8} required value={xmlInput} onChange={(e) => setXmlInput(e.target.value)} placeholder="Cole o código XML aqui..." className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-xs font-mono mb-4 resize-none" />
                          <button type="submit" className="w-full bg-brand-secondary text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-brand-secondary/90 shadow-md transition-all">Sincronizar Catálogo Agora</button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white shadow-xl p-8 md:p-12 border border-gray-100 text-center">
                      <div className="max-w-2xl mx-auto py-12">
                        <div className="w-20 h-20 bg-brand-accent/30 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Download size={40} className="text-brand-primary" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-brand-primary mb-2">Exportar Base de Dados</h2>
                        <p className="text-gray-500 mb-10">Gere um ficheiro XML com todos os imóveis atualmente registados no sistema.</p>
                        
                        <div className="bg-gray-50 border border-gray-100 p-6 mb-10 inline-block">
                          <div className="text-3xl font-bold text-brand-primary mb-1">{properties.length}</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Imóveis prontos para exportar</div>
                        </div>

                        <br />
                        <button onClick={handleDownloadXml} className="bg-brand-secondary text-white px-12 py-5 font-bold uppercase tracking-widest text-xs hover:bg-brand-secondary/90 transition-all shadow-xl hover:scale-105 active:scale-95 transform">
                          Descarregar Ficheiro XML
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}

          {sidebarTab === 'website' && (
            <div className="space-y-8">
              {/* Page Selection */}
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-brand-primary">Personalização do Website</h1>
                  <p className="text-gray-500 text-sm">Selecione a página e a secção que deseja editar.</p>
                </div>
                
                <div className="flex items-center justify-between w-full">
                  <div className="flex gap-4 p-1 bg-gray-200 w-fit rounded-none">
                    {[
                      { id: 'home', label: 'Início' },
                      { id: 'about', label: 'Sobre Nós' },
                      { id: 'services', label: 'Serviços' },
                      { id: 'contact', label: 'Contacto' }
                    ].map(page => (
                      <button 
                        key={page.id}
                        onClick={() => {
                          setWebsitePage(page.id as any);
                          // Reset section to first available for that page
                          if (page.id === 'home') setWebsiteSection('hero');
                          else if (page.id === 'about') setWebsiteSection('history');
                          else if (page.id === 'services') setWebsiteSection('main');
                          else if (page.id === 'contact') setWebsiteSection('main');
                        }}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${websitePage === page.id ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-brand-primary'}`}
                      >
                        {page.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-gray-100 p-1">
                    <button 
                      onClick={() => setPreviewMode('editor')}
                      className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${previewMode === 'editor' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-400 hover:text-brand-primary'}`}
                    >
                      Apenas Editor
                    </button>
                    <button 
                      onClick={() => setPreviewMode('split')}
                      className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${previewMode === 'split' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-400 hover:text-brand-primary'}`}
                    >
                      Vista Dividida
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Selection */}
              <div className="flex border-b border-gray-200 bg-white shadow-sm overflow-x-auto">
                {websitePage === 'home' && (
                  <>
                    <button onClick={() => setWebsiteSection('hero')} className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${websiteSection === 'hero' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Hero</button>
                    <button onClick={() => setWebsiteSection('evaluation')} className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${websiteSection === 'evaluation' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Avaliação</button>
                    <button onClick={() => setWebsiteSection('stats')} className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${websiteSection === 'stats' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Estatísticas</button>
                  </>
                )}
                {websitePage === 'about' && (
                  <>
                    <button onClick={() => setWebsiteSection('history')} className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${websiteSection === 'history' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>História</button>
                  </>
                )}
                {websitePage === 'services' && (
                  <>
                    <button onClick={() => setWebsiteSection('main')} className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${websiteSection === 'main' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Principal</button>
                  </>
                )}
                {websitePage === 'contact' && (
                  <>
                    <button onClick={() => setWebsiteSection('main')} className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${websiteSection === 'main' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Principal</button>
                    <button onClick={() => setWebsiteSection('info')} className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${websiteSection === 'info' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Informações</button>
                  </>
                )}
              </div>

              <div className={`grid grid-cols-1 ${previewMode === 'split' ? 'lg:grid-cols-2' : ''} gap-8`}>
                <div className="space-y-6">
                  {configSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                      <Check size={20} className="text-emerald-600" />
                      <span className="font-bold text-xs uppercase tracking-wider">{configSuccess}</span>
                    </div>
                  )}

                  <div className="bg-white shadow-xl p-8 border border-gray-100">
                    <div className="space-y-8">
                      {/* HOME SECTIONS */}
                      {websitePage === 'home' && websiteSection === 'hero' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Conteúdo Hero</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título Principal</label>
                                  <input type="text" value={websiteConfig.heroTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, heroTitle: e.target.value})} placeholder={liveConfig.heroTitle || 'Título Hero'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Subtítulo</label>
                                  <textarea rows={3} value={websiteConfig.heroSubtitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, heroSubtitle: e.target.value})} placeholder={liveConfig.heroSubtitle || 'Subtítulo'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Texto do Botão</label>
                                  <input type="text" value={websiteConfig.heroButtonText || ''} onChange={e => setWebsiteConfig({...websiteConfig, heroButtonText: e.target.value})} placeholder={liveConfig.heroButtonText || 'Ver seleção'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Imagem de Fundo</h3>
                              <div className="space-y-4">
                                {(websiteConfig.heroImage || liveConfig.heroImage) && (
                                  <img src={websiteConfig.heroImage || liveConfig.heroImage} className="w-full aspect-video object-cover border border-gray-200" alt="Hero" />
                                )}
                                <label className="cursor-pointer flex flex-col items-center justify-center gap-3 p-8 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-brand-primary transition-all">
                                  {uploading ? <Loader2 className="animate-spin text-brand-secondary" /> : <ImagePlus size={24} />}
                                  <span className="text-[10px] uppercase font-bold tracking-widest">Alterar Imagem</span>
                                  <input type="file" className="hidden" disabled={uploading} onChange={async (e) => {
                                    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
                                    try { const url = await uploadImage(file, `config/hero_${Date.now()}`); setWebsiteConfig({...websiteConfig, heroImage: url}); } catch (err) { alert('Erro.'); } finally { setUploading(false); }
                                  }} />
                                </label>
                              </div>
                           </div>
                        </div>
                      )}

                      {websitePage === 'home' && websiteSection === 'evaluation' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Conteúdo Avaliação</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título</label>
                                  <input type="text" value={websiteConfig.evalTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, evalTitle: e.target.value})} placeholder={liveConfig.evalTitle || 'Título Avaliação'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Texto / Descrição</label>
                                  <textarea rows={5} value={websiteConfig.evalSubtitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, evalSubtitle: e.target.value})} placeholder={liveConfig.evalSubtitle || 'Texto Avaliação'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                </div>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Imagem Lateral</h3>
                              <div className="space-y-4">
                                {(websiteConfig.evalImage || liveConfig.evalImage) && (
                                  <img src={websiteConfig.evalImage || liveConfig.evalImage} className="w-full aspect-square object-cover border border-gray-200" alt="Eval" />
                                )}
                                <label className="cursor-pointer flex flex-col items-center justify-center gap-3 p-8 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-brand-primary transition-all">
                                  {uploading ? <Loader2 className="animate-spin text-brand-secondary" /> : <ImagePlus size={24} />}
                                  <span className="text-[10px] uppercase font-bold tracking-widest">Alterar Imagem</span>
                                  <input type="file" className="hidden" disabled={uploading} onChange={async (e) => {
                                    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
                                    try { const url = await uploadImage(file, `config/eval_${Date.now()}`); setWebsiteConfig({...websiteConfig, evalImage: url}); } catch (err) { alert('Erro.'); } finally { setUploading(false); }
                                  }} />
                                </label>
                              </div>
                           </div>
                        </div>
                      )}

                      {websitePage === 'home' && websiteSection === 'stats' && (
                        <div className="space-y-6">
                           <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Números de Confiança</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Anos de Experiência</label>
                                <input type="text" value={websiteConfig.statsYears || ''} onChange={e => setWebsiteConfig({...websiteConfig, statsYears: e.target.value})} placeholder={liveConfig.statsYears || '15+'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Imóveis Vendidos</label>
                                <input type="text" value={websiteConfig.statsSold || ''} onChange={e => setWebsiteConfig({...websiteConfig, statsSold: e.target.value})} placeholder={liveConfig.statsSold || '800+'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Clientes Felizes</label>
                                <input type="text" value={websiteConfig.statsClients || ''} onChange={e => setWebsiteConfig({...websiteConfig, statsClients: e.target.value})} placeholder={liveConfig.statsClients || '1.2k'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Transparência</label>
                                <input type="text" value={websiteConfig.statsTransparency || ''} onChange={e => setWebsiteConfig({...websiteConfig, statsTransparency: e.target.value})} placeholder={liveConfig.statsTransparency || '100%'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                              </div>
                           </div>
                        </div>
                      )}

                      {/* ABOUT SECTIONS */}
                      {websitePage === 'about' && websiteSection === 'history' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">História & Visão</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título da Página</label>
                                  <input type="text" value={websiteConfig.aboutTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, aboutTitle: e.target.value})} placeholder={liveConfig.aboutTitle || 'Confiança, Proximidade, Resultados.'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Texto Parágrafo 1</label>
                                  <textarea rows={4} value={websiteConfig.aboutText1 || ''} onChange={e => setWebsiteConfig({...websiteConfig, aboutText1: e.target.value})} placeholder={liveConfig.aboutText1 || 'Texto 1'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Texto Parágrafo 2</label>
                                  <textarea rows={4} value={websiteConfig.aboutText2 || ''} onChange={e => setWebsiteConfig({...websiteConfig, aboutText2: e.target.value})} placeholder={liveConfig.aboutText2 || 'Texto 2'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Contador de Anos</label>
                                  <input type="text" value={websiteConfig.aboutYearsCount || ''} onChange={e => setWebsiteConfig({...websiteConfig, aboutYearsCount: e.target.value})} placeholder={liveConfig.aboutYearsCount || '15'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Imagem de Destaque</h3>
                              <div className="space-y-4">
                                {(websiteConfig.aboutImage || liveConfig.aboutImage) && (
                                  <img src={websiteConfig.aboutImage || liveConfig.aboutImage} className="w-full aspect-video object-cover border border-gray-200" alt="About" />
                                )}
                                <label className="cursor-pointer flex flex-col items-center justify-center gap-3 p-8 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-brand-primary transition-all">
                                  {uploading ? <Loader2 className="animate-spin text-brand-secondary" /> : <ImagePlus size={24} />}
                                  <span className="text-[10px] uppercase font-bold tracking-widest">Alterar Imagem</span>
                                  <input type="file" className="hidden" disabled={uploading} onChange={async (e) => {
                                    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
                                    try { const url = await uploadImage(file, `config/about_${Date.now()}`); setWebsiteConfig({...websiteConfig, aboutImage: url}); } catch (err) { alert('Erro.'); } finally { setUploading(false); }
                                  }} />
                                </label>
                              </div>
                           </div>
                        </div>
                      )}

                      {/* SERVICES SECTIONS */}
                      {websitePage === 'services' && websiteSection === 'main' && (
                        <div className="space-y-6">
                           <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Topo da Página de Serviços</h3>
                           <div className="grid grid-cols-1 gap-6">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título Principal</label>
                                <input type="text" value={websiteConfig.servicesTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, servicesTitle: e.target.value})} placeholder={liveConfig.servicesTitle || 'Soluções Imobiliárias de Excelência'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm font-serif" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Subtítulo / Descrição</label>
                                <textarea rows={3} value={websiteConfig.servicesSubtitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, servicesSubtitle: e.target.value})} placeholder={liveConfig.servicesSubtitle || 'Mais do que mediadores...'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                              </div>
                           </div>
                        </div>
                      )}

                      {/* CONTACT SECTIONS */}
                      {websitePage === 'contact' && websiteSection === 'main' && (
                        <div className="space-y-6">
                           <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Topo da Página de Contacto</h3>
                           <div className="grid grid-cols-1 gap-6">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título Principal</label>
                                <input type="text" value={websiteConfig.contactTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactTitle: e.target.value})} placeholder={liveConfig.contactTitle || 'Estamos Aqui Para o Ajudar'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm font-serif" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Subtítulo / Descrição</label>
                                <textarea rows={3} value={websiteConfig.contactSubtitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactSubtitle: e.target.value})} placeholder={liveConfig.contactSubtitle || 'Tem alguma questão sobre um imóvel...'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                              </div>
                           </div>
                        </div>
                      )}

                      {websitePage === 'contact' && websiteSection === 'info' && (
                        <div className="space-y-8">
                           <div>
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Dados de Contacto & Morada</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Morada Completa</label>
                                  <input type="text" value={websiteConfig.contactAddress || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactAddress: e.target.value})} placeholder={liveConfig.contactAddress || 'Av. 5 de Outubro, 123...'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Telefone</label>
                                  <input type="text" value={websiteConfig.contactPhone || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactPhone: e.target.value})} placeholder={liveConfig.contactPhone || '+351 289 123 456'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Email</label>
                                  <input type="text" value={websiteConfig.contactEmail || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactEmail: e.target.value})} placeholder={liveConfig.contactEmail || 'geral@imobiliariapremium.pt'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                              </div>
                           </div>

                           <div>
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Horário de Funcionamento</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Segunda — Sexta</label>
                                  <input type="text" value={websiteConfig.contactScheduleWeek || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactScheduleWeek: e.target.value})} placeholder={liveConfig.contactScheduleWeek || '09:00 - 18:30'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Sábado</label>
                                  <input type="text" value={websiteConfig.contactScheduleSat || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactScheduleSat: e.target.value})} placeholder={liveConfig.contactScheduleSat || '10:00 - 13:00'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Domingo</label>
                                  <input type="text" value={websiteConfig.contactScheduleSun || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactScheduleSun: e.target.value})} placeholder={liveConfig.contactScheduleSun || 'Encerrado'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                </div>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Save Button */}
                    <div className="pt-8 mt-8 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={handleSaveConfig}
                        disabled={isConfigLoading}
                        className={`bg-brand-primary text-white px-10 py-4 font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 ${isConfigLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand-primary/90 hover:scale-[1.02] active:scale-[0.98]'}`}
                      >
                        {isConfigLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={18} /> A Processar...
                          </>
                        ) : (
                          <>
                            <Save size={18} /> Publicar Alterações na Página
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Preview Column */}
                {previewMode === 'split' && (
                  <div className="space-y-6">
                    <div className="bg-brand-primary p-6 border-l-4 border-brand-secondary shadow-lg sticky top-32 z-30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="text-brand-secondary" size={20} />
                          <h3 className="text-white font-serif font-bold">Pré-visualização em Tempo Real</h3>
                        </div>
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold bg-white/5 px-2 py-1 border border-white/10">Modo Draft</span>
                      </div>
                      <p className="text-white/60 text-[10px] uppercase tracking-widest mt-2">Página: {websitePage} / Secção: {websiteSection}</p>
                    </div>

                    <div className="bg-white shadow-2xl border border-gray-200 overflow-hidden relative group">
                      {/* Device Frame Header */}
                      <div className="bg-gray-100 border-b border-gray-200 p-3 flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        </div>
                        <div className="bg-white rounded px-3 py-1 text-[10px] text-gray-400 font-mono flex-1 text-center truncate">
                          villassequa.pt/{websitePage !== 'home' ? websitePage : ''}
                        </div>
                      </div>

                      {/* Actual Content Preview */}
                      <div className="max-h-[700px] overflow-y-auto custom-scrollbar bg-gray-50 p-4">
                        <div className="bg-white shadow-sm border border-gray-100">
                           <WebsitePreview page={websitePage} section={websiteSection} config={{...liveConfig, ...websiteConfig}} />
                        </div>
                        <div className="mt-8 text-center">
                          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold">--- Fim da Pré-visualização ---</p>
                        </div>
                      </div>
                      
                      {/* Hint Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white to-transparent h-12 pointer-events-none" />
                    </div>

                    <div className="bg-amber-50 p-6 border-l-4 border-amber-400 shadow-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-amber-600" size={20} />
                        <h3 className="text-amber-900 font-serif font-bold">Verificação de Segurança</h3>
                      </div>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        Está a visualizar as alterações em <strong>Modo Draft</strong>. <br />
                        As alterações só serão visíveis para o público depois de clicar em <strong>"Publicar Alterações na Página"</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {sidebarTab === 'clientes' && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-brand-primary">Base de Dados de Clientes</h1>
                  <p className="text-gray-500 text-sm">Gestão do portefólio de clientes e contactos diretos.</p>
                </div>
                
                <div className="flex border-b border-gray-200 bg-white shadow-sm overflow-x-auto">
                  <button 
                    onClick={() => setClientesTab('list')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'list' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Users size={18} /> Lista de Clientes ({clients.length})
                  </button>
                  <button 
                    onClick={() => setClientesTab('add')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'add' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <UserPlus size={18} /> Novo Cliente
                  </button>
                </div>
              </div>

              {clientesTab === 'add' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100 max-w-4xl">
                   <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2">Registar Novo Cliente</h2>
                   <form onSubmit={handleAddClient} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Nome</label>
                        <input type="text" required value={clientFirstName} onChange={e => setClientFirstName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" placeholder="Ex: João" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Sobrenome</label>
                        <input type="text" required value={clientLastName} onChange={e => setClientLastName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" placeholder="Ex: Silva" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Telemóvel</label>
                        <input type="tel" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" placeholder="+351 9xx xxx xxx" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Email</label>
                        <input type="email" required value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" placeholder="exemplo@email.com" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Interesse Principal</label>
                        <select required value={clientInterest} onChange={e => setClientInterest(e.target.value as any)} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm">
                          <option value="compra">Compra</option>
                          <option value="venda">Venda</option>
                          <option value="arrendamento">Arrendamento</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 pt-4">
                        <button type="submit" disabled={clientSaving} className="bg-brand-primary text-white px-10 py-4 font-bold uppercase tracking-widest text-xs hover:bg-brand-primary/90 transition-all shadow-lg flex items-center gap-2">
                          {clientSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Guardar Cliente
                        </button>
                      </div>
                   </form>
                </motion.div>
              )}

              {clientesTab === 'list' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-100">
                          <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Nome</th>
                          <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Contacto</th>
                          <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Interesse</th>
                          <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Data Registo</th>
                          <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.length === 0 ? (
                          <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic">Nenhum cliente registado.</td></tr>
                        ) : (
                          clients.map(client => (
                            <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                              <td className="py-5 px-4">
                                <div className="font-bold text-brand-primary">{client.firstName} {client.lastName}</div>
                              </td>
                              <td className="py-5 px-4">
                                <div className="text-xs text-gray-600">{client.email}</div>
                                <div className="text-[10px] text-gray-400">{client.phone}</div>
                              </td>
                              <td className="py-5 px-4">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 ${
                                  client.interest === 'compra' ? 'bg-emerald-100 text-emerald-800' : 
                                  client.interest === 'venda' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {client.interest}
                                </span>
                              </td>
                              <td className="py-5 px-4 text-xs text-gray-400">
                                {new Date(client.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-5 px-4 text-right">
                                <button onClick={() => handleDeleteClient(client.id)} className="text-red-300 hover:text-red-600 transition-colors p-2 opacity-0 group-hover:opacity-100">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {sidebarTab === 'leads' && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-brand-primary">Gestão de Leads</h1>
                  <p className="text-gray-500 text-sm">Acompanhe as submissões dos formulários de contacto.</p>
                </div>

                <div className="flex border-b border-gray-200 bg-white shadow-sm overflow-x-auto">
                  <button 
                    onClick={() => setLeadsSubTab('info')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      leadsSubTab === 'info' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Building2 size={18} /> Formulários de Imóveis ({leads.filter(l => l.type === 'info').length})
                  </button>
                  <button 
                    onClick={() => setLeadsSubTab('evaluation')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      leadsSubTab === 'evaluation' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Euro size={18} /> Venda de Imóveis ({leads.filter(l => l.type === 'evaluation').length})
                  </button>
                  <button 
                    onClick={() => setLeadsSubTab('contact')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      leadsSubTab === 'contact' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <MailIcon size={18} /> Contactos Gerais ({leads.filter(l => l.type === 'contact').length})
                  </button>
                  <button 
                    onClick={() => setLeadsSubTab('newsletter')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      leadsSubTab === 'newsletter' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <MailIcon size={18} /> Newsletter ({leads.filter(l => l.type === 'newsletter').length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leads.filter(l => l.type === leadsSubTab).length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-400 italic">Nenhum lead capturado neste formulário até ao momento.</div>
                ) : (
                  leads.filter(l => l.type === leadsSubTab).map(lead => (
                    <div key={lead.id} className="bg-white border border-gray-200 p-6 relative group shadow-sm hover:shadow-md transition-all">
                       <button onClick={() => handleDeleteLead(lead.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                         <Trash2 size={14} />
                       </button>
                       <div className="flex items-center gap-2 mb-4">
                          <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 ${
                            lead.type === 'evaluation' ? 'bg-amber-500 text-white' : 
                            lead.type === 'contact' ? 'bg-brand-primary text-white' : 
                            lead.type === 'newsletter' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {lead.type === 'evaluation' ? 'Avaliação' : lead.type === 'contact' ? 'Contacto' : lead.type === 'newsletter' ? 'Newsletter' : 'Info'}
                          </span>
                          <span className="text-[10px] text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                       </div>
                       <h3 className="font-bold text-brand-primary mb-1">{lead.name}</h3>
                       <div className="text-xs text-gray-500 mb-4">{lead.email} • {lead.phone}</div>
                       
                       {lead.message && (
                         <div className="bg-gray-50 p-3 border border-gray-100 text-xs text-gray-600 mb-4 italic leading-relaxed line-clamp-3">
                           "{lead.message}"
                         </div>
                       )}

                       <div className="space-y-1 mb-4">
                         {lead.location && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><MapPin size={10} /> {lead.location}</div>}
                         {lead.propertyType && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><Briefcase size={10} /> {lead.propertyType}</div>}
                       </div>

                       <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                          <button onClick={() => { setSidebarTab('matching'); }} className="text-brand-secondary font-bold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1">Matching <ArrowRight size={10} /></button>
                          <a href={`mailto:${lead.email}`} className="bg-brand-primary text-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest hover:bg-brand-primary/90">Responder</a>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {sidebarTab === 'matching' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-serif font-bold text-brand-primary">Matching Inteligente</h1>
                <p className="text-gray-500 text-sm">Correspondência automática entre pedidos de clientes e o catálogo de imóveis.</p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {leads.filter(l => l.location || l.propertyType || l.message).length === 0 ? (
                  <div className="bg-white p-12 text-center border border-gray-200 text-gray-400 italic">
                    Nenhum pedido com critérios de pesquisa específicos encontrado para matching.
                  </div>
                ) : (
                  leads.filter(l => l.location || l.propertyType || l.message).map(lead => {
                    const matches = properties.filter(p => {
                      const matchesType = lead.propertyType ? p.type.toLowerCase().includes(lead.propertyType.toLowerCase()) : false;
                      const matchesLoc = lead.location ? p.location.toLowerCase().includes(lead.location.toLowerCase()) : false;
                      const messageKeywords = lead.message?.toLowerCase() || '';
                      const matchesKeywords = p.features.some(f => messageKeywords.includes(f.toLowerCase())) || 
                                             messageKeywords.includes(p.type.toLowerCase());
                      
                      return matchesType || matchesLoc || matchesKeywords;
                    }).sort((a, b) => {
                       let scoreA = 0;
                       let scoreB = 0;
                       if (lead.propertyType && a.type.toLowerCase().includes(lead.propertyType.toLowerCase())) scoreA += 2;
                       if (lead.propertyType && b.type.toLowerCase().includes(lead.propertyType.toLowerCase())) scoreB += 2;
                       if (lead.location && a.location.toLowerCase().includes(lead.location.toLowerCase())) scoreA += 2;
                       if (lead.location && b.location.toLowerCase().includes(lead.location.toLowerCase())) scoreB += 2;
                       return scoreB - scoreA;
                    }).slice(0, 3);

                    return (
                      <div key={lead.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-brand-primary text-white text-[8px] font-bold uppercase px-2 py-0.5 tracking-widest">Lead Ativa</span>
                              <span className="text-[10px] text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h2 className="text-xl font-serif font-bold text-brand-primary">{lead.name} procura imóvel</h2>
                            <div className="flex flex-wrap gap-4 mt-2">
                              {lead.location && <span className="text-[10px] font-bold uppercase text-gray-500 bg-gray-200 px-2 py-1 rounded-sm flex items-center gap-1"><MapPin size={10} /> {lead.location}</span>}
                              {lead.propertyType && <span className="text-[10px] font-bold uppercase text-gray-500 bg-gray-200 px-2 py-1 rounded-sm flex items-center gap-1"><Briefcase size={10} /> {lead.propertyType}</span>}
                            </div>
                          </div>
                          <button 
                            onClick={() => alert('As sugestões foram preparadas e enviadas para ' + lead.email)}
                            className="bg-brand-secondary text-white px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-brand-secondary/90 transition-all"
                          >
                            Enviar Seleção Automática
                          </button>
                        </div>
                        
                        <div className="p-6">
                          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-6">Melhores Correspondências no Site ({matches.length})</h3>
                          
                          {matches.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm italic border-2 border-dashed border-gray-100">
                              Nenhum imóvel corresponde aos critérios deste cliente no catálogo atual.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {matches.map(prop => (
                                <div key={prop.id} className="border border-gray-100 bg-gray-50 group hover:border-brand-secondary transition-all p-3">
                                  <img src={prop.images[0]} alt={prop.title} className="w-full h-32 object-cover mb-3" />
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-[8px] font-bold uppercase text-brand-secondary">{prop.type}</span>
                                    <span className="text-[10px] font-bold text-brand-primary">€{prop.price.toLocaleString()}</span>
                                  </div>
                                  <h4 className="text-sm font-bold text-brand-primary line-clamp-1 mb-1">{prop.title}</h4>
                                  <p className="text-[10px] text-gray-500 line-clamp-1 mb-3"><MapPin size={8} className="inline mr-1" /> {prop.location}</p>
                                  <button className="w-full py-2 bg-white border border-gray-200 text-[9px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">Ver Ficha</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {sidebarTab === 'newsletter' && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-brand-primary">Gestão de Newsletters</h1>
                  <p className="text-gray-500 text-sm">Crie modelos e envie novidades para os seus subscritores.</p>
                </div>

                <div className="flex border-b border-gray-200 bg-white shadow-sm overflow-x-auto">
                  <button 
                    onClick={() => {
                      setNewsletterTab('create');
                      setEditingTemplate(null);
                      setTemplateName('');
                      setTemplateSubject('');
                      setTemplatePreheader('');
                      setTemplateContent('');
                    }}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      newsletterTab === 'create' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <PlusCircle size={18} /> Novo Modelo
                  </button>
                  <button 
                    onClick={() => setNewsletterTab('list')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      newsletterTab === 'list' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Layout size={18} /> Modelos Guardados ({templates.length})
                  </button>
                  <button 
                    onClick={() => setNewsletterTab('send')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      newsletterTab === 'send' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <MailIcon size={18} /> Enviar Newsletter
                  </button>
                </div>

              </div>

              {newsletterTab === 'create' && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-serif font-bold text-brand-primary mb-6">
                      {editingTemplate ? 'Editar Modelo' : 'Criar Novo Modelo'}
                    </h2>
                    <form onSubmit={async (e) => {
                      await handleSaveTemplate(e);
                      setNewsletterTab('list');
                    }} className="space-y-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Nome Interno (Ex: Promoção Agosto)</label>
                        <input 
                          type="text" 
                          required 
                          value={templateName} 
                          onChange={e => setTemplateName(e.target.value)} 
                          className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" 
                          placeholder="Nome para sua organização..." 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Assunto do Email (O que o cliente vê)</label>
                          <input 
                            type="text" 
                            required 
                            value={templateSubject} 
                            onChange={e => setTemplateSubject(e.target.value)} 
                            className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm font-bold" 
                            placeholder="Ex: Descubra a sua casa de sonho no Algarve" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Preheader (Texto de pré-visualização)</label>
                          <input 
                            type="text" 
                            value={templatePreheader} 
                            onChange={e => setTemplatePreheader(e.target.value)} 
                            className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" 
                            placeholder="Ex: Seleção exclusiva de vivendas de luxo..." 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Conteúdo HTML (Estrutura de Email)</label>
                        <textarea 
                          rows={15} 
                          required 
                          value={templateContent} 
                          onChange={e => setTemplateContent(e.target.value)} 
                          className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm font-mono resize-none" 
                          placeholder="<html><body>...</body></html>" 
                        />
                        <div className="flex justify-between items-start mt-2">
                          <p className="text-[9px] text-gray-400">Variáveis: [NOME], [IMOVEIS]</p>
                          <button 
                            type="button" 
                            onClick={() => setTemplateContent(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Playfair Display', serif; color: #1a1a1a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #000000; color: #d4af37; padding: 40px; text-align: center; }
    .content { padding: 40px; }
    .footer { background: #f9f9f9; padding: 30px; text-align: center; font-size: 12px; color: #999; }
    .btn { background: #d4af37; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 24px; letter-spacing: 3px;">VILLAS & AQUA</h1>
      <p style="margin:5px 0 0; font-size: 10px; text-transform: uppercase;">Imobiliária Premium</p>
    </div>
    <div class="content">
      <h2 style="font-size: 28px;">Olá, [NOME]</h2>
      <p style="line-height: 1.6; color: #555;">Temos o prazer de apresentar uma seleção exclusiva das nossas propriedades mais luxuosas no Algarve.</p>
      
      <div style="margin: 40px 0;">
        [IMOVEIS]
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <a href="https://villas-aqua.com" class="btn">Ver Todas as Propriedades</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Villas & Aqua. Todos os direitos reservados.</p>
      <p>Av. 5 de Outubro, Almancil, Algarve</p>
    </div>
  </div>
</body>
</html>`)}
                            className="text-[10px] font-bold text-brand-secondary hover:underline"
                          >
                            Carregar Estrutura Base Premium
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-brand-primary text-white py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2">
                          <Save size={14} /> {editingTemplate ? 'Atualizar Modelo' : 'Guardar Modelo'}
                        </button>
                         {editingTemplate && (
                          <button 
                            type="button" 
                            onClick={() => { 
                              setEditingTemplate(null); 
                              setTemplateName(''); 
                              setTemplateSubject('');
                              setTemplatePreheader('');
                              setTemplateContent(''); 
                              setNewsletterTab('list'); 
                            }} 
                            className="bg-gray-100 text-gray-600 px-4 py-4 hover:bg-gray-200"
                          >
                            <RotateCcw size={14} /> Cancelar Edição
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {newsletterTab === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400 italic bg-white border border-gray-100">
                      Nenhum modelo de newsletter criado. <button onClick={() => setNewsletterTab('create')} className="text-brand-secondary font-bold underline">Criar o primeiro.</button>
                    </div>
                  ) : (
                    templates.map(tpl => (
                      <div key={tpl.id} className="bg-white border border-gray-200 p-6 flex flex-col group hover:border-brand-secondary transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-brand-primary">{tpl.name}</h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setPreviewTemplate(tpl)}
                              className="p-2 text-gray-400 hover:text-brand-secondary"
                              title="Pré-visualizar"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingTemplate(tpl);
                                setTemplateName(tpl.name);
                                setTemplateSubject(tpl.subject);
                                setTemplatePreheader(tpl.preheader || '');
                                setTemplateContent(tpl.content);
                                setNewsletterTab('create');
                              }}
                              className="p-2 text-gray-400 hover:text-brand-primary"
                            >
                              <Settings size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 border border-gray-100 text-[10px] font-mono text-gray-400 line-clamp-6 mb-4 overflow-hidden">
                          {tpl.content}
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest">
                            {new Date(tpl.updatedAt).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={() => {
                              setSelectedTemplateId(tpl.id);
                              setNewsletterTab('send');
                            }}
                            className="text-[9px] font-bold uppercase tracking-widest text-brand-secondary hover:underline"
                          >
                            Usar este modelo
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}


              {newsletterTab === 'send' && (
                <div className="space-y-8 max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Step 1: Template */}
                    <div className="bg-white p-8 border border-gray-200 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs">1</div>
                        <h2 className="font-serif font-bold text-brand-primary">Modelo</h2>
                      </div>
                      <select 
                        value={selectedTemplateId} 
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                      >
                        <option value="">Selecionar Modelo...</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      {selectedTemplateId && (
                        <div className="bg-emerald-50 p-4 text-[10px] text-emerald-800 space-y-2">
                          <div className="flex items-start gap-2">
                            <Check size={14} className="mt-0.5" />
                            <span className="font-bold">Modelo pronto para envio.</span>
                          </div>
                          <div className="pt-2 border-t border-emerald-200">
                             <span className="text-[8px] uppercase font-bold text-emerald-600 block mb-0.5">Assunto:</span>
                             <span className="italic">"{templates.find(t => t.id === selectedTemplateId)?.subject}"</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Properties */}
                    <div className="bg-white p-8 border border-gray-200 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs">2</div>
                        <h2 className="font-serif font-bold text-brand-primary">Imóveis</h2>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {properties.filter(p => p.publicationStatus === 'publicado').map(prop => (
                          <label key={prop.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group">
                            <input 
                              type="checkbox" 
                              checked={selectedPropIds.includes(prop.id)}
                              onChange={e => {
                                if (e.target.checked) setSelectedPropIds([...selectedPropIds, prop.id]);
                                else setSelectedPropIds(selectedPropIds.filter(id => id !== prop.id));
                              }}
                              className="w-4 h-4 accent-brand-secondary" 
                            />
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-brand-primary truncate">{prop.title}</div>
                              <div className="text-[9px] text-gray-500">{prop.reference} • €{prop.price.toLocaleString()}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center py-2 border-t border-gray-100">
                        {selectedPropIds.length} Imóveis Selecionados
                      </div>
                    </div>

                    {/* Step 3: Recipients */}
                    <div className="bg-white p-8 border border-gray-200 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs">3</div>
                        <h2 className="font-serif font-bold text-brand-primary">Destinatários</h2>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {leads.filter(l => l.type === 'newsletter').map(lead => (
                          <label key={lead.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group">
                            <input 
                              type="checkbox" 
                              checked={selectedLeadIds.includes(lead.id)}
                              onChange={e => {
                                if (e.target.checked) setSelectedLeadIds([...selectedLeadIds, lead.id]);
                                else setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id));
                              }}
                              className="w-4 h-4 accent-brand-secondary" 
                            />
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-brand-primary truncate">{lead.name}</div>
                              <div className="text-[9px] text-gray-500">{lead.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center py-2 border-t border-gray-100">
                        {selectedLeadIds.length} Subscritores Selecionados
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-primary p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-white font-serif font-bold text-xl mb-1">Pronto para Enviar?</h3>
                      <p className="text-white/60 text-xs">Irá enviar para {selectedLeadIds.length} contactos com {selectedPropIds.length} imóveis em destaque.</p>
                    </div>
                    <button 
                      onClick={handleSendNewsletter}
                      disabled={isSending || !selectedTemplateId || selectedLeadIds.length === 0}
                      className="bg-brand-secondary text-white px-12 py-5 font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand-secondary/90 transition-all flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl"
                    >
                      {isSending ? <Loader2 size={18} className="animate-spin" /> : <MailIcon size={18} />}
                      Disparar Newsletter Agora
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-serif font-bold text-brand-primary text-xl">{previewTemplate.name}</h3>
                <p className="text-xs text-gray-500 mt-1"><span className="font-bold uppercase tracking-widest text-[10px]">Assunto:</span> {previewTemplate.subject}</p>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="p-2 hover:bg-gray-200 transition-colors">
                <LogOut size={20} className="rotate-180" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
              <div className="mx-auto shadow-lg bg-white border border-gray-200 min-h-full">
                 <div dangerouslySetInnerHTML={{ __html: previewTemplate.content.replace('[NOME]', 'Estimado Cliente').replace('[IMOVEIS]', '<div style="background:#f0f0f0; padding:20px; border:2px dashed #ccc; text-align:center; color:#888;">Os imóveis selecionados aparecerão aqui</div>') }} />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-800"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  setSelectedTemplateId(previewTemplate.id);
                  setPreviewTemplate(null);
                  setNewsletterTab('send');
                }}
                className="bg-brand-primary text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-primary/90 shadow-lg"
              >
                Usar este Modelo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WebsitePreview: React.FC<{ page: string, section: string, config: WebsiteConfig }> = ({ page, section, config }) => {
  if (page === 'home') {
    if (section === 'hero') {
      return (
        <div className="relative aspect-video bg-gray-900 overflow-hidden">
          <img src={config.heroImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000'} className="w-full h-full object-cover opacity-50" alt="Hero" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            <h1 className="text-2xl font-serif font-bold mb-2 leading-tight">{config.heroTitle || 'Procura casa no Algarve?'}</h1>
            <p className="text-[10px] text-white/80 max-w-[200px] line-clamp-2 mb-4 leading-relaxed">{config.heroSubtitle || 'O seu subtítulo aparecerá aqui.'}</p>
            <div className="bg-brand-secondary text-white px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest">{config.heroButtonText || 'Ver seleção'}</div>
          </div>
        </div>
      );
    }
    if (section === 'evaluation') {
      return (
        <div className="bg-brand-primary p-6 text-white grid grid-cols-2 gap-4 items-center">
          <div className="space-y-3">
            <span className="text-brand-secondary text-[8px] font-bold uppercase tracking-widest">Vender?</span>
            <h2 className="text-lg font-serif font-bold leading-tight">{config.evalTitle || 'Avaliação Gratuita'}</h2>
            <p className="text-[9px] text-white/70 line-clamp-4 leading-relaxed">{config.evalSubtitle || 'Texto de avaliação...'}</p>
          </div>
          <div className="aspect-square bg-gray-800 overflow-hidden">
            <img src={config.evalImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600'} className="w-full h-full object-cover" alt="Eval" />
          </div>
        </div>
      );
    }
    if (section === 'stats') {
      return (
        <div className="bg-brand-accent/20 p-8 grid grid-cols-2 gap-6 text-center">
           <div>
             <div className="text-2xl font-serif font-bold text-brand-primary">{config.statsYears || '15+'}</div>
             <div className="text-[7px] uppercase tracking-widest text-gray-500 font-bold">Anos</div>
           </div>
           <div>
             <div className="text-2xl font-serif font-bold text-brand-primary">{config.statsSold || '800+'}</div>
             <div className="text-[7px] uppercase tracking-widest text-gray-500 font-bold">Vendidos</div>
           </div>
           <div>
             <div className="text-2xl font-serif font-bold text-brand-primary">{config.statsClients || '1.2k'}</div>
             <div className="text-[7px] uppercase tracking-widest text-gray-500 font-bold">Clientes</div>
           </div>
           <div>
             <div className="text-2xl font-serif font-bold text-brand-primary">{config.statsTransparency || '100%'}</div>
             <div className="text-[7px] uppercase tracking-widest text-gray-500 font-bold">Rigor</div>
           </div>
        </div>
      );
    }
  }

  if (page === 'about') {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
             <h1 className="text-xl font-serif font-bold text-brand-primary leading-tight">{config.aboutTitle || 'História & Visão'}</h1>
             <p className="text-[9px] text-gray-600 leading-relaxed">{config.aboutText1 || 'Parágrafo 1...'}</p>
             <p className="text-[9px] text-gray-600 leading-relaxed">{config.aboutText2 || 'Parágrafo 2...'}</p>
          </div>
          <div className="relative">
            <img src={config.aboutImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'} className="w-full aspect-[4/5] object-cover" alt="About" />
            <div className="absolute -bottom-4 -right-4 bg-brand-secondary p-4 text-white">
              <span className="text-2xl font-serif font-bold block">{config.aboutYearsCount || '15'}</span>
              <span className="text-[6px] uppercase font-bold tracking-widest">Anos</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'services') {
    return (
      <div className="p-12 text-center bg-white">
        <span className="text-brand-secondary text-[8px] font-bold uppercase tracking-widest block mb-2">Serviços</span>
        <h1 className="text-2xl font-serif font-bold text-brand-primary mb-4">{config.servicesTitle || 'Soluções Imobiliárias'}</h1>
        <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed">{config.servicesSubtitle || 'Descrição dos serviços...'}</p>
      </div>
    );
  }

  if (page === 'contact') {
    if (section === 'main') {
      return (
        <div className="p-12 text-center bg-white border-b border-gray-100">
          <span className="text-brand-secondary text-[8px] font-bold uppercase tracking-widest block mb-2">Contacto</span>
          <h1 className="text-2xl font-serif font-bold text-brand-primary mb-4">{config.contactTitle || 'Fale Connosco'}</h1>
          <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed">{config.contactSubtitle || 'Apoio especializado...'}</p>
        </div>
      );
    }
    return (
      <div className="p-8 space-y-6 bg-gray-50">
        <div className="grid grid-cols-1 gap-4">
           <div className="bg-white p-4 border border-gray-100 flex items-center gap-3">
             <MapPin size={16} className="text-brand-secondary" />
             <div>
               <div className="text-[8px] font-bold text-brand-primary uppercase">Escritório</div>
               <div className="text-[9px] text-gray-500">{config.contactAddress || 'Av. 5 de Outubro...'}</div>
             </div>
           </div>
           <div className="bg-white p-4 border border-gray-100 flex items-center gap-3">
             <Phone size={16} className="text-brand-secondary" />
             <div>
               <div className="text-[8px] font-bold text-brand-primary uppercase">Telefone</div>
               <div className="text-[9px] text-gray-500">{config.contactPhone || '+351...'}</div>
             </div>
           </div>
           <div className="bg-brand-primary p-6 text-white text-center">
             <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4">Horário</h4>
             <div className="space-y-2 text-[8px]">
               <div className="flex justify-between border-b border-white/10 pb-1">
                 <span>Seg - Sex</span>
                 <span className="font-bold">{config.contactScheduleWeek || '09:00 - 18:30'}</span>
               </div>
               <div className="flex justify-between border-b border-white/10 pb-1">
                 <span>Sábado</span>
                 <span className="font-bold">{config.contactScheduleSat || '10:00 - 13:00'}</span>
               </div>
               <div className="flex justify-between">
                 <span>Domingo</span>
                 <span className="italic text-white/50">{config.contactScheduleSun || 'Encerrado'}</span>
               </div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return <div className="p-12 text-center text-gray-400 italic">Pré-visualização indisponível para esta secção.</div>;
};

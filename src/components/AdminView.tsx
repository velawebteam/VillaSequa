import React, { useState } from 'react';
import { Property, View } from '../types';
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
  ArrowRight
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

  const [sidebarTab, setSidebarTab] = useState<'imoveis' | 'website' | 'clientes'>('imoveis');
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'sync' | 'export' | 'edit' | 'venda' | 'arrendamento' | 'construcao'>('add');
  const [clientesTab, setClientesTab] = useState<'list' | 'leads' | 'add'>('list');
  const [websiteSection, setWebsiteSection] = useState<'hero' | 'evaluation'>('hero');
  const [websiteTab, setWebsiteTab] = useState<'titulos' | 'textos' | 'imagens'>('titulos');
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Website Config State
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>({});
  const [liveConfig, setLiveConfig] = useState<WebsiteConfig>({});
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');

  // Add Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<Property['type'] | ''>('Vivenda');
  const [status, setStatus] = useState<Property['status'] | ''>('Novo');
  const [commercialStatus, setCommercialStatus] = useState<Property['commercialStatus'] | ''>('disponível');
  const [publicationStatus, setPublicationStatus] = useState<Property['publicationStatus'] | ''>('publicado');
  const [category, setCategory] = useState<Property['category']>('venda');
  const [bedrooms, setBedrooms] = useState('0');
  const [bathrooms, setBathrooms] = useState('0');
  const [area, setArea] = useState('0');
  const [featuresStr, setFeaturesStr] = useState('');
  const [visibility, setVisibility] = useState<Property['visibility']>('visível');
  const [isFeatured, setIsFeatured] = useState(false);
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
      const [allProps, config, allClients, allLeads] = await Promise.all([
        getPropertiesFromFirestore(),
        getWebsiteConfig(),
        getClientsFromFirestore(),
        getLeadsFromFirestore()
      ]);
      setProperties(allProps);
      setWebsiteConfig({}); // Start with empty fields for "changes"
      setLiveConfig(config);
      setClients(allClients);
      setLeads(allLeads);
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
        images: uploadedImages,
        features: featuresStr.split(',').map(s => s.trim()).filter(Boolean),
        featured: isFeatured,
        category,
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
      setLocation('');
      setType('');
      setStatus('');
      setCommercialStatus('');
      setPublicationStatus('');
      setCategory('venda');
      setBedrooms('');
      setBathrooms('');
      setArea('');
      setUploadedImages([]);
      setFeaturesStr('');
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

          <div className="pt-6 pb-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold px-4">Sistema</div>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all text-white/70 hover:bg-white/5"
          >
            <ExternalLink size={18} /> Sair do BackOffice
          </button>

          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={18} /> Sair
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
                : `${websiteSection === 'hero' ? 'Hero' : 'Avaliação'} > ${websiteTab === 'titulos' ? 'Títulos' : websiteTab === 'textos' ? 'Textos' : 'Imagens'}`}
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
                  onClick={() => setActiveTab('sync')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'sync' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Upload size={18} /> Atualizar (XML)
                </button>
                <button 
                  onClick={() => setActiveTab('export')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'export' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Download size={18} /> Exportar
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
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Descrição Completa</label>
                      <textarea rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva as características principais..." className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm resize-none" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Preço (€)</label>
                      <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="450000" className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Categoria</label>
                      <select required value={category} onChange={(e) => setCategory(e.target.value as Property['category'])} className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer text-gray-900">
                        <option value="venda">Compra/Venda</option>
                        <option value="arrendamento">Arrendamento</option>
                        <option value="construcao">Nova Construção</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Localização</label>
                      <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Quinta do Lago, Algarve" className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Tipo de Imóvel</label>
                      <select required value={type} onChange={(e) => setType(e.target.value as Property['type'])} className={`w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer ${type === '' ? 'text-gray-400' : 'text-gray-900'}`}>
                        <option value="">Selecionar</option>
                        <option value="Vivenda">Vivenda</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Comercial">Comercial</option>
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

                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Características (separadas por vírgula)</label>
                      <input type="text" value={featuresStr} onChange={(e) => setFeaturesStr(e.target.value)} placeholder="Ex: Piscina, Ar Condicionado, Garagem" className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm" />
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
              {(activeTab === 'list' || activeTab === 'venda' || activeTab === 'arrendamento' || activeTab === 'construcao') && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-brand-primary mb-1">
                        {activeTab === 'list' ? 'Todos os Imóveis' : 
                         activeTab === 'venda' ? 'Imóveis para Compra/Venda' : 
                         activeTab === 'arrendamento' ? 'Imóveis para Arrendamento' : 'Imóveis em Nova Construção'}
                      </h2>
                      <p className="text-gray-500 text-sm">Gerencie os imóveis publicados no site.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-accent/40 px-4 py-2 font-bold text-brand-primary text-sm">
                        Total: {properties.filter(p => {
                          if (activeTab === 'venda') return p.category === 'venda';
                          if (activeTab === 'arrendamento') return p.category === 'arrendamento';
                          if (activeTab === 'construcao') return p.category === 'construcao';
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
                    </select>
                    <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} className="p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary">
                      <option value="">Visibilidade: Todas</option>
                      <option value="visível">Visível</option>
                      <option value="oculto">Oculto</option>
                    </select>
                    <input type="text" placeholder="Características" value={filterFeatures} onChange={(e) => setFilterFeatures(e.target.value)} className="p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary" />
                    <input type="number" placeholder="Preço Mín." value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full p-3 border border-gray-200 text-sm outline-none focus:border-brand-primary" />
                  </div>

                  <div className="space-y-4">
                    {properties.filter(p => {
                      // Category Filter
                      if (activeTab === 'venda' && p.category !== 'venda') return false;
                      if (activeTab === 'arrendamento' && p.category !== 'arrendamento') return false;
                      if (activeTab === 'construcao' && p.category !== 'construcao') return false;
                      
                      // Search Filters
                      return (p.title.toLowerCase().includes(searchTitle.toLowerCase())) &&
                             (searchRef === '' || p.id.toLowerCase().includes(searchRef.toLowerCase())) &&
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
                              {property.category === 'construcao' && <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-500 text-white px-2 py-0.5">Nova Construção</span>}
                              {property.featured && <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 flex items-center gap-1"><Star size={10} className="fill-white" /> Destaque</span>}
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${property.visibility === 'visível' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>{property.visibility}</span>
                            </div>
                            <h3 className="font-serif font-bold text-brand-primary text-lg">{property.title}</h3>
                            <p className="text-xs text-gray-500">{property.location} • €{property.price.toLocaleString()} {property.category === 'arrendamento' ? '/mês' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                          <button onClick={() => { setEditingProperty(property); setActiveTab('edit'); }} className="px-4 py-2.5 bg-brand-accent text-brand-primary hover:bg-gray-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all">Editar</button>
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
                  <h2 className="text-2xl font-serif font-bold text-brand-primary mb-6">Editar Imóvel: {editingProperty.title}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Título</label>
                      <input type="text" value={editingProperty.title} onChange={e => setEditingProperty({...editingProperty, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Descrição</label>
                      <textarea rows={4} value={editingProperty.description} onChange={e => setEditingProperty({...editingProperty, description: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Preço (€)</label>
                      <input type="number" value={editingProperty.price} onChange={e => setEditingProperty({...editingProperty, price: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Localização</label>
                      <input type="text" value={editingProperty.location} onChange={e => setEditingProperty({...editingProperty, location: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm" />
                      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 block">Categoria</label>
                      <select value={editingProperty.category} onChange={e => setEditingProperty({...editingProperty, category: e.target.value as Property['category']})} className="w-full p-3 bg-gray-50 border border-gray-200 text-sm cursor-pointer">
                        <option value="venda">Compra/Venda</option>
                        <option value="arrendamento">Arrendamento</option>
                        <option value="construcao">Nova Construção</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-4">
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
                        await updatePropertyInFirestore(editingProperty.id, editingProperty);
                        const allProps = await getPropertiesFromFirestore();
                        setProperties(allProps);
                        setActiveTab('list');
                        setEditingProperty(null);
                        onPropertiesChange();
                      } catch (err) { alert('Erro ao atualizar imóvel.'); } finally { setUploading(false); }
                    }} className="bg-brand-primary text-white px-8 py-3 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg">{uploading && <Loader2 className="animate-spin" size={14} />} Guardar Alterações</button>
                    <button onClick={() => { setActiveTab('list'); setEditingProperty(null); }} className="bg-gray-200 text-gray-800 px-8 py-3 font-bold text-xs uppercase tracking-widest transition-all">Cancelar</button>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: XML CRM SYNC */}
              {activeTab === 'sync' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                  <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2">Sincronização CRM</h2>
                  <p className="text-gray-500 text-sm mb-8">Importe a sua base de dados XML.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="border-2 border-dashed border-gray-300 p-10 text-center flex flex-col items-center justify-center bg-gray-50">
                      <FileCode size={48} className="text-brand-secondary mb-4" />
                      <label className="cursor-pointer bg-brand-primary text-white px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-md">
                        <span>Escolher Ficheiro XML</span>
                        <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                    <form onSubmit={handleXmlTextSync} className="flex flex-col">
                      <textarea rows={8} required value={xmlInput} onChange={(e) => setXmlInput(e.target.value)} placeholder="Cole o XML aqui..." className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-xs font-mono mb-4 resize-none" />
                      <button type="submit" className="w-full bg-brand-secondary text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-brand-secondary/90 shadow-md transition-all">Sincronizar Catálogo</button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: EXPORT XML */}
              {activeTab === 'export' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100 text-center">
                  <div className="max-w-2xl mx-auto py-8">
                    <Download size={48} className="text-brand-primary mx-auto mb-6" />
                    <h2 className="text-3xl font-serif font-bold text-brand-primary mb-4">Exportar Base de Dados</h2>
                    <button onClick={handleDownloadXml} className="bg-brand-secondary text-white px-12 py-5 font-bold uppercase tracking-widest text-xs hover:bg-brand-secondary/90 transition-all shadow-xl">Descarregar XML ({properties.length} imóveis)</button>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {sidebarTab === 'website' && (
            <div className="space-y-8">
              {/* Website Section Selection (Level 1) */}
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-brand-primary">Personalização do Website</h1>
                  <p className="text-gray-500 text-sm">Selecione a secção e o tipo de conteúdo que deseja alterar.</p>
                </div>
                
                <div className="flex gap-4 p-1 bg-gray-200 w-fit rounded-none">
                  <button 
                    onClick={() => setWebsiteSection('hero')}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${websiteSection === 'hero' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-brand-primary'}`}
                  >
                    Secção Hero (Topo)
                  </button>
                  <button 
                    onClick={() => setWebsiteSection('evaluation')}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${websiteSection === 'evaluation' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-brand-primary'}`}
                  >
                    Secção de Avaliação
                  </button>
                </div>
              </div>

              {/* Website Content Type Selection (Level 2) */}
              <div className="flex border-b border-gray-200 bg-white shadow-sm overflow-x-auto">
                <button 
                  onClick={() => setWebsiteTab('titulos')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    websiteTab === 'titulos' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Type size={18} /> Títulos
                </button>
                <button 
                  onClick={() => setWebsiteTab('textos')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    websiteTab === 'textos' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <AlignLeft size={18} /> Textos
                </button>
                <button 
                  onClick={() => setWebsiteTab('imagens')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    websiteTab === 'imagens' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <ImageIcon size={18} /> Imagens
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Editor Column */}
                <div className="lg:col-span-2 space-y-6">
                  {configSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                      <Check size={20} className="text-emerald-600" />
                      <span className="font-bold text-xs uppercase tracking-wider">{configSuccess}</span>
                    </div>
                  )}

                  <div className="bg-white shadow-xl p-8 border border-gray-100">
                    {websiteTab === 'titulos' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                          <Type className="text-brand-secondary" size={20} />
                          <h3 className="font-serif font-bold text-brand-primary text-xl">
                            {websiteSection === 'hero' ? 'Secção Hero: Título' : 'Secção Avaliação: Título'}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Título Principal</label>
                          <input 
                            type="text" 
                            value={websiteSection === 'hero' ? (websiteConfig.heroTitle || '') : (websiteConfig.evalTitle || '')} 
                            onChange={e => setWebsiteConfig({
                              ...websiteConfig, 
                              [websiteSection === 'hero' ? 'heroTitle' : 'evalTitle']: e.target.value
                            })}
                            placeholder={websiteSection === 'hero' ? (liveConfig.heroTitle || 'Título Hero') : (liveConfig.evalTitle || 'Título Avaliação')}
                            className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm font-serif"
                          />
                        </div>
                        {websiteSection === 'hero' && (
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Texto do Botão</label>
                            <input 
                              type="text" 
                              value={websiteConfig.heroButtonText || ''} 
                              onChange={e => setWebsiteConfig({...websiteConfig, heroButtonText: e.target.value})}
                              placeholder={liveConfig.heroButtonText || 'Ver seleção'}
                              className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {websiteTab === 'textos' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                          <AlignLeft className="text-brand-secondary" size={20} />
                          <h3 className="font-serif font-bold text-brand-primary text-xl">
                            {websiteSection === 'hero' ? 'Secção Hero: Texto' : 'Secção Avaliação: Texto'}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Subtítulo / Descrição</label>
                          <textarea 
                            rows={6}
                            value={websiteSection === 'hero' ? (websiteConfig.heroSubtitle || '') : (websiteConfig.evalSubtitle || '')} 
                            onChange={e => setWebsiteConfig({
                              ...websiteConfig, 
                              [websiteSection === 'hero' ? 'heroSubtitle' : 'evalSubtitle']: e.target.value
                            })}
                            placeholder={websiteSection === 'hero' ? (liveConfig.heroSubtitle || 'Subtítulo Hero') : (liveConfig.evalSubtitle || 'Subtítulo Avaliação')}
                            className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm leading-relaxed resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {websiteTab === 'imagens' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                          <ImageIcon className="text-brand-secondary" size={20} />
                          <h3 className="font-serif font-bold text-brand-primary text-xl">
                            {websiteSection === 'hero' ? 'Secção Hero: Imagem' : 'Secção Avaliação: Imagem'}
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Imagem Principal</label>
                          
                          {(websiteSection === 'hero' ? websiteConfig.heroImage : websiteConfig.evalImage) && (
                            <div className="relative aspect-video w-full overflow-hidden border border-gray-200 group">
                              <img src={websiteSection === 'hero' ? websiteConfig.heroImage : websiteConfig.evalImage} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={() => setWebsiteConfig({
                                    ...websiteConfig, 
                                    [websiteSection === 'hero' ? 'heroImage' : 'evalImage']: ''
                                  })}
                                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          )}

                          <label className="cursor-pointer flex flex-col items-center justify-center gap-3 p-12 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-brand-primary hover:bg-gray-100 transition-all text-sm text-gray-500 group">
                            {uploading ? (
                              <Loader2 className="animate-spin text-brand-secondary" size={32} />
                            ) : (
                              <ImagePlus size={32} className="text-brand-secondary group-hover:scale-110 transition-transform" />
                            )}
                            <div className="text-center">
                              <span className="font-bold text-brand-primary block">{uploading ? 'A carregar...' : 'Alterar Imagem'}</span>
                              <span className="text-[10px] uppercase tracking-widest mt-1">PNG, JPG ou SVG (Máx 1MB)</span>
                            </div>
                            <input 
                              type="file" 
                              disabled={uploading}
                              accept=".png,.jpg,.jpeg,.svg" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploading(true);
                                try {
                                  const url = await uploadImage(file, `config/${websiteSection}_${Date.now()}_${file.name}`);
                                  setWebsiteConfig({
                                    ...websiteConfig, 
                                    [websiteSection === 'hero' ? 'heroImage' : 'evalImage']: url
                                  });
                                } catch (err) {
                                  alert('Erro ao carregar imagem.');
                                } finally {
                                  setUploading(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Bottom Save Button */}
                    <div className="pt-8 border-t border-gray-100 flex justify-end">
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
                            <Save size={18} /> Guardar Alterações
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Column */}
                <div className="space-y-6">
                  <div className="bg-brand-primary p-6 border-l-4 border-brand-secondary shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Palette className="text-brand-secondary" size={20} />
                      <h3 className="text-white font-serif font-bold">Pré-visualização</h3>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">Pré-visualização da secção que está a editar.</p>
                  </div>

                  {websiteSection === 'hero' ? (
                    <div className="bg-white p-4 shadow-xl border border-gray-100 overflow-hidden">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4 border-b border-gray-50 pb-2">Layout do Hero</div>
                      <div className="relative aspect-video bg-gray-900 overflow-hidden">
                        {(websiteConfig.heroImage || liveConfig.heroImage) ? (
                          <img src={websiteConfig.heroImage || liveConfig.heroImage} className="w-full h-full object-cover opacity-60" alt="Preview" />
                        ) : (
                          <div className="w-full h-full bg-brand-primary/20 flex items-center justify-center">
                            <Building2 className="text-white/10" size={64} />
                          </div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                          <h4 className="text-white font-serif font-bold text-lg leading-tight mb-2">
                            {websiteConfig.heroTitle || liveConfig.heroTitle || 'Título Hero'}
                          </h4>
                          <p className="text-white/70 text-[8px] line-clamp-2 px-4 mb-4">
                            {websiteConfig.heroSubtitle || liveConfig.heroSubtitle || 'O seu subtítulo aparecerá aqui.'}
                          </p>
                          <div className="bg-brand-secondary text-white px-4 py-2 text-[8px] font-bold uppercase tracking-widest">
                            {websiteConfig.heroButtonText || liveConfig.heroButtonText || 'Botão'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-4 shadow-xl border border-gray-100 overflow-hidden">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4 border-b border-gray-50 pb-2">Layout de Avaliação</div>
                      <div className="bg-brand-primary p-6 text-center">
                        <h4 className="text-white font-serif font-bold text-sm mb-4 leading-tight">
                          {websiteConfig.evalTitle || liveConfig.evalTitle || 'Receba uma avaliação gratuita do seu imóvel em 24h.'}
                        </h4>
                        <div className="relative aspect-video bg-gray-800 mb-4 overflow-hidden">
                           {(websiteConfig.evalImage || liveConfig.evalImage) ? (
                            <img src={websiteConfig.evalImage || liveConfig.evalImage} className="w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                              <ImagePlus className="text-white" size={32} />
                            </div>
                          )}
                        </div>
                        <p className="text-white/70 text-[8px] line-clamp-3">
                          {websiteConfig.evalSubtitle || liveConfig.evalSubtitle || 'Sabemos o valor real do seu património...'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 p-6 border-l-4 border-amber-400 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Settings className="text-amber-600" size={20} />
                      <h3 className="text-amber-900 font-serif font-bold">Dica</h3>
                    </div>
                    <p className="text-amber-800 text-xs leading-relaxed">Certifique-se de que as imagens têm boa qualidade para manter o aspeto premium do site.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sidebarTab === 'clientes' && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-brand-primary">Gestão de Clientes & Leads</h1>
                  <p className="text-gray-500 text-sm">Acompanhe os seus contactos e formulários capturados.</p>
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
                  <button 
                    onClick={() => setClientesTab('leads')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'leads' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <MailIcon size={18} /> Leads do Website ({leads.length})
                  </button>
                </div>
              </div>

              {clientesTab === 'add' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100 max-w-4xl">
                   <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2">Adicionar Novo Cliente</h2>
                   <p className="text-gray-500 text-sm mb-8">Registe um novo cliente na sua base de dados CRM.</p>

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
                  <div className="mb-8">
                    <h2 className="text-2xl font-serif font-bold text-brand-primary mb-1">Base de Dados de Clientes</h2>
                    <p className="text-gray-500 text-sm">Total de {clients.length} registos encontrados.</p>
                  </div>

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

              {clientesTab === 'leads' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                   <div className="mb-8">
                    <h2 className="text-2xl font-serif font-bold text-brand-primary mb-1">Leads Capturados</h2>
                    <p className="text-gray-500 text-sm">Formulários preenchidos no website por potenciais clientes.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leads.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-gray-400 italic">Nenhum lead capturado até ao momento.</div>
                    ) : (
                      leads.map(lead => (
                        <div key={lead.id} className="bg-gray-50 border border-gray-200 p-6 relative group">
                           <button onClick={() => handleDeleteLead(lead.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                             <Trash2 size={14} />
                           </button>
                           <div className="flex items-center gap-2 mb-4">
                              <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 ${
                                lead.type === 'evaluation' ? 'bg-amber-500 text-white' : 
                                lead.type === 'contact' ? 'bg-brand-primary text-white' : 'bg-gray-500 text-white'
                              }`}>
                                {lead.type === 'evaluation' ? 'Avaliação' : lead.type === 'contact' ? 'Contacto' : 'Info'}
                              </span>
                              <span className="text-[10px] text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                           </div>
                           <h3 className="font-bold text-brand-primary mb-1">{lead.name}</h3>
                           <div className="text-xs text-gray-500 mb-4">{lead.email} • {lead.phone}</div>
                           
                           {lead.message && (
                             <div className="bg-white p-3 border border-gray-100 text-xs text-gray-600 mb-4 italic leading-relaxed">
                               "{lead.message}"
                             </div>
                           )}

                           <div className="space-y-1">
                             {lead.location && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><MapPin size={10} /> {lead.location}</div>}
                             {lead.propertyType && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><Briefcase size={10} /> {lead.propertyType}</div>}
                           </div>

                           <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${lead.status === 'new' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">{lead.status}</span>
                              </div>
                              <a href={`mailto:${lead.email}`} className="text-brand-secondary font-bold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1">Responder <ArrowRight size={10} /></a>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};



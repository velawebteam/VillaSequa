import React, { useState } from 'react';
import { Property, View } from '../types';
import { getProperties, addProperty, deleteProperty, deleteAllProperties, toggleFeaturedProperty, parsePropertiesXml, saveProperties, exportPropertiesToXml } from '../lib/propertyStore';
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
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminViewProps {
  onViewChange: (v: View) => void;
  onPropertiesChange: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onViewChange, onPropertiesChange }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'sync'>('add');
  const [properties, setProperties] = useState<Property[]>(getProperties());

  // Add Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<Property['type'] | ''>('');
  const [status, setStatus] = useState<Property['status'] | ''>('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [area, setArea] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featuresStr, setFeaturesStr] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // XML Sync state
  const [xmlInput, setXmlInput] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'vela' && password === '0821053') {
      setIsLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !status) {
      alert('Por favor, selecione o Tipo de Imóvel e o Estado.');
      return;
    }
    const newProp = addProperty({
      title,
      description,
      price: parseFloat(price) || 350000,
      location,
      type: type as Property['type'],
      status: status as Property['status'],
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseInt(bathrooms) || 0,
      area: parseFloat(area) || 0,
      images: [imageUrl],
      features: featuresStr.split(',').map(s => s.trim()).filter(Boolean),
      featured: isFeatured
    });

    setProperties(getProperties());
    onPropertiesChange();
    setSuccessMsg(`Imóvel "${newProp.title}" publicado com sucesso!`);
    
    // Reset form
    setTitle('');
    setDescription('');
    setPrice('');
    setLocation('');
    setType('');
    setStatus('');
    setBedrooms('');
    setBathrooms('');
    setArea('');
    setImageUrl('');
    setFeaturesStr('');
    setIsFeatured(false);

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar este imóvel?')) {
      const updated = deleteProperty(id);
      setProperties(updated);
      onPropertiesChange();
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('ATENÇÃO: Tem a certeza absoluta que deseja ELIMINAR TODOS OS IMÓVEIS do site? Esta ação não pode ser desfeita.')) {
      const updated = deleteAllProperties();
      setProperties(updated);
      onPropertiesChange();
      alert('Todos os imóveis foram eliminados com sucesso.');
    }
  };

  const handleToggleFeatured = (id: string) => {
    const updated = toggleFeaturedProperty(id);
    setProperties(updated);
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
            saveProperties(parsed);
            setProperties(parsed);
            onPropertiesChange();
            setSyncSuccess(`Sincronização bem sucedida! ${parsed.length} imóveis importados do CRM.`);
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
        saveProperties(parsed);
        setProperties(parsed);
        onPropertiesChange();
        setSyncSuccess(`Sincronização bem sucedida! ${parsed.length} imóveis importados.`);
        setXmlInput('');
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
              onClick={() => onViewChange('home')}
              className="text-xs text-gray-500 hover:text-brand-primary flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft size={14} /> Voltar ao site público
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header bar */}
        <div className="bg-white shadow-sm p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-primary text-brand-secondary">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-brand-primary">Gestão Imobiliária & CRM</h1>
              <p className="text-xs text-gray-500">Sessão iniciada como <strong>vela</strong></p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onViewChange('home')}
              className="text-xs uppercase tracking-wider font-bold text-gray-700 bg-gray-100 px-4 py-2 hover:bg-gray-200 transition-all"
            >
              Ver Site Público
            </button>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="text-xs uppercase tracking-wider font-bold text-red-600 bg-red-50 px-4 py-2 hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8 bg-white shadow-sm overflow-x-auto">
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'add' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <PlusCircle size={18} /> Adição Manual de Imóveis
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'list' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <List size={18} /> Ver Lista de Imóveis ({properties.length})
          </button>
          <button 
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'sync' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Upload size={18} /> Atualizar Imóveis (CRM XML)
          </button>
          <button 
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'export' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Download size={18} /> Transferir Imóveis (XML)
          </button>
        </div>

        {/* TAB 1: ADD MANUAL PROPERTY */}
        {activeTab === 'add' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12">
            <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2">Adicionar Novo Imóvel Manualmente</h2>
            <p className="text-gray-500 text-sm mb-8">Preencha os campos abaixo. O imóvel será publicado instantaneamente e ficará visível no site público.</p>

            {successMsg && (
              <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-center gap-3">
                <Check size={20} className="text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Título do Imóvel</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Luxuosa Moradia V4 em Vilamoura"
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Descrição Completa</label>
                <textarea 
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva as características principais, acabamentos, localização..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Preço (€)</label>
                <input 
                  type="number" 
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="450000"
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Localização</label>
                <input 
                  type="text" 
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Quinta do Lago, Algarve"
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Tipo de Imóvel</label>
                <select 
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value as Property['type'])}
                  className={`w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer ${type === '' ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" className="text-gray-400">Selecionar</option>
                  <option value="Vivenda" className="text-gray-900">Vivenda</option>
                  <option value="Apartamento" className="text-gray-900">Apartamento</option>
                  <option value="Terreno" className="text-gray-900">Terreno</option>
                  <option value="Comercial" className="text-gray-900">Comercial</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Estado</label>
                <select 
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Property['status'])}
                  className={`w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm cursor-pointer ${status === '' ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" className="text-gray-400">Selecionar</option>
                  <option value="Novo" className="text-gray-900">Novo</option>
                  <option value="Usado" className="text-gray-900">Usado</option>
                  <option value="Em Construção" className="text-gray-900">Em Construção</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Quartos (T0, T1...)</label>
                <input 
                  type="number" 
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Casas de Banho</label>
                <input 
                  type="number" 
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Área Útil (m²)</label>
                <input 
                  type="number" 
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">URL da Imagem Principal</label>
                <input 
                  type="url" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">Características (separadas por vírgula)</label>
                <input 
                  type="text" 
                  value={featuresStr}
                  onChange={(e) => setFeaturesStr(e.target.value)}
                  placeholder="Piscina, Vista Mar, Ar Condicionado..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 accent-brand-primary cursor-pointer"
                />
                <label htmlFor="featuredCheck" className="text-sm font-bold text-gray-800 cursor-pointer">
                  Destacar este imóvel na homepage (Imóveis em Destaque)
                </label>
              </div>

              <div className="md:col-span-2 pt-4">
                <button 
                  type="submit"
                  className="w-full bg-brand-primary text-white py-5 font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand-primary/90 transition-all shadow-xl"
                >
                  Publicar Imóvel Agora
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TAB 2: LIST & MANAGE PROPERTIES */}
        {activeTab === 'list' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-brand-primary mb-1">Lista de Imóveis Atuais</h2>
                <p className="text-gray-500 text-sm">Gerencie os imóveis publicados no site, destaque-os ou elimine-os.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-brand-accent/40 px-4 py-2 font-bold text-brand-primary text-sm">
                  Total: {properties.length} imóveis
                </div>
                {properties.length > 0 && (
                  <button 
                    onClick={handleDeleteAll}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Eliminar Lista de Imóveis
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {properties.map((property) => (
                <div key={property.id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50 border border-gray-200 gap-6">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <img 
                      src={property.images[0]} 
                      alt={property.title} 
                      className="w-24 h-20 object-cover shadow-sm shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-secondary text-white px-2 py-0.5">
                          {property.type}
                        </span>
                        {property.featured && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 flex items-center gap-1">
                            <Star size={10} className="fill-white" /> Destaque
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-brand-primary text-lg">{property.title}</h3>
                      <p className="text-xs text-gray-500">{property.location} • €{property.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => handleToggleFeatured(property.id)}
                      className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                        property.featured 
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Star size={14} className={property.featured ? 'fill-amber-800' : ''} />
                      {property.featured ? 'Remover Destaque' : 'Destacar'}
                    </button>

                    <button 
                      onClick={() => handleDelete(property.id)}
                      className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 3: XML CRM SYNC */}
        {activeTab === 'sync' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12">
            <h2 className="text-2xl font-serif font-bold text-brand-primary mb-2">Atualizar Lista via Ficheiro XML (CRM)</h2>
            <p className="text-gray-500 text-sm mb-8">Faça o upload do ficheiro XML gerado pelo seu CRM imobiliário para atualizar instantaneamente o catálogo do site.</p>

            {syncSuccess && (
              <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-center gap-3">
                <Check size={20} className="text-emerald-600" />
                <span>{syncSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-2 border-dashed border-gray-300 p-10 text-center flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/50 transition-all">
                <FileCode size={48} className="text-brand-secondary mb-4" />
                <h3 className="font-serif font-bold text-lg mb-2">Carregar Ficheiro XML</h3>
                <p className="text-xs text-gray-500 mb-6">Selecione o ficheiro XML exportado do seu CRM.</p>
                <label className="cursor-pointer bg-brand-primary text-white px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-md">
                  <span>Escolher Ficheiro</span>
                  <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="flex flex-col">
                <h3 className="font-serif font-bold text-lg mb-2">Ou Cole o Código XML</h3>
                <p className="text-xs text-gray-500 mb-4">Em alternativa, cole o conteúdo XML diretamente no campo abaixo:</p>
                <form onSubmit={handleXmlTextSync} className="flex-1 flex flex-col">
                  <textarea 
                    rows={8}
                    required
                    value={xmlInput}
                    onChange={(e) => setXmlInput(e.target.value)}
                    placeholder="<properties><property><title>...</title>...</property></properties>"
                    className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-xs font-mono mb-4 flex-1 resize-none"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-brand-secondary text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand-secondary/90 transition-all shadow-md"
                  >
                    Sincronizar Catálogo XML
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-12 bg-amber-50 border border-amber-200 p-6">
              <h4 className="font-bold text-amber-900 text-sm mb-2">Estrutura XML Suportada:</h4>
              <p className="text-xs text-amber-800 leading-relaxed font-mono">
                &lt;properties&gt;<br/>
                &nbsp;&nbsp;&lt;property&gt;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;title&gt;Título do Imóvel&lt;/title&gt;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;description&gt;Descrição...&lt;/description&gt;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;price&gt;500000&lt;/price&gt;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;location&gt;Algarve&lt;/location&gt;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;type&gt;Vivenda&lt;/type&gt;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;bedrooms&gt;4&lt;/bedrooms&gt;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;image&gt;https://...&lt;/image&gt;<br/>
                &nbsp;&nbsp;&lt;/property&gt;<br/>
                &lt;/properties&gt;
              </p>
            </div>
          </motion.div>
        )}

        {/* TAB 4: TRANSFER / EXPORT XML */}
        {activeTab === 'export' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 text-center">
            <div className="max-w-2xl mx-auto py-8">
              <div className="w-20 h-20 bg-brand-accent/40 text-brand-primary flex items-center justify-center rounded-full mx-auto mb-6">
                <Download size={36} />
              </div>
              <h2 className="text-3xl font-serif font-bold text-brand-primary mb-4">Transferir Lista de Imóveis (XML)</h2>
              <p className="text-gray-600 text-base mb-8 leading-relaxed">
                Transfira e descarregue a lista completa de todos os imóveis atualmente registados no site em formato XML padrão. Ideal para backups ou sincronização com CRMs externos.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 p-6 mb-8 text-left font-mono text-xs text-gray-700 max-h-48 overflow-y-auto">
                {exportPropertiesToXml(properties)}
              </div>

              <button 
                onClick={handleDownloadXml}
                className="bg-brand-secondary text-white px-12 py-5 font-bold uppercase tracking-[0.2em] text-xs hover:bg-brand-secondary/90 transition-all shadow-xl inline-flex items-center gap-3"
              >
                <Download size={18} /> Descarregar Ficheiro XML ({properties.length} imóveis)
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

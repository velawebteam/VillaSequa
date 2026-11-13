import React, { useState, useEffect, useRef } from 'react';
import { Property, View, NewsletterTemplate, PROPERTY_FEATURES, ENERGY_RATES, FONTS } from '../types';
import { getProperties, addProperty, deleteProperty, deleteAllProperties, toggleFeaturedProperty, parsePropertiesXml, saveProperties, exportPropertiesToXml, exportPropertiesForPortalsXml, REAL_ESTATE_PORTALS } from '../lib/propertyStore';
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
  updateClientInFirestore,
  getClientsFromFirestore,
  deleteClientFromFirestore,
  getLeadsFromFirestore,
  updateLeadInFirestore,
  deleteLeadFromFirestore
} from '../lib/firestoreService';
import { Client, Lead } from '../types';
import { uploadImage } from '../lib/storageService';
import {
  getWebsiteConfig,
  updateWebsiteConfig,
  WebsiteConfig,
  DEFAULT_HEADER_LINKS_PT,
  DEFAULT_HEADER_LINKS_EN,
  getResolvedHeaderLinks,
  HeaderLinkConfig
} from '../lib/websiteService';
import { 
  getTemplates, 
  addTemplate, 
  updateTemplate, 
  deleteTemplate, 
  logSentNewsletter 
} from '../lib/newsletterService';
import {
  extractLeadSpecifications,
  getTopMatchedProperties,
  evaluatePropertyMatch,
  formatWhatsAppUrl,
  sanitizeWhatsAppPhone
} from '../lib/matchingService';


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
  Mail,
  MessageCircle,
  SlidersHorizontal,
  CheckCircle2,
  X,
  BedDouble,
  Bath,
  Maximize2,
  Edit3,
  ArrowLeftRight,
  Send,
  Inbox,
  RefreshCw,
  Ban,
  LayoutDashboard,
  Heart,
  Search,
  LayoutGrid,
  ChevronRight,
  Monitor,
  Tablet,
  Smartphone,
  Menu,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Instagram,
  Facebook,
  Linkedin,
  GripVertical,
  Globe,
  PanelTop,
  PanelBottom,
  FileText,
  Rss,
  Share2
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

  const [sidebarTab, setSidebarTab] = useState<'dashboard' | 'imoveis' | 'website' | 'clientes' | 'leads' | 'matching' | 'newsletter'>('dashboard');
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'meus' | 'sync' | 'export' | 'edit' | 'venda' | 'arrendamento' | 'construcao' | 'rascunho' | 'xml'>('add');
  const [prevTab, setPrevTab] = useState<typeof activeTab>('list');
  const [xmlSubTab, setXmlSubTab] = useState<'export_portals' | 'import' | 'export'>('export_portals');
  const [selectedFeedPropIds, setSelectedFeedPropIds] = useState<string[]>([]);
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [showPortalExportModal, setShowPortalExportModal] = useState(false);
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [feedExportResult, setFeedExportResult] = useState<{
    propertiesCount: number;
    propertyTitles: string[];
    portalNames: string[];
    fileName: string;
    xmlContent: string;
    timestamp: string;
  } | null>(null);
  const [clientesTab, setClientesTab] = useState<'list' | 'meus' | 'compra' | 'venda' | 'arrendamento' | 'transfer' | 'add'>('list');
  const [clientFeedback, setClientFeedback] = useState('');
  const [transferClientId, setTransferClientId] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferLoadingId, setTransferLoadingId] = useState<string | null>(null);
  const [refreshingClients, setRefreshingClients] = useState(false);
  const [refreshingDashboard, setRefreshingDashboard] = useState(false);
  const [websiteArea, setWebsiteArea] = useState<'header' | 'footer' | 'pages'>('header');
  const [headerLang, setHeaderLang] = useState<'pt' | 'en'>('pt');
  const [draggedHeaderIdx, setDraggedHeaderIdx] = useState<number | null>(null);
  const [websitePage, setWebsitePage] = useState<'home' | 'about' | 'services' | 'contact'>('home');
  const [websiteSection, setWebsiteSection] = useState<string>('hero');
  const [previewMode, setPreviewMode] = useState<'editor' | 'split'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [leadsSubTab, setLeadsSubTab] = useState<'info' | 'evaluation' | 'contact' | 'newsletter' | 'match'>('info');
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

  // Matching State
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [editingSpecsLeadId, setEditingSpecsLeadId] = useState<string | null>(null);
  const [specsDraft, setSpecsDraft] = useState<{
    location: string;
    propertyType: string;
    category: 'venda' | 'arrendamento' | 'construcao' | '';
    bedrooms: string;
    maxPrice: string;
    desiredFeatures: string[];
  }>({
    location: '',
    propertyType: '',
    category: '',
    bedrooms: '',
    maxPrice: '',
    desiredFeatures: []
  });
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [matchingDetailProperty, setMatchingDetailProperty] = useState<Property | null>(null);
  const [visualEmailModal, setVisualEmailModal] = useState<{ lead: Lead; assignedProps: Property[] } | null>(null);



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

  const renderFontSelector = (configKey: keyof WebsiteConfig, label: string) => (
    <div className="mt-2">
      <label className="text-[9px] uppercase font-bold text-brand-secondary mb-1 block">Fonte: {label}</label>
      <select 
        value={websiteConfig[configKey] || liveConfig[configKey] || ''} 
        onChange={e => setWebsiteConfig({...websiteConfig, [configKey]: e.target.value})}
        className="w-full p-2 bg-white border border-gray-200 text-[10px] outline-none focus:border-brand-primary"
      >
        <option value="">Fonte Padrão</option>
        {FONTS.map(font => (
          <option key={font.id} value={font.id} className={font.id}>{font.name}</option>
        ))}
      </select>
    </div>
  );
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
    if (password === '12345') {
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
        visibility,
        createdBy: username
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

  const triggerXmlDownload = (xmlContent: string, fileName: string) => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadXml = () => {
    const xmlData = exportPropertiesToXml(properties);
    triggerXmlDownload(xmlData, `imoveis_export_${new Date().toISOString().slice(0, 10)}.xml`);
  };

  const handleExecutePortalExport = () => {
    const selectedProps = properties.filter(p => selectedFeedPropIds.includes(p.id));
    if (selectedProps.length === 0 || selectedPortals.length === 0) return;

    const xmlContent = exportPropertiesForPortalsXml(selectedProps, selectedPortals, username);
    const fileName = `feed_portais_${new Date().toISOString().slice(0, 10)}.xml`;
    triggerXmlDownload(xmlContent, fileName);

    const portalNames = REAL_ESTATE_PORTALS
      .filter(portal => selectedPortals.includes(portal.id))
      .map(portal => portal.name);

    setFeedExportResult({
      propertiesCount: selectedProps.length,
      propertyTitles: selectedProps.map(p => `${p.reference ? `[${p.reference}] ` : ''}${p.title}`),
      portalNames,
      fileName,
      xmlContent,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    });
    setShowPortalExportModal(false);
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

  const normalizeUser = (val?: string) => (val || '').trim().toLowerCase();

  const refreshClientsList = async () => {
    setRefreshingClients(true);
    try {
      const allClients = await getClientsFromFirestore();
      setClients(allClients);
    } catch (err) {
      console.error('Erro ao atualizar clientes:', err);
    } finally {
      setRefreshingClients(false);
    }
  };

  const refreshDashboardData = async () => {
    setRefreshingDashboard(true);
    try {
      const [allProps, allClients, allLeads, allTemplates] = await Promise.all([
        getPropertiesFromFirestore(),
        getClientsFromFirestore(),
        getLeadsFromFirestore(),
        getTemplates()
      ]);
      setProperties(allProps);
      setClients(allClients);
      setLeads(allLeads);
      setTemplates(allTemplates);
    } catch (err) {
      console.error('Erro ao atualizar dashboard:', err);
    } finally {
      setRefreshingDashboard(false);
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
        interest: clientInterest,
        createdBy: username.trim()
      });
      const allClients = await getClientsFromFirestore();
      setClients(allClients);
      setClientFirstName('');
      setClientLastName('');
      setClientPhone('');
      setClientEmail('');
      setClientInterest('compra');
      setClientesTab('meus');
      setClientFeedback('Cliente adicionado com sucesso aos seus clientes!');
      setTimeout(() => setClientFeedback(''), 4000);
    } catch (err) {
      console.error('Erro ao adicionar cliente:', err);
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

  const handleSendClientTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = transferRecipient.trim();
    if (!transferClientId || !recipient) return;
    if (normalizeUser(recipient) === normalizeUser(username)) {
      setClientFeedback('Não pode enviar um cliente para si próprio.');
      setTimeout(() => setClientFeedback(''), 4000);
      return;
    }

    setTransferLoadingId(transferClientId);
    try {
      await updateClientInFirestore(transferClientId, {
        transferFrom: username.trim(),
        transferTo: recipient,
        transferStatus: 'pending',
        transferNote: transferNote.trim(),
        transferAt: new Date().toISOString()
      });
      const allClients = await getClientsFromFirestore();
      setClients(allClients);
      const sentClient = allClients.find(c => c.id === transferClientId);
      setTransferClientId('');
      setTransferRecipient('');
      setTransferNote('');
      setClientFeedback(
        sentClient
          ? `Cliente ${sentClient.firstName} ${sentClient.lastName} enviado para "${recipient}". Aguarda aceitação.`
          : `Cliente enviado para "${recipient}". Aguarda aceitação.`
      );
      setTimeout(() => setClientFeedback(''), 5000);
    } catch (err) {
      console.error('Erro ao enviar cliente:', err);
    } finally {
      setTransferLoadingId(null);
    }
  };

  const handleAcceptClientTransfer = async (client: Client) => {
    setTransferLoadingId(client.id);
    try {
      await updateClientInFirestore(client.id, {
        createdBy: username.trim(),
        transferStatus: 'accepted',
        transferTo: '',
        transferAt: new Date().toISOString()
      });
      const allClients = await getClientsFromFirestore();
      setClients(allClients);
      setClientFeedback(`Cliente ${client.firstName} ${client.lastName} aceite e adicionado a "Meus Clientes"!`);
      setTimeout(() => setClientFeedback(''), 5000);
    } catch (err) {
      console.error('Erro ao aceitar cliente:', err);
    } finally {
      setTransferLoadingId(null);
    }
  };

  const handleRejectClientTransfer = async (client: Client) => {
    setTransferLoadingId(client.id);
    try {
      await updateClientInFirestore(client.id, {
        transferStatus: 'rejected',
        transferTo: '',
        transferAt: new Date().toISOString()
      });
      const allClients = await getClientsFromFirestore();
      setClients(allClients);
      setClientFeedback(`Transferência do cliente ${client.firstName} ${client.lastName} recusada.`);
      setTimeout(() => setClientFeedback(''), 4000);
    } catch (err) {
      console.error('Erro ao recusar cliente:', err);
    } finally {
      setTransferLoadingId(null);
    }
  };

  const handleCancelClientTransfer = async (client: Client) => {
    setTransferLoadingId(client.id);
    try {
      await updateClientInFirestore(client.id, {
        transferStatus: '',
        transferTo: '',
        transferNote: ''
      });
      const allClients = await getClientsFromFirestore();
      setClients(allClients);
      setClientFeedback(`Envio do cliente ${client.firstName} ${client.lastName} cancelado.`);
      setTimeout(() => setClientFeedback(''), 4000);
    } catch (err) {
      console.error('Erro ao cancelar envio de cliente:', err);
    } finally {
      setTransferLoadingId(null);
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
            onClick={() => setSidebarTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all rounded-none ${sidebarTab === 'dashboard' ? 'bg-brand-secondary text-white shadow-lg' : 'hover:bg-white/5 text-white/70'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>

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
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold transition-all rounded-none ${sidebarTab === 'clientes' ? 'bg-brand-secondary text-white shadow-lg' : 'hover:bg-white/5 text-white/70'}`}
          >
            <span className="flex items-center gap-3"><Users size={18} /> Clientes</span>
            {clients.filter(c => normalizeUser(c.transferTo) === normalizeUser(username) && c.transferStatus === 'pending').length > 0 && (
              <span className="bg-amber-400 text-brand-primary text-[10px] font-bold px-1.5 py-0.5 leading-none">
                {clients.filter(c => normalizeUser(c.transferTo) === normalizeUser(username) && c.transferStatus === 'pending').length}
              </span>
            )}
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
              {sidebarTab === 'dashboard' ? 'Visão Geral' :
               sidebarTab === 'imoveis' ? 'Gestão de Imóveis' :
               sidebarTab === 'clientes' ? 'Carteira de Clientes' :
               sidebarTab === 'leads' ? 'Contactos & Leads' :
               sidebarTab === 'matching' ? 'Matching' :
               sidebarTab === 'newsletter' ? 'Comunicação' :
               'Personalização do Website'}
            </h2>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <p className="text-sm font-bold text-brand-primary">
              {sidebarTab === 'dashboard' ? 'Dashboard Principal'
                : sidebarTab === 'imoveis' 
                ? (activeTab === 'add' ? 'Adicionar Novo' : 
                   activeTab === 'list' ? 'Todos os Imóveis' : 
                   activeTab === 'meus' ? 'Meus Imóveis' :
                   activeTab === 'venda' ? 'Compra/Venda' : 
                   activeTab === 'arrendamento' ? 'Arrendamento' : 
                   activeTab === 'construcao' ? 'Nova Construção' : 
                   activeTab === 'rascunho' ? 'Rascunhos' :
                   activeTab === 'xml' ? 'Feed & Portais' :
                   activeTab === 'sync' ? 'Sincronização CRM' : 
                   activeTab === 'export' ? 'Exportação' : 'Editar Imóvel')
                : sidebarTab === 'leads' ? 'Gestão de Leads'
                : sidebarTab === 'matching' ? 'Matching Inteligente'
                : sidebarTab === 'clientes' ? 'Base de Dados de Clientes'
                : sidebarTab === 'newsletter' ? 'Gestão de Newsletter'
                : websiteArea === 'header'
                ? `Website > Cabeçalho (${headerLang.toUpperCase()})`
                : websiteArea === 'footer'
                ? 'Website > Rodapé'
                : `Website > Páginas > ${websitePage.charAt(0).toUpperCase() + websitePage.slice(1)} > ${websiteSection.charAt(0).toUpperCase() + websiteSection.slice(1)}`}
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
          {sidebarTab === 'dashboard' && (() => {
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

            const newLeads = [...leads]
              .filter(l => l.status === 'new')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const recentLeads7d = leads.filter(l => new Date(l.createdAt).getTime() >= sevenDaysAgo);
            const displayLeads = (newLeads.length > 0 ? newLeads : [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())).slice(0, 4);

            const receivedClientsPending = clients
              .filter(c => normalizeUser(c.transferTo) === normalizeUser(username) && c.transferStatus === 'pending')
              .sort((a, b) => new Date(b.transferAt || b.createdAt).getTime() - new Date(a.transferAt || a.createdAt).getTime());
            const acceptedReceivedCount = clients.filter(
              c => normalizeUser(c.createdBy) === normalizeUser(username) && c.transferStatus === 'accepted'
            ).length;
            const myClientsCount = clients.filter(c => normalizeUser(c.createdBy) === normalizeUser(username)).length;

            const matchingLeads = leads
              .filter(l => l.type !== 'newsletter')
              .map(lead => {
                const specs = extractLeadSpecifications(lead, properties);
                const topMatches = getTopMatchedProperties(properties, specs, 2);
                return { lead, specs, topMatches };
              });
            const newMatchingLeads = matchingLeads
              .filter(m => m.topMatches.length > 0 && !(m.lead.matchedPropertyIds && m.lead.matchedPropertyIds.length > 0))
              .sort((a, b) => new Date(b.lead.createdAt).getTime() - new Date(a.lead.createdAt).getTime());
            const assignedMatchingCount = matchingLeads.filter(
              m => m.lead.matchedPropertyIds && m.lead.matchedPropertyIds.length > 0
            ).length;

            const sortedProperties = [...properties].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const recentProperties = sortedProperties.filter(
              p => new Date(p.createdAt).getTime() >= sevenDaysAgo
            );
            const newConditionPropsCount = properties.filter(p => p.status === 'Novo').length;
            const myPropertiesCount = properties.filter(p => normalizeUser(p.createdBy) === normalizeUser(username)).length;

            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary mb-1">
                      Resumo Executivo &bull; {username}
                    </p>
                    <h1 className="text-3xl font-serif font-bold text-brand-primary">Dashboard de Gestão</h1>
                    <p className="text-gray-500 text-sm mt-1">
                      Acompanhe os novos leads, clientes recebidos, correspondências de matching e imóveis recentes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshDashboardData}
                    disabled={refreshingDashboard}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:border-brand-primary text-brand-primary text-xs font-bold uppercase tracking-widest shadow-sm transition-all self-start sm:self-auto"
                  >
                    <RefreshCw size={14} className={refreshingDashboard ? 'animate-spin' : ''} />
                    Atualizar Dados
                  </button>
                </div>

                {clientFeedback && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-center gap-3">
                    <Check size={18} className="text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">{clientFeedback}</span>
                  </div>
                )}

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Card 1: Novos Leads */}
                  <button
                    type="button"
                    onClick={() => setSidebarTab('leads')}
                    className="text-left bg-white p-6 border border-gray-100 shadow-lg hover:shadow-xl hover:border-brand-secondary/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-secondary" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 block">
                          Novos Leads
                        </span>
                        <div className="text-4xl font-serif font-bold text-brand-primary mt-2">
                          {newLeads.length}
                        </div>
                      </div>
                      <div className="p-3 bg-brand-accent/35 text-brand-primary group-hover:bg-brand-secondary group-hover:text-white transition-colors">
                        <MailIcon size={22} />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>7 dias: <strong className="text-brand-primary">{recentLeads7d.length}</strong> &bull; Total: <strong className="text-brand-primary">{leads.length}</strong></span>
                      <span className="text-brand-secondary font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        Ver <ArrowRight size={12} />
                      </span>
                    </div>
                  </button>

                  {/* Card 2: Clientes Recebidos */}
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarTab('clientes');
                      setClientesTab('transfer');
                      refreshClientsList();
                    }}
                    className="text-left bg-white p-6 border border-gray-100 shadow-lg hover:shadow-xl hover:border-amber-400 transition-all group relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 ${receivedClientsPending.length > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 block">
                          Clientes Recebidos
                        </span>
                        <div className="text-4xl font-serif font-bold text-brand-primary mt-2">
                          {receivedClientsPending.length}
                        </div>
                      </div>
                      <div className={`p-3 transition-colors ${
                        receivedClientsPending.length > 0
                          ? 'bg-amber-100 text-amber-800 group-hover:bg-amber-500 group-hover:text-white'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-brand-primary group-hover:text-white'
                      }`}>
                        <Inbox size={22} />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Aceites: <strong className="text-brand-primary">{acceptedReceivedCount}</strong> &bull; Meus: <strong className="text-brand-primary">{myClientsCount}</strong></span>
                      <span className="text-brand-secondary font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        Gerir <ArrowRight size={12} />
                      </span>
                    </div>
                  </button>

                  {/* Card 3: Novas Correspondências (Matching) */}
                  <button
                    type="button"
                    onClick={() => setSidebarTab('matching')}
                    className="text-left bg-white p-6 border border-gray-100 shadow-lg hover:shadow-xl hover:border-emerald-400 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 block">
                          Novas Correspondências
                        </span>
                        <div className="text-4xl font-serif font-bold text-brand-primary mt-2">
                          {newMatchingLeads.length}
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Star size={22} />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Matching atribuído: <strong className="text-brand-primary">{assignedMatchingCount}</strong></span>
                      <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        Matching <ArrowRight size={12} />
                      </span>
                    </div>
                  </button>

                  {/* Card 4: Novos Imóveis */}
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarTab('imoveis');
                      setActiveTab('list');
                    }}
                    className="text-left bg-white p-6 border border-gray-100 shadow-lg hover:shadow-xl hover:border-brand-primary/40 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 block">
                          Novos Imóveis (7d)
                        </span>
                        <div className="text-4xl font-serif font-bold text-brand-primary mt-2">
                          {recentProperties.length}
                        </div>
                      </div>
                      <div className="p-3 bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                        <Building2 size={22} />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Estado Novo: <strong className="text-brand-primary">{newConditionPropsCount}</strong> &bull; Total: <strong className="text-brand-primary">{properties.length}</strong> ({myPropertiesCount} meus)</span>
                      <span className="text-brand-primary font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        Imóveis <ArrowRight size={12} />
                      </span>
                    </div>
                  </button>
                </div>

                {/* Detailed Overview Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Panel 1: Novos Leads */}
                  <div className="bg-white border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col">
                    <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-accent/35 text-brand-primary">
                          <MailIcon size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-serif font-bold text-brand-primary">Novos Leads</h2>
                          <p className="text-[11px] text-gray-400">Pedidos recentes dos formulários do website.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSidebarTab('leads')}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary hover:text-brand-primary flex items-center gap-1"
                      >
                        Ver Todos <ArrowRight size={12} />
                      </button>
                    </div>

                    {displayLeads.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400 italic">Nenhum lead registado até ao momento.</div>
                    ) : (
                      <div className="space-y-3">
                        {displayLeads.map(lead => (
                          <div key={lead.id} className="p-4 border border-gray-100 bg-gray-50/70 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-brand-primary truncate">{lead.name}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                                  lead.status === 'new' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {lead.status === 'new' ? 'Novo' : lead.status}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-white border border-gray-200 text-gray-600">
                                  {lead.type === 'evaluation' ? 'Venda/Avaliação' : lead.type === 'contact' ? 'Contacto' : lead.type === 'newsletter' ? 'Newsletter' : lead.type === 'match' ? 'Match' : 'Pedido Info'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {lead.email}{lead.phone ? ` • ${lead.phone}` : ''}
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              {new Date(lead.createdAt).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Panel 2: Clientes Recebidos */}
                  <div className="bg-white border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col">
                    <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-700 border border-amber-200">
                          <Inbox size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-serif font-bold text-brand-primary">Clientes Recebidos</h2>
                          <p className="text-[11px] text-gray-400">Partilhas de colegas pendentes de aceitação.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarTab('clientes');
                          setClientesTab('transfer');
                          refreshClientsList();
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary hover:text-brand-primary flex items-center gap-1"
                      >
                        Enviar / Receber <ArrowRight size={12} />
                      </button>
                    </div>

                    {receivedClientsPending.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-gray-200 bg-gray-50/50">
                        <Inbox size={26} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400 italic">Sem clientes recebidos por aceitar neste momento.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {receivedClientsPending.slice(0, 4).map(client => (
                          <div key={client.id} className="p-4 border border-amber-200 bg-amber-50/30 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-sm text-brand-primary">{client.firstName} {client.lastName}</span>
                                <span className="ml-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-white border border-gray-200 text-gray-600">
                                  {client.interest}
                                </span>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  De: <strong className="text-brand-primary">{client.transferFrom}</strong> &bull; {client.phone}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={transferLoadingId === client.id}
                                  onClick={() => handleRejectClientTransfer(client)}
                                  className="px-3 py-1.5 border border-red-200 bg-white text-red-700 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                  Recusar
                                </button>
                                <button
                                  type="button"
                                  disabled={transferLoadingId === client.id}
                                  onClick={() => handleAcceptClientTransfer(client)}
                                  className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                  {transferLoadingId === client.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  Aceitar
                                </button>
                              </div>
                            </div>
                            {client.transferNote && (
                              <p className="text-xs text-gray-600 bg-white border border-gray-200 px-3 py-2">{client.transferNote}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Panel 3: Novas Correspondências (Matching) */}
                  <div className="bg-white border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col">
                    <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700">
                          <Star size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-serif font-bold text-brand-primary">Novas Correspondências (Matching)</h2>
                          <p className="text-[11px] text-gray-400">Leads com imóveis compatíveis prontos para atribuição.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSidebarTab('matching')}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary hover:text-brand-primary flex items-center gap-1"
                      >
                        Abrir Matching <ArrowRight size={12} />
                      </button>
                    </div>

                    {newMatchingLeads.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400 italic">
                        Todas as correspondências disponíveis já foram atribuídas ou ainda não existem leads com especificações compatíveis.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {newMatchingLeads.slice(0, 4).map(({ lead, topMatches }) => {
                          const bestMatch = topMatches[0];
                          return (
                            <div key={lead.id} className="p-4 border border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-brand-primary">{lead.name}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-emerald-100 text-emerald-800">
                                    {topMatches.length} {topMatches.length === 1 ? 'imóvel recomendado' : 'imóveis recomendados'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 truncate">
                                  Melhor opção: <strong className="text-brand-primary">{bestMatch.property.title}</strong> ({bestMatch.matchCount}/{bestMatch.totalSpecs} critérios)
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSidebarTab('matching')}
                                className="px-3.5 py-2 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary/90 whitespace-nowrap self-start sm:self-auto"
                              >
                                Atribuir
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Panel 4: Novos Imóveis */}
                  <div className="bg-white border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col">
                    <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/10 text-brand-primary">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-serif font-bold text-brand-primary">Novos Imóveis</h2>
                          <p className="text-[11px] text-gray-400">Últimas angariações adicionadas ao catálogo.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarTab('imoveis');
                          setActiveTab('list');
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary hover:text-brand-primary flex items-center gap-1"
                      >
                        Ver Catálogo <ArrowRight size={12} />
                      </button>
                    </div>

                    {sortedProperties.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400 italic">Nenhum imóvel registado no catálogo.</div>
                    ) : (
                      <div className="space-y-3">
                        {sortedProperties.slice(0, 4).map(prop => (
                          <div key={prop.id} className="p-3 border border-gray-100 bg-gray-50/70 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=200'}
                                alt={prop.title}
                                className="w-14 h-12 object-cover flex-shrink-0 bg-gray-200"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-brand-primary truncate">{prop.title}</div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  {prop.location} &bull; {prop.reference || 'Sem Ref.'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-bold text-brand-primary">
                                {prop.priceOnRequest ? 'Sob Consulta' : `${prop.price.toLocaleString('pt-PT')} €`}
                              </div>
                              <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-white border border-gray-200 text-gray-600 mt-1">
                                {prop.category}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}

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
                  onClick={() => setActiveTab('meus')}
                  className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'meus' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <User size={18} /> Meus Imóveis ({properties.filter(p => normalizeUser(p.createdBy) === normalizeUser(username)).length})
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
                  <Rss size={18} /> Feed
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
              {(activeTab === 'list' || activeTab === 'meus' || activeTab === 'venda' || activeTab === 'arrendamento' || activeTab === 'construcao' || activeTab === 'rascunho') && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-brand-primary mb-1">
                        {activeTab === 'list' ? 'Todos os Imóveis' : 
                         activeTab === 'meus' ? 'Os Meus Imóveis' : 
                         activeTab === 'venda' ? 'Imóveis para Compra/Venda' : 
                         activeTab === 'arrendamento' ? 'Imóveis para Arrendamento' : 
                         activeTab === 'rascunho' ? 'Rascunhos em Preparação' : 'Imóveis em Nova Construção'}
                      </h2>
                      <p className="text-gray-500 text-sm">Gerencie os imóveis publicados no site.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-accent/40 px-4 py-2 font-bold text-brand-primary text-sm">
                        Total: {properties.filter(p => {
                          if (activeTab === 'meus') return normalizeUser(p.createdBy) === normalizeUser(username);
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
                      if (activeTab === 'construcao' && p.category !== 'construcao') return false;
                      if (activeTab === 'rascunho' && p.publicationStatus !== 'rascunho') return false;
                      if (activeTab === 'meus' && normalizeUser(p.createdBy) !== normalizeUser(username)) return false;
                      
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
                          <button 
                            disabled={property.createdBy !== username}
                            onClick={() => { 
                              setPrevTab(activeTab);
                              setEditingProperty(property); 
                              setEditCoords(property.coordinates ? `${property.coordinates.lat}, ${property.coordinates.lng}` : '');
                              setActiveTab('edit'); 
                            }} 
                            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${property.createdBy === username ? 'bg-brand-accent text-brand-primary hover:bg-gray-200 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 opacity-60'}`}
                          >
                            {property.createdBy !== username && <Lock size={12} />}
                            Editar
                          </button>
                          <button onClick={() => handleToggleFeatured(property.id)} className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${property.featured ? 'bg-amber-100 text-amber-800' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}><Star size={14} className={property.featured ? 'fill-amber-800' : ''} /> {property.featured ? 'Remover Destaque' : 'Destacar'}</button>
                          <button 
                            disabled={property.createdBy !== username}
                            onClick={() => handleDelete(property.id)} 
                            className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${property.createdBy === username ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'}`}
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
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

              {/* TAB: FEED (EXPORTAR IMÓVEIS, IMPORTAR CRM & EXPORTAR XML) */}
              {activeTab === 'xml' && (() => {
                const myFeedProperties = properties.filter(p => normalizeUser(p.createdBy) === normalizeUser(username));
                const filteredFeedProperties = myFeedProperties.filter(p => {
                  const q = feedSearchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    p.title.toLowerCase().includes(q) ||
                    (p.reference || '').toLowerCase().includes(q) ||
                    p.location.toLowerCase().includes(q)
                  );
                });
                const selectedMyPropsCount = selectedFeedPropIds.filter(id => myFeedProperties.some(p => p.id === id)).length;
                const allFilteredSelected = filteredFeedProperties.length > 0 && filteredFeedProperties.every(p => selectedFeedPropIds.includes(p.id));

                const toggleFeedProperty = (propId: string) => {
                  setSelectedFeedPropIds(prev =>
                    prev.includes(propId) ? prev.filter(id => id !== propId) : [...prev, propId]
                  );
                };

                const toggleSelectAllFiltered = () => {
                  const filteredIds = filteredFeedProperties.map(p => p.id);
                  if (allFilteredSelected) {
                    setSelectedFeedPropIds(prev => prev.filter(id => !filteredIds.includes(id)));
                  } else {
                    setSelectedFeedPropIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                  }
                };

                const togglePortalSelection = (portalId: string) => {
                  setSelectedPortals(prev =>
                    prev.includes(portalId) ? prev.filter(id => id !== portalId) : [...prev, portalId]
                  );
                };

                return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="flex flex-wrap border-b border-gray-200 bg-white shadow-sm">
                    <button 
                      onClick={() => setXmlSubTab('export_portals')}
                      className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${
                        xmlSubTab === 'export_portals' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-900'
                      }`}
                    >
                      <Share2 size={16} /> Exportar Imóveis
                    </button>
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

                  {xmlSubTab === 'export_portals' ? (
                    <div className="bg-white shadow-xl p-8 md:p-10 border border-gray-100">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100 mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-serif font-bold text-brand-primary">Exportar Imóveis</h2>
                            <span className="bg-brand-accent/40 text-brand-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                              Meus Imóveis ({myFeedProperties.length})
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">
                            Selecione um ou mais dos seus imóveis e clique em Exportar para escolher manualmente os portais imobiliários de destino.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {selectedMyPropsCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedFeedPropIds([])}
                              className="px-4 py-3 border border-gray-200 text-gray-500 hover:text-gray-900 text-xs font-bold uppercase tracking-widest transition-all"
                            >
                              Limpar ({selectedMyPropsCount})
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={selectedMyPropsCount === 0}
                            onClick={() => setShowPortalExportModal(true)}
                            className={`px-7 py-3.5 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                              selectedMyPropsCount > 0
                                ? 'bg-brand-secondary text-white hover:bg-brand-secondary/90 cursor-pointer'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                          >
                            <Share2 size={16} />
                            Exportar {selectedMyPropsCount > 0 ? `(${selectedMyPropsCount})` : ''}
                          </button>
                        </div>
                      </div>

                      {feedExportResult && (
                        <div className="mb-8 bg-emerald-50 border border-emerald-200 p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-bold text-emerald-900 text-sm">
                                  Exportação concluída às {feedExportResult.timestamp} ({feedExportResult.propertiesCount} {feedExportResult.propertiesCount === 1 ? 'imóvel' : 'imóveis'})
                                </h4>
                                <p className="text-xs text-emerald-800 mt-1">
                                  Feed gerado (<span className="font-mono">{feedExportResult.fileName}</span>) para {feedExportResult.portalNames.length} {feedExportResult.portalNames.length === 1 ? 'portal' : 'portais'}:
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {feedExportResult.portalNames.map(name => (
                                    <span key={name} className="bg-white border border-emerald-200 text-emerald-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => triggerXmlDownload(feedExportResult.xmlContent, feedExportResult.fileName)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                              >
                                <Download size={14} /> Descarregar Novamente
                              </button>
                              <button
                                type="button"
                                onClick={() => setFeedExportResult(null)}
                                className="p-2 text-emerald-700 hover:text-emerald-900"
                                title="Fechar aviso"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {myFeedProperties.length === 0 ? (
                        <div className="py-16 text-center bg-gray-50 border border-dashed border-gray-200">
                          <Building2 size={44} className="text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-serif font-bold text-brand-primary mb-2">Ainda não tem imóveis associados à sua conta</h3>
                          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                            Apenas os imóveis criados por si (<span className="font-bold">{username}</span>) aparecem neste painel de exportação.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('add')}
                            className="bg-brand-primary text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all inline-flex items-center gap-2"
                          >
                            <PlusCircle size={16} /> Adicionar Novo Imóvel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-gray-50 p-4 border border-gray-100">
                            <div className="relative flex-1 max-w-md">
                              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={feedSearchQuery}
                                onChange={(e) => setFeedSearchQuery(e.target.value)}
                                placeholder="Filtrar os meus imóveis por título, referência ou zona..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-sm outline-none focus:border-brand-primary"
                              />
                            </div>

                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={toggleSelectAllFiltered}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer"
                              >
                                <span className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                                  allFilteredSelected ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-gray-300'
                                }`}>
                                  {allFilteredSelected && <Check size={12} />}
                                </span>
                                {allFilteredSelected ? 'Desselecionar Visíveis' : 'Selecionar Todos'}
                              </button>
                              <span className="text-xs text-gray-500 font-medium">
                                {selectedMyPropsCount} de {myFeedProperties.length} selecionado(s)
                              </span>
                            </div>
                          </div>

                          {filteredFeedProperties.length === 0 ? (
                            <div className="py-12 text-center bg-gray-50 border border-gray-100 text-gray-500 text-sm">
                              Nenhum dos seus imóveis corresponde à pesquisa &ldquo;{feedSearchQuery}&rdquo;.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {filteredFeedProperties.map(property => {
                                const isSelected = selectedFeedPropIds.includes(property.id);
                                return (
                                  <div
                                    key={property.id}
                                    onClick={() => toggleFeedProperty(property.id)}
                                    className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-5 border transition-all cursor-pointer gap-4 ${
                                      isSelected
                                        ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFeedProperty(property.id);
                                        }}
                                        aria-label={`Selecionar ${property.title}`}
                                        className={`w-5 h-5 border flex items-center justify-center shrink-0 transition-colors ${
                                          isSelected
                                            ? 'bg-brand-primary border-brand-primary text-white'
                                            : 'bg-white border-gray-300 text-transparent hover:border-brand-primary'
                                        }`}
                                      >
                                        <Check size={14} />
                                      </button>

                                      <img
                                        src={property.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=60'}
                                        alt={property.title}
                                        className="w-24 h-20 object-cover border border-gray-200 shrink-0"
                                      />

                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                          {property.reference && (
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-gray-900 text-white px-2 py-0.5">
                                              {property.reference}
                                            </span>
                                          )}
                                          <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-secondary text-white px-2 py-0.5">
                                            {property.type}
                                          </span>
                                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                                            property.category === 'venda' ? 'bg-emerald-500 text-white' :
                                            property.category === 'arrendamento' ? 'bg-blue-500 text-white' :
                                            property.category === 'construcao' ? 'bg-orange-500 text-white' : 'bg-gray-400 text-white'
                                          }`}>
                                            {property.category === 'venda' ? 'Compra/Venda' :
                                             property.category === 'arrendamento' ? 'Arrendamento' :
                                             property.category === 'construcao' ? 'Nova Construção' : 'Sem Categoria'}
                                          </span>
                                        </div>

                                        <h3 className="font-serif font-bold text-brand-primary text-base truncate">{property.title}</h3>

                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1">
                                          <span className="flex items-center gap-1"><MapPin size={12} className="text-brand-secondary" /> {property.location}</span>
                                          {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble size={12} /> T{property.bedrooms}</span>}
                                          {property.area > 0 && <span className="flex items-center gap-1"><Maximize2 size={12} /> {property.area} m²</span>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pl-9 md:pl-0">
                                      <div className="text-left md:text-right">
                                        <div className="text-base font-bold text-brand-primary">
                                          {property.priceOnRequest
                                            ? 'Sob Consulta'
                                            : `€${property.price.toLocaleString('pt-PT')}`}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                          property.visibility === 'visível' ? 'text-emerald-600' : 'text-gray-400'
                                        }`}>
                                          {property.visibility}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : xmlSubTab === 'import' ? (
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

                  {/* PORTAL SELECTION MODAL */}
                  {showPortalExportModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200">
                        <div className="p-6 md:p-8 border-b border-gray-100 flex items-start justify-between gap-4 bg-gray-50/70">
                          <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary mb-1">
                              <Globe size={14} /> Distribuição em Portais Imobiliários
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-brand-primary">Selecionar Portais para Exportação</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Escolha manualmente os portais imobiliários para exportar os{' '}
                              <span className="font-bold text-brand-primary">{selectedMyPropsCount}</span>{' '}
                              {selectedMyPropsCount === 1 ? 'imóvel selecionado' : 'imóveis selecionados'}.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPortalExportModal(false)}
                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="px-6 md:px-8 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                          <div className="text-xs text-gray-600">
                            <span className="font-bold text-brand-primary">{selectedPortals.length}</span> de {REAL_ESTATE_PORTALS.length} portais selecionados manualmente
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => setSelectedPortals(REAL_ESTATE_PORTALS.map(p => p.id))}
                              className="text-[11px] font-bold uppercase tracking-widest text-brand-primary hover:text-brand-secondary transition-colors"
                            >
                              Selecionar Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPortals([])}
                              className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-800 transition-colors"
                            >
                              Limpar Seleção
                            </button>
                          </div>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {REAL_ESTATE_PORTALS.map(portal => {
                            const isChecked = selectedPortals.includes(portal.id);
                            return (
                              <button
                                key={portal.id}
                                type="button"
                                onClick={() => togglePortalSelection(portal.id)}
                                className={`text-left p-4 border transition-all flex items-start gap-3 ${
                                  isChecked
                                    ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <span className={`w-5 h-5 border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isChecked
                                    ? 'bg-brand-primary border-brand-primary text-white'
                                    : 'bg-white border-gray-300 text-transparent'
                                }`}>
                                  <Check size={14} />
                                </span>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-brand-primary leading-tight">{portal.name}</div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.5">
                                      {portal.market}
                                    </span>
                                    <span className="text-[9px] font-mono text-brand-secondary font-bold">
                                      {portal.format}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{portal.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="p-6 md:px-8 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-xs text-gray-500">
                            {selectedPortals.length === 0
                              ? 'Selecione pelo menos 1 portal imobiliário da lista acima.'
                              : `${selectedMyPropsCount} ${selectedMyPropsCount === 1 ? 'imóvel' : 'imóveis'} prontos para exportar para ${selectedPortals.length} ${selectedPortals.length === 1 ? 'portal' : 'portais'}.`}
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                              type="button"
                              onClick={() => setShowPortalExportModal(false)}
                              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={selectedPortals.length === 0 || selectedMyPropsCount === 0}
                              onClick={handleExecutePortalExport}
                              className={`px-8 py-3 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                                selectedPortals.length > 0 && selectedMyPropsCount > 0
                                  ? 'bg-brand-secondary text-white hover:bg-brand-secondary/90 cursor-pointer'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                              }`}
                            >
                              <Download size={16} /> Exportar Imóveis
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
                );
              })()}
            </>
          )}

          {sidebarTab === 'website' && (() => {
            const mergedConfig: WebsiteConfig = { ...liveConfig, ...websiteConfig };
            const currentHeaderLinks: HeaderLinkConfig[] = getResolvedHeaderLinks(mergedConfig, headerLang);

            const updateActiveHeaderLinks = (nextLinks: HeaderLinkConfig[]) => {
              if (headerLang === 'pt') {
                setWebsiteConfig({ ...websiteConfig, headerLinksPt: nextLinks });
              } else {
                setWebsiteConfig({ ...websiteConfig, headerLinksEn: nextLinks });
              }
            };

            const moveHeaderLink = (index: number, direction: -1 | 1) => {
              const targetIdx = index + direction;
              if (targetIdx < 0 || targetIdx >= currentHeaderLinks.length) return;
              const next = [...currentHeaderLinks];
              const [moved] = next.splice(index, 1);
              next.splice(targetIdx, 0, moved);
              updateActiveHeaderLinks(next);
            };

            const reorderHeaderLinks = (fromIdx: number, toIdx: number) => {
              if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= currentHeaderLinks.length || toIdx >= currentHeaderLinks.length) return;
              const next = [...currentHeaderLinks];
              const [moved] = next.splice(fromIdx, 1);
              next.splice(toIdx, 0, moved);
              updateActiveHeaderLinks(next);
            };

            const toggleHeaderLinkVisibility = (id: HeaderLinkConfig['id']) => {
              const next = currentHeaderLinks.map(link =>
                link.id === id ? { ...link, visible: !link.visible } : link
              );
              updateActiveHeaderLinks(next);
            };

            const resetHeaderLinks = () => {
              const defaults = headerLang === 'en' ? DEFAULT_HEADER_LINKS_EN : DEFAULT_HEADER_LINKS_PT;
              updateActiveHeaderLinks(defaults.map(d => ({ ...d })));
            };

            return (
            <div className="space-y-8">
              {/* Top-Level Website Area Division: Cabeçalho | Rodapé | Páginas */}
              <div className="flex flex-col gap-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-primary">Personalização do Website</h1>
                    <p className="text-gray-500 text-sm">Escolha primeiro a área que pretende configurar: Cabeçalho, Rodapé ou Páginas.</p>
                  </div>

                  <div className="flex bg-gray-100 p-1 w-fit">
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

                {/* First Layer Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'header' as const,
                      label: 'Cabeçalho',
                      desc: 'Versão PT/EN, ordem e visibilidade das ligações',
                      icon: PanelTop
                    },
                    {
                      id: 'footer' as const,
                      label: 'Rodapé',
                      desc: 'Redes sociais, morada e contactos do rodapé',
                      icon: PanelBottom
                    },
                    {
                      id: 'pages' as const,
                      label: 'Páginas',
                      desc: 'Textos, fontes e imagens de cada página',
                      icon: FileText
                    }
                  ].map(area => {
                    const Icon = area.icon;
                    const active = websiteArea === area.id;
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => setWebsiteArea(area.id)}
                        className={`p-5 border text-left transition-all flex items-start gap-4 ${
                          active
                            ? 'bg-brand-primary text-white border-brand-primary shadow-lg'
                            : 'bg-white text-brand-primary border-gray-200 hover:border-brand-secondary'
                        }`}
                      >
                        <div className={`p-2.5 shrink-0 ${active ? 'bg-brand-secondary text-white' : 'bg-gray-100 text-brand-primary'}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-xs uppercase tracking-widest block mb-1">{area.label}</span>
                          <span className={`text-[11px] leading-snug block ${active ? 'text-white/75' : 'text-gray-500'}`}>
                            {area.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* HEADER: Language Switcher */}
                {websiteArea === 'header' && (
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-brand-secondary" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary block">Versão do Site</span>
                        <span className="text-[11px] text-gray-500">Selecione o idioma do cabeçalho a configurar</span>
                      </div>
                    </div>
                    <div className="flex gap-2 p-1 bg-gray-100">
                      <button
                        type="button"
                        onClick={() => setHeaderLang('pt')}
                        className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                          headerLang === 'pt' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-brand-primary'
                        }`}
                      >
                        Português (PT)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeaderLang('en')}
                        className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                          headerLang === 'en' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-brand-primary'
                        }`}
                      >
                        English (EN)
                      </button>
                    </div>
                  </div>
                )}

                {/* PAGES: Existing Page & Section Selection */}
                {websiteArea === 'pages' && (
                  <>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-wrap gap-2 sm:gap-4 p-1 bg-gray-200 w-fit rounded-none">
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
                      {/* HEADER EDITOR */}
                      {websiteArea === 'header' && (
                        <div className="space-y-6">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                            <div>
                              <h3 className="font-serif font-bold text-brand-primary text-xl">
                                Ligações do Cabeçalho ({headerLang === 'pt' ? 'Versão Portuguesa' : 'English Version'})
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Arraste ou use as setas para ordenar as ligações e clique no ícone de visibilidade para esconder ou mostrar cada ligação.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={resetHeaderLinks}
                              className="px-3 py-2 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary hover:border-brand-primary flex items-center gap-1.5 transition-colors"
                            >
                              <RotateCcw size={12} /> Repor Padrão
                            </button>
                          </div>

                          <div className="space-y-3">
                            {currentHeaderLinks.map((link, idx) => (
                              <div
                                key={link.id}
                                draggable
                                onDragStart={() => setDraggedHeaderIdx(idx)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={() => {
                                  if (draggedHeaderIdx !== null) {
                                    reorderHeaderLinks(draggedHeaderIdx, idx);
                                  }
                                  setDraggedHeaderIdx(null);
                                }}
                                onDragEnd={() => setDraggedHeaderIdx(null)}
                                className={`flex flex-wrap items-center justify-between gap-3 p-4 border transition-all ${
                                  draggedHeaderIdx === idx
                                    ? 'border-brand-secondary bg-brand-secondary/5 opacity-70'
                                    : link.visible
                                    ? 'border-gray-200 bg-gray-50/70 hover:border-brand-primary/40'
                                    : 'border-dashed border-gray-300 bg-gray-100/60 opacity-65'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="cursor-grab text-gray-400 hover:text-brand-primary" title="Arrastar para reordenar">
                                    <GripVertical size={18} />
                                  </span>
                                  <span className="w-7 h-7 bg-brand-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold text-sm ${link.visible ? 'text-brand-primary' : 'text-gray-400 line-through'}`}>
                                        {link.label}
                                      </span>
                                      {!link.visible && (
                                        <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 bg-gray-200 text-gray-600">
                                          Oculta
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-mono">{link.path}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="flex border border-gray-200 bg-white">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => moveHeaderLink(idx, -1)}
                                      title="Mover para cima"
                                      className="p-2 text-gray-600 hover:text-brand-primary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
                                    >
                                      <ArrowUp size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === currentHeaderLinks.length - 1}
                                      onClick={() => moveHeaderLink(idx, 1)}
                                      title="Mover para baixo"
                                      className="p-2 text-gray-600 hover:text-brand-primary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <ArrowDown size={15} />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => toggleHeaderLinkVisibility(link.id)}
                                    className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest border inline-flex items-center gap-1.5 transition-all ${
                                      link.visible
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary hover:text-brand-primary'
                                    }`}
                                  >
                                    {link.visible ? (
                                      <>
                                        <Eye size={14} /> Visível
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff size={14} /> Mostrar
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FOOTER EDITOR */}
                      {websiteArea === 'footer' && (
                        <div className="space-y-8">
                          <div>
                            <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2 mb-4">
                              Ligações das Redes Sociais
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 flex items-center gap-2">
                                  <Instagram size={13} className="text-brand-secondary" /> Instagram (URL)
                                </label>
                                <input
                                  type="url"
                                  value={websiteConfig.footerInstagramUrl ?? liveConfig.footerInstagramUrl ?? ''}
                                  onChange={e => setWebsiteConfig({ ...websiteConfig, footerInstagramUrl: e.target.value })}
                                  placeholder="https://instagram.com/imobiliariapremium"
                                  className="w-full p-4 bg-gray-50 border border-gray-200 text-sm outline-none focus:border-brand-primary"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 flex items-center gap-2">
                                  <Facebook size={13} className="text-brand-secondary" /> Facebook (URL)
                                </label>
                                <input
                                  type="url"
                                  value={websiteConfig.footerFacebookUrl ?? liveConfig.footerFacebookUrl ?? ''}
                                  onChange={e => setWebsiteConfig({ ...websiteConfig, footerFacebookUrl: e.target.value })}
                                  placeholder="https://facebook.com/imobiliariapremium"
                                  className="w-full p-4 bg-gray-50 border border-gray-200 text-sm outline-none focus:border-brand-primary"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 flex items-center gap-2">
                                  <Linkedin size={13} className="text-brand-secondary" /> LinkedIn (URL)
                                </label>
                                <input
                                  type="url"
                                  value={websiteConfig.footerLinkedinUrl ?? liveConfig.footerLinkedinUrl ?? ''}
                                  onChange={e => setWebsiteConfig({ ...websiteConfig, footerLinkedinUrl: e.target.value })}
                                  placeholder="https://linkedin.com/company/imobiliariapremium"
                                  className="w-full p-4 bg-gray-50 border border-gray-200 text-sm outline-none focus:border-brand-primary"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2 mb-4">
                              Morada do Rodapé
                            </h3>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 flex items-center gap-2">
                                <MapPin size={13} className="text-brand-secondary" /> Morada Completa
                              </label>
                              <textarea
                                rows={3}
                                value={websiteConfig.footerAddress ?? liveConfig.footerAddress ?? ''}
                                onChange={e => setWebsiteConfig({ ...websiteConfig, footerAddress: e.target.value })}
                                placeholder={liveConfig.contactAddress || 'Av. 5 de Outubro, 123\n8000-001 Faro, Algarve'}
                                className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none outline-none focus:border-brand-primary"
                              />
                            </div>
                          </div>

                          <div>
                            <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2 mb-4">
                              Contactos do Rodapé
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 flex items-center gap-2">
                                  <Phone size={13} className="text-brand-secondary" /> Telefone
                                </label>
                                <input
                                  type="text"
                                  value={websiteConfig.footerPhone ?? liveConfig.footerPhone ?? ''}
                                  onChange={e => setWebsiteConfig({ ...websiteConfig, footerPhone: e.target.value })}
                                  placeholder={liveConfig.contactPhone || '+351 289 123 456'}
                                  className="w-full p-4 bg-gray-50 border border-gray-200 text-sm outline-none focus:border-brand-primary"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 flex items-center gap-2">
                                  <Mail size={13} className="text-brand-secondary" /> Email
                                </label>
                                <input
                                  type="email"
                                  value={websiteConfig.footerEmail ?? liveConfig.footerEmail ?? ''}
                                  onChange={e => setWebsiteConfig({ ...websiteConfig, footerEmail: e.target.value })}
                                  placeholder={liveConfig.contactEmail || 'geral@imobiliariapremium.pt'}
                                  className="w-full p-4 bg-gray-50 border border-gray-200 text-sm outline-none focus:border-brand-primary"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* HOME SECTIONS */}
                      {websiteArea === 'pages' && websitePage === 'home' && websiteSection === 'hero' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Conteúdo Hero</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título Principal</label>
                                  <input type="text" value={websiteConfig.heroTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, heroTitle: e.target.value})} placeholder={liveConfig.heroTitle || 'Título Hero'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('heroTitleFont', 'Título')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Subtítulo</label>
                                  <textarea rows={3} value={websiteConfig.heroSubtitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, heroSubtitle: e.target.value})} placeholder={liveConfig.heroSubtitle || 'Subtítulo'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                  {renderFontSelector('heroSubtitleFont', 'Subtítulo')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Texto do Botão</label>
                                  <input type="text" value={websiteConfig.heroButtonText || ''} onChange={e => setWebsiteConfig({...websiteConfig, heroButtonText: e.target.value})} placeholder={liveConfig.heroButtonText || 'Ver seleção'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('heroButtonTextFont', 'Botão')}
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

                      {websiteArea === 'pages' && websitePage === 'home' && websiteSection === 'evaluation' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Conteúdo Avaliação</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título</label>
                                  <input type="text" value={websiteConfig.evalTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, evalTitle: e.target.value})} placeholder={liveConfig.evalTitle || 'Título Avaliação'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('evalTitleFont', 'Título')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Texto / Descrição</label>
                                  <textarea rows={5} value={websiteConfig.evalSubtitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, evalSubtitle: e.target.value})} placeholder={liveConfig.evalSubtitle || 'Texto Avaliação'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                  {renderFontSelector('evalSubtitleFont', 'Texto')}
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

                      {websiteArea === 'pages' && websitePage === 'home' && websiteSection === 'stats' && (
                        <div className="space-y-6">
                           <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Números de Confiança</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Anos de Experiência</label>
                                <input type="text" value={websiteConfig.statsYears || ''} onChange={e => setWebsiteConfig({...websiteConfig, statsYears: e.target.value})} placeholder={liveConfig.statsYears || '15+'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                {renderFontSelector('statsYearsFont', 'Número')}
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Imóveis Vendidos</label>
                                <input type="text" value={websiteConfig.statsSold || ''} onChange={e => setWebsiteConfig({...websiteConfig, statsSold: e.target.value})} placeholder={liveConfig.statsSold || '800+'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                {renderFontSelector('statsSoldFont', 'Número')}
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Clientes Felizes</label>
                                <input type="text" value={websiteConfig.statsClients || ''} onChange={e => setWebsiteConfig({...websiteConfig, statsClients: e.target.value})} placeholder={liveConfig.statsClients || '1.2k'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                {renderFontSelector('statsClientsFont', 'Número')}
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Transparência</label>
                                <input type="text" value={websiteConfig.statsTransparency || ''} onChange={e => setWebsiteConfig({...websiteConfig, statsTransparency: e.target.value})} placeholder={liveConfig.statsTransparency || '100%'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                {renderFontSelector('statsTransparencyFont', 'Número')}
                              </div>
                           </div>
                        </div>
                      )}

                      {/* ABOUT SECTIONS */}
                      {websiteArea === 'pages' && websitePage === 'about' && websiteSection === 'history' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">História & Visão</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título da Página</label>
                                  <input type="text" value={websiteConfig.aboutTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, aboutTitle: e.target.value})} placeholder={liveConfig.aboutTitle || 'Confiança, Proximidade, Resultados.'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('aboutTitleFont', 'Título')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Texto Parágrafo 1</label>
                                  <textarea rows={4} value={websiteConfig.aboutText1 || ''} onChange={e => setWebsiteConfig({...websiteConfig, aboutText1: e.target.value})} placeholder={liveConfig.aboutText1 || 'Texto 1'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                  {renderFontSelector('aboutText1Font', 'Parágrafo 1')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Texto Parágrafo 2</label>
                                  <textarea rows={4} value={websiteConfig.aboutText2 || ''} onChange={e => setWebsiteConfig({...websiteConfig, aboutText2: e.target.value})} placeholder={liveConfig.aboutText2 || 'Texto 2'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                  {renderFontSelector('aboutText2Font', 'Parágrafo 2')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Contador de Anos</label>
                                  <input type="text" value={websiteConfig.aboutYearsCount || ''} onChange={e => setWebsiteConfig({...websiteConfig, aboutYearsCount: e.target.value})} placeholder={liveConfig.aboutYearsCount || '15'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('aboutYearsCountFont', 'Número')}
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
                      {websiteArea === 'pages' && websitePage === 'services' && websiteSection === 'main' && (
                        <div className="space-y-6">
                           <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Topo da Página de Serviços</h3>
                           <div className="grid grid-cols-1 gap-6">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título Principal</label>
                                <input type="text" value={websiteConfig.servicesTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, servicesTitle: e.target.value})} placeholder={liveConfig.servicesTitle || 'Soluções Imobiliárias de Excelência'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm font-serif" />
                                {renderFontSelector('servicesTitleFont', 'Título')}
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Subtítulo / Descrição</label>
                                <textarea rows={3} value={websiteConfig.servicesSubtitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, servicesSubtitle: e.target.value})} placeholder={liveConfig.servicesSubtitle || 'Mais do que mediadores...'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                {renderFontSelector('servicesSubtitleFont', 'Subtítulo')}
                              </div>
                           </div>
                        </div>
                      )}

                      {/* CONTACT SECTIONS */}
                      {websiteArea === 'pages' && websitePage === 'contact' && websiteSection === 'main' && (
                        <div className="space-y-6">
                           <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Topo da Página de Contacto</h3>
                           <div className="grid grid-cols-1 gap-6">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Título Principal</label>
                                <input type="text" value={websiteConfig.contactTitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactTitle: e.target.value})} placeholder={liveConfig.contactTitle || 'Estamos Aqui Para o Ajudar'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm font-serif" />
                                {renderFontSelector('contactTitleFont', 'Título')}
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Subtítulo / Descrição</label>
                                <textarea rows={3} value={websiteConfig.contactSubtitle || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactSubtitle: e.target.value})} placeholder={liveConfig.contactSubtitle || 'Tem alguma questão sobre um imóvel...'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm resize-none" />
                                {renderFontSelector('contactSubtitleFont', 'Subtítulo')}
                              </div>
                           </div>
                        </div>
                      )}

                      {websiteArea === 'pages' && websitePage === 'contact' && websiteSection === 'info' && (
                        <div className="space-y-8">
                           <div>
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Dados de Contacto & Morada</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Morada Completa</label>
                                  <input type="text" value={websiteConfig.contactAddress || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactAddress: e.target.value})} placeholder={liveConfig.contactAddress || 'Av. 5 de Outubro, 123...'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('contactAddressFont', 'Texto')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Telefone</label>
                                  <input type="text" value={websiteConfig.contactPhone || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactPhone: e.target.value})} placeholder={liveConfig.contactPhone || '+351 289 123 456'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('contactPhoneFont', 'Texto')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Email</label>
                                  <input type="text" value={websiteConfig.contactEmail || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactEmail: e.target.value})} placeholder={liveConfig.contactEmail || 'geral@imobiliariapremium.pt'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('contactEmailFont', 'Texto')}
                                </div>
                              </div>
                           </div>

                           <div>
                              <h3 className="font-serif font-bold text-brand-primary text-xl border-b border-gray-100 pb-2">Horário de Funcionamento</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Segunda — Sexta</label>
                                  <input type="text" value={websiteConfig.contactScheduleWeek || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactScheduleWeek: e.target.value})} placeholder={liveConfig.contactScheduleWeek || '09:00 - 18:30'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('contactScheduleWeekFont', 'Horário')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Sábado</label>
                                  <input type="text" value={websiteConfig.contactScheduleSat || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactScheduleSat: e.target.value})} placeholder={liveConfig.contactScheduleSat || '10:00 - 13:00'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('contactScheduleSatFont', 'Horário')}
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Domingo</label>
                                  <input type="text" value={websiteConfig.contactScheduleSun || ''} onChange={e => setWebsiteConfig({...websiteConfig, contactScheduleSun: e.target.value})} placeholder={liveConfig.contactScheduleSun || 'Encerrado'} className="w-full p-4 bg-gray-50 border border-gray-200 text-sm" />
                                  {renderFontSelector('contactScheduleSunFont', 'Horário')}
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
                            <Save size={18} /> {websiteArea === 'header' ? 'Publicar Cabeçalho' : websiteArea === 'footer' ? 'Publicar Rodapé' : 'Publicar Alterações na Página'}
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
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="text-brand-secondary" size={20} />
                          <div>
                            <h3 className="text-white font-serif font-bold leading-tight">Pré-visualização em Tempo Real</h3>
                            <p className="text-white/60 text-[10px] uppercase tracking-widest mt-1">
                              {websiteArea === 'header'
                                ? `Cabeçalho · Versão ${headerLang.toUpperCase()}`
                                : websiteArea === 'footer'
                                ? 'Rodapé Global'
                                : `Página: ${websitePage} / Secção: ${websiteSection}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white/10 p-1 border border-white/15">
                            {[
                              { id: 'desktop', label: 'Desktop', icon: Monitor, width: '1280px' },
                              { id: 'tablet', label: 'Tablet', icon: Tablet, width: '768px' },
                              { id: 'mobile', label: 'Mobile', icon: Smartphone, width: '390px' }
                            ].map(d => {
                              const Icon = d.icon;
                              const active = previewDevice === d.id;
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => setPreviewDevice(d.id as 'desktop' | 'tablet' | 'mobile')}
                                  title={`${d.label} (${d.width})`}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    active
                                      ? 'bg-brand-secondary text-white shadow-sm'
                                      : 'text-white/70 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  <Icon size={13} />
                                  <span className="hidden sm:inline">{d.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold bg-white/5 px-2 py-1.5 border border-white/10">Modo Draft</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white shadow-2xl border border-gray-200 overflow-hidden relative group">
                      {/* Device Frame Header */}
                      <div className="bg-gray-100 border-b border-gray-200 p-3 flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        </div>
                        <div className="bg-white rounded px-3 py-1 text-[10px] text-gray-400 font-mono flex-1 text-center truncate">
                          villassequa.pt/{websiteArea === 'pages' && websitePage !== 'home' ? websitePage : ''}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-white px-2 py-1 border border-gray-200 whitespace-nowrap">
                          {previewDevice === 'desktop' ? 'Desktop · 1280px' : previewDevice === 'tablet' ? 'Tablet · 768px' : 'Mobile · 390px'}
                        </span>
                      </div>

                      {/* Actual Content Preview */}
                      <div className={`max-h-[720px] overflow-y-auto custom-scrollbar ${previewDevice === 'desktop' ? 'bg-white' : 'bg-gray-200/80 py-6 px-4'}`}>
                        <WebsitePreview
                          area={websiteArea}
                          headerLang={headerLang}
                          page={websitePage}
                          section={websiteSection}
                          config={mergedConfig}
                          properties={properties}
                          device={previewDevice}
                        />
                        <div className="py-4 bg-gray-50 border-t border-gray-100 text-center mt-4">
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
                        As alterações só serão visíveis para o público depois de clicar em <strong>&ldquo;Publicar Alterações&rdquo;</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {sidebarTab === 'clientes' && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-primary">Base de Dados de Clientes</h1>
                    <p className="text-gray-500 text-sm">Gestão do portefólio de clientes por consultor e por interesse.</p>
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <User size={12} className="text-brand-secondary" /> Consultor: <span className="text-brand-primary">{username}</span>
                  </div>
                </div>
                
                <div className="flex border-b border-gray-200 bg-white shadow-sm overflow-x-auto">
                  <button 
                    onClick={() => setClientesTab('list')}
                    className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'list' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Users size={18} /> Lista de Clientes ({clients.length})
                  </button>
                  <button 
                    onClick={() => setClientesTab('meus')}
                    className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'meus' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <User size={18} /> Meus Clientes ({clients.filter(c => normalizeUser(c.createdBy) === normalizeUser(username)).length})
                  </button>
                  <button 
                    onClick={() => setClientesTab('compra')}
                    className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'compra' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Compra ({clients.filter(c => c.interest === 'compra').length})
                  </button>
                  <button 
                    onClick={() => setClientesTab('venda')}
                    className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'venda' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Venda ({clients.filter(c => c.interest === 'venda').length})
                  </button>
                  <button 
                    onClick={() => setClientesTab('arrendamento')}
                    className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'arrendamento' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Arrendamento ({clients.filter(c => c.interest === 'arrendamento').length})
                  </button>
                  <button 
                    onClick={() => {
                      setClientesTab('transfer');
                      refreshClientsList();
                    }}
                    className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'transfer' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <ArrowLeftRight size={18} /> Enviar / Receber
                    {clients.filter(c => normalizeUser(c.transferTo) === normalizeUser(username) && c.transferStatus === 'pending').length > 0 && (
                      <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5">
                        {clients.filter(c => normalizeUser(c.transferTo) === normalizeUser(username) && c.transferStatus === 'pending').length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setClientesTab('add')}
                    className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      clientesTab === 'add' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <UserPlus size={18} /> Novo Cliente
                  </button>
                </div>
              </div>

              {clientFeedback && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 flex items-center gap-3">
                  <Check size={18} className="text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">{clientFeedback}</span>
                </div>
              )}

              {clientesTab === 'transfer' && (() => {
                const eligibleOwnClients = clients.filter(
                  c =>
                    (normalizeUser(c.createdBy) === normalizeUser(username) ||
                      (!c.createdBy && normalizeUser(username) === 'admin')) &&
                    c.transferStatus !== 'pending'
                );

                const incomingTransfers = clients.filter(
                  c => normalizeUser(c.transferTo) === normalizeUser(username) && c.transferStatus === 'pending'
                );

                const outgoingTransfers = clients.filter(
                  c => normalizeUser(c.transferFrom) === normalizeUser(username) && c.transferStatus === 'pending'
                );

                const knownColleagues = Array.from(
                  new Set([
                    ...clients.map(c => c.createdBy),
                    ...clients.map(c => c.transferFrom),
                    ...clients.map(c => c.transferTo),
                    ...properties.map(p => p.createdBy)
                  ].filter((u): u is string => Boolean(u && u.trim() && normalizeUser(u) !== normalizeUser(username))))
                );

                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="bg-white border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-serif font-bold text-brand-primary flex items-center gap-2">
                          <ArrowLeftRight size={20} className="text-brand-secondary" /> Partilha de Clientes entre Consultores
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          Envie um cliente da sua carteira para um colega ou aceite clientes partilhados consigo para os integrar em &ldquo;Meus Clientes&rdquo;.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={refreshClientsList}
                        disabled={refreshingClients}
                        className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold uppercase tracking-widest text-brand-primary transition-all self-start sm:self-auto"
                      >
                        <RefreshCw size={14} className={refreshingClients ? 'animate-spin' : ''} />
                        Atualizar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Enviar Cliente */}
                      <div className="bg-white shadow-xl p-8 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                          <div className="p-2.5 bg-brand-primary text-brand-secondary">
                            <Send size={18} />
                          </div>
                          <div>
                            <h3 className="text-lg font-serif font-bold text-brand-primary">Enviar Cliente para Colega</h3>
                            <p className="text-[11px] text-gray-400">Selecione um dos seus clientes e indique o utilizador do colega.</p>
                          </div>
                        </div>

                        <form onSubmit={handleSendClientTransfer} className="space-y-5">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">
                              Cliente a Enviar
                            </label>
                            <select
                              required
                              value={transferClientId}
                              onChange={e => setTransferClientId(e.target.value)}
                              className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                            >
                              <option value="">Selecionar cliente da sua carteira...</option>
                              {eligibleOwnClients.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.firstName} {c.lastName} ({c.interest}) — {c.email}
                                </option>
                              ))}
                            </select>
                            {eligibleOwnClients.length === 0 && (
                              <p className="text-[11px] text-amber-700 mt-2">
                                Não tem clientes disponíveis para enviar neste momento (adicione em &ldquo;Novo Cliente&rdquo; ou aguarde conclusão dos envios pendentes).
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">
                              Utilizador do Colega Destinatário
                            </label>
                            <input
                              type="text"
                              required
                              value={transferRecipient}
                              onChange={e => setTransferRecipient(e.target.value)}
                              className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm"
                              placeholder="Ex: joana, pedro, consultor2..."
                            />
                            {knownColleagues.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mr-1">
                                  Colegas recentes:
                                </span>
                                {knownColleagues.map(colleague => (
                                  <button
                                    key={colleague}
                                    type="button"
                                    onClick={() => setTransferRecipient(colleague)}
                                    className={`text-[11px] font-bold px-2.5 py-1 border transition-colors ${
                                      normalizeUser(transferRecipient) === normalizeUser(colleague)
                                        ? 'bg-brand-primary text-white border-brand-primary'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-brand-primary'
                                    }`}
                                  >
                                    {colleague}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-700 mb-2 block">
                              Nota para o Colega (Opcional)
                            </label>
                            <textarea
                              rows={3}
                              value={transferNote}
                              onChange={e => setTransferNote(e.target.value)}
                              className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:border-brand-primary text-sm resize-none"
                              placeholder="Ex: Cliente procura moradia T3 em Loulé até 450.000€..."
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={!transferClientId || !transferRecipient.trim() || transferLoadingId !== null}
                            className="w-full bg-brand-primary text-white px-8 py-4 font-bold uppercase tracking-widest text-xs hover:bg-brand-primary/90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            {transferLoadingId && transferLoadingId === transferClientId ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                            Enviar Cliente
                          </button>
                        </form>
                      </div>

                      {/* Clientes Recebidos + Envios Pendentes */}
                      <div className="space-y-8">
                        <div className="bg-white shadow-xl p-8 border border-gray-100">
                          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200">
                                <Inbox size={18} />
                              </div>
                              <div>
                                <h3 className="text-lg font-serif font-bold text-brand-primary">Clientes Recebidos para Aceitar</h3>
                                <p className="text-[11px] text-gray-400">Clientes enviados por outros colegas para &ldquo;{username}&rdquo;.</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 px-2.5 py-1">
                              {incomingTransfers.length} pendente{incomingTransfers.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {incomingTransfers.length === 0 ? (
                            <div className="py-10 text-center border border-dashed border-gray-200 bg-gray-50/50">
                              <Inbox size={28} className="mx-auto text-gray-300 mb-2" />
                              <p className="text-sm text-gray-400 italic">Não tem clientes pendentes para aceitar.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {incomingTransfers.map(client => (
                                <div key={client.id} className="border border-amber-200 bg-amber-50/30 p-5 space-y-3">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-brand-primary text-base">
                                          {client.firstName} {client.lastName}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                                          client.interest === 'compra' ? 'bg-emerald-100 text-emerald-800' :
                                          client.interest === 'venda' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {client.interest}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        {client.email} &bull; {client.phone}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 px-2.5 py-1 text-gray-600">
                                      De: <strong className="text-brand-primary">{client.transferFrom || 'Colega'}</strong>
                                    </span>
                                  </div>

                                  {client.transferNote && (
                                    <div className="bg-white border border-gray-200 p-3 text-xs text-gray-700">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Nota do Colega</span>
                                      {client.transferNote}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                    <span className="text-[10px] text-gray-400">
                                      {client.transferAt ? `Enviado em ${new Date(client.transferAt).toLocaleString('pt-PT')}` : ''}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={transferLoadingId === client.id}
                                        onClick={() => handleRejectClientTransfer(client)}
                                        className="px-4 py-2 border border-red-200 text-red-700 bg-white hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                      >
                                        <X size={14} /> Recusar
                                      </button>
                                      <button
                                        type="button"
                                        disabled={transferLoadingId === client.id}
                                        onClick={() => handleAcceptClientTransfer(client)}
                                        className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                                      >
                                        {transferLoadingId === client.id ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <Check size={14} />
                                        )}
                                        Aceitar Cliente
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-white shadow-xl p-8 border border-gray-100">
                          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
                            <h3 className="text-base font-serif font-bold text-brand-primary flex items-center gap-2">
                              <ArrowLeftRight size={16} className="text-brand-secondary" /> Envios Pendentes
                            </h3>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              {outgoingTransfers.length} {outgoingTransfers.length === 1 ? 'envio' : 'envios'}
                            </span>
                          </div>

                          {outgoingTransfers.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Nenhum envio pendente de aceitação.</p>
                          ) : (
                            <div className="space-y-3">
                              {outgoingTransfers.map(client => (
                                <div key={client.id} className="border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
                                  <div>
                                    <div className="font-bold text-sm text-brand-primary">
                                      {client.firstName} {client.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Enviado para <strong className="text-brand-primary">{client.transferTo}</strong> &bull; Aguarda aceitação
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={transferLoadingId === client.id}
                                    onClick={() => handleCancelClientTransfer(client)}
                                    className="px-3.5 py-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 self-start sm:self-auto transition-colors disabled:opacity-50"
                                  >
                                    {transferLoadingId === client.id ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Ban size={13} />
                                    )}
                                    Cancelar Envio
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {clientesTab === 'add' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100 max-w-4xl">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                     <div>
                       <h2 className="text-2xl font-serif font-bold text-brand-primary">Registar Novo Cliente</h2>
                       <p className="text-xs text-gray-400 mt-1">Este cliente ficará associado ao consultor atual e visível em &ldquo;Meus Clientes&rdquo;.</p>
                     </div>
                     <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-accent/40 text-brand-primary px-3 py-1.5">
                       Consultor: {username}
                     </span>
                   </div>
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

              {clientesTab !== 'add' && clientesTab !== 'transfer' && (() => {
                const filteredClients = clients.filter(client => {
                  if (clientesTab === 'meus') return normalizeUser(client.createdBy) === normalizeUser(username);
                  if (clientesTab === 'compra') return client.interest === 'compra';
                  if (clientesTab === 'venda') return client.interest === 'venda';
                  if (clientesTab === 'arrendamento') return client.interest === 'arrendamento';
                  return true;
                });

                const tabTitle =
                  clientesTab === 'meus' ? `Meus Clientes (${username})` :
                  clientesTab === 'compra' ? 'Clientes com Interesse de Compra' :
                  clientesTab === 'venda' ? 'Clientes com Interesse de Venda' :
                  clientesTab === 'arrendamento' ? 'Clientes com Interesse de Arrendamento' :
                  'Todos os Clientes';

                const emptyText =
                  clientesTab === 'meus' ? 'Ainda não adicionou nenhum cliente com este utilizador.' :
                  clientesTab === 'compra' ? 'Nenhum cliente com interesse de compra registado.' :
                  clientesTab === 'venda' ? 'Nenhum cliente com interesse de venda registado.' :
                  clientesTab === 'arrendamento' ? 'Nenhum cliente com interesse de arrendamento registado.' :
                  'Nenhum cliente registado.';

                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white shadow-xl p-8 md:p-12 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                      <h2 className="text-xl font-serif font-bold text-brand-primary">{tabTitle}</h2>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-100">
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Nome</th>
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Contacto</th>
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Interesse</th>
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Consultor</th>
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4">Data Registo</th>
                            <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 px-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClients.length === 0 ? (
                            <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">{emptyText}</td></tr>
                          ) : (
                            filteredClients.map(client => {
                              const cleanTel = (client.phone || '').replace(/[^\d+]/g, '');
                              const waDigits = sanitizeWhatsAppPhone(client.phone || '');
                              const hasPhone = cleanTel.replace(/\D/g, '').length >= 7;
                              const hasWhatsApp = waDigits.length >= 7;
                              const hasEmail = Boolean(client.email && client.email.trim());
                              const waMessage = `Olá ${client.firstName || 'estimado(a) cliente'}, contacto da Villas Sequa Imobiliária relativamente ao seu interesse de ${client.interest}.`;
                              const mailSubject = `Villas Sequa Imobiliária — Contacto (${client.interest})`;

                              return (
                                <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                                  <td className="py-5 px-4">
                                    <div className="font-bold text-brand-primary">{client.firstName} {client.lastName}</div>
                                    {client.transferStatus === 'pending' && client.transferTo && (
                                      <div className="text-[10px] font-bold text-amber-700 mt-0.5">
                                        Transferência pendente para: {client.transferTo}
                                      </div>
                                    )}
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
                                  <td className="py-5 px-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 ${
                                      normalizeUser(client.createdBy) === normalizeUser(username)
                                        ? 'bg-brand-accent/50 text-brand-primary'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {client.createdBy || '—'}
                                    </span>
                                  </td>
                                  <td className="py-5 px-4 text-xs text-gray-400">
                                    {new Date(client.createdAt).toLocaleDateString('pt-PT')}
                                  </td>
                                  <td className="py-5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {hasPhone ? (
                                        <a
                                          href={`tel:${cleanTel}`}
                                          title={`Ligar para ${client.phone}`}
                                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-secondary hover:bg-brand-secondary/90 text-white text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap"
                                        >
                                          <Phone size={13} /> Ligar
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled
                                          title="Sem número de telefone"
                                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed whitespace-nowrap"
                                        >
                                          <Phone size={13} /> Ligar
                                        </button>
                                      )}

                                      {hasWhatsApp ? (
                                        <a
                                          href={`https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title={`Contactar ${client.firstName} por WhatsApp`}
                                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1fb858] text-white text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap"
                                        >
                                          <MessageCircle size={13} /> WhatsApp
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled
                                          title="Sem número de WhatsApp válido"
                                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed whitespace-nowrap"
                                        >
                                          <MessageCircle size={13} /> WhatsApp
                                        </button>
                                      )}

                                      {hasEmail ? (
                                        <a
                                          href={`mailto:${client.email.trim()}?subject=${encodeURIComponent(mailSubject)}`}
                                          title={`Enviar email para ${client.email}`}
                                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap"
                                        >
                                          <Mail size={13} /> Email
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled
                                          title="Sem endereço de email"
                                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed whitespace-nowrap"
                                        >
                                          <Mail size={13} /> Email
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClient(client.id)}
                                        title="Eliminar cliente"
                                        className="text-red-300 hover:text-red-600 transition-colors p-2 ml-1"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              })()}
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
                  <button 
                    onClick={() => setLeadsSubTab('match')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                      leadsSubTab === 'match' ? 'border-brand-primary text-brand-primary bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Star size={18} /> Match ({leads.filter(l => l.type === 'match').length})
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
                            lead.type === 'newsletter' ? 'bg-emerald-500 text-white' : 
                            lead.type === 'match' ? 'bg-brand-secondary text-white' : 'bg-gray-500 text-white'
                          }`}>
                            {lead.type === 'evaluation' ? 'Avaliação' : lead.type === 'contact' ? 'Contacto' : lead.type === 'newsletter' ? 'Newsletter' : lead.type === 'match' ? 'Match' : 'Info'}
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
                         {lead.propertyType && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><Briefcase size={10} /> {lead.propertyType}</div>}
                         {lead.category && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><Star size={10} /> {lead.category === 'venda' ? 'Compra' : lead.category === 'arrendamento' ? 'Arrendamento' : 'Nova Construção'}</div>}
                         {lead.location && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><MapPin size={10} /> {lead.location}</div>}
                         {lead.bedrooms !== undefined && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><BedDouble size={10} /> {lead.bedrooms} Quartos</div>}
                         {lead.maxPrice !== undefined && lead.maxPrice > 0 && <div className="text-[10px] text-gray-500 uppercase tracking-tighter flex items-center gap-1"><Euro size={10} /> Até {lead.maxPrice.toLocaleString('pt-PT')} €</div>}
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
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-brand-primary">Matching Inteligente</h1>
                  <p className="text-gray-500 text-sm">
                    Visualização das especificações pedidas por cada lead, recomendação automática dos 2 imóveis com maior correspondência e contacto direto após atribuição.
                  </p>
                </div>
                <div className="bg-white border border-gray-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Regra: Top 2 Imóveis por Nº de Especificações
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {leads.filter(l => l.type !== 'newsletter' && (l.type === 'match' || l.location || l.propertyType || l.category || l.message || l.bedrooms !== undefined || l.maxPrice || (l.desiredFeatures && l.desiredFeatures.length > 0))).length === 0 ? (
                  <div className="bg-white p-12 text-center border border-gray-200 text-gray-400 italic">
                    Nenhum pedido com critérios de pesquisa específicos encontrado para matching.
                  </div>
                ) : (
                  leads
                    .filter(l => l.type !== 'newsletter' && (l.type === 'match' || l.location || l.propertyType || l.category || l.message || l.bedrooms !== undefined || l.maxPrice || (l.desiredFeatures && l.desiredFeatures.length > 0)))
                    .map(lead => {
                      const specs = extractLeadSpecifications(lead, properties);
                      const topMatches = getTopMatchedProperties(properties, specs, 2);

                      const assignedResults = (lead.matchedPropertyIds || [])
                        .map(id => properties.find(p => p.id === id))
                        .filter((p): p is Property => Boolean(p))
                        .map(p => evaluatePropertyMatch(p, specs));

                      const isAssigned = assignedResults.length > 0;
                      const displayResults = isAssigned ? assignedResults : topMatches;
                      const whatsappDigits = sanitizeWhatsAppPhone(lead.phone);
                      const hasValidWhatsApp = whatsappDigits.length >= 9;
                      const isEditingSpecs = editingSpecsLeadId === lead.id;

                      const topIds = topMatches.map(m => m.property.id);
                      const assignedIds = assignedResults.map(m => m.property.id);
                      const recommendationsDifferFromAssigned =
                        isAssigned &&
                        topIds.length > 0 &&
                        (topIds.length !== assignedIds.length || topIds.some((id, idx) => assignedIds[idx] !== id));

                      const handleOpenSpecsEditor = () => {
                        const typeSpec = specs.find(s => s.category === 'type');
                        const locSpec = specs.find(s => s.category === 'location');
                        const catSpec = specs.find(s => s.category === 'category');
                        const bedSpec = specs.find(s => s.category === 'bedrooms');
                        const priceSpec = specs.find(s => s.category === 'maxPrice');
                        const featSpecs = specs.filter(s => s.category === 'feature').map(s => String(s.rawValue));

                        setSpecsDraft({
                          location: lead.location || (locSpec ? String(locSpec.rawValue) : ''),
                          propertyType: lead.propertyType || (typeSpec ? String(typeSpec.rawValue) : ''),
                          category: (lead.category || (catSpec ? String(catSpec.rawValue) : '')) as 'venda' | 'arrendamento' | 'construcao' | '',
                          bedrooms: lead.bedrooms ? String(lead.bedrooms) : (bedSpec ? String(bedSpec.rawValue) : ''),
                          maxPrice: lead.maxPrice ? String(lead.maxPrice) : (priceSpec ? String(priceSpec.rawValue) : ''),
                          desiredFeatures: lead.desiredFeatures?.length ? lead.desiredFeatures : featSpecs,
                        });
                        setEditingSpecsLeadId(lead.id);
                      };

                      const handleSaveLeadSpecs = async (e: React.FormEvent) => {
                        e.preventDefault();
                        setSavingSpecs(true);
                        try {
                          const updates: Partial<Lead> = {
                            location: specsDraft.location.trim(),
                            propertyType: specsDraft.propertyType.trim(),
                            category: specsDraft.category,
                            bedrooms: specsDraft.bedrooms ? parseInt(specsDraft.bedrooms, 10) || 0 : 0,
                            maxPrice: specsDraft.maxPrice ? parseFloat(specsDraft.maxPrice) || 0 : 0,
                            desiredFeatures: specsDraft.desiredFeatures,
                          };
                          await updateLeadInFirestore(lead.id, updates);
                          setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, ...updates } : l)));
                          setEditingSpecsLeadId(null);
                        } catch (err) {
                          console.error('Erro ao guardar especificações:', err);
                        } finally {
                          setSavingSpecs(false);
                        }
                      };

                      const handleAssignTopMatches = async () => {
                        if (topMatches.length === 0) return;
                        setAssigningLeadId(lead.id);
                        try {
                          const matchedPropertyIds = topMatches.map(m => m.property.id);
                          const matchedAt = new Date().toISOString();
                          const nextStatus: Lead['status'] = lead.status === 'new' ? 'qualified' : lead.status;
                          await updateLeadInFirestore(lead.id, {
                            matchedPropertyIds,
                            matchedAt,
                            status: nextStatus,
                          });
                          setLeads(prev =>
                            prev.map(l =>
                              l.id === lead.id
                                ? { ...l, matchedPropertyIds, matchedAt, status: nextStatus }
                                : l
                            )
                          );
                        } catch (err) {
                          console.error('Erro ao atribuir imóveis:', err);
                        } finally {
                          setAssigningLeadId(null);
                        }
                      };

                      const handleClearAssignment = async () => {
                        setAssigningLeadId(lead.id);
                        try {
                          await updateLeadInFirestore(lead.id, {
                            matchedPropertyIds: [],
                            matchedAt: '',
                          });
                          setLeads(prev =>
                            prev.map(l =>
                              l.id === lead.id
                                ? { ...l, matchedPropertyIds: [], matchedAt: '' }
                                : l
                            )
                          );
                        } catch (err) {
                          console.error('Erro ao limpar atribuição:', err);
                        } finally {
                          setAssigningLeadId(null);
                        }
                      };

                      return (
                        <div key={lead.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                          {/* Lead Card Header */}
                          <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 tracking-widest ${
                                  isAssigned ? 'bg-emerald-600 text-white' : 'bg-brand-primary text-white'
                                }`}>
                                  {isAssigned
                                    ? `${assignedResults.length} Imóve${assignedResults.length === 1 ? 'l Atribuído' : 'is Atribuídos'}`
                                    : 'Lead Ativa'}
                                </span>
                                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 tracking-widest ${
                                  lead.type === 'match' ? 'bg-brand-secondary text-white' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {lead.type === 'evaluation' ? 'Avaliação' : lead.type === 'contact' ? 'Contacto' : lead.type === 'match' ? 'Formulário Match' : 'Pedido Info'}
                                </span>
                                <span className="text-[10px] text-gray-400">{new Date(lead.createdAt).toLocaleDateString('pt-PT')}</span>
                              </div>
                              <h2 className="text-xl font-serif font-bold text-brand-primary">{lead.name}</h2>
                              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-gray-500">
                                {lead.phone && (
                                  <span className="flex items-center gap-1.5">
                                    <Phone size={12} className="text-brand-secondary" /> {lead.phone}
                                  </span>
                                )}
                                {lead.email && (
                                  <span className="flex items-center gap-1.5">
                                    <Mail size={12} className="text-brand-secondary" /> {lead.email}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Assignment & Contact Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                              {!isAssigned ? (
                                <button
                                  type="button"
                                  disabled={topMatches.length === 0 || assigningLeadId === lead.id}
                                  onClick={handleAssignTopMatches}
                                  className="bg-brand-secondary text-white px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-brand-secondary/90 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {assigningLeadId === lead.id ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={15} />
                                  )}
                                  Atribuir {topMatches.length === 2 ? 'os 2 Imóveis' : 'Imóvel'} à Lead
                                </button>
                              ) : (
                                <>
                                  {hasValidWhatsApp ? (
                                    <a
                                      href={formatWhatsAppUrl(
                                        lead.phone,
                                        lead,
                                        assignedResults.map(r => r.property)
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-[#25D366] hover:bg-[#1fb858] text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-2 transition-all"
                                    >
                                      <MessageCircle size={16} /> Contactar por WhatsApp
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled
                                      title="Esta lead não tem número de telefone válido"
                                      className="bg-gray-200 text-gray-400 px-5 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-not-allowed"
                                    >
                                      <MessageCircle size={16} /> Sem Telemóvel
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVisualEmailModal({
                                        lead,
                                        assignedProps: assignedResults.map(r => r.property),
                                      })
                                    }
                                    className="bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-2 transition-all"
                                  >
                                    <Mail size={16} /> Contactar por Email
                                    <span className="text-[8px] bg-white/20 px-1.5 py-0.5 tracking-wider">Visual</span>
                                  </button>

                                  {recommendationsDifferFromAssigned && (
                                    <button
                                      type="button"
                                      disabled={assigningLeadId === lead.id}
                                      onClick={handleAssignTopMatches}
                                      className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                                    >
                                      Atualizar Top 2
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={assigningLeadId === lead.id}
                                    onClick={handleClearAssignment}
                                    className="border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 px-3 py-3 text-[10px] font-bold uppercase tracking-widest transition-all"
                                    title="Remover atribuição de imóveis"
                                  >
                                    Desatribuir
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Requested Specifications Section */}
                          <div className="p-6 border-b border-gray-100 bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-secondary flex items-center gap-2">
                                <SlidersHorizontal size={13} /> Especificações Pedidas pela Lead ({specs.length})
                              </h3>
                              <button
                                type="button"
                                onClick={() => (isEditingSpecs ? setEditingSpecsLeadId(null) : handleOpenSpecsEditor())}
                                className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-brand-secondary flex items-center gap-1 transition-colors"
                              >
                                <Edit3 size={12} /> {isEditingSpecs ? 'Fechar Editor' : 'Editar Especificações'}
                              </button>
                            </div>

                            {specs.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                                {specs.map(spec => (
                                  <div key={spec.key} className="bg-gray-50 border border-gray-200 px-3 py-2.5">
                                    <span className="block text-[9px] uppercase tracking-wider font-bold text-gray-400">
                                      {spec.label}
                                    </span>
                                    <span className="block text-xs font-bold text-brand-primary mt-0.5 truncate" title={spec.value}>
                                      {spec.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic mb-4 bg-gray-50 p-3 border border-dashed border-gray-200">
                                Nenhuma especificação estruturada detetada automaticamente na mensagem. Utilize &ldquo;Editar Especificações&rdquo; para definir os critérios desta lead.
                              </div>
                            )}

                            {lead.message && (
                              <div className="bg-gray-50 border-l-2 border-brand-secondary px-4 py-2.5 text-xs text-gray-600 italic">
                                <span className="font-bold not-italic text-[10px] uppercase tracking-wider text-gray-400 mr-2">
                                  Pedido do Cliente:
                                </span>
                                &ldquo;{lead.message}&rdquo;
                              </div>
                            )}

                            {/* Inline Specification Editor */}
                            {isEditingSpecs && (
                              <form onSubmit={handleSaveLeadSpecs} className="mt-5 p-5 bg-gray-50 border border-gray-200 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-1 block">Tipo de Imóvel</label>
                                    <select
                                      value={specsDraft.propertyType}
                                      onChange={e => setSpecsDraft({ ...specsDraft, propertyType: e.target.value })}
                                      className="w-full p-2.5 bg-white border border-gray-200 text-xs outline-none focus:border-brand-primary"
                                    >
                                      <option value="">Qualquer</option>
                                      <option value="Vivenda">Vivenda / Moradia</option>
                                      <option value="Apartamento">Apartamento</option>
                                      <option value="Terreno">Terreno</option>
                                      <option value="Comercial">Comercial</option>
                                      <option value="Nova Construção">Nova Construção</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-1 block">Localização</label>
                                    <input
                                      type="text"
                                      value={specsDraft.location}
                                      onChange={e => setSpecsDraft({ ...specsDraft, location: e.target.value })}
                                      placeholder="Ex: Vilamoura"
                                      className="w-full p-2.5 bg-white border border-gray-200 text-xs outline-none focus:border-brand-primary"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-1 block">Finalidade</label>
                                    <select
                                      value={specsDraft.category}
                                      onChange={e =>
                                        setSpecsDraft({
                                          ...specsDraft,
                                          category: e.target.value as 'venda' | 'arrendamento' | 'construcao' | '',
                                        })
                                      }
                                      className="w-full p-2.5 bg-white border border-gray-200 text-xs outline-none focus:border-brand-primary"
                                    >
                                      <option value="">Qualquer</option>
                                      <option value="venda">Compra</option>
                                      <option value="arrendamento">Arrendamento</option>
                                      <option value="construcao">Nova Construção</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-1 block">Quartos Mín.</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={specsDraft.bedrooms}
                                      onChange={e => setSpecsDraft({ ...specsDraft, bedrooms: e.target.value })}
                                      placeholder="Ex: 3"
                                      className="w-full p-2.5 bg-white border border-gray-200 text-xs outline-none focus:border-brand-primary"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-1 block">Orçamento Máx. (€)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={specsDraft.maxPrice}
                                      onChange={e => setSpecsDraft({ ...specsDraft, maxPrice: e.target.value })}
                                      placeholder="Ex: 500000"
                                      className="w-full p-2.5 bg-white border border-gray-200 text-xs outline-none focus:border-brand-primary"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-2 block">Comodidades Desejadas</label>
                                  <div className="flex flex-wrap gap-2">
                                    {PROPERTY_FEATURES.map(feat => {
                                      const selected = specsDraft.desiredFeatures.includes(feat);
                                      return (
                                        <button
                                          key={feat}
                                          type="button"
                                          onClick={() => {
                                            setSpecsDraft({
                                              ...specsDraft,
                                              desiredFeatures: selected
                                                ? specsDraft.desiredFeatures.filter(f => f !== feat)
                                                : [...specsDraft.desiredFeatures, feat],
                                            });
                                          }}
                                          className={`px-2.5 py-1 text-[10px] font-bold border transition-all ${
                                            selected
                                              ? 'bg-brand-primary text-white border-brand-primary'
                                              : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary'
                                          }`}
                                        >
                                          {feat}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSpecsLeadId(null)}
                                    className="px-4 py-2 bg-white border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-600"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={savingSpecs}
                                    className="px-6 py-2 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                                  >
                                    {savingSpecs && <Loader2 size={12} className="animate-spin" />}
                                    Guardar Especificações
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>

                          {/* Top 2 Recommended / Assigned Properties */}
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-5">
                              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                                {isAssigned
                                  ? `Imóveis Atribuídos à Lead (${displayResults.length})`
                                  : `2 Imóveis Recomendados com Maior Correspondência (${displayResults.length})`}
                              </h3>
                              {isAssigned && lead.matchedAt && (
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  Atribuído em {new Date(lead.matchedAt).toLocaleDateString('pt-PT')}
                                </span>
                              )}
                            </div>

                            {displayResults.length === 0 ? (
                              <div className="py-8 text-center text-gray-400 text-sm italic border-2 border-dashed border-gray-100">
                                Nenhum imóvel disponível no catálogo corresponde às especificações atuais desta lead.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {displayResults.map((result, idx) => {
                                  const prop = result.property;
                                  return (
                                    <div
                                      key={prop.id}
                                      className={`border transition-all p-4 flex flex-col justify-between ${
                                        isAssigned
                                          ? 'border-emerald-200 bg-emerald-50/30'
                                          : 'border-gray-200 bg-gray-50 hover:border-brand-secondary'
                                      }`}
                                    >
                                      <div>
                                        <div className="relative mb-3">
                                          <img
                                            src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'}
                                            alt={prop.title}
                                            className="w-full h-44 object-cover"
                                          />
                                          <div className="absolute top-3 left-3 flex gap-2">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 shadow ${
                                              isAssigned ? 'bg-emerald-600 text-white' : 'bg-brand-primary text-white'
                                            }`}>
                                              {isAssigned ? `Atribuído #${idx + 1}` : `#${idx + 1} Recomendado`}
                                            </span>
                                          </div>
                                          <div className="absolute top-3 right-3 bg-white/95 text-brand-primary text-[10px] font-bold px-2.5 py-1 shadow">
                                            {result.matchCount}/{result.totalSpecs} Especificações
                                          </div>
                                        </div>

                                        <div className="flex justify-between items-start mb-1">
                                          <span className="text-[10px] font-bold uppercase text-brand-secondary">
                                            {prop.type} • {prop.reference}
                                          </span>
                                          <span className="text-sm font-bold text-brand-primary">
                                            {prop.priceOnRequest ? 'Sob Consulta' : `€${prop.price.toLocaleString('pt-PT')}`}
                                          </span>
                                        </div>

                                        <h4 className="text-base font-serif font-bold text-brand-primary line-clamp-1 mb-1">
                                          {prop.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 line-clamp-1 mb-3 flex items-center gap-1">
                                          <MapPin size={11} className="text-brand-secondary" /> {prop.location}
                                        </p>

                                        <div className="flex items-center gap-4 text-[10px] text-gray-500 border-y border-gray-200/70 py-2 mb-3">
                                          <span className="flex items-center gap-1"><BedDouble size={12} /> {prop.bedrooms} Quartos</span>
                                          <span className="flex items-center gap-1"><Bath size={12} /> {prop.bathrooms} WC</span>
                                          <span className="flex items-center gap-1"><Maximize2 size={12} /> {prop.area} m²</span>
                                        </div>

                                        {/* Specification Match Breakdown */}
                                        <div className="mb-4">
                                          <span className="block text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-1.5">
                                            Correspondência das Especificações:
                                          </span>
                                          <div className="flex flex-wrap gap-1.5">
                                            {result.matchedSpecs.map(s => (
                                              <span
                                                key={s.key}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5"
                                              >
                                                <Check size={10} /> {s.value}
                                              </span>
                                            ))}
                                            {result.unmatchedSpecs.map(s => (
                                              <span
                                                key={s.key}
                                                className="inline-flex items-center gap-1 text-[10px] bg-gray-200/70 text-gray-500 px-2 py-0.5 line-through"
                                              >
                                                {s.value}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setMatchingDetailProperty(prop)}
                                        className="w-full py-2.5 bg-white border border-gray-200 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
                                      >
                                        Ver Ficha do Imóvel
                                      </button>
                                    </div>
                                  );
                                })}
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

      {/* Property Quick Detail Modal (Matching) */}
      {matchingDetailProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                  {matchingDetailProperty.type} • Ref: {matchingDetailProperty.reference}
                </span>
                <h3 className="font-serif font-bold text-brand-primary text-xl">{matchingDetailProperty.title}</h3>
              </div>
              <button
                onClick={() => setMatchingDetailProperty(null)}
                className="p-2 hover:bg-gray-200 transition-colors text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {matchingDetailProperty.images[0] && (
                <img
                  src={matchingDetailProperty.images[0]}
                  alt={matchingDetailProperty.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 border border-gray-100">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">Preço</span>
                  <span className="text-sm font-bold text-brand-primary">
                    {matchingDetailProperty.priceOnRequest
                      ? 'Sob Consulta'
                      : `${matchingDetailProperty.price.toLocaleString('pt-PT')} €`}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">Localização</span>
                  <span className="text-sm font-bold text-brand-primary">{matchingDetailProperty.location}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">Tipologia</span>
                  <span className="text-sm font-bold text-brand-primary">{matchingDetailProperty.bedrooms} Quartos • {matchingDetailProperty.bathrooms} WC</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">Área Útil</span>
                  <span className="text-sm font-bold text-brand-primary">{matchingDetailProperty.area} m²</span>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Descrição</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{matchingDetailProperty.description}</p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Características</h4>
                <div className="flex flex-wrap gap-2">
                  {matchingDetailProperty.features.map(f => (
                    <span key={f} className="bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold text-brand-primary">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50">
              <button
                onClick={() => setMatchingDetailProperty(null)}
                className="bg-brand-primary text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Email Preview Modal (No API connected yet) */}
      {visualEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary text-white">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-brand-primary text-lg">Contactar Lead por Email</h3>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600">
                    Modo Visual — API de Email por ligar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVisualEmailModal(null)}
                className="p-2 hover:bg-gray-200 transition-colors text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-xs text-amber-900">
                <strong>Aviso Visual:</strong> Este botão será ligado à API de envio de emails numa fase posterior. Abaixo encontra a pré-visualização da mensagem preparada para esta lead.
              </div>

              <div className="grid grid-cols-1 gap-3 text-xs">
                <div className="bg-gray-50 p-3 border border-gray-200">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-0.5">Para</span>
                  <span className="font-bold text-brand-primary">{visualEmailModal.lead.name} &lt;{visualEmailModal.lead.email}&gt;</span>
                </div>
                <div className="bg-gray-50 p-3 border border-gray-200">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block mb-0.5">Assunto</span>
                  <span className="font-bold text-brand-primary">Seleção Personalizada: 2 Imóveis no Algarve para si</span>
                </div>
                <div className="bg-gray-50 p-4 border border-gray-200 space-y-3 text-gray-600 leading-relaxed">
                  <p>Olá <strong>{visualEmailModal.lead.name}</strong>,</p>
                  <p>Com base nas especificações que nos indicou, selecionámos os 2 imóveis que melhor correspondem ao que procura:</p>
                  <ul className="space-y-2">
                    {visualEmailModal.assignedProps.map((p, i) => (
                      <li key={p.id} className="bg-white p-3 border border-gray-200 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-brand-primary">{i + 1}. {p.title}</div>
                          <div className="text-[11px] text-gray-500">{p.location} • Ref: {p.reference}</div>
                        </div>
                        <div className="font-bold text-brand-secondary">
                          {p.priceOnRequest ? 'Sob Consulta' : `${p.price.toLocaleString('pt-PT')} €`}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p>Ficamos ao dispor para agendar uma visita.</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setVisualEmailModal(null)}
                className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-gray-100"
              >
                Fechar
              </button>
              <button
                type="button"
                disabled
                className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold uppercase tracking-widest opacity-50 cursor-not-allowed flex items-center gap-2"
              >
                <Mail size={14} /> Enviar Email (API por ligar)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const ScaledDevicePreview: React.FC<{ device: PreviewDevice; children: React.ReactNode }> = ({ device, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const targetWidth = device === 'desktop' ? 1280 : device === 'tablet' ? 768 : 390;
  const bezelPadding = device === 'desktop' ? 0 : device === 'tablet' ? 26 : 22;
  const [scale, setScale] = useState(device === 'mobile' ? 1 : 0.5);
  const [contentHeight, setContentHeight] = useState(600);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const availableWidth = Math.max(200, containerRef.current.clientWidth - bezelPadding);
        setScale(Math.min(1, availableWidth / targetWidth));
      }
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    };

    updateSize();

    const ro = new ResizeObserver(() => {
      updateSize();
    });
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current) ro.observe(contentRef.current);

    return () => ro.disconnect();
  }, [children, targetWidth, bezelPadding]);

  const scaledWidth = Math.round(targetWidth * scale);
  const scaledHeight = Math.max(180, Math.ceil(contentHeight * scale));

  if (device === 'desktop') {
    return (
      <div
        ref={containerRef}
        className="w-full overflow-hidden relative bg-white"
        style={{ height: `${scaledHeight}px` }}
      >
        <div
          ref={contentRef}
          className="origin-top-left pointer-events-none select-none"
          style={{
            width: `${targetWidth}px`,
            transform: `scale(${scale})`
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div
        className={`bg-gray-900 shadow-2xl border border-gray-800 overflow-hidden w-fit ${
          device === 'mobile' ? 'rounded-[28px] p-2.5' : 'rounded-[18px] p-3'
        }`}
      >
        {/* Top Hardware Bezel */}
        <div className="flex items-center justify-center pb-2">
          {device === 'mobile' ? (
            <div className="w-16 h-1.5 rounded-full bg-gray-700" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-gray-700" />
          )}
        </div>
        <div
          className="overflow-hidden relative bg-white mx-auto"
          style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
        >
          <div
            ref={contentRef}
            className="origin-top-left pointer-events-none select-none"
            style={{
              width: `${targetWidth}px`,
              transform: `scale(${scale})`
            }}
          >
            {children}
          </div>
        </div>
        <div className="flex items-center justify-center pt-2">
          <div className={`rounded-full bg-gray-700 ${device === 'mobile' ? 'w-20 h-1' : 'w-10 h-1'}`} />
        </div>
      </div>
    </div>
  );
};

const PreviewNavbar: React.FC<{
  transparent?: boolean;
  activeLabel?: string;
  device?: PreviewDevice;
  config?: WebsiteConfig;
  lang?: 'pt' | 'en';
}> = ({
  transparent = false,
  activeLabel,
  device = 'desktop',
  config,
  lang = 'pt'
}) => {
  const resolvedLang: 'pt' | 'en' = lang === 'en' ? 'en' : 'pt';
  const menuItems = getResolvedHeaderLinks(config, resolvedLang).filter(item => item.visible);
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';

  return (
    <nav className={`w-full z-30 ${transparent ? 'absolute top-0 left-0 bg-transparent py-5' : 'relative bg-white shadow-sm py-3 border-b border-gray-100'}`}>
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : isTablet ? 'px-5' : 'px-8'} flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <Building2 className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} ${transparent ? 'text-white' : 'text-brand-primary'}`} />
          <span className={`font-serif font-bold tracking-tighter ${isMobile ? 'text-base' : 'text-lg'} ${transparent ? 'text-white' : 'text-brand-primary'}`}>
            IMOBILIÁRIA<span className="text-brand-secondary italic">PREMIUM</span>
          </span>
        </div>

        {isMobile ? (
          <div className="flex items-center space-x-2">
            <span className={`p-2 ${transparent ? 'text-white' : 'text-brand-primary'}`}>
              <Heart size={20} />
            </span>
            <span className={`p-2 ${transparent ? 'text-white' : 'text-brand-primary'}`}>
              <Menu size={24} />
            </span>
          </div>
        ) : (
          <div className={`flex items-center ${isTablet ? 'space-x-2.5' : 'space-x-5'}`}>
            {menuItems.map(item => (
              <span
                key={item.id}
                className={`${isTablet ? 'text-[9px] tracking-[0.12em]' : 'text-[10px] tracking-[0.2em]'} uppercase font-bold whitespace-nowrap ${
                  activeLabel === item.label
                    ? transparent
                      ? 'text-white underline underline-offset-8 decoration-white/50'
                      : 'text-brand-secondary'
                    : transparent
                    ? 'text-white/80'
                    : 'text-brand-primary'
                }`}
              >
                {item.label}
              </span>
            ))}
            <span className={`inline-flex border ${isTablet ? 'text-[8px]' : 'text-[9px]'} font-bold tracking-widest ${transparent ? 'border-white/25' : 'border-gray-200'}`}>
              <span className={`px-1.5 py-0.5 ${lang === 'pt' ? 'bg-brand-secondary text-white' : transparent ? 'text-white/70' : 'text-brand-primary'}`}>PT</span>
              <span className={`px-1.5 py-0.5 ${lang === 'en' ? 'bg-brand-secondary text-white' : transparent ? 'text-white/70' : 'text-brand-primary'}`}>EN</span>
            </span>
            <span className={`p-1.5 ${transparent ? 'text-white' : 'text-brand-primary'}`}>
              <Heart size={16} />
            </span>
            <span className={`bg-brand-secondary text-white ${isTablet ? 'px-3 py-2 text-[9px]' : 'px-5 py-2.5 text-[10px]'} uppercase tracking-widest font-bold shadow-md whitespace-nowrap`}>
              {lang === 'en' ? 'View Properties' : 'Ver Imóveis'}
            </span>
            <span className={`${isTablet ? 'px-2.5 py-2 text-[9px]' : 'px-4 py-2.5 text-[10px]'} border uppercase tracking-widest font-bold inline-flex items-center gap-1.5 whitespace-nowrap ${
              transparent ? 'border-white/40 text-white' : 'border-brand-primary/30 text-brand-primary'
            }`}>
              <Lock size={11} /> {lang === 'en' ? 'Backoffice' : 'Ir para o Backoffice'}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
};

const WebsitePreview: React.FC<{
  area?: 'header' | 'footer' | 'pages';
  headerLang?: 'pt' | 'en';
  page: string;
  section: string;
  config: WebsiteConfig;
  properties?: Property[];
  device?: PreviewDevice;
}> = ({
  area = 'pages',
  headerLang = 'pt',
  page,
  section,
  config,
  properties = [],
  device = 'desktop'
}) => {
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const isDesktop = device === 'desktop';

  if (area === 'header') {
    const resolvedHeaderLang: 'pt' | 'en' = headerLang === 'en' ? 'en' : 'pt';
    const visibleLinks = getResolvedHeaderLinks(config, resolvedHeaderLang).filter(i => i.visible);
    const heroImage = config.heroImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000';

    return (
      <ScaledDevicePreview device={device}>
        <div className="bg-white space-y-6 pb-8">
          {/* Transparent Header over Hero */}
          <div>
            <div className="bg-gray-100 px-6 py-2 text-[10px] uppercase tracking-widest font-bold text-gray-500 border-b border-gray-200">
              Cabeçalho Transparente (Página Inicial) · {headerLang.toUpperCase()}
            </div>
            <div className="relative h-[220px] overflow-hidden">
              <img src={heroImage} alt="Hero Header Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/55" />
              <PreviewNavbar transparent activeLabel={visibleLinks[0]?.label} device={device} config={config} lang={headerLang} />
              <div className="absolute inset-x-0 bottom-6 text-center text-white/60 text-xs uppercase tracking-widest">
                {visibleLinks.length} {visibleLinks.length === 1 ? 'ligação visível' : 'ligações visíveis'}
              </div>
            </div>
          </div>

          {/* Solid Header (Scrolled / Internal Pages) */}
          <div>
            <div className="bg-gray-100 px-6 py-2 text-[10px] uppercase tracking-widest font-bold text-gray-500 border-y border-gray-200">
              Cabeçalho Branco (Páginas Internas / Scroll) · {headerLang.toUpperCase()}
            </div>
            <PreviewNavbar activeLabel={visibleLinks[1]?.label} device={device} config={config} lang={headerLang} />
          </div>

          {/* Mobile Drawer Preview when previewing Mobile */}
          {isMobile && (
            <div className="px-4">
              <div className="border border-gray-200 bg-white shadow-lg p-6">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Menu Mobile ({headerLang.toUpperCase()})</span>
                  <span className="text-[10px] font-bold bg-brand-primary text-white px-2 py-0.5">{headerLang.toUpperCase()}</span>
                </div>
                {visibleLinks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4">Todas as ligações estão ocultas.</p>
                ) : (
                  visibleLinks.map(item => (
                    <div key={item.id} className="text-base font-serif font-bold text-brand-primary py-3 border-b border-gray-100">
                      {item.label}
                    </div>
                  ))
                )}
                <div className="mt-4 bg-brand-primary text-white px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-center flex items-center justify-center gap-1.5">
                  <Lock size={12} /> {headerLang === 'en' ? 'Backoffice' : 'Ir para o Backoffice'}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScaledDevicePreview>
    );
  }

  if (area === 'footer') {
    const instagramUrl = config.footerInstagramUrl?.trim() || '';
    const facebookUrl = config.footerFacebookUrl?.trim() || '';
    const linkedinUrl = config.footerLinkedinUrl?.trim() || '';
    const footerAddress = config.footerAddress?.trim() || config.contactAddress?.trim() || 'Av. 5 de Outubro, 123\n8000-001 Faro, Algarve';
    const footerPhone = config.footerPhone?.trim() || config.contactPhone?.trim() || '+351 289 123 456';
    const footerEmail = config.footerEmail?.trim() || config.contactEmail?.trim() || 'geral@imobiliariapremium.pt';

    return (
      <ScaledDevicePreview device={device}>
        <footer className={`bg-brand-primary text-white ${isMobile ? 'pt-14 pb-8 px-5' : 'pt-20 pb-10 px-8'}`}>
          <div className="max-w-7xl mx-auto">
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-10' : isTablet ? 'grid-cols-2 gap-10' : 'grid-cols-4 gap-12'} mb-14`}>
              <div>
                <div className="flex items-center mb-6 gap-2">
                  <Building2 className="h-8 w-8 text-brand-secondary" />
                  <span className="font-serif font-bold tracking-tighter text-xl text-white">
                    IMOBILIÁRIA<span className="text-brand-secondary italic">PREMIUM</span>
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Líderes no mercado imobiliário do Algarve, proporcionando um serviço premium e personalizado para compradores e vendedores exigentes.
                </p>
                <div className="flex space-x-3">
                  <span className={`p-2 rounded-full border ${instagramUrl ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-white/5 text-white/60 border-white/10'}`} title={instagramUrl || 'Instagram por configurar'}>
                    <Instagram size={18} />
                  </span>
                  <span className={`p-2 rounded-full border ${facebookUrl ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-white/5 text-white/60 border-white/10'}`} title={facebookUrl || 'Facebook por configurar'}>
                    <Facebook size={18} />
                  </span>
                  <span className={`p-2 rounded-full border ${linkedinUrl ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-white/5 text-white/60 border-white/10'}`} title={linkedinUrl || 'LinkedIn por configurar'}>
                    <Linkedin size={18} />
                  </span>
                </div>
                {(instagramUrl || facebookUrl || linkedinUrl) && (
                  <p className="text-[10px] text-emerald-300/90 mt-3 uppercase tracking-wider font-bold">
                    {[instagramUrl && 'IG', facebookUrl && 'FB', linkedinUrl && 'IN'].filter(Boolean).join(' · ')} ligado(s)
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-serif text-lg mb-6 text-white">Links Rápidos</h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>Início</li>
                  <li>Imóveis</li>
                  <li>Vender</li>
                  <li>Serviços</li>
                  <li>Sobre Nós</li>
                  <li>Contacto</li>
                  <li>Favoritos</li>
                </ul>
              </div>

              <div>
                <h4 className="font-serif text-lg mb-6 text-white">Serviços</h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>Compra de Imóveis</li>
                  <li>Venda e Avaliação</li>
                  <li>Arrendamentos</li>
                  <li>Gestão de Propriedades</li>
                  <li>Investimento Imobiliário</li>
                </ul>
              </div>

              <div>
                <h4 className="font-serif text-lg mb-6 text-white">Contacto</h4>
                <ul className="space-y-4 text-sm text-gray-300">
                  <li className="flex items-start space-x-3">
                    <MapPin size={18} className="text-brand-secondary mt-1 shrink-0" />
                    <span className="whitespace-pre-line">{footerAddress}</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Phone size={18} className="text-brand-secondary shrink-0" />
                    <span>{footerPhone}</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Mail size={18} className="text-brand-secondary shrink-0" />
                    <span className="break-all">{footerEmail}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className={`border-t border-white/10 pt-8 flex ${isMobile ? 'flex-col text-center' : 'flex-row justify-between'} items-center gap-4`}>
              <p className="text-xs text-white/50">
                &copy; {new Date().getFullYear()} Imobiliária Premium. Todos os direitos reservados.
              </p>
              <div className="flex space-x-8 text-xs text-white/50">
                <span>Política de Privacidade</span>
                <span>Termos e Condições</span>
              </div>
            </div>
          </div>
        </footer>
      </ScaledDevicePreview>
    );
  }

  if (page === 'home') {
    if (section === 'hero') {
      const heroTitle = config.heroTitle || 'Procura casa no Algarve?';
      const heroSubtitle = config.heroSubtitle || '';
      const heroImage = config.heroImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000';
      const heroButtonText = config.heroButtonText || 'Ver seleção';

      return (
        <ScaledDevicePreview device={device}>
          <div className="bg-white overflow-hidden">
            {/* Hero Section */}
            <section className={`relative ${isMobile ? 'h-[620px]' : isTablet ? 'h-[680px]' : 'h-[740px]'} flex items-center overflow-hidden`}>
              <PreviewNavbar transparent activeLabel="Início" device={device} config={config} lang="pt" />
              <div className="absolute inset-0 z-0">
                <img
                  src={heroImage}
                  alt="Algarve Luxury Real Estate"
                  className="w-full h-full object-cover scale-110"
                />
                <div className="absolute inset-0 bg-brand-muted/40 mix-blend-multiply" />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/60" />
              </div>

              <div className={`max-w-7xl mx-auto ${isMobile ? 'px-5 pt-8' : 'px-8'} relative z-10 w-full`}>
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className={`${isMobile ? 'text-5xl mb-5' : isTablet ? 'text-7xl mb-6' : 'text-8xl mb-6'} font-bold text-white leading-[1.1] tracking-tight ${config.heroTitleFont || 'font-serif'}`}>
                    {heroTitle}
                  </h1>

                  {heroSubtitle && (
                    <p className={`text-white/80 ${isMobile ? 'text-lg mb-8' : 'text-2xl mb-12'} max-w-2xl mx-auto font-light leading-relaxed ${config.heroSubtitleFont || ''}`}>
                      {heroSubtitle}
                    </p>
                  )}

                  <div className={`flex ${isMobile ? 'flex-col gap-4 px-2' : 'flex-row gap-8 justify-center'} mt-8`}>
                    <span className={`bg-brand-secondary text-white ${isMobile ? 'px-8 py-4 text-[10px]' : 'px-12 py-5 text-xs min-w-[240px]'} rounded-none uppercase tracking-[0.3em] font-bold shadow-2xl inline-flex items-center justify-center ${config.heroButtonTextFont || ''}`}>
                      {heroButtonText}
                    </span>
                    <span className={`bg-white/10 backdrop-blur-xl border border-white/30 text-white ${isMobile ? 'px-8 py-4 text-[10px]' : 'px-12 py-5 text-xs min-w-[240px]'} rounded-none uppercase tracking-[0.3em] font-bold inline-flex items-center justify-center`}>
                      Fale connosco
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Search */}
            <section className={`relative z-20 ${isMobile ? '-mt-12 px-4 pb-10' : '-mt-20 max-w-6xl mx-auto px-4 pb-12'}`}>
              <div className="bg-white p-2 rounded-none shadow-2xl border border-gray-100">
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} items-center`}>
                  <div className={`${isMobile ? 'px-6 py-5 border-b' : isTablet ? 'px-4 py-6 border-r' : 'px-8 py-8 border-r'} border-gray-100`}>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary mb-2 block">Localização</label>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400 shrink-0" />
                      <span className={`text-brand-primary font-medium ${isTablet ? 'text-sm' : ''}`}>Todo o Algarve</span>
                    </div>
                  </div>
                  <div className={`${isMobile ? 'px-6 py-5 border-b' : isTablet ? 'px-4 py-6 border-r' : 'px-8 py-8 border-r'} border-gray-100`}>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary mb-2 block">Tipo</label>
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={16} className="text-gray-400 shrink-0" />
                      <span className={`text-brand-primary font-medium ${isTablet ? 'text-sm' : ''}`}>Moradias & Apar.</span>
                    </div>
                  </div>
                  <div className={`${isMobile ? 'px-6 py-5 border-b' : isTablet ? 'px-4 py-6 border-r' : 'px-8 py-8 border-r'} border-gray-100`}>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-secondary mb-2 block">Preço Máx.</label>
                    <div className="flex items-center gap-2">
                      <Euro size={16} className="text-gray-400 shrink-0" />
                      <span className={`text-brand-primary font-medium ${isTablet ? 'text-sm' : ''}`}>Qualquer valor</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="w-full bg-brand-primary text-white h-14 flex items-center justify-center gap-2.5 font-bold uppercase tracking-[0.2em] text-xs shadow-lg">
                      <Search size={16} /> Pesquisar
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </ScaledDevicePreview>
      );
    }

    if (section === 'evaluation') {
      const evalTitle = config.evalTitle || 'Receba uma avaliação gratuita do seu imóvel em 24h.';
      const evalSubtitle = config.evalSubtitle || 'Sabemos o valor real do seu património. Utilizamos dados atualizados de mercado e a nossa vasta experiência local para garantir o melhor preço na venda.';
      const evalImage = config.evalImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000';

      return (
        <ScaledDevicePreview device={device}>
          <section className={`${isMobile ? 'py-14 px-5' : isTablet ? 'py-20 pb-28 px-8' : 'py-24 pb-32 px-8'} bg-brand-primary relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-secondary/10 -skew-x-12 translate-x-1/2" />
            <div className="max-w-7xl mx-auto relative z-10">
              <div className={`grid ${isDesktop ? 'grid-cols-2 gap-20' : 'grid-cols-1 gap-14'} items-center`}>
                <div>
                  <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Vender o seu imóvel?</span>
                  <h2 className={`${isMobile ? 'text-3xl mb-6' : isTablet ? 'text-5xl mb-8' : 'text-5xl xl:text-6xl mb-8'} font-bold text-white leading-tight tracking-tight ${config.evalTitleFont || 'font-serif'}`}>
                    {evalTitle}
                  </h2>
                  <p className={`text-white/80 ${isMobile ? 'text-base mb-8' : 'text-lg mb-10'} leading-relaxed font-light ${config.evalSubtitleFont || ''}`}>
                    {evalSubtitle}
                  </p>
                  <ul className="space-y-5 mb-10">
                    {[
                      'Estratégia de Marketing Personalizada',
                      'Fotografia Profissional e Vídeo 4K',
                      'Filtragem Rigorosa de Compradores'
                    ].map((item, i) => (
                      <li key={i} className={`flex items-center gap-4 text-white font-light ${isMobile ? 'text-base' : 'text-lg'}`}>
                        <div className="bg-brand-secondary/20 p-1 shrink-0">
                          <CheckCircle2 className="text-brand-secondary" size={20} />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={`inline-flex bg-brand-secondary text-white ${isMobile ? 'w-full px-6 py-4' : 'px-12 py-5'} rounded-none font-bold text-xs uppercase tracking-[0.3em] items-center justify-center gap-3 shadow-2xl`}>
                    Solicitar Avaliação <ArrowRight size={18} />
                  </div>
                </div>

                <div className="relative">
                  <div className="relative z-10 rounded-none overflow-hidden shadow-2xl aspect-[4/5]">
                    <img src={evalImage} alt="Serviço Premium" className="w-full h-full object-cover" />
                  </div>
                  {!isMobile && (
                    <div className={`absolute -bottom-10 ${isTablet ? 'left-4 p-8' : '-left-10 p-10'} bg-white rounded-none shadow-2xl max-w-xs z-20 border-l-4 border-brand-secondary`}>
                      <div className="flex gap-1 text-brand-secondary mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={18} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-brand-primary font-serif text-lg italic mb-6 leading-relaxed">
                        &ldquo;Excederam todas as expetativas na venda da nossa moradia em Vilamoura.&rdquo;
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-accent rounded-full flex items-center justify-center font-bold text-brand-primary">JS</div>
                        <div>
                          <div className="font-bold text-brand-primary text-sm uppercase tracking-wider">João Santos</div>
                          <div className="text-[10px] text-brand-muted uppercase tracking-widest">Proprietário</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </ScaledDevicePreview>
      );
    }

    if (section === 'stats') {
      return (
        <ScaledDevicePreview device={device}>
          <section className={`${isMobile ? 'py-20 px-5' : isTablet ? 'py-24 px-8' : 'py-32 px-8'} bg-brand-accent/30 relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="max-w-7xl mx-auto text-center relative z-10">
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-10' : isTablet ? 'grid-cols-4 gap-8' : 'grid-cols-4 gap-16'}`}>
                <div>
                  <p className={`${isMobile || isTablet ? 'text-5xl' : 'text-6xl'} font-bold text-brand-primary mb-4 tracking-tighter ${config.statsYearsFont || 'font-serif'}`}>{config.statsYears || '15+'}</p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-muted font-bold">Anos de Experiência</p>
                </div>
                <div>
                  <p className={`${isMobile || isTablet ? 'text-5xl' : 'text-6xl'} font-bold text-brand-primary mb-4 tracking-tighter ${config.statsSoldFont || 'font-serif'}`}>{config.statsSold || '800+'}</p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-muted font-bold">Imóveis Vendidos</p>
                </div>
                <div>
                  <p className={`${isMobile || isTablet ? 'text-5xl' : 'text-6xl'} font-bold text-brand-primary mb-4 tracking-tighter ${config.statsClientsFont || 'font-serif'}`}>{config.statsClients || '1.2k'}</p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-muted font-bold">Clientes Felizes</p>
                </div>
                <div>
                  <p className={`${isMobile || isTablet ? 'text-5xl' : 'text-6xl'} font-bold text-brand-primary mb-4 tracking-tighter ${config.statsTransparencyFont || 'font-serif'}`}>{config.statsTransparency || '100%'}</p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-muted font-bold">Transparência</p>
                </div>
              </div>
            </div>
          </section>
        </ScaledDevicePreview>
      );
    }
  }

  if (page === 'about') {
    const title = config.aboutTitle || 'Confiança, Proximidade, Resultados.';
    const text1 = config.aboutText1 || 'A nossa imobiliária nasceu da paixão pelo mercado imobiliário algarvio e da necessidade de oferecer um serviço verdadeiramente premium, onde o cliente não é apenas mais um número, mas sim o centro de toda a operação.';
    const text2 = config.aboutText2 || 'Com sede no coração do Algarve, a nossa equipa combina décadas de conhecimento local com uma visão moderna e tecnológica do negócio imobiliário internacional.';
    const image = config.aboutImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000';
    const years = config.aboutYearsCount || '15';

    return (
      <ScaledDevicePreview device={device}>
        <div className="bg-white">
          <PreviewNavbar activeLabel="Sobre Nós" device={device} config={config} lang="pt" />
          <div className={`${isMobile ? 'pt-12 pb-16' : 'pt-20 pb-24'}`}>
            <div className={`max-w-7xl mx-auto ${isMobile ? 'px-5' : 'px-8'}`}>
              <div className={`grid ${isDesktop ? 'grid-cols-2 gap-20 mb-24' : 'grid-cols-1 gap-12 mb-16'} items-center`}>
                <div>
                  <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Nossa História</span>
                  <h1 className={`${isMobile ? 'text-4xl mb-6' : 'text-6xl mb-8'} font-bold text-brand-primary ${config.aboutTitleFont || 'font-serif'}`}>{title}</h1>
                  <p className={`text-gray-600 ${isMobile ? 'text-base mb-6' : 'text-lg mb-8'} leading-relaxed ${config.aboutText1Font || ''}`}>{text1}</p>
                  <p className={`text-gray-600 ${isMobile ? 'text-base mb-8' : 'text-lg mb-10'} leading-relaxed ${config.aboutText2Font || ''}`}>{text2}</p>
                  <div className={`flex flex-wrap ${isMobile ? 'gap-5' : 'gap-8'}`}>
                    {['Honestidade', 'Rigor', 'Excelência'].map(val => (
                      <div key={val} className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-brand-accent/30 rounded-full flex items-center justify-center text-brand-primary">
                          <CheckCircle2 size={22} />
                        </div>
                        <span className="font-bold text-sm">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <img src={image} alt="Sobre a nossa imobiliária" className="rounded-none shadow-2xl w-full object-cover" />
                  {!isMobile && (
                    <div className={`absolute -bottom-8 ${isTablet ? 'right-4 p-8' : '-right-10 p-10'} bg-brand-secondary rounded-none text-white shadow-2xl`}>
                      <span className={`text-5xl font-bold block mb-2 ${config.aboutYearsCountFont || 'font-serif'}`}>{years}</span>
                      <span className="text-xs uppercase tracking-[0.2em] font-bold">Anos de Excelência</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center mb-16">
                <h2 className={`${isMobile ? 'text-3xl mb-8' : 'text-4xl mb-12'} font-serif font-bold text-brand-primary`}>A Nossa Equipa</h2>
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-10' : 'grid-cols-3 gap-12'}`}>
                  {[
                    { name: 'Ana Silva', role: 'Fundadora & CEO', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
                    { name: 'Ricardo Santos', role: 'Consultor Sénior', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
                    { name: 'Sofia Ferreira', role: 'Coordenadora de Marketing', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400' }
                  ].map((member, i) => (
                    <div key={i}>
                      <div className="relative aspect-[3/4] overflow-hidden rounded-none mb-6 grayscale">
                        <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-brand-primary mb-1">{member.name}</h3>
                      <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`bg-brand-primary ${isMobile ? 'p-8' : 'p-20'} rounded-none text-center text-white`}>
                <h2 className={`${isMobile ? 'text-3xl mb-6' : 'text-5xl mb-8'} font-serif font-bold`}>Quer fazer parte da nossa história?</h2>
                <p className={`text-gray-400 ${isMobile ? 'text-base mb-8' : 'text-lg mb-12'} max-w-2xl mx-auto`}>
                  Estamos sempre à procura de talentos apaixonados pelo mercado imobiliário e pelo Algarve.
                </p>
                <span className={`inline-block bg-brand-secondary text-white ${isMobile ? 'px-8 py-4 text-base' : 'px-12 py-5 text-lg'} rounded-none font-bold shadow-xl`}>
                  Falar connosco
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScaledDevicePreview>
    );
  }

  if (page === 'services') {
    const title = config.servicesTitle || 'Soluções Imobiliárias de Excelência';
    const subtitle = config.servicesSubtitle || 'Mais do que mediadores, somos os seus parceiros estratégicos no mercado imobiliário do Algarve.';

    return (
      <ScaledDevicePreview device={device}>
        <div className="bg-white">
          <PreviewNavbar activeLabel="Serviços" device={device} config={config} lang="pt" />
          <div className={`${isMobile ? 'pt-12 pb-16' : 'pt-20 pb-24'}`}>
            <div className={`max-w-7xl mx-auto ${isMobile ? 'px-5' : 'px-8'}`}>
              <div className={`text-center max-w-3xl mx-auto ${isMobile ? 'mb-12' : 'mb-20'}`}>
                <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Nossa Especialidade</span>
                <h1 className={`${isMobile ? 'text-4xl mb-6 px-1' : 'text-6xl mb-8 px-4'} font-bold text-brand-primary ${config.servicesTitleFont || 'font-serif'}`}>{title}</h1>
                <p className={`text-brand-muted ${isMobile ? 'text-base px-1' : 'text-lg px-4'} leading-relaxed ${config.servicesSubtitleFont || ''}`}>{subtitle}</p>
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-2 gap-8'}`}>
                <div className={`bg-white ${isMobile ? 'p-8' : 'p-12'} rounded-none border border-gray-100 shadow-sm`}>
                  <h3 className={`${isMobile ? 'text-2xl mb-4' : 'text-3xl mb-6'} font-serif font-bold`}>Compra de Imóveis</h3>
                  <p className="text-brand-muted mb-8 leading-relaxed text-sm md:text-base">
                    Acompanhamento total desde a pesquisa até à escritura. Seleção personalizada com base no seu estilo de vida e objetivos de investimento.
                  </p>
                  <span className="text-brand-primary font-bold flex items-center gap-2">
                    Explorar Ofertas <ArrowRight size={20} />
                  </span>
                </div>

                <div className={`bg-brand-primary ${isMobile ? 'p-8' : 'p-12'} rounded-none text-white shadow-xl`}>
                  <h3 className={`${isMobile ? 'text-2xl mb-4' : 'text-3xl mb-6'} font-serif font-bold`}>Venda de Imóveis</h3>
                  <p className="text-gray-400 mb-8 leading-relaxed text-sm md:text-base">
                    Estratégia de marketing global, fotografia profissional e avaliação precisa para garantir o valor máximo de mercado.
                  </p>
                  <div className={`flex ${isMobile ? 'flex-col' : ''} gap-2`}>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-gray-400">
                      Localização do seu imóvel
                    </div>
                    <div className="bg-brand-secondary text-white px-6 py-3 rounded-none font-bold text-sm text-center whitespace-nowrap">
                      Pedir Avaliação
                    </div>
                  </div>
                </div>

                <div className={`bg-gray-50 ${isMobile ? 'p-8' : 'p-12'} rounded-none border border-gray-100`}>
                  <h3 className={`${isMobile ? 'text-2xl mb-4' : 'text-3xl mb-6'} font-serif font-bold`}>Arrendamento</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base">
                    Gestão profissional e mediação de arrendamentos de curta e longa duração com máxima rentabilidade e segurança jurídica.
                  </p>
                </div>

                <div className={`bg-white ${isMobile ? 'p-8' : 'p-12'} rounded-none border border-gray-100 shadow-sm`}>
                  <h3 className={`${isMobile ? 'text-2xl mb-4' : 'text-3xl mb-6'} font-serif font-bold`}>Avaliação de Imóveis</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base">
                    Relatórios detalhados baseados em métricas reais e comparativos de mercado. Essencial para tomadas de decisão inteligentes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScaledDevicePreview>
    );
  }

  if (page === 'contact') {
    const title = config.contactTitle || 'Estamos Aqui Para o Ajudar';
    const subtitle = config.contactSubtitle || 'Tem alguma questão sobre um imóvel ou gostaria de uma avaliação? A nossa equipa de especialistas está pronta para responder.';
    const address = config.contactAddress || 'Av. 5 de Outubro, 123, 8000-001 Faro, Algarve';
    const phone = config.contactPhone || '+351 289 123 456';
    const email = config.contactEmail || 'geral@imobiliariapremium.pt';
    const scheduleWeek = config.contactScheduleWeek || '09:00 - 18:30';
    const scheduleSat = config.contactScheduleSat || '10:00 - 13:00';
    const scheduleSun = config.contactScheduleSun || 'Encerrado';

    return (
      <ScaledDevicePreview device={device}>
        <div className="bg-white">
          <PreviewNavbar activeLabel="Contacto" device={device} config={config} lang="pt" />
          <div className={`${isMobile ? 'pt-12 pb-16' : 'pt-20 pb-24'}`}>
            <div className={`max-w-7xl mx-auto ${isMobile ? 'px-5' : 'px-8'}`}>
              {section === 'main' && (
                <div className={`text-center max-w-3xl mx-auto ${isMobile ? 'mb-12' : 'mb-20'}`}>
                  <span className="text-brand-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Fale Connosco</span>
                  <h1 className={`${isMobile ? 'text-4xl mb-6' : 'text-6xl mb-8'} font-bold text-brand-primary ${config.contactTitleFont || 'font-serif'}`}>{title}</h1>
                  <p className={`text-brand-muted ${isMobile ? 'text-base' : 'text-lg'} leading-relaxed ${config.contactSubtitleFont || ''}`}>{subtitle}</p>
                </div>
              )}

              <div className={`flex flex-col items-center ${isMobile ? 'gap-10' : 'gap-16'}`}>
                <div className="space-y-10 w-full max-w-4xl">
                  <div className="text-center">
                    <h3 className="text-2xl font-serif font-bold text-brand-primary mb-6">Informações de Contacto</h3>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-6'}`}>
                      <div className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-none border border-gray-100 h-full">
                        <div className="w-16 h-16 bg-white flex items-center justify-center text-brand-secondary shadow-sm mb-4">
                          <MapPin size={28} />
                        </div>
                        <div>
                          <div className="font-bold text-brand-primary mb-2">O Nosso Escritório</div>
                          <div className={`text-brand-muted text-sm px-2 ${config.contactAddressFont || ''}`}>{address}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-none border border-gray-100 h-full">
                        <div className="w-16 h-16 bg-white flex items-center justify-center text-brand-secondary shadow-sm mb-4">
                          <Phone size={28} />
                        </div>
                        <div>
                          <div className="font-bold text-brand-primary mb-2">Telefone</div>
                          <div className={`text-brand-muted text-sm ${config.contactPhoneFont || ''}`}>{phone}</div>
                          <div className="text-brand-muted/60 text-xs mt-2">Segunda a Sexta, 09h - 18h</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-none border border-gray-100 h-full">
                        <div className="w-16 h-16 bg-white flex items-center justify-center text-brand-secondary shadow-sm mb-4">
                          <Mail size={28} />
                        </div>
                        <div>
                          <div className="font-bold text-brand-primary mb-2">Email</div>
                          <div className={`text-brand-muted text-sm break-all ${config.contactEmailFont || ''}`}>{email}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-2xl mx-auto w-full text-center">
                    <h3 className="text-2xl font-serif font-bold text-brand-primary mb-6">Horário de Funcionamento</h3>
                    <div className={`bg-brand-primary ${isMobile ? 'p-6 text-sm' : 'p-8'} text-white rounded-none`}>
                      <div className="flex justify-between py-3 border-b border-white/10">
                        <span>Segunda — Sexta</span>
                        <span className={`font-bold ${config.contactScheduleWeekFont || ''}`}>{scheduleWeek}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-white/10">
                        <span>Sábado</span>
                        <span className={`font-bold ${config.contactScheduleSatFont || ''}`}>{scheduleSat}</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span>Domingo</span>
                        <span className={`text-white/40 italic ${config.contactScheduleSunFont || ''}`}>{scheduleSun}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`bg-white ${isMobile ? 'p-6' : 'p-16'} border border-gray-100 shadow-2xl rounded-none w-full max-w-4xl`}>
                  <div className="text-center max-w-2xl mx-auto">
                    <h3 className="text-2xl font-serif font-bold text-brand-primary mb-8">Envie uma Mensagem</h3>
                    <div className="space-y-6 text-left">
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Nome</label>
                          <div className="w-full bg-gray-50 p-4 text-sm text-gray-400">O seu nome</div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Email</label>
                          <div className="w-full bg-gray-50 p-4 text-sm text-gray-400">seu@email.com</div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Telefone</label>
                        <div className="w-full bg-gray-50 p-4 text-sm text-gray-400">+351 9xx xxx xxx</div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Assunto</label>
                        <div className="w-full bg-gray-50 p-4 text-sm text-brand-primary flex items-center justify-between">
                          <span>Informações Gerais</span>
                          <ChevronRight size={18} className="rotate-90 text-brand-muted" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Imóvel de Interesse (Opcional)</label>
                        <div className="w-full bg-gray-50 p-4 text-sm text-brand-primary flex items-center justify-between gap-2">
                          <span className="truncate">
                            {properties[0]
                              ? `${properties[0].title} - ${properties[0].price.toLocaleString('pt-PT')} €`
                              : 'Selecione um imóvel...'}
                          </span>
                          <ChevronRight size={18} className="rotate-90 text-brand-muted shrink-0" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2 block">Mensagem</label>
                        <div className="w-full bg-gray-50 p-4 h-36 text-sm text-gray-400">Como podemos ajudar?</div>
                      </div>
                      <div className="w-full bg-brand-primary text-white py-5 rounded-none font-bold text-sm uppercase tracking-[0.2em] text-center shadow-lg">
                        Enviar Mensagem
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScaledDevicePreview>
    );
  }

  return <div className="p-12 text-center text-gray-400 italic">Pré-visualização indisponível para esta secção.</div>;
};

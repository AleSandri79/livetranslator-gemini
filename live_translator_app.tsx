import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc } from 'firebase/firestore';
import { Mic, MicOff, Settings, Volume2, MonitorPlay, Users, QrCode, Type, Plus, Minus, LogOut, Loader2, AlertCircle, Globe, VolumeX } from 'lucide-react';

// --- Firebase Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-translator-app';

// --- Supported Languages Definition ---
const SUPPORTED_LANGUAGES = [
  { code: 'ru', name: 'Русский', speechCode: 'ru-RU' },
  { code: 'en', name: 'English', speechCode: 'en-US' },
  { code: 'es', name: 'Español', speechCode: 'es-ES' },
  { code: 'de', name: 'Deutsch', speechCode: 'de-DE' },
  { code: 'fr', name: 'Français', speechCode: 'fr-FR' },
  { code: 'zh', name: '中文', speechCode: 'zh-CN' }
];

// --- UI Translations Dictionary ---
const TRANSLATIONS = {
  ru: {
    appTitle: 'ConfTrans',
    subtitle: 'Синхронный перевод для конференций',
    iAmListener: 'Я слушатель',
    iAmHost: 'Я ведущий',
    sessionCode: 'Код сессии',
    password: 'Пароль',
    optional: '(Опционально)',
    ifSet: 'Если установлен',
    sessionCodePlaceholder: 'Напр. X7B9A',
    createSession: 'Создать сессию',
    joinSession: 'Подключиться',
    protectedByPassword: 'Защищено паролем',
    micSelect: 'Источник звука (Микрофон)',
    unknownMic: 'Неизвестный микрофон',
    sensitivityVad: 'Чувствительность (VAD)',
    auto: 'Авто',
    manual: 'Ручная',
    apiSettings: 'Настройки API',
    stopBroadcasting: 'Остановить трансляцию',
    startBroadcasting: 'Начать трансляцию',
    audioControl: 'Контроль уровня и качества звука',
    speakingDetected: 'Голос обнаружен',
    silence: 'Тишина',
    transcriptHistory: 'История транскрипции и перевода',
    waitingText: 'Здесь появится переведенный текст...',
    saveAndClose: 'Сохранить и закрыть',
    scanToJoin: 'Сканировать для входа',
    live: 'В эфире',
    waitingHost: 'Ожидание ведущего',
    waitingTranslation: 'Ожидание перевода...',
    textAppearsHere: 'Текст появится здесь, когда ведущий начнет говорить.',
    interfaceLanguage: 'Язык интерфейса',
    targetLanguage: 'Язык перевода',
    speechLanguage: 'Язык речи (Ввод)',
    readAloud: 'Озвучивать перевод (TTS)',
    translationApi: 'Интеграция API перевода',
    geminiKey: 'Gemini API Key',
    deeplKey: 'DeepL API Key',
    anthropicKey: 'Anthropic API Key',
    errorDb: 'База данных недоступна',
    errorSessionNotFound: 'Сессия не найдена',
    errorWrongPassword: 'Неверный пароль',
    errorEnterCode: 'Введите код сессии',
    errorCreateSession: 'Ошибка создания сессии',
    errorJoinSession: 'Ошибка подключения'
  },
  en: {
    appTitle: 'ConfTrans',
    subtitle: 'Real-time Conference Translation',
    iAmListener: 'I am a Listener',
    iAmHost: 'I am a Host',
    sessionCode: 'Session Code',
    password: 'Password',
    optional: '(Optional)',
    ifSet: 'If required',
    sessionCodePlaceholder: 'e.g. X7B9A',
    createSession: 'Create Session',
    joinSession: 'Join Session',
    protectedByPassword: 'Password Protected',
    micSelect: 'Audio Source (Microphone)',
    unknownMic: 'Unknown Microphone',
    sensitivityVad: 'Sensitivity (VAD)',
    auto: 'Auto',
    manual: 'Manual',
    apiSettings: 'API Settings',
    stopBroadcasting: 'Stop Broadcast',
    startBroadcasting: 'Start Broadcast',
    audioControl: 'Audio Level & Quality Meter',
    speakingDetected: 'Speech Detected',
    silence: 'Silence',
    transcriptHistory: 'Transcription & Translation History',
    waitingText: 'Translated text will appear here...',
    saveAndClose: 'Save & Close',
    scanToJoin: 'Scan to Join',
    live: 'LIVE',
    waitingHost: 'Waiting for host',
    waitingTranslation: 'Waiting for translation...',
    textAppearsHere: 'Text will appear here when the host speaks.',
    interfaceLanguage: 'Interface Language',
    targetLanguage: 'Target Translation Language',
    speechLanguage: 'Speech Language (Input)',
    readAloud: 'Read Translation Aloud (TTS)',
    translationApi: 'Translation API Integration',
    geminiKey: 'Gemini API Key',
    deeplKey: 'DeepL API Key',
    anthropicKey: 'Anthropic API Key',
    errorDb: 'Database unavailable',
    errorSessionNotFound: 'Session not found',
    errorWrongPassword: 'Incorrect password',
    errorEnterCode: 'Enter session code',
    errorCreateSession: 'Failed to create session',
    errorJoinSession: 'Failed to join session'
  },
  es: {
    appTitle: 'ConfTrans',
    subtitle: 'Traducción de conferencias en tiempo real',
    iAmListener: 'Soy Oyente',
    iAmHost: 'Soy Anfitrión',
    sessionCode: 'Código de Sesión',
    password: 'Contraseña',
    optional: '(Opcional)',
    ifSet: 'Si está configurado',
    sessionCodePlaceholder: 'Ej. X7B9A',
    createSession: 'Crear Sesión',
    joinSession: 'Unirse a la Sesión',
    protectedByPassword: 'Protegido con contraseña',
    micSelect: 'Fuente de Audio (Micrófono)',
    unknownMic: 'Micrófono Desconocido',
    sensitivityVad: 'Sensibilidad (VAD)',
    auto: 'Auto',
    manual: 'Manual',
    apiSettings: 'Ajustes de API',
    stopBroadcasting: 'Detener Transmisión',
    startBroadcasting: 'Iniciar Transmisión',
    audioControl: 'Control de Nivel y Calidad de Audio',
    speakingDetected: 'Voz Detectada',
    silence: 'Silencio',
    transcriptHistory: 'Historial de Transcripción y Traducción',
    waitingText: 'El texto traducido aparecerá aquí...',
    saveAndClose: 'Guardar y Cerrar',
    scanToJoin: 'Escanear para unirse',
    live: 'EN VIVO',
    waitingHost: 'Esperando al anfitrión',
    waitingTranslation: 'Esperando traducción...',
    textAppearsHere: 'El texto aparecerá cuando el anfitrión hable.',
    interfaceLanguage: 'Idioma de Interfaz',
    targetLanguage: 'Idioma de Traducción',
    speechLanguage: 'Idioma del Discurso (Entrada)',
    readAloud: 'Leer Traducción (TTS)',
    translationApi: 'Integración de API de Traducción',
    geminiKey: 'Clave API de Gemini',
    deeplKey: 'Clave API de DeepL',
    anthropicKey: 'Clave API de Anthropic',
    errorDb: 'Base de datos no disponible',
    errorSessionNotFound: 'Sesión no encontrada',
    errorWrongPassword: 'Contraseña incorrecta',
    errorEnterCode: 'Ingrese el código de sesión',
    errorCreateSession: 'Error al crear la sesión',
    errorJoinSession: 'Error al unirse a la sesión'
  },
  de: {
    appTitle: 'ConfTrans',
    subtitle: 'Echtzeit-Konferenzübersetzung',
    iAmListener: 'Ich bin Zuhörer',
    iAmHost: 'Ich bin Gastgeber',
    sessionCode: 'Sitzungscode',
    password: 'Passwort',
    optional: '(Optional)',
    ifSet: 'Falls erforderlich',
    sessionCodePlaceholder: 'z.B. X7B9A',
    createSession: 'Sitzung Erstellen',
    joinSession: 'Sitzung Beitreten',
    protectedByPassword: 'Passwortgeschützt',
    micSelect: 'Audioquelle (Mikrofon)',
    unknownMic: 'Unbekanntes Mikrofon',
    sensitivityVad: 'Empfindlichkeit (VAD)',
    auto: 'Auto',
    manual: 'Manuell',
    apiSettings: 'API-Einstellungen',
    stopBroadcasting: 'Übertragung Stoppen',
    startBroadcasting: 'Übertragung Starten',
    audioControl: 'Audiopegel- & Qualitätskontrolle',
    speakingDetected: 'Sprache Erkannt',
    silence: 'Stille',
    transcriptHistory: 'Transkriptions- & Übersetzungsverlauf',
    waitingText: 'Übersetzter Text erscheint hier...',
    saveAndClose: 'Speichern & Schließen',
    scanToJoin: 'Scannen zum Beitreten',
    live: 'LIVE',
    waitingHost: 'Warten auf den Gastgeber',
    waitingTranslation: 'Warten auf Übersetzung...',
    textAppearsHere: 'Der Text erscheint hier, wenn der Gastgeber spricht.',
    interfaceLanguage: 'Schnittstellensprache',
    targetLanguage: 'Zielsprache für Übersetzung',
    speechLanguage: 'Sprache der Spracheingabe',
    readAloud: 'Übersetzung Vorlesen (TTS)',
    translationApi: 'Übersetzungs-API-Integration',
    geminiKey: 'Gemini API-Schlüssel',
    deeplKey: 'DeepL API-Schlüssel',
    anthropicKey: 'Anthropic API-Schlüssel',
    errorDb: 'Datenbank nicht verfügbar',
    errorSessionNotFound: 'Sitzung nicht gefunden',
    errorWrongPassword: 'Falsches Passwort',
    errorEnterCode: 'Sitzungscode eingeben',
    errorCreateSession: 'Sitzung konnte nicht erstellt werden',
    errorJoinSession: 'Sitzung konnte nicht beigetreten werden'
  },
  fr: {
    appTitle: 'ConfTrans',
    subtitle: 'Traduction de conférence en temps réel',
    iAmListener: 'Je suis Auditeur',
    iAmHost: 'Je suis Hôte',
    sessionCode: 'Code de Session',
    password: 'Mot de Passe',
    optional: '(Optionnel)',
    ifSet: 'Si requis',
    sessionCodePlaceholder: 'ex. X7B9A',
    createSession: 'Créer la Session',
    joinSession: 'Rejoindre la Session',
    protectedByPassword: 'Protégé par mot de passe',
    micSelect: 'Source Audio (Microphone)',
    unknownMic: 'Microphone Inconnu',
    sensitivityVad: 'Sensibilité (VAD)',
    auto: 'Auto',
    manual: 'Manuel',
    apiSettings: 'Paramètres API',
    stopBroadcasting: 'Arrêter la Diffusion',
    startBroadcasting: 'Démarrer la Diffusion',
    audioControl: 'Contrôle du Niveau et Qualité Audio',
    speakingDetected: 'Voix Détectée',
    silence: 'Silence',
    transcriptHistory: 'Historique de Transcription et Traduction',
    waitingText: 'Le texte traduit apparaîtra ici...',
    saveAndClose: 'Enregistrer et Fermer',
    scanToJoin: 'Scanner pour rejoindre',
    live: 'EN DIRECT',
    waitingHost: "En attente de l'hôte",
    waitingTranslation: 'En attente de la traduction...',
    textAppearsHere: "Le texte apparaîtra ici lorsque l'hôte parlera.",
    interfaceLanguage: 'Langue de l\'Interface',
    targetLanguage: 'Langue de Traduction Cible',
    speechLanguage: 'Langue Parlée (Entrée)',
    readAloud: 'Lire la Traduction (TTS)',
    translationApi: 'Intégration API de Traduction',
    geminiKey: 'Clé API Gemini',
    deeplKey: 'Clé API DeepL',
    anthropicKey: 'Clé API Anthropic',
    errorDb: 'Base de données indisponible',
    errorSessionNotFound: 'Session non trouvée',
    errorWrongPassword: 'Mot de passe incorrect',
    errorEnterCode: 'Entrez le code de session',
    errorCreateSession: 'Échec de création de session',
    errorJoinSession: 'Échec de connexion à la session'
  },
  zh: {
    appTitle: 'ConfTrans',
    subtitle: '会议实时翻译',
    iAmListener: '我是听众',
    iAmHost: '我是主持人',
    sessionCode: '会议代码',
    password: '密码',
    optional: '(可选)',
    ifSet: '如需设置',
    sessionCodePlaceholder: '例如 X7B9A',
    createSession: '创建会议',
    joinSession: '加入会议',
    protectedByPassword: '受密码保护',
    micSelect: '音频来源 (麦克风)',
    unknownMic: '未知麦克风',
    sensitivityVad: '灵敏度 (VAD)',
    auto: '自动',
    manual: '手动',
    apiSettings: 'API 设置',
    stopBroadcasting: '停止广播',
    startBroadcasting: '开始广播',
    audioControl: '音量与音质监控',
    speakingDetected: '检测到语音',
    silence: '静音',
    transcriptHistory: '转录与翻译历史',
    waitingText: '翻译后的文本将显示在这里...',
    saveAndClose: '保存并关闭',
    scanToJoin: '扫码加入',
    live: '直播中',
    waitingHost: '等待主持人...',
    waitingTranslation: '等待翻译...',
    textAppearsHere: '主持人发言时文本将显示在这里。',
    interfaceLanguage: '界面语言',
    targetLanguage: '目标翻译语言',
    speechLanguage: '发言语言 (输入)',
    readAloud: '朗读翻译 (TTS)',
    translationApi: '翻译 API 集成',
    geminiKey: 'Gemini API 密钥',
    deeplKey: 'DeepL API 密钥',
    anthropicKey: 'Anthropic API 密钥',
    errorDb: '数据库不可用',
    errorSessionNotFound: '未找到会议',
    errorWrongPassword: '密码错误',
    errorEnterCode: '请输入会议代码',
    errorCreateSession: '创建会议失败',
    errorJoinSession: '加入会议失败'
  }
};

// --- Helper Functions ---
const generateSessionCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const translateTextPlaceholder = async (text, targetLangCode, keys) => {
  if (keys.gemini) {
    try {
      const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode) || SUPPORTED_LANGUAGES[1];
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-preview:generateContent?key=${keys.gemini}`;
      const payload = {
        contents: [{ parts: [{ text: `Translate the following text to ${targetLangObj.name}, keeping the original tone. Return ONLY the translation: ${text}` }] }],
      };
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || `[${targetLangCode.toUpperCase()}] ${text}`;
    } catch (err) {
      console.error("Translation API Error:", err);
      return `[${targetLangCode.toUpperCase()}] ${text}`;
    }
  }
  return `[${targetLangCode.toUpperCase()}] ${text}`;
};

// --- Components ---

const LanguageSelector = ({ currentLang, onSelect, label }) => {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-gray-400 whitespace-nowrap">{label}:</span>}
      <div className="relative inline-block w-full">
        <select 
          value={currentLang}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const HostDashboard = ({ user, sessionCode, sessionData, uiLang, targetLang, setTargetLang, setUiLang, onLeave }) => {
  const t = TRANSLATIONS[uiLang] || TRANSLATIONS.en;
  const [isLive, setIsLive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [vadThreshold, setVadThreshold] = useState(30);
  const [isAutoVad, setIsAutoVad] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sourceLang, setSourceLang] = useState('ru');
  const [apiKeys, setApiKeys] = useState({ gemini: '', anthropic: '', deepl: '' });
  const [showSettings, setShowSettings] = useState(false);
  
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const reqAnimFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const ambientNoiseRef = useRef(10);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      const speechLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang);
      recognitionRef.current.lang = speechLangObj ? speechLangObj.speechCode : 'ru-RU';

      recognitionRef.current.onresult = async (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript && db) {
          const translation = await translateTextPlaceholder(finalTranscript, targetLang, apiKeys);
          const newMsg = {
            id: Date.now().toString(),
            original: finalTranscript,
            translated: translation,
            timestamp: Date.now()
          };
          
          const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionCode);
          const updatedTranscripts = [...(sessionData?.transcripts || []), newMsg].slice(-50);
          updateDoc(sessionRef, { transcripts: updatedTranscripts });
        }
      };

      recognitionRef.current.onerror = (event) => console.error("Speech recognition error", event.error);
    }
  }, [sessionCode, sessionData, apiKeys, targetLang, sourceLang]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
      const audioInputs = deviceInfos.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs);
      if (audioInputs.length > 0) setSelectedMic(audioInputs[0].deviceId);
    });
  }, []);

  // Audio Visualizer & VAD
  useEffect(() => {
    if (!isLive || !selectedMic) return;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedMic } });
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');

        const draw = () => {
          if (!analyserRef.current) return;
          reqAnimFrameRef.current = requestAnimationFrame(draw);
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const average = sum / bufferLength;

          let currentThreshold = vadThreshold;
          if (isAutoVad) {
            ambientNoiseRef.current = ambientNoiseRef.current * 0.98 + average * 0.02;
            currentThreshold = ambientNoiseRef.current + 15;
          }

          setIsSpeaking(average > currentThreshold);

          canvasCtx.fillStyle = '#111827';
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            canvasCtx.fillStyle = average > currentThreshold ? `rgb(52, 211, 153)` : `rgb(96, 165, 250)`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        };

        draw();
        if (recognitionRef.current) recognitionRef.current.start();

      } catch (err) {
        console.error("Error accessing microphone", err);
      }
    };

    startAudio();

    return () => {
      if (reqAnimFrameRef.current) cancelAnimationFrame(reqAnimFrameRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isLive, selectedMic, isAutoVad, vadThreshold]);

  const toggleLive = () => {
    const newLiveState = !isLive;
    setIsLive(newLiveState);
    if (db) {
      updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionCode), { isLive: newLiveState });
    }
  };

  const joinUrl = `https://app.wordly.mock/?session=${sessionCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}&bgcolor=FFFFFF&color=000000`;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-950 text-white font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-gray-900 p-6 flex flex-col shadow-xl z-10 border-r border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MonitorPlay className="w-7 h-7 text-blue-400" />
            <h1 className="text-xl font-bold tracking-wide">{t.appTitle}</h1>
          </div>
          <button onClick={onLeave} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Interface & Translation Language controls */}
        <div className="space-y-3 bg-gray-800/60 p-3 rounded-lg border border-gray-700/50 mb-6">
          <LanguageSelector currentLang={uiLang} onSelect={setUiLang} label={t.interfaceLanguage} />
          <LanguageSelector currentLang={targetLang} onSelect={setTargetLang} label={t.targetLanguage} />
          <LanguageSelector currentLang={sourceLang} onSelect={setSourceLang} label={t.speechLanguage} />
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700/60">
          <p className="text-xs text-gray-400 mb-1">{t.sessionCode}</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-mono font-bold tracking-widest text-blue-300">{sessionCode}</span>
            <div className="bg-blue-900/40 p-2 rounded-md">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          {sessionData?.password && (
            <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
               {t.protectedByPassword}
            </p>
          )}
        </div>

        <div className="space-y-4 flex-grow">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t.micSelect}</label>
            <select 
              className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
              disabled={isLive}
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || t.unknownMic}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-950 p-3 rounded border border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">{t.sensitivityVad}</label>
              <button 
                onClick={() => setIsAutoVad(!isAutoVad)}
                className={`text-xs px-2 py-0.5 rounded ${isAutoVad ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {isAutoVad ? t.auto : t.manual}
              </button>
            </div>
            {!isAutoVad && (
              <input 
                type="range" min="0" max="100" 
                value={vadThreshold} onChange={(e) => setVadThreshold(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            )}
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-2 rounded text-xs transition border border-gray-700"
          >
            <Settings className="w-4 h-4" />
            <span>{t.apiSettings}</span>
          </button>
        </div>

        <button 
          onClick={toggleLive}
          className={`mt-6 w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${isLive ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
        >
          {isLive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isLive ? t.stopBroadcasting : t.startBroadcasting}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 relative overflow-hidden bg-gray-950">
        
        {/* Visualizer Panel */}
        <div className="bg-gray-900 rounded-xl p-4 shadow-xl mb-6 relative overflow-hidden border border-gray-800 flex flex-col h-44">
          <div className="flex justify-between items-center mb-2 z-10">
            <h2 className="text-gray-400 text-xs font-semibold flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-400" /> {t.audioControl}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
              <span className="text-xs text-gray-400">{isSpeaking ? t.speakingDetected : t.silence}</span>
            </div>
          </div>
          <canvas ref={canvasRef} width="800" height="120" className="w-full flex-1 rounded-lg bg-gray-950 border border-gray-900" />
        </div>

        {/* Transcripts Panel */}
        <div className="flex-1 bg-gray-900 rounded-xl shadow-xl overflow-hidden flex flex-col border border-gray-800 relative">
          <div className="p-4 border-b border-gray-800 bg-gray-900/90 flex justify-between items-center">
             <h3 className="font-semibold text-sm text-gray-300">{t.transcriptHistory}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sessionData?.transcripts?.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-600 flex-col gap-2">
                 <Type className="w-8 h-8 opacity-40" />
                 <p className="text-sm">{t.waitingText}</p>
              </div>
            )}
            {sessionData?.transcripts?.map((msg) => (
              <div key={msg.id} className="bg-gray-950/60 p-3 rounded-lg border border-gray-800/80">
                <p className="text-xs text-gray-400 mb-1">{msg.original}</p>
                <p className="text-sm text-blue-200 font-medium">{msg.translated}</p>
              </div>
            ))}
          </div>
        </div>

        {/* API Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-800">
              <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">{t.translationApi}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t.geminiKey}</label>
                  <input type="password" value={apiKeys.gemini} onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="AIzaSy..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t.deeplKey}</label>
                  <input type="password" value={apiKeys.deepl} onChange={(e) => setApiKeys({...apiKeys, deepl: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t.anthropicKey}</label>
                  <input type="password" value={apiKeys.anthropic} onChange={(e) => setApiKeys({...apiKeys, anthropic: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="mt-6 w-full bg-blue-600 hover:bg-blue-500 p-2 rounded text-xs font-semibold transition">{t.saveAndClose}</button>
            </div>
          </div>
        )}

        {/* Floating QR Code Hover */}
        <div className="absolute top-6 right-6 group">
          <button className="bg-gray-800 p-2.5 rounded-full shadow-lg hover:bg-gray-700 border border-gray-700 transition flex items-center justify-center">
            <QrCode className="w-5 h-5 text-gray-300 group-hover:text-white" />
          </button>
          <div className="absolute right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-3 rounded-xl shadow-2xl pointer-events-none origin-top-right transform scale-95 group-hover:scale-100 border border-gray-200">
            <img src={qrUrl} alt="QR Code" className="w-36 h-36 rounded-lg" />
            <p className="text-center text-xs text-gray-800 mt-2 font-bold">{t.scanToJoin}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

const ListenerDashboard = ({ sessionCode, sessionData, uiLang, setUiLang, onLeave }) => {
  const t = TRANSLATIONS[uiLang] || TRANSLATIONS.en;
  const [fontSize, setFontSize] = useState(18);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const transcriptsEndRef = useRef(null);
  const lastSpokenIdRef = useRef(null);

  const scrollToBottom = () => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionData?.transcripts]);

  // Web Speech API Text-To-Speech for Listeners
  useEffect(() => {
    if (!ttsEnabled || !sessionData?.transcripts?.length) return;
    const latest = sessionData.transcripts[sessionData.transcripts.length - 1];
    
    if (latest && latest.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = latest.id;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(latest.translated);
        const speechLangObj = SUPPORTED_LANGUAGES.find(l => l.code === uiLang);
        utterance.lang = speechLangObj ? speechLangObj.speechCode : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [sessionData?.transcripts, ttsEnabled, uiLang]);

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 font-sans">
      {/* Top Navigation Header */}
      <div className="bg-gray-900/90 backdrop-blur p-3 shadow-lg flex justify-between items-center border-b border-gray-800 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onLeave} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h1 className="font-bold text-sm leading-tight">{t.sessionCode}: {sessionCode}</h1>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${sessionData?.isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {sessionData?.isLive ? t.live : t.waitingHost}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TTS Toggle Button */}
          <button 
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-lg border transition ${ttsEnabled ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
            title={t.readAloud}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Listener UI Language Selector */}
          <div className="w-24">
            <LanguageSelector currentLang={uiLang} onSelect={setUiLang} />
          </div>

          {/* Font Size Adjusters */}
          <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700">
            <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono w-5 text-center text-gray-300">{fontSize}</span>
            <button onClick={() => setFontSize(f => Math.min(48, f + 2))} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Transcription Display */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-24 scroll-smooth">
        {!sessionData?.transcripts?.length ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500/80" />
            <p className="text-base text-center font-medium text-gray-400">{t.waitingTranslation}</p>
            <p className="text-xs mt-1 text-center text-gray-600 max-w-xs">{t.textAppearsHere}</p>
          </div>
        ) : (
          sessionData.transcripts.map((msg, idx) => (
             <div key={msg.id} className={`transition-all duration-300 ease-out ${idx === sessionData.transcripts.length - 1 ? 'opacity-100 scale-100' : 'opacity-60'}`}>
                <p className="text-gray-500 mb-1" style={{ fontSize: `${Math.max(10, fontSize * 0.6)}px` }}>
                  {msg.original}
                </p>
                <p className="text-white font-medium leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                  {msg.translated}
                </p>
             </div>
          ))
        )}
        <div ref={transcriptsEndRef} />
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [appState, setAppState] = useState('setup');
  const [role, setRole] = useState('listener');
  const [sessionCode, setSessionCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState(null);

  // 1. Interface Language State
  const [uiLang, setUiLang] = useState('ru');
  
  // 2. Default Target Translation Language initialized to UI language
  const [targetLang, setTargetLang] = useState('ru');

  // Handle Interface Language Change + Auto-update Target Translation Language
  const handleUiLangChange = (newLang) => {
    setUiLang(newLang);
    setTargetLang(newLang); // Smart Default matching interface language
  };

  const t = TRANSLATIONS[uiLang] || TRANSLATIONS.en;

  // Firebase Auth Setup
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Snapshot listener
  useEffect(() => {
    if (!user || !sessionCode || !db || appState === 'setup') return;

    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionCode);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        setSessionData(snapshot.data());
      } else {
        setError(t.errorSessionNotFound);
        setAppState('setup');
      }
    }, (err) => {
      console.error("Firestore sync error:", err);
    });

    return () => unsubscribe();
  }, [user, sessionCode, appState, t]);

  const handleCreateSession = async () => {
    if (!db) return setError(t.errorDb);
    const code = generateSessionCode();
    try {
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', code);
      await setDoc(sessionRef, {
        hostId: user.uid,
        password: password || null,
        isLive: false,
        createdAt: Date.now(),
        transcripts: []
      });
      setSessionCode(code);
      setAppState('host');
      setError('');
    } catch (err) {
      setError(t.errorCreateSession);
      console.error(err);
    }
  };

  const handleJoinSession = async () => {
    if (!sessionCode) return setError(t.errorEnterCode);
    if (!db) return setError(t.errorDb);
    try {
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionCode.toUpperCase());
      const snapshot = await getDoc(sessionRef);
      
      if (!snapshot.exists()) {
        return setError(t.errorSessionNotFound);
      }
      
      const data = snapshot.data();
      if (data.password && data.password !== password) {
        return setError(t.errorWrongPassword);
      }
      
      setSessionCode(sessionCode.toUpperCase());
      setAppState('listener');
      setError('');
    } catch (err) {
      setError(t.errorJoinSession);
      console.error(err);
    }
  };

  const leaveSession = () => {
    setAppState('setup');
    setSessionCode('');
    setPassword('');
    setSessionData(null);
  };

  if (loadingAuth) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (appState === 'host') {
    return (
      <HostDashboard 
        user={user} 
        sessionCode={sessionCode} 
        sessionData={sessionData} 
        uiLang={uiLang}
        targetLang={targetLang}
        setTargetLang={setTargetLang}
        setUiLang={handleUiLangChange}
        onLeave={leaveSession} 
      />
    );
  }

  if (appState === 'listener') {
    return (
      <ListenerDashboard 
        sessionCode={sessionCode} 
        sessionData={sessionData} 
        uiLang={uiLang}
        setUiLang={handleUiLangChange}
        onLeave={leaveSession} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans text-gray-200">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-blue-600/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-purple-600/15 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Header & Interface Language Selector */}
          <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="bg-gray-800 p-2 rounded-xl border border-gray-700">
                 <MonitorPlay className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-none">{t.appTitle}</h1>
                <span className="text-[10px] text-gray-400">{t.subtitle}</span>
              </div>
            </div>
            
            {/* Top Language Dropdown */}
            <div className="w-32">
              <LanguageSelector currentLang={uiLang} onSelect={handleUiLangChange} />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-gray-950 p-1 mb-6 border border-gray-800">
            <button 
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${role === 'listener' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setRole('listener'); setError(''); }}
            >
              {t.iAmListener}
            </button>
            <button 
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${role === 'host' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setRole('host'); setError(''); }}
            >
              {t.iAmHost}
            </button>
          </div>

          <div className="space-y-4">
            {role === 'listener' && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t.sessionCode}</label>
                <input 
                  type="text" 
                  value={sessionCode} 
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition font-mono tracking-widest uppercase text-sm"
                  placeholder={t.sessionCodePlaceholder}
                  maxLength={6}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {t.password} {role === 'host' && t.optional}
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                placeholder={role === 'host' ? t.password : t.ifSet}
              />
            </div>

            <button 
              onClick={role === 'host' ? handleCreateSession : handleJoinSession}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all text-sm active:scale-[0.98]"
            >
              {role === 'host' ? t.createSession : t.joinSession}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
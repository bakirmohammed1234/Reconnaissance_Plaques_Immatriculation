import React, { useState } from 'react';
import { Camera, FileImage, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

const LicensePlateApp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(null);
  
  // URL de ton serveur FastAPI - à modifier selon ton setup
  const API_URL = 'http://192.168.11.104:8000';

  // Styles CSS
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '1.1rem'
    },
    statusContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    statusLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    statusDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      animation: 'pulse 2s infinite'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 32px',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '1.1rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: 'scale(1)'
    },
    buttonPrimary: {
      backgroundColor: '#2563eb',
      color: 'white'
    },
    buttonDisabled: {
      backgroundColor: '#d1d5db',
      color: '#9ca3af',
      cursor: 'not-allowed'
    },
    buttonSmall: {
      padding: '8px 16px',
      fontSize: '0.875rem',
      backgroundColor: '#dbeafe',
      color: '#1d4ed8',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    imageContainer: {
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    imagePlaceholder: {
      padding: '48px',
      textAlign: 'center',
      color: '#9ca3af'
    },
    image: {
      width: '100%',
      height: 'auto'
    },
    resultBox: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '12px',
      padding: '16px'
    },
    resultHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    resultText: {
      fontSize: '0.875rem',
      color: '#1f2937',
      fontFamily: 'monospace',
      backgroundColor: 'white',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      whiteSpace: 'pre-wrap'
    },
    statusMessage: {
      marginTop: '16px',
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#374151'
    },
    instructions: {
      marginTop: '32px',
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '12px',
      padding: '16px'
    },
    instructionTitle: {
      fontWeight: '600',
      color: '#1e40af',
      marginBottom: '8px'
    },
    instructionList: {
      color: '#1e40af',
      fontSize: '0.875rem',
      lineHeight: '1.6',
      margin: 0,
      paddingLeft: '16px'
    },
    spinner: {
      width: '24px',
      height: '24px',
      border: '2px solid white',
      borderTop: '2px solid transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  // Vérifier le statut de connexion Arduino
  const checkArduinoStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();
      setIsConnected(data.arduino_status === 'connected');
      return data.arduino_status === 'connected';
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      setIsConnected(false);
      return false;
    }
  };

  // Déclencher la prise de photo
  const takePhoto = async () => {
    setIsLoading(true);
    setStatus('Vérification de la connexion Arduino...');
    
    try {
      const arduinoConnected = await checkArduinoStatus();
      if (!arduinoConnected) {
        setStatus('❌ Arduino non connecté');
        setIsLoading(false);
        return;
      }

      setStatus('📸 Déclenchement de la prise de photo...');
      
      const triggerResponse = await fetch(`${API_URL}/trigger-photo`, {
        method: 'POST',
      });
      
      if (!triggerResponse.ok) {
        throw new Error('Erreur lors du déclenchement de la photo');
      }

      setStatus('⏳ Traitement de l\'image en cours...');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const extractionResponse = await fetch(`${API_URL}/extraction`);
      const extractionData = await extractionResponse.json();
      
      setExtractedText(extractionData);
      setStatus('✅ Photo traitée avec succès !');
      setPhoto(`${API_URL}/images/latest.jpg?t=${Date.now()}`);
      
    } catch (error) {
      console.error('Erreur:', error);
      setStatus(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkArduinoStatus();
  }, []);

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .button-hover:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          .button-hover:active {
            transform: scale(0.95);
          }
        `}
      </style>
      
      <div style={styles.maxWidth}>
        
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            🚗 Reconnaissance de Plaques
          </h1>
          <p style={styles.subtitle}>
            Prenez une photo avec votre ESP32-CAM et extrayez le texte automatiquement
          </p>
        </div>

        {/* Status de connexion */}
        <div style={styles.card}>
          <div style={styles.statusContainer}>
            <div style={styles.statusLeft}>
              {isConnected === null ? (
                <div style={{...styles.statusDot, backgroundColor: '#9ca3af'}}></div>
              ) : isConnected ? (
                <Wifi size={20} color="#10b981" />
              ) : (
                <WifiOff size={20} color="#ef4444" />
              )}
              <span style={{fontWeight: '500'}}>
                Arduino: {isConnected === null ? 'Vérification...' : isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            <button 
              onClick={checkArduinoStatus}
              style={styles.buttonSmall}
            >
              Actualiser
            </button>
          </div>
        </div>

        {/* Contrôles */}
        <div style={styles.card}>
          <div style={{textAlign: 'center'}}>
            <button
              onClick={takePhoto}
              disabled={isLoading || !isConnected}
              className="button-hover"
              style={{
                ...styles.button,
                ...(isLoading || !isConnected ? styles.buttonDisabled : styles.buttonPrimary)
              }}
            >
              {isLoading ? (
                <>
                  <div style={styles.spinner}></div>
                  Traitement...
                </>
              ) : (
                <>
                  <Camera size={24} />
                  Prendre une photo
                </>
              )}
            </button>
          </div>
          
          {status && (
            <div style={styles.statusMessage}>
              {status}
            </div>
          )}
        </div>

        {/* Résultats */}
        <div style={styles.grid}>
          
          {/* Photo */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              <FileImage size={20} />
              Photo capturée
            </h2>
            {photo ? (
              <div style={styles.imageContainer}>
                <img 
                  src={photo} 
                  alt="Photo capturée" 
                  style={styles.image}
                  onError={() => setPhoto(null)}
                />
              </div>
            ) : (
              <div style={styles.imageContainer}>
                <div style={styles.imagePlaceholder}>
                  <FileImage size={48} color="#d1d5db" style={{margin: '0 auto 8px'}} />
                  <p style={{margin: 0}}>Aucune photo prise</p>
                </div>
              </div>
            )}
          </div>

          {/* Texte extrait */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              <AlertCircle size={20} />
              Texte extrait
            </h2>
            {extractedText ? (
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <CheckCircle size={20} color="#16a34a" />
                  <span style={{fontWeight: '500', color: '#166534'}}>Résultat détecté:</span>
                </div>
                <pre style={styles.resultText}>
                  {JSON.stringify(extractedText, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={styles.imageContainer}>
                <div style={styles.imagePlaceholder}>
                  <AlertCircle size={48} color="#d1d5db" style={{margin: '0 auto 8px'}} />
                  <p style={{margin: 0}}>Aucun texte extrait</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div style={styles.instructions}>
          <h3 style={styles.instructionTitle}>💡 Instructions:</h3>
          <ul style={styles.instructionList}>
            <li>Assurez-vous que votre ESP32-CAM est connecté au WiFi</li>
            <li>Vérifiez que votre serveur FastAPI fonctionne sur localhost:8000</li>
            <li>Pointez la caméra vers une plaque d'immatriculation bien éclairée</li>
            <li>Cliquez sur "Prendre une photo" et attendez le traitement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LicensePlateApp;
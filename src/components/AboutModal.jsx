import React from 'react';
import './AboutModal.css';

const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Fechar modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="modal-header">
          <div className="developer-avatar">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="modal-title">Sobre o Desenvolvedor</h2>
        </div>
        
        <div className="modal-body">
          <div className="info-section">
            <h3>JALLISSON JALLIS</h3>
            <p className="role">Desenvolvedor Full Stack</p>
          </div>
          
          <div className="info-section">
            <h4>🚀 Sobre o Sistema</h4>
            <p>
              Sistema moderno de gerenciamento de produtos desenvolvido com React e Node.js, 
              com interface intuitiva para controle de estoque multi-loja.
            </p>
          </div>
          
          <div className="info-section">
            <h4>💻 Tecnologias Utilizadas</h4>
            <div className="tech-stack">
              <span className="tech-badge">React 18</span>
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">Express</span>
              <span className="tech-badge">MySQL</span>
              <span className="tech-badge">Vite</span>
              <span className="tech-badge">CSS3</span>
            </div>
          </div>
          
          <div className="info-section">
            <h4>✨ Principais Features</h4>
            <ul className="features-list">
              <li>Interface responsiva e moderna</li>
              <li>Edição em tempo real</li>
              <li>Sistema de busca avançado</li>
              <li>Navegação por teclado</li>
              <li>Scroll infinito otimizado</li>
              <li>Controle para 15 lojas</li>
            </ul>
          </div>
          
          <div className="info-section">
            <h4>📞 99 991420419</h4>
            <div className="contact-links">
              <a 
                href="https://www.linkedin.com/in/jallisson-jallis-4b265b8b/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="contact-link linkedin"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 8C18.8333 8 21 10.1667 21 13V21H17V13C17 11.8954 16.1046 11 15 11C13.8954 11 13 11.8954 13 13V21H9V13C9 10.1667 11.1667 8 14 8H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="1" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="3" cy="4" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                LinkedIn
              </a>
              
              <a 
                href="mailto:jallissonn@hotmail.com" 
                className="contact-link email"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                E-mail
              </a>
            </div>
          </div>
          
          <div className="version-info">
            <p>
              <strong>Versão:</strong> 1.0.0 | 
              <strong> Build:</strong> {new Date().getFullYear()} |
              <strong> React:</strong> 18.2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
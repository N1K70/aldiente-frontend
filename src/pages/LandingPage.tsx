import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonIcon, IonImg } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  checkmarkCircleOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  calendarOutline,
  chatbubblesOutline,
  starOutline,
  arrowForwardOutline,
  logoApple,
  logoAndroid,
  desktopOutline,
  menuOutline,
  closeOutline,
  sparklesOutline,
  timeOutline,
  cardOutline,
  heartOutline,
} from 'ionicons/icons';
import { useAuth } from '../shared/context/AuthContext';
import { getLoginUrl, isLandingDomain, getAppUrl } from '../shared/utils/domainUtils';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Función para navegar al login (redirige al dominio correcto si es necesario)
  const goToLogin = () => {
    if (isLandingDomain()) {
      // Estamos en home.aldiente.app, redirigir a aldiente.app/login
      window.location.href = getLoginUrl();
    } else {
      // Estamos en el dominio principal, usar navegación normal
      history.push('/login');
    }
  };

  // Si el usuario ya está logueado, redirigir al home
  useEffect(() => {
    if (user) {
      if (isLandingDomain()) {
        // Si está en landing domain pero logueado, ir al app domain
        window.location.href = `${getAppUrl()}/tabs/home`;
      } else {
        history.replace('/tabs/home');
      }
    }
  }, [user, history]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: peopleOutline,
      title: 'Conecta con Profesionales',
      description: 'Encuentra estudiantes de odontología certificados y supervisados por docentes expertos.',
    },
    {
      icon: calendarOutline,
      title: 'Reserva Fácil',
      description: 'Agenda tu cita en segundos. Elige fecha, hora y servicio desde tu celular o computador.',
    },
    {
      icon: cardOutline,
      title: 'Precios Accesibles',
      description: 'Tratamientos de calidad a precios justos. Paga de forma segura con Webpay.',
    },
    {
      icon: shieldCheckmarkOutline,
      title: 'Seguridad Garantizada',
      description: 'Todos los procedimientos son supervisados por profesionales titulados.',
    },
    {
      icon: chatbubblesOutline,
      title: 'Chat Directo',
      description: 'Comunícate directamente con tu estudiante antes y después de tu cita.',
    },
    {
      icon: starOutline,
      title: 'Calificaciones Reales',
      description: 'Lee opiniones de otros pacientes y elige con confianza.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Crea tu cuenta',
      description: 'Regístrate gratis en menos de 1 minuto. Solo necesitas tu correo y RUT.',
    },
    {
      number: '02',
      title: 'Encuentra tu servicio',
      description: 'Usa nuestro quiz inteligente o explora el catálogo de tratamientos disponibles.',
    },
    {
      number: '03',
      title: 'Reserva tu cita',
      description: 'Elige al estudiante, fecha y hora que más te convenga. Confirma con un clic.',
    },
    {
      number: '04',
      title: 'Recibe tu tratamiento',
      description: 'Asiste a tu cita y recibe atención de calidad. ¡Así de simple!',
    },
  ];

  const stats = [
    { value: '500+', label: 'Pacientes atendidos' },
    { value: '50+', label: 'Estudiantes activos' },
    { value: '4.8', label: 'Calificación promedio' },
    { value: '98%', label: 'Satisfacción' },
  ];

  const testimonials = [
    {
      name: 'María González',
      role: 'Paciente',
      text: 'Excelente experiencia. El estudiante fue muy profesional y el precio muy accesible. ¡Totalmente recomendado!',
      rating: 5,
    },
    {
      name: 'Carlos Muñoz',
      role: 'Paciente',
      text: 'Reservar fue súper fácil y la atención de primera. Me encantó poder ver las calificaciones antes de elegir.',
      rating: 5,
    },
    {
      name: 'Ana Pérez',
      role: 'Estudiante',
      text: 'ALDIENTE me ha permitido ganar experiencia real mientras ayudo a personas que lo necesitan.',
      rating: 5,
    },
  ];

  return (
    <IonPage>
      <IonContent scrollEvents={true} className="landing-content">
        {/* Navbar */}
        <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
          <div className="navbar-container">
            <div className="navbar-logo">
              <IonImg
                src="/assets/images/LOGO_ALDIENTE_SINFONDO.png"
                alt="ALDIENTE"
                className="navbar-logo-img"
              />
              <span className="navbar-brand">ALDIENTE</span>
            </div>

            <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
              <a href="#features" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Características</a>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>Cómo funciona</a>
              <a href="#testimonials" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); }}>Testimonios</a>
              <button className="navbar-cta" onClick={goToLogin}>
                Comenzar
              </button>
            </div>

            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <IonIcon icon={mobileMenuOpen ? closeOutline : menuOutline} />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-shapes">
            <div className="hero-blob blob-1"></div>
            <div className="hero-blob blob-2"></div>
            <div className="hero-blob blob-3"></div>
          </div>

          <div className="hero-container">
            <motion.div
              className="hero-content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="hero-badge">
                <IonIcon icon={sparklesOutline} />
                <span>La nueva forma de cuidar tu sonrisa</span>
              </div>

              <h1 className="hero-title">
                Servicios odontológicos
                <span className="hero-title-highlight"> de calidad</span>
                <br />a tu alcance
              </h1>

              <p className="hero-subtitle">
                Conectamos pacientes con estudiantes de odontología certificados.
                Tratamientos profesionales, supervisados y a precios accesibles.
              </p>

              <div className="hero-cta-group">
                <motion.button
                  className="hero-cta-primary"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToLogin}
                >
                  Comenzar ahora
                  <IonIcon icon={arrowForwardOutline} />
                </motion.button>

                <motion.button
                  className="hero-cta-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Ver cómo funciona
                </motion.button>
              </div>

              <div className="hero-trust">
                <div className="hero-trust-avatars">
                  <div className="trust-avatar">MG</div>
                  <div className="trust-avatar">CP</div>
                  <div className="trust-avatar">AL</div>
                  <div className="trust-avatar">+</div>
                </div>
                <p>Más de <strong>500 pacientes</strong> ya confían en nosotros</p>
              </div>
            </motion.div>

            <motion.div
              className="hero-visual"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="hero-phone-mockup">
                <div className="phone-frame">
                  <div className="phone-screen">
                    <div className="phone-header">
                      <span className="phone-title">ALDIENTE</span>
                    </div>
                    <div className="phone-content">
                      <div className="phone-greeting">Hola, María 👋</div>
                      <div className="phone-subtitle">Encuentra tu servicio ideal</div>
                      <div className="phone-card">
                        <div className="phone-card-icon">🦷</div>
                        <div className="phone-card-text">
                          <strong>Limpieza dental</strong>
                          <span>Desde $15.000</span>
                        </div>
                      </div>
                      <div className="phone-card">
                        <div className="phone-card-icon">✨</div>
                        <div className="phone-card-text">
                          <strong>Blanqueamiento</strong>
                          <span>Desde $25.000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-floating-card card-1">
                <IonIcon icon={checkmarkCircleOutline} />
                <span>Cita confirmada</span>
              </div>

              <div className="hero-floating-card card-2">
                <IonIcon icon={starOutline} />
                <span>4.9 ★ Calificación</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-container">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="section-container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-badge">Características</span>
              <h2 className="section-title">Todo lo que necesitas en un solo lugar</h2>
              <p className="section-subtitle">
                ALDIENTE te ofrece una experiencia completa para cuidar tu salud dental
              </p>
            </motion.div>

            <div className="features-grid">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="feature-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <div className="feature-icon">
                    <IonIcon icon={feature.icon} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="how-section">
          <div className="section-container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-badge">Proceso</span>
              <h2 className="section-title">¿Cómo funciona?</h2>
              <p className="section-subtitle">
                En solo 4 pasos estarás recibiendo atención dental de calidad
              </p>
            </motion.div>

            <div className="steps-grid">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="step-card"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  <div className="step-number">{step.number}</div>
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-description">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="testimonials-section">
          <div className="section-container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-badge">Testimonios</span>
              <h2 className="section-title">Lo que dicen nuestros usuarios</h2>
              <p className="section-subtitle">
                Miles de pacientes y estudiantes ya confían en ALDIENTE
              </p>
            </motion.div>

            <div className="testimonials-grid">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="testimonial-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <IonIcon key={i} icon={starOutline} className="star-filled" />
                    ))}
                  </div>
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="author-info">
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.role}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <motion.div
              className="cta-content"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="cta-title">
                ¿Listo para cuidar tu sonrisa?
              </h2>
              <p className="cta-subtitle">
                Únete a ALDIENTE hoy y accede a tratamientos dentales de calidad a precios accesibles.
              </p>

              <div className="cta-buttons">
                <motion.button
                  className="cta-btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => history.push('/login')}
                >
                  Crear cuenta gratis
                  <IonIcon icon={arrowForwardOutline} />
                </motion.button>
              </div>

              <div className="cta-platforms">
                <span>Disponible en:</span>
                <div className="platform-icons">
                  <div className="platform-icon">
                    <IonIcon icon={desktopOutline} />
                    <span>Web</span>
                  </div>
                  <div className="platform-icon">
                    <IonIcon icon={logoApple} />
                    <span>iOS</span>
                  </div>
                  <div className="platform-icon">
                    <IonIcon icon={logoAndroid} />
                    <span>Android</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-container">
            <div className="footer-main">
              <div className="footer-brand">
                <div className="footer-logo">
                  <IonImg
                    src="/assets/images/LOGO_ALDIENTE_SINFONDO.png"
                    alt="ALDIENTE"
                    className="footer-logo-img"
                  />
                  <span>ALDIENTE</span>
                </div>
                <p className="footer-tagline">
                  Conectando sonrisas con profesionales del futuro.
                </p>
              </div>

              <div className="footer-links-grid">
                <div className="footer-links-col">
                  <h4>Producto</h4>
                  <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Características</a>
                  <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>Cómo funciona</a>
                  <a href="#testimonials" onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); }}>Testimonios</a>
                </div>
                <div className="footer-links-col">
                  <h4>Legal</h4>
                  <a href="#">Términos de uso</a>
                  <a href="#">Privacidad</a>
                  <a href="#">Cookies</a>
                </div>
                <div className="footer-links-col">
                  <h4>Contacto</h4>
                  <a href="mailto:contacto@aldiente.cl">contacto@aldiente.cl</a>
                  <a href="#">Soporte</a>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p>© {new Date().getFullYear()} ALDIENTE. Todos los derechos reservados.</p>
              <p className="footer-made">
                Hecho con <IonIcon icon={heartOutline} className="heart-icon" /> en Chile
              </p>
            </div>
          </div>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default LandingPage;

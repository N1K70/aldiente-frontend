import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { homeOutline, calendarOutline, personOutline } from 'ionicons/icons';
import { usePageTransition } from '../context/PageTransitionContext';
import LiquidGlass from 'liquid-glass-react';
import './CustomTabBar.css';

interface TabBarProps {
  userRole?: 'student' | 'patient' | 'admin';
}

const CustomTabBar: React.FC<TabBarProps> = ({ userRole }) => {
  const history = useHistory();
  const location = useLocation();
  const { setDirection } = usePageTransition();

  const tabs = [
    {
      path: '/tabs/home',
      icon: homeOutline,
      label: 'Inicio',
    },
    ...(userRole === 'patient' ? [{
      path: '/tabs/profile/reservas',
      icon: calendarOutline,
      label: 'Reservas',
    }] : []),
    ...(userRole === 'student' ? [{
      path: '/tabs/appointments',
      icon: calendarOutline,
      label: 'Citas',
    }] : []),
    {
      path: '/tabs/profile',
      icon: personOutline,
      label: 'Perfil',
    }
  ];

  const handleTabClick = (path: string) => {
    const currentIndex = tabs.findIndex(tab => location.pathname === tab.path);
    const targetIndex = tabs.findIndex(tab => tab.path === path);
    
    if (currentIndex !== -1 && targetIndex !== -1) {
      if (targetIndex > currentIndex) {
        setDirection('right');
      } else if (targetIndex < currentIndex) {
        setDirection('left');
      } else {
        setDirection('none');
      }
    } else {
      setDirection('none');
    }
    
    history.push(path);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="tab-bar-wrapper">
      <div className="tab-bar-glass">
        <LiquidGlass
          displacementScale={50}
          blurAmount={0.12}
          saturation={180}
          aberrationIntensity={1.8}
          elasticity={0.25}
          cornerRadius={28}
        >
          <div className="tab-bar-content">
            {tabs.map((tab) => {
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.path}
                  className={`tab-button ${active ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.path)}
                >
                  <IonIcon icon={tab.icon} className="tab-icon" />
                  {active && <span className="tab-label">{tab.label}</span>}
                </button>
              );
            })}
          </div>
        </LiquidGlass>
      </div>
    </div>
  );
};

export default CustomTabBar;

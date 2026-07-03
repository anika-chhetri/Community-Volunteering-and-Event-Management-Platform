import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', duration, onClose }) {
  // Use longer duration for error messages (5 seconds), shorter for success (3 seconds)
  const effectiveDuration = duration !== undefined ? duration : (type === 'error' ? 5000 : 3000);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, effectiveDuration);
    return () => clearTimeout(timer);
  }, [message, effectiveDuration, onClose]);

  if (!message) return null;

  const bgColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6';
  const borderColor = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#1d4ed8';
  const icon = type === 'success' ? '✓ SUCCESS' : type === 'error' ? '✕ ERROR' : 'ℹ INFO';

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      background: bgColor,
      color: '#fff',
      padding: '20px 28px',
      borderRadius: 12,
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      zIndex: 9999,
      minWidth: 320,
      animation: 'slideIn 0.3s ease-out',
      border: `3px solid ${borderColor}`,
      fontSize: 16,
      fontWeight: 600
    }}>
      <span style={{ fontSize: 28, fontWeight: 'bold', minWidth: 30 }}>{icon.charAt(0)}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <strong style={{ fontSize: 16 }}>{icon.split(' ')[1]}</strong>
        <span style={{ fontSize: 14 }}>{message}</span>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

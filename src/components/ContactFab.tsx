'use client';
import { useState } from 'react';

interface ContactFabProps {
    callEnabled: boolean;
    whatsappEnabled: boolean;
    locationEnabled?: boolean;
    phoneNumber?: string;
    whatsappNumber?: string;
    locationLat?: number;
    locationLng?: number;
    themeColor: string;
}

export default function ContactFab({
    callEnabled,
    whatsappEnabled,
    locationEnabled,
    phoneNumber,
    whatsappNumber,
    locationLat,
    locationLng,
    themeColor
}: ContactFabProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!callEnabled && !whatsappEnabled && !locationEnabled) return null;

    const toggleOpen = () => setIsOpen(!isOpen);

    const mainButtonStyle: React.CSSProperties = {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: themeColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        fontSize: '1.5rem',
        zIndex: 100,
        transition: 'transform 0.3s ease',
        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
    };

    const actionButtonStyle = (bgColor: string, delay: string): React.CSSProperties => ({
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px',
        cursor: 'pointer',
        fontSize: '1.2rem',
        textDecoration: 'none',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
        transition: `all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}`,
        pointerEvents: isOpen ? 'auto' : 'none',
        position: 'relative'
    });

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 9999
        }}>
            {/* Actions Menu (popups upwards) */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '8px'
            }}>
                {whatsappEnabled && whatsappNumber && (
                    <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={actionButtonStyle('#25D366', '0.2s')}
                        title="Whatsapp"
                    >
                        <i className="fa-brands fa-whatsapp"></i>
                    </a>
                )}

                {callEnabled && phoneNumber && (
                    <a
                        href={`tel:${phoneNumber}`}
                        style={actionButtonStyle('#10B981', '0.1s')}
                        title="Ara"
                    >
                        <i className="fa-solid fa-phone"></i>
                    </a>
                )}

                {locationEnabled && locationLat && locationLng && (
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${locationLat},${locationLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={actionButtonStyle('#EA4335', '0.0s')}
                        title="Konum"
                    >
                        <i className="fa-solid fa-location-dot"></i>
                    </a>
                )}
            </div>

            {/* Main Toggle Button */}
            <div onClick={toggleOpen} style={mainButtonStyle}>
                {isOpen ? (
                    <i className="fa-solid fa-plus"></i>
                ) : (
                    <i className="fa-solid fa-comment-dots"></i>
                )}
            </div>
        </div>
    );
}

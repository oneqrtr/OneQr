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
    cartCount?: number;
    onWhatsappClick?: () => void;
}

export default function ContactFab({
    callEnabled,
    whatsappEnabled,
    locationEnabled,
    phoneNumber,
    whatsappNumber,
    locationLat,
    locationLng,
    themeColor,
    cartCount = 0,
    onWhatsappClick,
    onCartClick,
    orderEnabled = false
}: ContactFabProps & { onCartClick?: () => void, orderEnabled?: boolean }) {
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
        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        position: 'relative'
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

    const badgeStyle: React.CSSProperties = {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: '#EF4444',
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        border: '2px solid white',
        zIndex: 101,
        // Ensure badge doesn't rotate with parent transform if placed inside rotating element, 
        // but here we are placing inside relative container, mainButtonStyle has rotate.
        // If we put badge inside main button, it will rotate.
        // Better to handle rotation carefully or counter-rotate if needed, 
        // OR simpler: place badge outside the rotating icon wrapper but inside the container.
        // Current structure: container -> div(mainButton) -> icon.
        // We will place badge inside div(mainButton). It will rotate. 
        // For a perfectly upright badge, we'd need to separate the button background from the icon rotation,
        // or counter-rotate the badge. 
        // However, standard FABs often rotate the whole thing (like 'plus' to 'x').
        // Let's keep it simple. If it rotates 45deg, the badge rotates too. 
        // Actually, 'plus' icon rotates. If we want badge to NOT rotate, we should restructure.
        // But for now, let's stick to the prompt's request which implies a simple badge.
        // The user prompt shows HTML examples.
    };

    // Helper to render WhatsApp button content
    const renderWhatsappButton = () => {
        const hasCart = cartCount > 0;

        // If we have items in cart and a handler, we prioritize that over direct link
        // BUT user said: "sepete ekleme bittiğinde ise watsapp icona tıklandıgında eğer sepet doluysa bir modal açılacak."
        // So we use onClick if cartCount > 0

        const handleClick = (e: React.MouseEvent) => {
            if (hasCart && onWhatsappClick) {
                e.preventDefault();
                onWhatsappClick();
            }
        };

        return (
            <a
                href={hasCart ? '#' : `https://wa.me/${whatsappNumber}`}
                onClick={handleClick}
                target={hasCart ? undefined : "_blank"}
                rel={hasCart ? undefined : "noopener noreferrer"}
                style={actionButtonStyle('#25D366', '0.2s')}
                title="Whatsapp"
            >
                {/* Badge on WhatsApp button when open */}
                {isOpen && hasCart && (
                    <span style={badgeStyle}>{cartCount}</span>
                )}
                <i className="fa-brands fa-whatsapp"></i>
            </a>
        );
    };

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
                {/* System Order (Cart) Button */}
                {orderEnabled && (
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            if (onCartClick) onCartClick();
                        }}
                        style={actionButtonStyle('#F59E0B', '0.3s')} // Amber/Orange for Food Order
                        title="Sepetim"
                    >
                        {isOpen && cartCount > 0 && (
                            <span style={badgeStyle}>{cartCount}</span>
                        )}
                        <i className="fa-solid fa-basket-shopping"></i>
                    </div>
                )}

                {whatsappEnabled && whatsappNumber && renderWhatsappButton()}

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
                {/* Badge on Main Button when closed */}
                {!isOpen && cartCount > 0 && (
                    <span style={badgeStyle}>{cartCount}</span>
                )}

                {isOpen ? (
                    <i className="fa-solid fa-plus"></i>
                ) : (
                    <i className="fa-solid fa-comment-dots"></i>
                )}
            </div>
        </div>
    );
}

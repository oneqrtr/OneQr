'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const FALLBACK_CENTER: [number, number] = [36.855, 30.76];

interface CustomerPin {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

interface KonumMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lat: number, lng: number) => void;
    onSelectCustomer?: (id: string, lat: number, lng: number) => void;
    themeColor?: string;
    selectedLat?: number | null;
    selectedLng?: number | null;
    centerLat?: number | null;
    centerLng?: number | null;
    restaurantName?: string;
    customerPins?: CustomerPin[];
}

export default function KonumMapModal({ isOpen, onClose, onSelect, onSelectCustomer, themeColor = '#2563EB', selectedLat, selectedLng, centerLat, centerLng, restaurantName, customerPins = [] }: KonumMapModalProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const customerMarkersRef = useRef<any[]>([]);
    const onSelectRef = useRef(onSelect);
    const onSelectCustomerRef = useRef(onSelectCustomer);
    onSelectRef.current = onSelect;
    onSelectCustomerRef.current = onSelectCustomer;

    useEffect(() => {
        if (!isOpen || !mapRef.current) return;

        const init = async () => {
            const L = (await import('leaflet')).default;
            const el = mapRef.current;
            if (!el) return;

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            const mapCenter: [number, number] = (centerLat != null && centerLng != null) ? [centerLat, centerLng] : FALLBACK_CENTER;
            const map = L.map(el, {
                center: mapCenter,
                zoom: 13,
                minZoom: 10,
                maxZoom: 19,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '© <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20,
            }).addTo(map);

            map.attributionControl.setPrefix(false);
            map.attributionControl.remove();
            const attrDiv = L.DomUtil.create('div', 'leaflet-custom-attribution');
            attrDiv.innerHTML = '<a href="https://oneqr.tr" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;text-decoration:none;color:#666;font-size:11px;"><img src="/logo-qr.png" alt="OneQR" style="width:20px;height:20px;object-fit:contain;" /></a><span style="font-size:9px;color:#999;margin-left:6px">© CARTO</span>';
            attrDiv.style.cssText = 'position:absolute;bottom:6px;right:6px;z-index:1000;background:rgba(255,255,255,0.9);padding:4px 8px;border-radius:4px;';
            map.getContainer().appendChild(attrDiv);

            const iconHtml = `
                <div style="
                    width: 28px; height: 28px;
                    background: ${themeColor};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                "></div>
            `;
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });

            const updateMarker = (lat: number, lng: number) => {
                if (markerRef.current) map.removeLayer(markerRef.current);
                markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            };

            if (selectedLat != null && selectedLng != null) {
                updateMarker(selectedLat, selectedLng);
                map.setView([selectedLat, selectedLng], 16);
            }

            customerMarkersRef.current.forEach(m => map.removeLayer(m));
            customerMarkersRef.current = [];
            customerPins.forEach(pin => {
                const pinIcon = L.divIcon({
                    html: `<div style="width:24px;height:24px;background:${themeColor};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:700;">!</div>`,
                    className: 'customer-pin',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });
                const m = L.marker([pin.lat, pin.lng], { icon: pinIcon }).addTo(map);
                m.bindPopup(`<div style="font-weight:600;padding:4px;">${pin.name}</div>`, { closeButton: false });
                m.on('click', () => {
                    if (onSelectCustomerRef.current) onSelectCustomerRef.current(pin.id, pin.lat, pin.lng);
                });
                customerMarkersRef.current.push(m);
            });

            map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
                const { lat, lng } = e.latlng;
                updateMarker(lat, lng);
                onSelectRef.current(lat, lng);
            });

            mapInstanceRef.current = map;
        };

        init();
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            markerRef.current = null;
            customerMarkersRef.current = [];
        };
    }, [isOpen, themeColor, customerPins]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    maxWidth: '560px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Konum seç {restaurantName ? `(${restaurantName})` : ''}</h3>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#6B7280' }}>&times;</button>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#6B7280' }}>
                    {customerPins.length > 0 ? 'Müşteri pinine tıklayarak seçin veya haritada yeni konum işaretleyin' : 'Haritada bir noktaya tıklayarak teslimat adresini işaretleyin'}
                </p>
                <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', border: `3px solid ${themeColor}` }} />
            </div>
        </div>
    );
}

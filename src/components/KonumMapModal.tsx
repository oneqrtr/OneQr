'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const FALLBACK_CENTER: [number, number] = [36.855, 30.76];

interface KonumMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lat: number, lng: number) => void;
    themeColor?: string;
    selectedLat?: number | null;
    selectedLng?: number | null;
    centerLat?: number | null;
    centerLng?: number | null;
    restaurantName?: string;
}

export default function KonumMapModal({ isOpen, onClose, onSelect, themeColor = '#2563EB', selectedLat, selectedLng, centerLat, centerLng, restaurantName }: KonumMapModalProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

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
        };
    }, [isOpen, themeColor]);

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
                <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#6B7280' }}>Haritada bir noktaya tıklayarak teslimat adresini işaretleyin</p>
                <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', border: `3px solid ${themeColor}` }} />
            </div>
        </div>
    );
}

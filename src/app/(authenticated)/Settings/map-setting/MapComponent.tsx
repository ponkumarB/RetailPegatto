'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';

interface MapComponentProps {
  selectedZone: string | null;
  setSelectedZone: (zoneId: string | null) => void;
  hoveredZone: string | null;
  setHoveredZone: (zoneId: string | null) => void;
  primaryColor: string;
}

export default function MapComponent({
  selectedZone,
  setSelectedZone,
  hoveredZone,
  setHoveredZone,
  primaryColor
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonsRef = useRef<{ [key: string]: L.Polygon }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { theme } = useTheme();

  // Zone Definitions
  const zoneData = [
    {
      id: 'yelahanka',
      name: 'Yelahanka (North)',
      color: '#10B981', // emerald
      polygon: [
        [13.060, 77.550],
        [13.130, 77.550],
        [13.130, 77.630],
        [13.060, 77.630]
      ],
      marker: [13.095, 77.590],
      rep: 'Ajay Kumar',
      initials: 'AK'
    },
    {
      id: 'central',
      name: 'Central Bengaluru',
      color: '#3B82F6', // blue
      polygon: [
        [12.940, 77.560],
        [13.030, 77.560],
        [13.030, 77.630],
        [12.940, 77.630]
      ],
      marker: [12.975, 77.595],
      rep: 'Neha Sharma',
      initials: 'NS'
    },
    {
      id: 'whitefield',
      name: 'Whitefield (East)',
      color: '#8B5CF6', // purple
      polygon: [
        [12.940, 77.700],
        [13.010, 77.700],
        [13.010, 77.780],
        [12.940, 77.780]
      ],
      marker: [12.975, 77.740],
      rep: 'Ramesh Rao',
      initials: 'RR'
    },
    {
      id: 'south',
      name: 'South Bengaluru',
      color: '#F97316', // orange
      polygon: [
        [12.870, 77.550],
        [12.935, 77.550],
        [12.935, 77.630],
        [12.870, 77.630]
      ],
      marker: [12.902, 77.590],
      rep: 'Priya Patel',
      initials: 'PP'
    }
  ];

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Instantiate map centered at Bengaluru center
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true
    }).setView([12.9716, 77.5946], 11);

    mapInstanceRef.current = map;

    // Load theme-based tiles
    const currentTheme = theme === 'dark' ? 'dark' : 'light';
    const tileUrl = currentTheme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Draw polygons & add markers
    zoneData.forEach(z => {
      // Custom div marker icon
      const customIcon = L.divIcon({
        className: 'custom-rep-marker',
        html: `
          <div style="
            background-color: ${z.color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            color: white;
            border: 2px solid white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease-in-out;
            cursor: pointer;
          ">
            ${z.initials}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Marker placement
      const marker = L.marker(z.marker as L.LatLngExpression, { icon: customIcon }).addTo(map);
      marker.bindPopup(`<b>${z.rep}</b><br/>Representative for ${z.name}`);

      // Area Polygon mapping
      const polygon = L.polygon(z.polygon as L.LatLngTuple[], {
        color: z.color,
        fillColor: z.color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '4'
      }).addTo(map);

      // Save polygon ref
      polygonsRef.current[z.id] = polygon;

      // Event handlers
      polygon.on('click', () => {
        setSelectedZone(z.id);
      });

      polygon.on('mouseover', () => {
        setHoveredZone(z.id);
        polygon.setStyle({
          fillOpacity: 0.25
        });
      });

      polygon.on('mouseout', () => {
        setHoveredZone(null);
        polygon.setStyle({
          fillOpacity: selectedZone === z.id ? 0.35 : 0.12
        });
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layers dynamically on theme changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const currentTheme = theme === 'dark' ? 'dark' : 'light';
    const tileUrl = currentTheme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Handle selected/hovered state highlights & zoom auto-focusing
  useEffect(() => {
    const activeZone = selectedZone || hoveredZone;

    Object.keys(polygonsRef.current).forEach(id => {
      const polygon = polygonsRef.current[id];
      const isSelected = selectedZone === id;
      const isActive = activeZone === id;

      if (polygon) {
        polygon.setStyle({
          fillOpacity: isSelected ? 0.35 : isActive ? 0.25 : 0.12,
          weight: isActive ? 3.5 : 2,
          dashArray: isSelected ? '0' : '4'
        });
      }
    });

    // Zoom and fly to selected zone
    if (selectedZone && mapInstanceRef.current && polygonsRef.current[selectedZone]) {
      const polygon = polygonsRef.current[selectedZone];
      mapInstanceRef.current.fitBounds(polygon.getBounds(), {
        padding: [40, 40],
        maxZoom: 13,
        animate: true,
        duration: 0.8
      });
    } else if (!selectedZone && mapInstanceRef.current) {
      // Zoom back out to whole city view
      mapInstanceRef.current.setView([12.9716, 77.5946], 11, {
        animate: true,
        duration: 0.8
      });
    }
  }, [selectedZone, hoveredZone]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-xl border border-slate-100 dark:border-slate-800" 
      style={{ minHeight: '400px' }}
    />
  );
}

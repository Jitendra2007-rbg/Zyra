import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title: string;
    description?: string;
    color?: 'blue' | 'red' | 'green' | 'orange' | 'yellow' | 'violet' | 'grey' | 'black';
  }>;
  className?: string;
}

const getMarkerIcon = (color: string = 'blue') => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const Map = ({
  center = [12.9716, 77.5946], // Default: Bangalore, India
  zoom = 13,
  markers = [],
  className = "h-[400px] w-full rounded-lg"
}: MapProps) => {
  // Calculate center based on markers if not provided or if multiple markers
  const mapCenter = markers.length > 0 && markers.length <= 2
    ? markers[0].position
    : center;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.length > 0 ? (
        markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            icon={getMarkerIcon(marker.color || 'blue')}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{marker.title}</h3>
                {marker.description && (
                  <p className="text-sm text-muted-foreground">{marker.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))
      ) : (
        <Marker position={center}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">Default Location</h3>
              <p className="text-sm text-muted-foreground">Bangalore, India</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;

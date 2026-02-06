import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from './ui/button';
import { Crosshair } from 'lucide-react';

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
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  enableCurrentLocation?: boolean;
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

function LocationMarker({ onSelect }: { onSelect?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      if (onSelect) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={getMarkerIcon('red')}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const Map = ({
  center = [12.9716, 77.5946], // Default: Bangalore, India
  zoom = 13,
  markers = [],
  className = "h-[400px] w-full rounded-lg",
  interactive = false,
  onLocationSelect,
  enableCurrentLocation = false
}: MapProps) => {
  // Calculate center based on markers if not provided or if multiple markers
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    markers.length > 0 && markers.length <= 2 ? markers[0].position : center
  );

  useEffect(() => {
    if (markers.length > 0 && markers.length <= 2) {
      setMapCenter(markers[0].position);
    } else {
      setMapCenter(center);
    }
  }, [center, markers]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter: [number, number] = [latitude, longitude];
          setMapCenter(newCenter);
          if (onLocationSelect) {
            onLocationSelect(latitude, longitude);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please check permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="relative">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        className={className}
        style={{ zIndex: 0 }}
      >
        <ChangeView center={mapCenter} zoom={zoom} />
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
        ) : !interactive && (
          <Marker position={mapCenter}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">Default Location</h3>
                <p className="text-sm text-muted-foreground">Bangalore, India</p>
              </div>
            </Popup>
          </Marker>
        )}

        {interactive && <LocationMarker onSelect={onLocationSelect} />}
      </MapContainer>

      {enableCurrentLocation && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 z-[1000] shadow-md bg-white hover:bg-gray-100"
          onClick={handleCurrentLocation}
          title="Use Current Location"
        >
          <Crosshair className="h-5 w-5 text-primary" />
        </Button>
      )}
    </div>
  );
};

export default Map;

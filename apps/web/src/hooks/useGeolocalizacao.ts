import { useState } from 'react';

export interface Coordenadas {
  latitude: number;
  longitude: number;
  precisao: number;
}

export function useGeolocalizacao() {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [erro, setErro] = useState('');
  const [obtendo, setObtendo] = useState(false);

  const obter = (): Promise<Coordenadas> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocalização não suportada neste dispositivo.';
        setErro(msg);
        reject(new Error(msg));
        return;
      }

      setObtendo(true);
      setErro('');

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordenadas = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            precisao: pos.coords.accuracy,
          };
          setCoordenadas(coords);
          setObtendo(false);
          resolve(coords);
        },
        (err) => {
          const msg = err.code === 1
            ? 'Permissão de localização negada. Habilite nas configurações do navegador.'
            : 'Não foi possível obter sua localização.';
          setErro(msg);
          setObtendo(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  return { coordenadas, erro, obtendo, obter };
}

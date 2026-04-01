import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export function useFaceApi() {
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setCarregado(true);
      } catch (e) {
        setErro('Não foi possível carregar os modelos de reconhecimento facial.');
        console.error(e);
      }
    }
    carregar();
  }, []);

  async function detectarRosto(video: HTMLVideoElement) {
    return faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  async function compararDescritores(
    descritoresReferencia: number[][],
    descritoresCapturado: Float32Array
  ): Promise<number> {
    if (!descritoresReferencia.length) return 0;
    const labeled = new faceapi.LabeledFaceDescriptors('usuario', [
      new Float32Array(descritoresReferencia[0]),
    ]);
    const matcher = new faceapi.FaceMatcher([labeled], 0.6);
    const resultado = matcher.findBestMatch(descritoresCapturado);
    const distancia = resultado.distance;
    return Math.max(0, Math.min(1, 1 - distancia / 0.6));
  }

  return { carregado, erro, detectarRosto, compararDescritores };
}

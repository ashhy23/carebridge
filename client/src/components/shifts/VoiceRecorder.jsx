import { useRef, useState } from 'react';
import api from '../../lib/api';

export default function VoiceRecorder({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  async function startRecording() {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const blob = new Blob(chunks, { type: 'audio/webm' });
        setIsTranscribing(true);

        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');

          const { data } = await api.post('/ai/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          onTranscript(data.transcript);
        } catch {
          setError('Transcription failed. Please try again.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(
          'Microphone access denied. Please allow microphone access in your browser settings.'
        );
      } else {
        setError('Transcription failed. Please try again.');
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function handleToggle() {
    if (isTranscribing) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  let buttonLabel = '🎤 Record Voice Note';
  let buttonClass =
    'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-400';

  if (isRecording) {
    buttonLabel = '🔴 Recording... (tap to stop)';
    buttonClass =
      'rounded-lg border border-red-500 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 animate-pulse';
  } else if (isTranscribing) {
    buttonLabel = 'Transcribing...';
    buttonClass =
      'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed';
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isTranscribing}
        className={buttonClass}
      >
        {buttonLabel}
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
const recognition = new window.webkitSpeechRecognition(); // or new window.SpeechRecognition() for browsers that support it


const SpeechToText = () => {
  const [transcription, setTranscription] = useState('');
  const [socket, setSocket] = useState(null);
  const [speakers, setSpeakers] = useState([]);

  const handleStart = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      setTranscription(transcript);

      if (socket) {
        socket.emit('audio', event.results[0][0].transcript);
      }
    };

    recognition.start();
  };

  const handleStop = () => {
    recognition.stop();
  };

  const handleSave = () => {
    const data = new Blob([transcription], { type: 'text/plain' });
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('transcription', message => {
      const [speaker, transcript] = message.split(':');
      setTranscription(t => `${t}\n${transcript}`);
      setSpeakers(s => [...s, speaker]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div>
      <div>
        <button onClick={handleStart}>Start</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handleSave}>Save</button>
      </div>
      <div>
        {transcription.split('\n').map((line, index) => (
          <div key={index}>
            <span style={{ fontWeight: 'bold' }}>
              {speakers[index] ? `Speaker ${speakers[index]}` : ''}
            </span>{' '}
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeechToText;

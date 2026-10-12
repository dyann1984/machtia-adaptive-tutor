const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/ELEVENLABS_API_KEY=([^\r\n]+)/)[1].trim();
const voice = env.match(/ELEVENLABS_VOICE_ID=([^\r\n]+)/)[1].trim();

const rawText = "Cristóbal Colón llegó a tierras americanas el 12 de octubre de 1492 con tres carabelas (la Niña, la Pinta y la Santa María). Buscaba una ruta a Asia navegando al oeste. ¡Pero ojo! América ya estaba descubierta y habitada desde hacía miles de años por los pueblos originarios e indígenas (como los Taínos, Mayas, Mexicas e Incas), con sus propias ciudades, lenguas y culturas. Por eso hoy los historiadores le llaman el Encuentro de dos mundos.";

async function testColumbus() {
  const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: rawText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    })
  });
  console.log('Status:', res.status);
  if (res.ok) {
    const buf = await res.arrayBuffer();
    console.log('Success! Buffer bytes:', buf.byteLength);
  } else {
    console.log('Error text:', await res.text());
  }
}
testColumbus().catch(console.error);

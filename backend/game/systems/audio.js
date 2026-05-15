const SAMPLE_RATE = 8000;
const TWO_PI = Math.PI * 2;

function clampSample(value) {
  return Math.max(-1, Math.min(1, value));
}

function writeText(bytes, offset, text) {
  for (let i = 0; i < text.length; i++) {
    bytes[offset + i] = text.charCodeAt(i);
  }
}

function writeUint16(bytes, offset, value) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >> 8) & 255;
}

function writeUint32(bytes, offset, value) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >> 8) & 255;
  bytes[offset + 2] = (value >> 16) & 255;
  bytes[offset + 3] = (value >> 24) & 255;
}

function samplesToWavDataUrl(samples) {
  const dataBytes = samples.length * 2;
  const bytes = new Uint8Array(44 + dataBytes);

  writeText(bytes, 0, "RIFF");
  writeUint32(bytes, 4, 36 + dataBytes);
  writeText(bytes, 8, "WAVE");
  writeText(bytes, 12, "fmt ");
  writeUint32(bytes, 16, 16);
  writeUint16(bytes, 20, 1);
  writeUint16(bytes, 22, 1);
  writeUint32(bytes, 24, SAMPLE_RATE);
  writeUint32(bytes, 28, SAMPLE_RATE * 2);
  writeUint16(bytes, 32, 2);
  writeUint16(bytes, 34, 16);
  writeText(bytes, 36, "data");
  writeUint32(bytes, 40, dataBytes);

  for (let i = 0; i < samples.length; i++) {
    const value = Math.round(clampSample(samples[i]) * 32767);
    writeUint16(bytes, 44 + i * 2, value < 0 ? value + 65536 : value);
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

function makeClip(durationSeconds, generator) {
  const length = Math.floor(durationSeconds * SAMPLE_RATE);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const time = i / SAMPLE_RATE;
    samples[i] = generator(time, i);
  }

  return samplesToWavDataUrl(samples);
}

function createAudio(src, { loop = false, volume = 0.4 } = {}) {
  const audio = document.createElement("audio");
  audio.src = src;
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = "auto";
  audio.dataset.generated = "true";
  document.body.appendChild(audio);
  return audio;
}

function setPlaying(audio, shouldPlay) {
  if (shouldPlay && audio.paused) {
    audio.play().catch(() => {});
  } else if (!shouldPlay && !audio.paused) {
    audio.pause();
  }
}

function createBirdsClip() {
  return makeClip(4, (time) => {
    const chirpA = time > 0.45 && time < 0.75 ? Math.sin(TWO_PI * (1300 + time * 500) * time) * 0.22 : 0;
    const chirpB = time > 2.1 && time < 2.38 ? Math.sin(TWO_PI * (980 + time * 380) * time) * 0.18 : 0;
    const chirpC = time > 3.05 && time < 3.2 ? Math.sin(TWO_PI * 1450 * time) * 0.14 : 0;
    return chirpA + chirpB + chirpC;
  });
}

function createWindClip() {
  return makeClip(5, (time) => {
    const noise = (Math.random() * 2 - 1) * 0.06;
    const lowDrift = Math.sin(TWO_PI * 0.18 * time) * 0.08;
    return noise + lowDrift;
  });
}

function createNightClip() {
  return makeClip(5, (time) => {
    const drone = Math.sin(TWO_PI * 72 * time) * 0.08;
    const pulse = Math.sin(TWO_PI * 0.42 * time) * 0.06;
    const noise = (Math.random() * 2 - 1) * 0.025;
    return drone + pulse + noise;
  });
}

function createMonsterClip() {
  return makeClip(3.5, (time) => {
    const growl = Math.sin(TWO_PI * (48 + Math.sin(time * 6) * 14) * time) * 0.13;
    const pulse = Math.sin(TWO_PI * 0.9 * time) > 0.55 ? 0.12 : 0;
    return growl + pulse;
  });
}

function createFootstepClip() {
  return makeClip(0.24, (time) => {
    const fade = Math.max(0, 1 - time / 0.24);
    const thump = Math.sin(TWO_PI * 95 * time) * fade * 0.24;
    const grit = (Math.random() * 2 - 1) * fade * 0.08;
    return thump + grit;
  });
}

export function createAudioSystem() {
  const clips = {
    birds: createAudio(createBirdsClip(), { loop: true, volume: 0.22 }),
    wind: createAudio(createWindClip(), { loop: true, volume: 0.18 }),
    night: createAudio(createNightClip(), { loop: true, volume: 0.28 }),
    monsters: createAudio(createMonsterClip(), { loop: true, volume: 0.16 }),
    footsteps: createAudio(createFootstepClip(), { volume: 0.35 })
  };
  let unlocked = false;
  let footstepTimer = 0;
  let masterVolume = 0.7;

  function applyVolume() {
    clips.birds.volume = 0.22 * masterVolume;
    clips.wind.volume = 0.18 * masterVolume;
    clips.night.volume = 0.28 * masterVolume;
    clips.monsters.volume = 0.16 * masterVolume;
    clips.footsteps.volume = 0.35 * masterVolume;
  }

  applyVolume();

  function unlock() {
    if (unlocked) return;

    unlocked = true;
    for (const audio of Object.values(clips)) {
      const volume = audio.volume;
      audio.volume = 0;
      audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = volume;
        })
        .catch(() => {
          audio.volume = volume;
        });
    }
  }

  return {
    unlock,
    setVolume(value) {
      masterVolume = Math.max(0, Math.min(1, value));
      applyVolume();
    },
    update(deltaTime, context) {
      if (!unlocked) return;

      const isNight = context.dayNight.isNight;
      setPlaying(clips.birds, !isNight);
      setPlaying(clips.wind, !isNight);
      setPlaying(clips.night, isNight);
      setPlaying(clips.monsters, isNight);

      footstepTimer = Math.max(0, footstepTimer - deltaTime);
      if (context.movementState?.isMoving && footstepTimer <= 0) {
        clips.footsteps.currentTime = 0;
        clips.footsteps.play().catch(() => {});
        footstepTimer = 0.38;
      }
    }
  };
}

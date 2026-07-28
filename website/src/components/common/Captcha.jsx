import { useRef, useEffect, useCallback } from "react";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const CHARS = UPPER + LOWER + DIGITS;
const CAPTCHA_LENGTH = 4;
const WIDTH = 160;
const HEIGHT = 52;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomColor(min, max) {
  return `rgb(${randomInt(min, max)},${randomInt(min, max)},${randomInt(min, max)})`;
}

function generateCaptchaText() {
  // Ensure at least 1 uppercase, 1 lowercase, 1 digit
  const mandatory = [
    UPPER[randomInt(0, UPPER.length - 1)],
    LOWER[randomInt(0, LOWER.length - 1)],
    DIGITS[randomInt(0, DIGITS.length - 1)]
  ];
  // Fill remaining with random chars
  while (mandatory.length < CAPTCHA_LENGTH) {
    mandatory.push(CHARS[randomInt(0, CHARS.length - 1)]);
  }
  // Shuffle
  for (let i = mandatory.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [mandatory[i], mandatory[j]] = [mandatory[j], mandatory[i]];
  }
  return mandatory.join("");
}

/**
 * Captcha component renders a distorted canvas CAPTCHA.
 * Props:
 * - onGenerate(text): called when a new CAPTCHA is generated
 * - disabled: disable refresh
 */
export default function Captcha({ onGenerate, disabled }) {
  const canvasRef = useRef(null);

  const drawCaptcha = useCallback((text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, randomColor(230, 255));
    gradient.addColorStop(1, randomColor(230, 255));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Noise dots
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = randomColor(80, 200);
      ctx.beginPath();
      ctx.arc(randomInt(0, WIDTH), randomInt(0, HEIGHT), randomInt(1, 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = randomColor(100, 200);
      ctx.lineWidth = randomInt(1, 2);
      ctx.beginPath();
      ctx.moveTo(randomInt(0, WIDTH), randomInt(0, HEIGHT));
      ctx.bezierCurveTo(
        randomInt(0, WIDTH), randomInt(0, HEIGHT),
        randomInt(0, WIDTH), randomInt(0, HEIGHT),
        randomInt(0, WIDTH), randomInt(0, HEIGHT)
      );
      ctx.stroke();
    }

    // Draw each character with distortion
    const startX = 16;
    const charWidth = (WIDTH - 32) / CAPTCHA_LENGTH;

    for (let i = 0; i < text.length; i++) {
      const x = startX + i * charWidth + charWidth / 2;
      const y = HEIGHT / 2 + randomInt(-4, 8);

      ctx.save();
      ctx.translate(x, y);

      // Random rotation (heavy distortion)
      const angle = (randomInt(-40, 40) * Math.PI) / 180;
      ctx.rotate(angle);

      // Random scale
      const scaleX = 0.7 + Math.random() * 0.6;
      const scaleY = 0.7 + Math.random() * 0.6;
      ctx.scale(scaleX, scaleY);

      // Random font
      const fonts = ["bold", "italic bold", "italic"];
      const fontSize = randomInt(22, 30);
      ctx.font = `${fonts[randomInt(0, fonts.length - 1)]} ${fontSize}px 'Courier New', monospace`;

      // Text color (dark but varied)
      ctx.fillStyle = randomColor(0, 80);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Shadow for depth
      ctx.shadowColor = randomColor(100, 180);
      ctx.shadowBlur = randomInt(1, 3);
      ctx.shadowOffsetX = randomInt(-2, 2);
      ctx.shadowOffsetY = randomInt(-2, 2);

      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Extra noise lines crossing text
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = randomColor(80, 160);
      ctx.lineWidth = randomInt(1, 2);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(randomInt(0, 30), randomInt(0, HEIGHT));
      ctx.lineTo(randomInt(WIDTH - 30, WIDTH), randomInt(0, HEIGHT));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, []);

  const generateCaptcha = useCallback(() => {
    const text = generateCaptchaText();
    setTimeout(() => drawCaptcha(text), 10);
    onGenerate?.(text);
  }, [drawCaptcha, onGenerate]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  return (
    <div className="flex items-center gap-2 h-full w-full">
      <div className="flex-1 h-full rounded-[14px] overflow-hidden border border-gray-200 shadow-sm bg-white">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className={`w-full h-full object-cover cursor-pointer transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
          onClick={() => !disabled && generateCaptcha()}
          title="Nhấn để tạo CAPTCHA mới"
        />
      </div>
      <button
        type="button"
        className={`flex-shrink-0 flex items-center justify-center w-[52px] h-[52px] bg-white border border-gray-200 rounded-[14px] shadow-sm text-gray-500 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#1D4ED8] hover:bg-blue-50 hover:border-blue-200'} focus:outline-none`}
        onClick={() => !disabled && generateCaptcha()}
        disabled={disabled}
        title="Tạo CAPTCHA mới"
      >
        <span className="material-symbols-outlined">refresh</span>
      </button>
    </div>
  );
}

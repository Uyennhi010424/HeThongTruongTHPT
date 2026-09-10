import { useRef, useEffect, useCallback } from "react";

const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // Loại bỏ các ký tự dễ nhầm lẫn (0, O, 1, I, L)
const CAPTCHA_LENGTH = 4;
const WIDTH = 160;
const HEIGHT = 52;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCaptchaText() {
  let result = "";
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    result += CHARS[randomInt(0, CHARS.length - 1)];
  }
  return result;
}

/**
 * Captcha component renders a clean, readable canvas CAPTCHA.
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

    // 1. Nền sáng nhẹ nhàng, chuyên nghiệp
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, "#F8FAFC");
    gradient.addColorStop(1, "#EFF6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Họa tiết lưới nhẹ nhàng tinh tế (không làm rối mắt)
    ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
    ctx.lineWidth = 1;
    for (let x = 15; x < WIDTH; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 10; y < HEIGHT; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // 3. Một vài đường lượn sóng mỏng mềm mại bảo mật
    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = i === 0 ? "rgba(59, 130, 246, 0.25)" : "rgba(99, 102, 241, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, randomInt(15, HEIGHT - 15));
      ctx.bezierCurveTo(
        WIDTH * 0.33, randomInt(5, HEIGHT - 5),
        WIDTH * 0.66, randomInt(5, HEIGHT - 5),
        WIDTH, randomInt(15, HEIGHT - 15)
      );
      ctx.stroke();
    }

    // 4. Vẽ từng ký tự rõ ràng, nét đậm, góc nghiêng nhẹ
    const colors = ["#1E3A8A", "#1D4ED8", "#0F172A", "#312E81", "#1E40AF"];
    const startX = 20;
    const charWidth = (WIDTH - 40) / CAPTCHA_LENGTH;

    for (let i = 0; i < text.length; i++) {
      const x = startX + i * charWidth + charWidth / 2;
      const y = HEIGHT / 2 + 2;

      ctx.save();
      ctx.translate(x, y);

      // Góc nghiêng vừa phải (-10 đến +10 độ) để vẫn bảo mật nhưng cực kỳ dễ đọc
      const angle = (randomInt(-10, 10) * Math.PI) / 180;
      ctx.rotate(angle);

      // Font chữ to, đậm, rõ ràng
      const fontSize = 28;
      ctx.font = `bold ${fontSize}px 'Segoe UI', -apple-system, Roboto, sans-serif`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Đổ bóng nhẹ làm nổi bật chữ
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(text[i], 0, 0);
      ctx.restore();
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
          className={`w-full h-full object-contain cursor-pointer transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
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

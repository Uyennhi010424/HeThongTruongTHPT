const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain';

function findExactTimetableStyle() {
  try {
    const convos = fs.readdirSync(brainDir);
    console.log(`Đang quét ${convos.length} hội thoại để tìm nhãn tiếng Việt đặc thù của giao diện TKB tổng hợp...`);
    const candidates = [];

    for (const convo of convos) {
      const logPath = path.join(brainDir, convo, '.system_generated', 'logs', 'transcript_full.jsonl');
      if (!fs.existsSync(logPath)) continue;

      try {
        const fileContent = fs.readFileSync(logPath, 'utf8');
        const lines = fileContent.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Tìm các nhãn đặc trưng trong bức ảnh mới:
          // "Thời khóa biểu theo lớp" hoặc "Bấm vào tên lớp để xem" hoặc "Buổi sáng" / "Buổi chiều"
          if (line.includes("Thời khóa biểu theo lớp") || line.includes("Bấm vào tên lớp để xem")) {
            try {
              const stepObj = JSON.parse(line);
              const toolCalls = stepObj.tool_calls || [];
              for (const tc of toolCalls) {
                const args = tc.args || {};
                const code = args.CodeContent || args.ReplacementContent || "";
                if (code.includes("export default function AdminThoiKhoaBieuPage") || code.includes("function AdminThoiKhoaBieuPage")) {
                  candidates.push({
                    convo,
                    step: stepObj.step_index,
                    len: code.length,
                    lines: code.split('\n').length,
                    code
                  });
                }
              }
            } catch (e) {
              // Bỏ qua
            }
          }
        }
      } catch (err) {
        // Bỏ qua
      }
    }

    console.log(`Số bản ứng viên TKB tổng hợp tìm thấy: ${candidates.length}`);
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.len - a.len);
      const best = candidates[0];
      console.log(`\n--> KHÔI PHỤC BẢN PHÙ HỢP NHẤT: Convo ${best.convo} bước ${best.step} (Số dòng: ${best.lines})`);
      const targetPath = 'd:\\C++\\LuanVanTN\\HETHONGTRUONGTHPT\\website\\src\\features\\admin\\thoikhoabieu\\AdminThoiKhoaBieuPage.jsx';
      fs.writeFileSync(targetPath, best.code, 'utf8');
      console.log("ĐÃ PHỤC HỒI THÀNH CÔNG GIAO DIỆN TKB TỔNG HỢP!");
    } else {
      console.log("Không tìm thấy bản code nào chứa nhãn tiếng Việt đặc thù trong log.");
    }
  } catch (err) {
    console.error("Lỗi:", err.message);
  }
}

findExactTimetableStyle();

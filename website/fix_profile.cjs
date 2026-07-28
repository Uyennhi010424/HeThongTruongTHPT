const fs = require('fs');
const file = 'website/src/features/student/ProfilePage.jsx';
let content = fs.readFileSync(file, 'utf8');

const returnMatch = content.match(/  return \([\s\S]*?<div className="student-page">/);
if (!returnMatch) {
  console.error("Could not find the return block!");
  process.exit(1);
}

const returnStartIndex = returnMatch.index;
const newReturnBlock = `  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 md:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Hồ sơ học sinh</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Thông tin chi tiết và tùy chỉnh tài khoản</p>
            </div>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/50">
              Lớp {student?.lop?.tenLop || "Chưa có lớp"}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold mb-6">{error}</div>}
          {!error && loading && <div className="text-center py-12 text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</div>}
          
          {!loading && !error && (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Left Column: Avatar & Basic Actions */}
              <div className="flex flex-col items-center shrink-0 lg:w-[280px]">
                <div className="relative group cursor-pointer mb-5" onClick={() => document.getElementById('avatar-upload').click()}>
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[64px] md:text-[80px] text-slate-300">person</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 m-[6px]">
                     <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 text-center mb-1">{student?.hoTen || "--"}</h3>
                <p className="text-[15px] font-medium text-slate-500 mb-8">@{student?.user?.username || "--"}</p>
                
                <div className="w-full space-y-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold rounded-xl transition-colors"
                    onClick={() => navigate('/student/profile/edit')}
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    Cập nhật hồ sơ
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-5 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold rounded-xl transition-colors"
                    onClick={() => navigate('/student/profile/change-password')}
                  >
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    Đổi mật khẩu
                  </button>
                </div>
              </div>

              {/* Right Column: Detailed Info Grid */}
              <div className="flex-1 min-w-0 bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100/50">
                <h4 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">info</span>
                  Chi tiết thông tin
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  {FIELD_DEFS.map(({ key, label }) => {
                    if (key === 'username') return null;
                    return (
                      <div key={key} className={\`flex flex-col gap-1.5 \${key === 'diaChi' || key === 'email' ? 'sm:col-span-2' : ''}\`}>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                        <div className="text-slate-800 font-semibold text-[15px]">
                          {getFieldValue(key)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

content = content.slice(0, returnStartIndex) + newReturnBlock + '\n}\n';
fs.writeFileSync(file, content);
console.log("Successfully replaced the return block!");

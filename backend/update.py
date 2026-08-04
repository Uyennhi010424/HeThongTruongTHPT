import sys

file_path = r'd:\C++\LuanVanTN\HETHONGTRUONGTHPT\backend\src\main\java\com\hethongtruongthpt\service\DashboardService.java'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import com.hethongtruongthpt.repository.ThongBaoRepository;',
    'import com.hethongtruongthpt.repository.ThongBaoRepository;\nimport com.hethongtruongthpt.repository.NamHocRepository;\nimport com.hethongtruongthpt.entity.NamHoc;'
)

content = content.replace(
    'private final DiemCalculationService diemCalculationService;',
    'private final DiemCalculationService diemCalculationService;\n    private final NamHocRepository namHocRepository;'
)

content = content.replace(
    'DiemCalculationService diemCalculationService) {',
    'DiemCalculationService diemCalculationService, NamHocRepository namHocRepository) {\n        this.namHocRepository = namHocRepository;'
)

old_logic = '''        // Get current academic year and semester
        LocalDate now = LocalDate.now();
        int curMonth = now.getMonthValue();
        String curNamHoc = curMonth >= 8
                ? now.getYear() + "-" + (now.getYear() + 1)
                : (now.getYear() - 1) + "-" + now.getYear();
        int curHocKy = (curMonth >= 8 || curMonth <= 1) ? 1 : 2;'''

new_logic = '''        // Get current academic year and semester from DB
        java.util.List<NamHoc> activeNamHocs = namHocRepository.findByTrangThai("DANG_MO");
        LocalDate now = LocalDate.now();
        int curMonth = now.getMonthValue();
        String curNamHoc = "2025-2026";
        int curHocKy = 2;
        LocalDate yearStart = LocalDate.of(now.getYear(), 9, 1);
        
        if (!activeNamHocs.isEmpty()) {
            NamHoc active = activeNamHocs.get(0);
            curNamHoc = active.getTenNamHoc();
            yearStart = active.getNgayBatDauHk1();
            if (now.isAfter(active.getNgayKetThucHk1())) {
                curHocKy = 2;
            } else {
                curHocKy = 1;
            }
        } else {
            curNamHoc = curMonth >= 8
                    ? now.getYear() + "-" + (now.getYear() + 1)
                    : (now.getYear() - 1) + "-" + now.getYear();
            curHocKy = (curMonth >= 8 || curMonth <= 1) ? 1 : 2;
            yearStart = curMonth >= 8
                    ? LocalDate.of(now.getYear(), 9, 1)
                    : LocalDate.of(now.getYear() - 1, 9, 1);
        }'''
content = content.replace(old_logic, new_logic)

old_stats = '''            LocalDate yearStart = curMonth >= 8
                    ? LocalDate.of(now.getYear(), 9, 1)
                    : LocalDate.of(now.getYear() - 1, 9, 1);
            Map<String, Object> allStats = diemDanhService.getStatistics(lopId, yearStart, now);'''
new_stats = '''            Map<String, Object> allStats = diemDanhService.getStatistics(lopId, yearStart, now);'''
content = content.replace(old_stats, new_stats)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")

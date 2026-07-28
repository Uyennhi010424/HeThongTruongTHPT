const fs = require('fs');
const path = 'backend/src/main/java/com/hethongtruongthpt/service/HocSinhService.java';
let content = fs.readFileSync(path, 'utf8');

const regex = /public HocSinh update\([\s\S]*?return getById\(saved\.getId\(\)\);\n    \}/;
const replacement = `public HocSinh update(Integer id, HocSinh hocSinh) {
        HocSinh existing = getById(id);
        Integer oldLopId = existing.getLop() != null ? existing.getLop().getId() : null;

        if (hocSinh.getLop() != null && hocSinh.getLop().getId() != null) {
            existing.setLop(resolveLop(hocSinh));
        }

        if (hocSinh.getHoTen() != null) existing.setHoTen(hocSinh.getHoTen());
        if (hocSinh.getNgaySinh() != null) existing.setNgaySinh(hocSinh.getNgaySinh());
        if (hocSinh.getGioiTinh() != null) existing.setGioiTinh(hocSinh.getGioiTinh());
        if (hocSinh.getDanToc() != null) existing.setDanToc(hocSinh.getDanToc());
        if (hocSinh.getTonGiao() != null) existing.setTonGiao(hocSinh.getTonGiao());
        if (hocSinh.getSdt() != null) existing.setSdt(hocSinh.getSdt());
        if (hocSinh.getEmail() != null) existing.setEmail(hocSinh.getEmail());
        if (hocSinh.getDiaChi() != null) existing.setDiaChi(hocSinh.getDiaChi());
        if (hocSinh.getNamNhapHoc() != null) existing.setNamNhapHoc(hocSinh.getNamNhapHoc());
        
        validateStudentRules(existing, existing.getLop());
        
        HocSinh saved = hocSinhRepository.save(existing);

        // Auto-sync sĩ số: lớp cũ và lớp mới (nếu khác nhau)
        Integer newLopId = saved.getLop() != null ? saved.getLop().getId() : null;
        if (oldLopId != null) refreshSiSo(oldLopId);
        if (newLopId != null && !newLopId.equals(oldLopId)) refreshSiSo(newLopId);

        return getById(saved.getId());
    }`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');

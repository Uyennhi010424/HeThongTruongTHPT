package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.*;
import com.hethongtruongthpt.util.SchoolWeekUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class GiaoVienDangKyService {

    private final UserRepository userRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final GiaoVienBanRepository giaoVienBanRepository;
    private final PhanCongDayRepository phanCongDayRepository;
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    private final LopHocRepository lopHocRepository;
    private final MonHocRepository monHocRepository;
    private final GiaoVienNghiRepository giaoVienNghiRepository;
    private final TkbDayThayRepository tkbDayThayRepository;
    private final ChiTietToHopRepository chiTietToHopRepository;
    private final ThoiKhoaBieuCrudService thoiKhoaBieuCrudService;
    private final NamHocRepository namHocRepository;

    public GiaoVienDangKyService(UserRepository userRepository,
                                 GiaoVienRepository giaoVienRepository,
                                 GiaoVienBanRepository giaoVienBanRepository,
                                 PhanCongDayRepository phanCongDayRepository,
                                 ThoiKhoaBieuRepository thoiKhoaBieuRepository,
                                 LopHocRepository lopHocRepository,
                                 MonHocRepository monHocRepository,
                                 GiaoVienNghiRepository giaoVienNghiRepository,
                                 TkbDayThayRepository tkbDayThayRepository,
                                 ChiTietToHopRepository chiTietToHopRepository,
                                 ThoiKhoaBieuCrudService thoiKhoaBieuCrudService,
                                 NamHocRepository namHocRepository) {
        this.userRepository = userRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.giaoVienBanRepository = giaoVienBanRepository;
        this.phanCongDayRepository = phanCongDayRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.giaoVienNghiRepository = giaoVienNghiRepository;
        this.tkbDayThayRepository = tkbDayThayRepository;
        this.chiTietToHopRepository = chiTietToHopRepository;
        this.thoiKhoaBieuCrudService = thoiKhoaBieuCrudService;
        this.namHocRepository = namHocRepository;
    }

    @Transactional(readOnly = true)
    public GiaoVien getCurrentTeacher() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().equals("anonymousUser")) {
            throw new ApiException("Chương trình yêu cầu đăng nhập");
        }
        String username = auth.getName();
        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ApiException("Không tìm thấy tài khoản: " + username));
        return giaoVienRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException("Tài khoản không liên kết với giáo viên"));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLichBan(Integer tuan) {
        GiaoVien gv = getCurrentTeacher();
        if (tuan == null) tuan = 1;
        List<GiaoVienBan> list = giaoVienBanRepository.findByGiaoVienIdAndTuan(gv.getId(), tuan);
        List<Map<String, Object>> result = new ArrayList<>();
        for (GiaoVienBan gvb : list) {
            Map<String, Object> item = new HashMap<>();
            item.put("thu", gvb.getThu());
            item.put("tiet", gvb.getTiet());
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void dangKyLichBan(Integer tuan, List<Map<String, Integer>> slots) {
        GiaoVien gv = getCurrentTeacher();
        if (tuan == null) tuan = 1;
        List<GiaoVienBan> existing = giaoVienBanRepository.findByGiaoVienIdAndTuan(gv.getId(), tuan);
        giaoVienBanRepository.deleteAll(existing);
        giaoVienBanRepository.flush();

        if (slots != null) {
            for (Map<String, Integer> slot : slots) {
                Integer thu = slot.get("thu");
                Integer tiet = slot.get("tiet");
                if (thu != null && tiet != null && thu >= 2 && thu <= 7 && tiet >= 1 && tiet <= 10) {
                    GiaoVienBan gvb = new GiaoVienBan();
                    gvb.setGiaoVien(gv);
                    gvb.setTuan(tuan);
                    gvb.setThu(thu);
                    gvb.setTiet(tiet);
                    giaoVienBanRepository.save(gvb);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<ThoiKhoaBieu> getThoiKhoaBieu(String namHoc, Integer hocKy, Integer tuan) {
        GiaoVien gv = getCurrentTeacher();
        if (tuan == null) tuan = 1;
        List<ThoiKhoaBieu> rawSlots = thoiKhoaBieuRepository.findByGiaoVienIdAndHocKyAndNamHocAndTuan(gv.getId(), hocKy, namHoc, tuan);
        List<ThoiKhoaBieu> weekSlots = rawSlots != null ? new ArrayList<>(rawSlots) : new ArrayList<>();

        // Calculate Monday & Sunday of week tuan in namHoc
        LocalDate monday = null;
        LocalDate sunday = null;
        if (namHoc != null && !namHoc.isBlank()) {
            NamHoc nh = namHocRepository.findByTenNamHoc(namHoc).orElse(null);
            if (nh != null && nh.getNgayBatDauHk1() != null) {
                LocalDate week1Monday = SchoolWeekUtils.mondayOfWeekContaining(nh.getNgayBatDauHk1());
                monday = week1Monday.plusWeeks(tuan - 1);
                sunday = monday.plusDays(6);
            }
        }

        // 1. Mark leave days for this teacher (GiaoVienNghi APPROVED)
        if (monday != null && sunday != null) {
            List<GiaoVienNghi> leaves = giaoVienNghiRepository.findByGiaoVienIdAndNgayBetween(gv.getId(), monday, sunday);
            for (GiaoVienNghi nghi : leaves) {
                if ("APPROVED".equals(nghi.getTrangThai())) {
                    int absentThu = nghi.getNgay().getDayOfWeek().getValue() + 1; // 2=Mon..7=Sat
                    for (ThoiKhoaBieu s : weekSlots) {
                        if (s.getThu() != null && s.getThu() == absentThu) {
                            String thayName = nghi.getGiaoVienThay() != null ? nghi.getGiaoVienThay().getHoTen() : "";
                            String leaveTag = "[Nghỉ dạy" + (!thayName.isEmpty() ? " - GV dạy thay: " + thayName : "") + "]";
                            if (s.getGhiChu() == null || !s.getGhiChu().contains("[Nghỉ dạy")) {
                                s.setGhiChu(leaveTag + (s.getGhiChu() != null && !s.getGhiChu().isBlank() ? " - " + s.getGhiChu() : ""));
                            }
                        }
                    }
                }
            }
        }

        // 2. Fetch substitute teaching slots (TkbDayThay where giaoVienThayId == gv.getId())
        List<TkbDayThay> subList = Collections.emptyList();
        if (monday != null && sunday != null) {
            subList = tkbDayThayRepository.findByGiaoVienThayIdAndNgayBetween(gv.getId(), monday, sunday);
        } else if (namHoc != null && !namHoc.isBlank()) {
            subList = tkbDayThayRepository.findByGiaoVienThayIdAndNamHoc(gv.getId(), namHoc);
        }

        Set<String> seenSlots = new HashSet<>();
        for (ThoiKhoaBieu s : weekSlots) {
            seenSlots.add(s.getThu() + "-" + s.getTietBatDau() + "-" + (s.getLop() != null ? s.getLop().getId() : 0));
        }

        for (TkbDayThay dt : subList) {
            ThoiKhoaBieu orig = dt.getThoiKhoaBieu();
            if (orig == null) continue;
            
            // Only include substitute slot if it matches the requested academic year, semester and week
            if (namHoc != null && orig.getNamHoc() != null && !namHoc.equals(orig.getNamHoc())) continue;
            if (hocKy != null && orig.getHocKy() != null && !hocKy.equals(orig.getHocKy())) continue;
            if (orig.getTuan() != null && !orig.getTuan().equals(tuan)) continue;
            
            int thu = dt.getNgay() != null ? (dt.getNgay().getDayOfWeek().getValue() + 1) : (orig.getThu() != null ? orig.getThu() : 2);
            String slotKey = thu + "-" + orig.getTietBatDau() + "-" + (orig.getLop() != null ? orig.getLop().getId() : 0);
            if (seenSlots.contains(slotKey)) continue;
            seenSlots.add(slotKey);

            ThoiKhoaBieu subSlot = new ThoiKhoaBieu();
            subSlot.setId(orig.getId());
            subSlot.setLop(orig.getLop());
            subSlot.setMonHoc(orig.getMonHoc());
            subSlot.setGiaoVien(gv);
            subSlot.setThu(thu);
            subSlot.setTietBatDau(orig.getTietBatDau());
            subSlot.setSoTiet(orig.getSoTiet());
            subSlot.setNamHoc(orig.getNamHoc() != null ? orig.getNamHoc() : namHoc);
            subSlot.setHocKy(orig.getHocKy() != null ? orig.getHocKy() : hocKy);
            subSlot.setTuan(tuan);
            subSlot.setPhongHoc(orig.getPhongHoc());
            subSlot.setIsLocked(true);
            
            String origGvName = orig.getGiaoVien() != null ? orig.getGiaoVien().getHoTen() : "đồng nghiệp";
            String note = "Dạy thay GV: " + origGvName;
            subSlot.setGhiChu(note);
            
            weekSlots.add(subSlot);
        }

        return weekSlots;
    }

    @Transactional(readOnly = true)
    public boolean isExamWeek(String namHoc, Integer tuan) {
        return thoiKhoaBieuCrudService.isExamWeek(namHoc, tuan);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyClasses(String namHoc, Integer hocKy) {
        GiaoVien gv = getCurrentTeacher();
        List<PhanCongDay> list = phanCongDayRepository.findByNamHocAndHocKy(namHoc, hocKy);
        List<Map<String, Object>> result = new ArrayList<>();
        for (PhanCongDay pc : list) {
            if (pc.getGiaoVien() != null && pc.getGiaoVien().getId().equals(gv.getId())) {
                if (pc.getLop() == null || pc.getMonHoc() == null) continue;
                Map<String, Object> item = new HashMap<>();
                item.put("lopId", pc.getLop().getId());
                item.put("tenLop", pc.getLop().getTenLop());
                item.put("monHocId", pc.getMonHoc().getId());
                item.put("tenMon", pc.getMonHoc().getTenMon());
                item.put("phanCongId", pc.getId());
                result.add(item);
            }
        }
        return result;
    }

    @Transactional
    public ThoiKhoaBieu dangKyLichDay(Map<String, Object> body) {
        GiaoVien gv = getCurrentTeacher();
        
        Integer lopId = (Integer) body.get("lopId");
        Integer monHocId = (Integer) body.get("monHocId");
        Integer thu = (Integer) body.get("thu");
        Integer tietBatDau = (Integer) body.get("tietBatDau");
        Integer soTiet = (Integer) body.get("soTiet");
        if (soTiet == null) soTiet = 1;
        String namHoc = (String) body.get("namHoc");
        Integer hocKy = (Integer) body.get("hocKy");
        Integer tuan = (Integer) body.get("tuan");
        if (tuan == null) tuan = 1;
        
        if (lopId == null || monHocId == null || thu == null || tietBatDau == null || namHoc == null || hocKy == null) {
            throw new ApiException("Thi\u1ebft th\u00f4ng tin \u0111\u0103ng k\u00fd");
        }
        
        List<PhanCongDay> pcs = phanCongDayRepository.findByNamHocAndHocKy(namHoc, hocKy);
        boolean found = false;
        for (PhanCongDay pc : pcs) {
            if (pc.getLop().getId().equals(lopId) &&
                pc.getMonHoc().getId().equals(monHocId) &&
                pc.getGiaoVien() != null && pc.getGiaoVien().getId().equals(gv.getId())) {
                found = true;
                break;
            }
        }
        if (!found) {
            throw new ApiException("B\u1ea1n kh\u00f4ng \u0111\u01b0\u1ee3c ph\u00e2n c\u00f4ng d\u1ea1y m\u00f4n n\u00e0y \u1edf l\u1edbp n\u00e0y.");
        }
        
        Integer mappedTuan = (tuan % 2 == 0) ? 2 : 1;
        
        for (int i = 0; i < soTiet; i++) {
            int currentTiet = tietBatDau + i;
            if (currentTiet > 10) {
                throw new ApiException("V\u01b0\u1ee3t qu\u00e1 10 ti\u1ebft trong ng\u00e0y.");
            }
            
            List<GiaoVienBan> busyList = giaoVienBanRepository.findByGiaoVienIdAndTuan(gv.getId(), tuan);
            for (GiaoVienBan b : busyList) {
                if (b.getThu().equals(thu) && b.getTiet().equals(currentTiet)) {
                    throw new ApiException("Ti\u1ebft \u0111\u0103ng k\u00fd tr\u00f9ng v\u1edbi l\u1ecbch b\u00e1o b\u1eadn c\u1ee7a b\u1ea1n.");
                }
            }
            
            // Check overlap with system slots in cycle mappedTuan (unlocked)
            List<ThoiKhoaBieu> systemTkb = thoiKhoaBieuRepository.findByNamHocAndHocKyAndTuan(namHoc, hocKy, mappedTuan);
            if (systemTkb != null) {
                for (ThoiKhoaBieu tkb : systemTkb) {
                    if (tkb.getIsLocked() != null && tkb.getIsLocked()) continue;
                    int tkbStart = tkb.getTietBatDau();
                    int tkbCnt = tkb.getSoTiet() != null ? tkb.getSoTiet() : 1;
                    if (tkb.getThu().equals(thu) && currentTiet >= tkbStart && currentTiet < tkbStart + tkbCnt) {
                        if (tkb.getLop().getId().equals(lopId)) {
                            throw new ApiException("L\u1edbp h\u1ecdc \u0111\u00e3 b\u1ecb tr\u00f9ng l\u1ecbch v\u1edbi m\u00f4n " + tkb.getMonHoc().getTenMon());
                        }
                        if (tkb.getGiaoVien() != null && tkb.getGiaoVien().getId().equals(gv.getId())) {
                            throw new ApiException("B\u1ea1n \u0111\u00e3 tr\u00f9ng l\u1ecbch d\u1ea1y l\u1edbp " + tkb.getLop().getTenLop() + " m\u00f4n " + tkb.getMonHoc().getTenMon());
                        }
                    }
                }
            }
            
            // Check overlap with teacher slots on this specific week (locked)
            List<ThoiKhoaBieu> teacherTkb = thoiKhoaBieuRepository.findByNamHocAndHocKyAndTuan(namHoc, hocKy, tuan);
            if (teacherTkb != null) {
                for (ThoiKhoaBieu tkb : teacherTkb) {
                    if (tkb.getIsLocked() == null || !tkb.getIsLocked()) continue;
                    int tkbStart = tkb.getTietBatDau();
                    int tkbCnt = tkb.getSoTiet() != null ? tkb.getSoTiet() : 1;
                    if (tkb.getThu().equals(thu) && currentTiet >= tkbStart && currentTiet < tkbStart + tkbCnt) {
                        if (tkb.getLop().getId().equals(lopId)) {
                            throw new ApiException("L\u1edbp h\u1ecdc \u0111\u00e3 b\u1ecb tr\u00f9ng l\u1ecbch v\u1edbi m\u00f4n " + tkb.getMonHoc().getTenMon());
                        }
                        if (tkb.getGiaoVien() != null && tkb.getGiaoVien().getId().equals(gv.getId())) {
                            throw new ApiException("B\u1ea1n \u0111\u00e3 tr\u00f9ng l\u1ecbch d\u1ea1y l\u1edbp " + tkb.getLop().getTenLop() + " m\u00f4n " + tkb.getMonHoc().getTenMon());
                        }
                    }
                }
            }
        }
        
        LopHoc lop = lopHocRepository.findById(lopId).orElseThrow(() -> new ApiException("Kh\u00f4ng t\u00ecm th\u1ea5y l\u1edbp."));
        MonHoc mon = monHocRepository.findById(monHocId).orElseThrow(() -> new ApiException("Kh\u00f4ng t\u00ecm th\u1ea5y m\u00f4n h\u1ecdc."));

        // Constraint check on registered periods
        int allocatedPeriods = getPeriodCount(mon.getTenMon(), lop);
        
        // Sum system slots (unlocked) in mappedTuan
        List<ThoiKhoaBieu> classSystemTkb = thoiKhoaBieuRepository.findByLopIdAndHocKyAndNamHocAndTuan(lopId, hocKy, namHoc, mappedTuan);
        int currentRegisteredPeriods = 0;
        if (classSystemTkb != null) {
            for (ThoiKhoaBieu t : classSystemTkb) {
                if (t.getIsLocked() != null && t.getIsLocked()) continue;
                if (t.getMonHoc().getId().equals(monHocId)) {
                    currentRegisteredPeriods += (t.getSoTiet() != null ? t.getSoTiet() : 1);
                }
            }
        }
        
        // Sum teacher slots (locked) in this specific week
        List<ThoiKhoaBieu> classTeacherTkb = thoiKhoaBieuRepository.findByLopIdAndHocKyAndNamHocAndTuan(lopId, hocKy, namHoc, tuan);
        if (classTeacherTkb != null) {
            for (ThoiKhoaBieu t : classTeacherTkb) {
                if (t.getIsLocked() == null || !t.getIsLocked()) continue;
                if (t.getMonHoc().getId().equals(monHocId)) {
                    currentRegisteredPeriods += (t.getSoTiet() != null ? t.getSoTiet() : 1);
                }
            }
        }
        
        if (currentRegisteredPeriods + soTiet > allocatedPeriods) {
            throw new ApiException("L\u1edbp " + lop.getTenLop() + " ch\u1ec9 \u0111\u01b0\u1ee3c \u0111\u0103ng k\u00fd t\u1ed1i \u0111a " + allocatedPeriods + " ti\u1ebft m\u00f4n " + mon.getTenMon() + " m\u1ed7i tu\u1ea7n. Hi\u1ec7n t\u1ea1i \u0111\u00e3 c\u00f3 " + currentRegisteredPeriods + " ti\u1ebft.");
        }
        
        ThoiKhoaBieu tkb = new ThoiKhoaBieu();
        tkb.setLop(lop);
        tkb.setMonHoc(mon);
        tkb.setGiaoVien(gv);
        tkb.setThu(thu);
        tkb.setTietBatDau(tietBatDau);
        tkb.setSoTiet(soTiet);
        tkb.setNamHoc(namHoc);
        tkb.setHocKy(hocKy);
        tkb.setTuan(tuan);
        tkb.setIsLocked(true);
        
        if (lop.getPhongHoc() != null) {
            tkb.setPhongHoc(lop.getPhongHoc());
        }
        
        return thoiKhoaBieuRepository.save(tkb);
    }

    @Transactional
    public void deleteLichDay(Integer id) {
        GiaoVien gv = getCurrentTeacher();
        ThoiKhoaBieu tkb = thoiKhoaBieuRepository.findById(id)
                .orElseThrow(() -> new ApiException("Kh\u00f4ng t\u00ecm th\u1ea5y m\u1ee5c th\u1edd\u0069 kh\u00f3a bi\u1ec3u ID: " + id));
        if (tkb.getGiaoVien() == null || !tkb.getGiaoVien().getId().equals(gv.getId())) {
            throw new ApiException("B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n xo\u00e1 m\u1ee5c th\u1edd\u0069 kh\u00f3a bi\u1ec3u n\u00e0y.");
        }
        if (tkb.getIsLocked() == null || !tkb.getIsLocked()) {
            throw new ApiException("Kh\u00f4ng th\u1ec3 xo\u00e1 ti\u1ebft h\u1ecdc do h\u1ec7 th\u1ed1ng t\u1ef1 \u0111\u1ed9ng s\u1eafp x\u1ebfp.");
        }
        thoiKhoaBieuRepository.delete(tkb);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTkbDayThayTrong(LocalDate ngay, String namHoc, Integer hocKy, Integer tuan) {
        int thu = ngay.getDayOfWeek().getValue() + 1;
        if (thu > 7) return Collections.emptyList();
        
        List<GiaoVienNghi> rawNghiList = (namHoc != null && !namHoc.isBlank())
                ? giaoVienNghiRepository.findByNgayAndNamHoc(ngay, namHoc)
                : giaoVienNghiRepository.findByNgay(ngay);
        List<GiaoVienNghi> nghiList = rawNghiList.stream()
                .filter(n -> "APPROVED".equals(n.getTrangThai()))
                .collect(Collectors.toList());
        if (nghiList.isEmpty()) return Collections.emptyList();
        Set<Integer> absentGvIds = nghiList.stream().map(n -> n.getGiaoVien().getId()).collect(Collectors.toSet());
        
        Integer mappedTuan = (tuan != null && tuan % 2 == 0) ? 2 : 1;
        List<ThoiKhoaBieu> allTkb = thoiKhoaBieuRepository.findByNamHocAndHocKyAndTuan(namHoc, hocKy, mappedTuan);
        if (allTkb == null) return Collections.emptyList();
        
        List<TkbDayThay> dayThayList = (namHoc != null && !namHoc.isBlank())
                ? tkbDayThayRepository.findByNgayAndNamHoc(ngay, namHoc)
                : tkbDayThayRepository.findByNgay(ngay);
        Set<Integer> occupiedTkbIds = dayThayList.stream().map(d -> d.getThoiKhoaBieu().getId()).collect(Collectors.toSet());
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (ThoiKhoaBieu t : allTkb) {
            if (t.getGiaoVien() != null && absentGvIds.contains(t.getGiaoVien().getId()) && t.getThu() == thu) {
                if (!occupiedTkbIds.contains(t.getId())) {
                    if (t.getLop() == null || t.getMonHoc() == null) continue;
                    Map<String, Object> item = new HashMap<>();
                    item.put("tkbId", t.getId());
                    item.put("lopTen", t.getLop().getTenLop());
                    item.put("monTen", t.getMonHoc().getTenMon());
                    item.put("giaoVienNghiHoTen", t.getGiaoVien().getHoTen());
                    item.put("thu", t.getThu());
                    item.put("tietBatDau", t.getTietBatDau());
                    item.put("soTiet", t.getSoTiet());
                    result.add(item);
                }
            }
        }
        return result;
    }

    @Transactional
    public TkbDayThay dangKyDayThay(Integer tkbId, LocalDate ngay) {
        GiaoVien gv = getCurrentTeacher();
        ThoiKhoaBieu tkb = thoiKhoaBieuRepository.findById(tkbId)
                .orElseThrow(() -> new ApiException("Kh\u00f4ng t\u00ecm th\u1ea5y m\u1ee5c th\u1edd\u0069 kh\u00f3a bi\u1ec3u ID: " + tkbId));
                 
        List<TkbDayThay> existing = tkbDayThayRepository.findByThoiKhoaBieuId(tkbId);
        for (TkbDayThay d : existing) {
            if (d.getNgay().equals(ngay)) {
                throw new ApiException("Ti\u1ebft h\u1ecdc n\u00e0y \u0111\u00e3 \u0111\u01b0\u1ee3c nh\u1eadn d\u1ea1y thay b\u1edf\u0069 gi\u00e1o vi\u00ean kh\u00e1c.");
            }
        }
        
        int thu = tkb.getThu();
        int start = tkb.getTietBatDau();
        int cnt = tkb.getSoTiet() != null ? tkb.getSoTiet() : 1;
        
        Integer mappedTuan = (tkb.getTuan() != null && tkb.getTuan() % 2 == 0) ? 2 : 1;
        List<GiaoVienBan> busyList = giaoVienBanRepository.findByGiaoVienIdAndTuan(gv.getId(), mappedTuan);
        for (int i = 0; i < cnt; i++) {
            int currentTiet = start + i;
            for (GiaoVienBan b : busyList) {
                if (b.getThu().equals(thu) && b.getTiet().equals(currentTiet)) {
                    throw new ApiException("Ti\u1ebft d\u1ea1y thay tr\u00f9ng v\u1edbi l\u1ecbch b\u00e1o b\u1eadn c\u1ee7a b\u1ea1n.");
                }
            }
            
            List<ThoiKhoaBieu> myTkb = thoiKhoaBieuRepository.findByNamHocAndHocKyAndTuan(tkb.getNamHoc(), tkb.getHocKy(), mappedTuan);
            if (myTkb != null) {
                for (ThoiKhoaBieu t : myTkb) {
                    if (t.getGiaoVien() != null && t.getGiaoVien().getId().equals(gv.getId()) && t.getThu() == thu) {
                        int tStart = t.getTietBatDau();
                        int tCnt = t.getSoTiet() != null ? t.getSoTiet() : 1;
                        if (currentTiet >= tStart && currentTiet < tStart + tCnt) {
                            throw new ApiException("B\u1ea1n \u0111\u00e3 c\u00f3 l\u1ecbch d\u1ea1y l\u1edbp " + t.getLop().getTenLop() + " v\u00e0o ti\u1ebft n\u00e0y.");
                        }
                    }
                }
            }
            
            List<TkbDayThay> myOtherDayThay = tkbDayThayRepository.findByGiaoVienThayIdAndNgay(gv.getId(), ngay);
            for (TkbDayThay dt : myOtherDayThay) {
                ThoiKhoaBieu otherT = dt.getThoiKhoaBieu();
                int dtStart = otherT.getTietBatDau();
                int dtCnt = otherT.getSoTiet() != null ? otherT.getSoTiet() : 1;
                if (currentTiet >= dtStart && currentTiet < dtStart + dtCnt) {
                    throw new ApiException("B\u1ea1n \u0111\u00e3 \u0111\u0103ng k\u00fd m\u1ed9t ca d\u1ea1y thay kh\u00e1c v\u00e0o ti\u1ebft n\u00e0y ng\u00e0y " + ngay);
                }
            }
        }
        
        TkbDayThay dayThay = new TkbDayThay();
        dayThay.setThoiKhoaBieu(tkb);
        dayThay.setGiaoVienThay(gv);
        dayThay.setNgay(ngay);
        dayThay.setGhiChu("Gi\u00e1o vi\u00ean t\u1ef1 \u0111\u0103ng k\u00fd d\u1ea1y thay");
        
        return tkbDayThayRepository.save(dayThay);
    }

    @Transactional
    public void huyDangKyDayThay(Integer dayThayId) {
        GiaoVien gv = getCurrentTeacher();
        TkbDayThay dt = tkbDayThayRepository.findById(dayThayId)
                .orElseThrow(() -> new ApiException("Kh\u00f4ng t\u00ecm th\u1ea5y ca d\u1ea1y thay ID: " + dayThayId));
        if (dt.getGiaoVienThay() == null || !dt.getGiaoVienThay().getId().equals(gv.getId())) {
            throw new ApiException("B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n h\u1ee7y ca d\u1ea1y thay n\u00e0y.");
        }
        tkbDayThayRepository.delete(dt);
    }

    @Transactional(readOnly = true)
    public List<TkbDayThay> getLichDayThayCuaToi(LocalDate ngay, String namHoc) {
        GiaoVien gv = getCurrentTeacher();
        if (ngay != null) {
            if (namHoc != null && !namHoc.isBlank()) {
                return tkbDayThayRepository.findByGiaoVienThayIdAndNgay(gv.getId(), ngay).stream()
                        .filter(dt -> dt.getThoiKhoaBieu() != null && namHoc.equals(dt.getThoiKhoaBieu().getNamHoc()))
                        .collect(Collectors.toList());
            }
            return tkbDayThayRepository.findByGiaoVienThayIdAndNgay(gv.getId(), ngay);
        }
        if (namHoc != null && !namHoc.isBlank()) {
            return tkbDayThayRepository.findByGiaoVienThayIdAndNamHoc(gv.getId(), namHoc);
        }
        return tkbDayThayRepository.findAll().stream()
                .filter(dt -> dt.getGiaoVienThay() != null && dt.getGiaoVienThay().getId().equals(gv.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ThoiKhoaBieu doiLichDay(Integer sourceId, Integer targetThu, Integer targetTiet, Integer targetId) {
        GiaoVien gv = getCurrentTeacher();
        ThoiKhoaBieu source = thoiKhoaBieuRepository.findById(sourceId)
                .orElseThrow(() -> new ApiException("Kh\u00f4ng t\u00ecm th\u1ea5y ti\u1ebft h\u1ecdc g\u1ed1c ID: " + sourceId));
                 
        if (source.getGiaoVien() == null || !source.getGiaoVien().getId().equals(gv.getId())) {
            throw new ApiException("B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n ch\u1ec9nh s\u1eeda ti\u1ebft h\u1ecdc n\u00e0y.");
        }
        
        if (targetId != null) {
            ThoiKhoaBieu target = thoiKhoaBieuRepository.findById(targetId)
                    .orElseThrow(() -> new ApiException("Kh\u00f4ng t\u00ecm th\u1ea5y ti\u1ebft h\u1ecdc \u0111\u1ed5i ID: " + targetId));
                     
            if (target.getGiaoVien() == null || !target.getGiaoVien().getId().equals(gv.getId())) {
                throw new ApiException("B\u1ea1n ch\u1ec9 c\u00f3 th\u1ec3 ho\u00e1n \u0111\u1ed5i c\u00e1c ti\u1ebft d\u1ea1y c\u1ee7a ch\u00ednh b\u1ea1n.");
            }
            
            int thu1 = source.getThu(), tiet1 = source.getTietBatDau();
            int thu2 = target.getThu(), tiet2 = target.getTietBatDau();
            
            source.setThu(thu2); source.setTietBatDau(tiet2); source.setIsLocked(true);
            target.setThu(thu1); target.setTietBatDau(tiet1); target.setIsLocked(true);
            
            thoiKhoaBieuRepository.save(target);
            return thoiKhoaBieuRepository.save(source);
        } else {
            if (targetThu == null || targetTiet == null) {
                throw new ApiException("Thi\u1ebft th\u00f4ng tin v\u1ecb tr\u00ed \u0111\u1ed5i l\u1ecbch");
            }
            
            int cnt = source.getSoTiet() != null ? source.getSoTiet() : 1;
            
            for (int i = 0; i < cnt; i++) {
                int currentTiet = targetTiet + i;
                if (currentTiet > 10) {
                    throw new ApiException("V\u01b0\u1ee3t qu\u00e1 10 ti\u1ebft trong ng\u00e0y.");
                }
                
                List<GiaoVienBan> busyList = giaoVienBanRepository.findByGiaoVienIdAndTuan(gv.getId(), source.getTuan());
                for (GiaoVienBan b : busyList) {
                    if (b.getThu().equals(targetThu) && b.getTiet().equals(currentTiet)) {
                        throw new ApiException("Ti\u1ebft h\u1ecdc tr\u00f9ng v\u1edbi l\u1ecbch b\u00e1o b\u1eadn c\u1ee7a b\u1ea1n.");
                    }
                }
                
                Integer mappedTuan = (source.getTuan() != null && source.getTuan() % 2 == 0) ? 2 : 1;
                
                // Check system slots in cycle mappedTuan (unlocked)
                List<ThoiKhoaBieu> systemTkb = thoiKhoaBieuRepository.findByNamHocAndHocKyAndTuan(source.getNamHoc(), source.getHocKy(), mappedTuan);
                if (systemTkb != null) {
                    for (ThoiKhoaBieu tkb : systemTkb) {
                        if (tkb.getIsLocked() != null && tkb.getIsLocked()) continue;
                        if (tkb.getId().equals(sourceId)) continue;
                        int tkbStart = tkb.getTietBatDau();
                        int tkbCnt = tkb.getSoTiet() != null ? tkb.getSoTiet() : 1;
                        if (tkb.getThu().equals(targetThu) && currentTiet >= tkbStart && currentTiet < tkbStart + tkbCnt) {
                            if (tkb.getLop().getId().equals(source.getLop().getId())) {
                                throw new ApiException("L\u1edbp h\u1ecdc \u0111\u00e3 b\u1ecb tr\u00f9ng l\u1ecbch v\u1edbi m\u00f4n " + tkb.getMonHoc().getTenMon());
                            }
                            if (tkb.getGiaoVien() != null && tkb.getGiaoVien().getId().equals(gv.getId())) {
                                throw new ApiException("B\u1ea1n \u0111\u00e3 c\u00f3 l\u1ecbch d\u1ea1y l\u1edbp kh\u00e1c v\u00e0o th\u1edd\u0069 gian n\u00e0y.");
                            }
                        }
                    }
                }
                
                // Check teacher slots on this specific week (locked)
                List<ThoiKhoaBieu> teacherTkb = thoiKhoaBieuRepository.findByNamHocAndHocKyAndTuan(source.getNamHoc(), source.getHocKy(), source.getTuan());
                if (teacherTkb != null) {
                    for (ThoiKhoaBieu tkb : teacherTkb) {
                        if (tkb.getIsLocked() == null || !tkb.getIsLocked()) continue;
                        if (tkb.getId().equals(sourceId)) continue;
                        int tkbStart = tkb.getTietBatDau();
                        int tkbCnt = tkb.getSoTiet() != null ? tkb.getSoTiet() : 1;
                        if (tkb.getThu().equals(targetThu) && currentTiet >= tkbStart && currentTiet < tkbStart + tkbCnt) {
                            if (tkb.getLop().getId().equals(source.getLop().getId())) {
                                throw new ApiException("L\u1edbp h\u1ecdc \u0111\u00e3 b\u1ecb tr\u00f9ng l\u1ecbch v\u1edbi m\u00f4n " + tkb.getMonHoc().getTenMon());
                            }
                            if (tkb.getGiaoVien() != null && tkb.getGiaoVien().getId().equals(gv.getId())) {
                                throw new ApiException("B\u1ea1n \u0111\u00e3 c\u00f3 l\u1ecbch d\u1ea1y l\u1edbp kh\u00e1c v\u00e0o th\u1edd\u0069 gian n\u00e0y.");
                            }
                        }
                    }
                }
            }
            
            source.setThu(targetThu);
            source.setTietBatDau(targetTiet);
            source.setIsLocked(true);
            return thoiKhoaBieuRepository.save(source);
        }
    }

    @Transactional
    public ThoiKhoaBieu updateGhiChu(Integer id, String ghiChu) {
        GiaoVien gv = getCurrentTeacher();
        ThoiKhoaBieu tkb = thoiKhoaBieuRepository.findById(id)
                .orElseThrow(() -> new ApiException("Kh\\u00f4ng t\\u00ecm th\\u1ea5y ti\\u1ebft h\\u1ecdc ID: " + id));
        if (tkb.getGiaoVien() == null || !tkb.getGiaoVien().getId().equals(gv.getId())) {
            throw new ApiException("B\\u1ea1n kh\\u00f4ng c\\u00f3 quy\\u1ec1n ch\\u1ec9nh s\\u1eeda ghi ch\\u00fa c\\u1ee7a ti\\u1ebft h\\u1ecdc n\\u00e0y.");
        }
        tkb.setGhiChu(ghiChu);
        return thoiKhoaBieuRepository.save(tkb);
    }

    private int getPeriodCount(String tenMon, LopHoc lop) {
        if (lop != null && lop.getToHopId() != null) {
            String norm = normalizeVietnamese(tenMon);
            try {
                List<ChiTietToHop> chiTiets = chiTietToHopRepository.findByToHopMonId(lop.getToHopId());
                for (ChiTietToHop ct : chiTiets) {
                    if (ct.getMonHoc() != null && normalizeVietnamese(ct.getMonHoc().getTenMon()).equals(norm)) {
                        return ct.getSoTiet() != null ? ct.getSoTiet() : 2;
                    }
                }
            } catch (Exception ex) {
                // Fall back
            }
        }

        String normalized = normalizeVietnamese(tenMon);
        boolean isGrade12 = lop != null && lop.getTenLop() != null && lop.getTenLop().startsWith("12");

        if (isGrade12) {
            if (normalized.contains("toan")) return 6;
            if (normalized.contains("ngu van")) return 6;
            if (normalized.contains("tieng anh")) return 4;
        } else {
            if (normalized.contains("toan")) return 5;
            if (normalized.contains("ngu van")) return 5;
            if (normalized.contains("tieng anh")) return 4;
        }
        
        if (normalized.contains("vat li") || normalized.contains("vat ly")
            || normalized.contains("hoa hoc") || normalized.contains("sinh hoc")
            || normalized.contains("lich su") || normalized.contains("dia li") || normalized.contains("dia ly")
            || normalized.contains("gdkt") || normalized.contains("giao duc kinh te") || normalized.contains("kinh te")
            || normalized.contains("tin hoc") || normalized.contains("tin")
            || normalized.contains("cong nghe")) {
            return 2;
        }
        
        if (normalized.contains("the duc") || normalized.contains("giao duc the chat") || normalized.contains("gdtc")) return 2;
        
        return 2;
    }

    private String normalizeVietnamese(String str) {
        if (str == null) return "";
        String normalized = java.text.Normalizer.normalize(str.toLowerCase(), java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "")
                .replace("ÃÂ", "d")
                .replace("ÃÂ", "d")
                .trim();
    }
}

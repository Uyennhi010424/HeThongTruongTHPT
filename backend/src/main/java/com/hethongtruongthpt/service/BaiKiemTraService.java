package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.baikiemtra.*;
import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BaiKiemTraService {
    private final BaiKiemTraRepository baiKiemTraRepository;
    private final CauHoiRepository cauHoiRepository;
    private final DapAnRepository dapAnRepository;
    private final BaiLamRepository baiLamRepository;
    private final ChiTietBaiLamRepository chiTietBaiLamRepository;
    private final LopHocRepository lopHocRepository;
    private final MonHocRepository monHocRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final HocSinhRepository hocSinhRepository;
    private final PhanCongDayRepository phanCongDayRepository;
    private final NotificationService notificationService;

    public BaiKiemTraService(BaiKiemTraRepository baiKiemTraRepository, CauHoiRepository cauHoiRepository, DapAnRepository dapAnRepository, BaiLamRepository baiLamRepository, ChiTietBaiLamRepository chiTietBaiLamRepository, LopHocRepository lopHocRepository, MonHocRepository monHocRepository, GiaoVienRepository giaoVienRepository, HocSinhRepository hocSinhRepository, PhanCongDayRepository phanCongDayRepository, NotificationService notificationService) {
        this.baiKiemTraRepository = baiKiemTraRepository;
        this.cauHoiRepository = cauHoiRepository;
        this.dapAnRepository = dapAnRepository;
        this.baiLamRepository = baiLamRepository;
        this.chiTietBaiLamRepository = chiTietBaiLamRepository;
        this.lopHocRepository = lopHocRepository;
        this.monHocRepository = monHocRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.phanCongDayRepository = phanCongDayRepository;
        this.notificationService = notificationService;
    }
    
    // --- API for Teacher: Manage Exams ---
    
    @Transactional(readOnly = true)
    public List<BaiKiemTraDTO> getExamsByUsername(String username) {
        GiaoVien gv = giaoVienRepository.findByUserUsername(username).orElse(null);
        if (gv == null) {
            return getExamsByTeacher(1);
        }
        return getExamsByTeacher(gv.getId());
    }

    @Transactional(readOnly = true)
    public List<BaiKiemTraDTO> getExamsByTeacher(Integer giaoVienId) {
        return baiKiemTraRepository.findByGiaoVienIdOrderByNgayTaoDesc(giaoVienId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeacherMetadataDTO getTeacherMetadataByUsername(String username) {
        GiaoVien gv = giaoVienRepository.findByUserUsername(username).orElse(null);
        if (gv == null) {
            return getTeacherMetadata(1); // fallback to 1 if something goes wrong
        }
        return getTeacherMetadata(gv.getId());
    }

    // --- API for Student: Fetch Exams ---
    @Transactional(readOnly = true)
    public List<BaiKiemTraDTO> getExamsForStudent(String username) {
        HocSinh hs = hocSinhRepository.findByUserUsername(username).orElseThrow(() -> new ResourceNotFoundException("Học sinh không tồn tại"));
        if (hs.getLop() == null) {
            return new ArrayList<>();
        }
        return baiKiemTraRepository.findByLopHocIdOrderByNgayTaoDesc(hs.getLop().getId()).stream()
                .map(exam -> {
                    BaiKiemTraDTO dto = mapToDTO(exam);
                    List<BaiLam> existings = baiLamRepository.findByBaiKiemTraIdAndHocSinhId(exam.getId(), hs.getId());
                    
                    BaiLam inProgress = existings.stream().filter(b -> "DANG_LAM".equals(b.getTrangThai())).findFirst().orElse(null);
                    long completedAttempts = existings.stream().filter(b -> "DA_NOP".equals(b.getTrangThai()) || "VI_PHAM_QUY_CHE".equals(b.getTrangThai())).count();
                    int maxAttempts = exam.getSoLanLamBai() != null ? exam.getSoLanLamBai() : 1;
                    
                    if (inProgress != null) {
                        dto.setTrangThaiLamBai("DANG_LAM");
                    } else if (completedAttempts >= maxAttempts) {
                        dto.setTrangThaiLamBai("HET_LAN_LAM_BAI");
                        // Get highest score from submitted attempts
                        existings.stream().filter(b -> "DA_NOP".equals(b.getTrangThai())).map(BaiLam::getDiemTracNghiem).max(Double::compareTo).ifPresent(dto::setDiemDatDuoc);
                    } else if (completedAttempts > 0) {
                        dto.setTrangThaiLamBai("CHUA_HET_LAN_LAM_BAI");
                    } else {
                        dto.setTrangThaiLamBai("CHUA_LAM");
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BaiLamDTO getExamResultForStudent(Integer examId, String username) {
        HocSinh hs = hocSinhRepository.findByUserUsername(username).orElseThrow(() -> new ResourceNotFoundException("Học sinh không tồn tại"));
        List<BaiLam> existings = baiLamRepository.findByBaiKiemTraIdAndHocSinhId(examId, hs.getId());
        
        // Find the attempt with the highest score that is already submitted
        BaiLam bestAttempt = existings.stream()
                .filter(b -> "DA_NOP".equals(b.getTrangThai()))
                .max(Comparator.comparing(b -> (b.getDiemTracNghiem() != null ? b.getDiemTracNghiem() : 0.0) + (b.getDiemTuLuan() != null ? b.getDiemTuLuan() : 0.0)))
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có kết quả nộp bài cho bài kiểm tra này"));
                
        return buildAttemptDetailDTO(bestAttempt);
    }

    private BaiLamDTO buildAttemptDetailDTO(BaiLam attempt) {
        BaiLamDTO dto = mapBaiLamToDTO(attempt);
        
        // Load detailed answers
        List<ChiTietBaiLam> chiTiets = chiTietBaiLamRepository.findByBaiLamId(attempt.getId());
        List<ChiTietBaiLamDTO> chiTietDTOs = new ArrayList<>();
        for (ChiTietBaiLam ct : chiTiets) {
            ChiTietBaiLamDTO ctDTO = new ChiTietBaiLamDTO();
            ctDTO.setId(ct.getId());
            ctDTO.setBaiLamId(ct.getBaiLam().getId());
            if (ct.getCauHoi() != null) {
                ctDTO.setCauHoiId(ct.getCauHoi().getId());
                ctDTO.setNoiDungCauHoi(ct.getCauHoi().getNoiDung());
                ctDTO.setLoaiCauHoi(ct.getCauHoi().getLoaiCauHoi());
                ctDTO.setDiemToiDa(ct.getCauHoi().getDiem());
                
                if ("TRAC_NGHIEM".equals(ct.getCauHoi().getLoaiCauHoi())) {
                    List<DapAn> dapAns = dapAnRepository.findByCauHoiId(ct.getCauHoi().getId());
                    if (dapAns != null) {
                        for (DapAn da : dapAns) {
                            if (Boolean.TRUE.equals(da.getLaDapAnDung())) {
                                ctDTO.setDapAnDung(da.getNoiDung());
                                break;
                            }
                        }
                    }
                }
            }
            if (ct.getDapAn() != null) {
                ctDTO.setDapAnId(ct.getDapAn().getId());
                ctDTO.setDapAnDaChon(ct.getDapAn().getNoiDung());
            }
            ctDTO.setCauTraLoiTuLuan(ct.getCauTraLoiTuLuan());
            ctDTO.setDiemDatDuoc(ct.getDiemDatDuoc());
            chiTietDTOs.add(ctDTO);
        }
        dto.setChiTietBaiLams(chiTietDTOs);
        return dto;
    }
    
    // --- API for Teacher: View Results ---
    @Transactional(readOnly = true)
    public List<BaiLamDTO> getAttemptsForExam(Integer examId) {
        List<BaiLam> attempts = baiLamRepository.findByBaiKiemTraId(examId);
        return attempts.stream()
                .filter(b -> "DA_NOP".equals(b.getTrangThai()) || "VI_PHAM_QUY_CHE".equals(b.getTrangThai()))
                .sorted((a1, a2) -> {
                    // Sort by student name first, then by submit time
                    String name1 = (a1.getHocSinh() != null && a1.getHocSinh().getHoTen() != null) ? a1.getHocSinh().getHoTen() : "";
                    String name2 = (a2.getHocSinh() != null && a2.getHocSinh().getHoTen() != null) ? a2.getHocSinh().getHoTen() : "";
                    int nameCmp = name1.compareTo(name2);
                    if (nameCmp != 0) return nameCmp;
                    
                    if (a1.getThoiGianNop() != null && a2.getThoiGianNop() != null) {
                        return a2.getThoiGianNop().compareTo(a1.getThoiGianNop()); // newest first
                    }
                    if (a1.getThoiGianNop() == null && a2.getThoiGianNop() != null) return 1;
                    if (a1.getThoiGianNop() != null && a2.getThoiGianNop() == null) return -1;
                    return 0;
                })
                .map(this::mapBaiLamToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BaiLamDTO getAttemptDetailByAttemptId(Integer attemptId) {
        BaiLam attempt = baiLamRepository.findById(attemptId).orElseThrow(() -> new ResourceNotFoundException("Bài làm không tồn tại"));
        return buildAttemptDetailDTO(attempt);
    }

    @Transactional(readOnly = true)
    public TeacherMetadataDTO getTeacherMetadata(Integer giaoVienId) {
        List<PhanCongDay> phanCongs = phanCongDayRepository.findByGiaoVienId(giaoVienId);
        
        List<TeacherMetadataDTO.ClassInfo> classes;
        List<TeacherMetadataDTO.SubjectInfo> subjects;

        if (!phanCongs.isEmpty()) {
            classes = phanCongs.stream()
                .map(pc -> pc.getLop())
                .distinct()
                .map(l -> new TeacherMetadataDTO.ClassInfo(l.getId(), l.getTenLop()))
                .collect(Collectors.toList());
                
            subjects = phanCongs.stream()
                .map(pc -> pc.getMonHoc())
                .distinct()
                .map(m -> new TeacherMetadataDTO.SubjectInfo(m.getId(), m.getTenMon()))
                .collect(Collectors.toList());
        } else {
            // Fallback: Get all classes, and get subject based on teacher's boMon
            classes = lopHocRepository.findAll().stream()
                .map(l -> new TeacherMetadataDTO.ClassInfo(l.getId(), l.getTenLop()))
                .collect(Collectors.toList());
                
            GiaoVien gv = giaoVienRepository.findById(giaoVienId).orElse(null);
            if (gv != null && gv.getBoMon() != null) {
                String boMon = gv.getBoMon().toLowerCase().replace("í", "ý").replace("i", "y");
                List<MonHoc> allMon = monHocRepository.findAll();
                List<MonHoc> matching = allMon.stream()
                    .filter(m -> {
                        String tenMon = m.getTenMon().toLowerCase().replace("í", "ý").replace("i", "y");
                        return boMon.contains(tenMon) || tenMon.contains(boMon);
                    })
                    .collect(Collectors.toList());
                    
                if (!matching.isEmpty()) {
                    subjects = matching.stream()
                        .map(m -> new TeacherMetadataDTO.SubjectInfo(m.getId(), m.getTenMon()))
                        .collect(Collectors.toList());
                } else {
                    subjects = allMon.stream()
                        .map(m -> new TeacherMetadataDTO.SubjectInfo(m.getId(), m.getTenMon()))
                        .collect(Collectors.toList());
                }
            } else {
                subjects = monHocRepository.findAll().stream()
                    .map(m -> new TeacherMetadataDTO.SubjectInfo(m.getId(), m.getTenMon()))
                    .collect(Collectors.toList());
            }
        }
            
        return new TeacherMetadataDTO(classes, subjects);
    }
    
    @Transactional
    public BaiKiemTraDTO createExamByAuth(BaiKiemTraDTO dto, String username) {
        GiaoVien gv = giaoVienRepository.findByUserUsername(username).orElseThrow(() -> new ResourceNotFoundException("Giáo viên không tồn tại"));
        dto.setGiaoVienId(gv.getId());
        return createExam(dto);
    }

    @Transactional
    public BaiKiemTraDTO createExam(BaiKiemTraDTO dto) {
        BaiKiemTra exam = new BaiKiemTra();
        exam.setTieuDe(dto.getTieuDe());
        exam.setThoiGianLamBai(dto.getThoiGianLamBai());
        exam.setThoiGianBatDau(dto.getThoiGianBatDau());
        exam.setThoiGianKetThuc(dto.getThoiGianKetThuc());
        exam.setLopHoc(lopHocRepository.findById(dto.getLopHocId()).orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại")));
        exam.setMonHoc(monHocRepository.findById(dto.getMonHocId()).orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại")));
        exam.setGiaoVien(giaoVienRepository.findById(dto.getGiaoVienId()).orElseThrow(() -> new ResourceNotFoundException("Giáo viên không tồn tại")));
        exam.setSoLanLamBai(dto.getSoLanLamBai() != null ? dto.getSoLanLamBai() : 1);
        exam.setNgayTao(LocalDateTime.now());
        exam.setDaThongBao(true);
        
        BaiKiemTra saved = baiKiemTraRepository.save(exam);
        
        // Gửi thông báo cho học sinh trong lớp
        ThongBao tb = new ThongBao();
        tb.setTieuDe("Lịch kiểm tra mới: " + exam.getTieuDe());
        tb.setNoiDung(String.format("Giáo viên %s đã tạo lịch kiểm tra môn %s cho lớp. Thời gian làm bài: %d phút. Thời gian bắt đầu: %s.",
                saved.getGiaoVien().getHoTen(),
                saved.getMonHoc().getTenMon(),
                saved.getThoiGianLamBai(),
                saved.getThoiGianBatDau().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))));
        tb.setLoai("HOC_SINH");
        tb.setLop(saved.getLopHoc());
        tb.setNguoiTao(saved.getGiaoVien().getUser());
        tb.setSenderRole("GIAO_VIEN");
        notificationService.createThongBaoWithSms(tb, false);
        
        return mapToDTO(saved);
    }
    
    @Transactional
    public void deleteExam(Integer id) {
        List<BaiLam> baiLams = baiLamRepository.findByBaiKiemTraId(id);
        if (baiLams != null && !baiLams.isEmpty()) {
            throw new com.hethongtruongthpt.exception.ApiException("Không thể xóa bài kiểm tra vì đã có học sinh làm bài.");
        }

        // Xóa DapAn và CauHoi
        List<CauHoi> cauHois = cauHoiRepository.findByBaiKiemTraId(id);
        for (CauHoi ch : cauHois) {
            dapAnRepository.deleteAll(dapAnRepository.findByCauHoiId(ch.getId()));
        }
        cauHoiRepository.deleteAll(cauHois);

        // Xóa BaiKiemTra
        baiKiemTraRepository.deleteById(id);
    }

    @Transactional
    public void clearAllExams() {
        chiTietBaiLamRepository.deleteAllInBatch();
        baiLamRepository.deleteAllInBatch();
        dapAnRepository.deleteAllInBatch();
        cauHoiRepository.deleteAllInBatch();
        baiKiemTraRepository.deleteAllInBatch();
    }
    
    @Transactional(readOnly = true)
    public BaiKiemTraDTO getExamDetailForStudent(Integer id) {
        BaiKiemTra exam = baiKiemTraRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài kiểm tra"));
        BaiKiemTraDTO dto = mapToDTO(exam);
        
        List<CauHoi> cauHois = cauHoiRepository.findByBaiKiemTraId(id);
        List<CauHoiDTO> cauHoiDTOs = new ArrayList<>();
        for (CauHoi ch : cauHois) {
            CauHoiDTO chDTO = new CauHoiDTO();
            chDTO.setId(ch.getId());
            chDTO.setLoaiCauHoi(ch.getLoaiCauHoi());
            chDTO.setNoiDung(ch.getNoiDung());
            chDTO.setDiem(ch.getDiem());
            
            if ("TRAC_NGHIEM".equals(ch.getLoaiCauHoi())) {
                List<DapAn> dapAns = dapAnRepository.findByCauHoiId(ch.getId());
                chDTO.setDapAns(dapAns.stream().map(da -> {
                    DapAnDTO daDTO = new DapAnDTO();
                    daDTO.setId(da.getId());
                    daDTO.setNoiDung(da.getNoiDung());
                    daDTO.setLaDapAnDung(null); // Omit correct answer for students
                    return daDTO;
                }).collect(Collectors.toList()));
            }
            cauHoiDTOs.add(chDTO);
        }
        dto.setCauHois(cauHoiDTOs);
        return dto;
    }
    
    @Transactional(readOnly = true)
    public BaiKiemTraDTO getExamDetail(Integer id) {
        BaiKiemTra exam = baiKiemTraRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài kiểm tra"));
        BaiKiemTraDTO dto = mapToDTO(exam);
        
        // Load questions
        List<CauHoi> cauHois = cauHoiRepository.findByBaiKiemTraId(id);
        List<CauHoiDTO> cauHoiDTOs = new ArrayList<>();
        for (CauHoi ch : cauHois) {
            CauHoiDTO chDTO = new CauHoiDTO();
            chDTO.setId(ch.getId());
            chDTO.setLoaiCauHoi(ch.getLoaiCauHoi());
            chDTO.setNoiDung(ch.getNoiDung());
            chDTO.setDiem(ch.getDiem());
            
            if ("TRAC_NGHIEM".equals(ch.getLoaiCauHoi())) {
                List<DapAn> dapAns = dapAnRepository.findByCauHoiId(ch.getId());
                chDTO.setDapAns(dapAns.stream().map(da -> {
                    DapAnDTO daDTO = new DapAnDTO();
                    daDTO.setId(da.getId());
                    daDTO.setNoiDung(da.getNoiDung());
                    daDTO.setLaDapAnDung(da.getLaDapAnDung());
                    return daDTO;
                }).collect(Collectors.toList()));
            }
            cauHoiDTOs.add(chDTO);
        }
        dto.setCauHois(cauHoiDTOs);
        return dto;
    }
    
    @Transactional
    public void addQuestionToExam(Integer examId, CauHoiDTO dto) {
        BaiKiemTra exam = baiKiemTraRepository.findById(examId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài kiểm tra"));
        
        CauHoi ch = new CauHoi();
        ch.setBaiKiemTra(exam);
        ch.setLoaiCauHoi(dto.getLoaiCauHoi());
        ch.setNoiDung(dto.getNoiDung());
        ch.setDiem(dto.getDiem());
        CauHoi savedCh = cauHoiRepository.save(ch);
        
        if ("TRAC_NGHIEM".equals(dto.getLoaiCauHoi()) && dto.getDapAns() != null) {
            for (DapAnDTO daDTO : dto.getDapAns()) {
                DapAn da = new DapAn();
                da.setCauHoi(savedCh);
                da.setNoiDung(daDTO.getNoiDung());
                da.setLaDapAnDung(daDTO.getLaDapAnDung());
                dapAnRepository.save(da);
            }
        }
    }

    @Transactional
    public void editQuestion(Integer cauHoiId, CauHoiDTO dto) {
        CauHoi ch = cauHoiRepository.findById(cauHoiId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi"));
        
        List<BaiLam> attempts = baiLamRepository.findByBaiKiemTraId(ch.getBaiKiemTra().getId());
        if (attempts != null && !attempts.isEmpty()) {
            throw new com.hethongtruongthpt.exception.ApiException("Không thể sửa câu hỏi vì bài kiểm tra này đã có học sinh làm bài.");
        }

        ch.setLoaiCauHoi(dto.getLoaiCauHoi());
        ch.setNoiDung(dto.getNoiDung());
        ch.setDiem(dto.getDiem());
        cauHoiRepository.save(ch);

        // Delete old dap ans and add new ones
        dapAnRepository.deleteAll(dapAnRepository.findByCauHoiId(cauHoiId));
        
        if ("TRAC_NGHIEM".equals(dto.getLoaiCauHoi()) && dto.getDapAns() != null) {
            for (DapAnDTO daDTO : dto.getDapAns()) {
                DapAn da = new DapAn();
                da.setCauHoi(ch);
                da.setNoiDung(daDTO.getNoiDung());
                da.setLaDapAnDung(daDTO.getLaDapAnDung());
                dapAnRepository.save(da);
            }
        }
    }

    @Transactional
    public void deleteQuestion(Integer cauHoiId) {
        CauHoi ch = cauHoiRepository.findById(cauHoiId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi"));
        
        List<BaiLam> attempts = baiLamRepository.findByBaiKiemTraId(ch.getBaiKiemTra().getId());
        if (attempts != null && !attempts.isEmpty()) {
            throw new com.hethongtruongthpt.exception.ApiException("Không thể xóa câu hỏi vì bài kiểm tra này đã có học sinh làm bài.");
        }
        
        dapAnRepository.deleteAll(dapAnRepository.findByCauHoiId(cauHoiId));
        cauHoiRepository.delete(ch);
    }
    
    // --- Helper ---
    private BaiKiemTraDTO mapToDTO(BaiKiemTra entity) {
        BaiKiemTraDTO dto = new BaiKiemTraDTO();
        dto.setId(entity.getId());
        dto.setTieuDe(entity.getTieuDe());
        dto.setThoiGianLamBai(entity.getThoiGianLamBai());
        dto.setThoiGianBatDau(entity.getThoiGianBatDau());
        dto.setThoiGianKetThuc(entity.getThoiGianKetThuc());
        dto.setLopHocId(entity.getLopHoc().getId());
        dto.setTenLopHoc(entity.getLopHoc().getTenLop());
        dto.setMonHocId(entity.getMonHoc().getId());
        dto.setTenMonHoc(entity.getMonHoc().getTenMon());
        dto.setGiaoVienId(entity.getGiaoVien().getId());
        dto.setTenGiaoVien(entity.getGiaoVien().getHoTen());
        dto.setSoLanLamBai(entity.getSoLanLamBai() != null ? entity.getSoLanLamBai() : 1);
        dto.setNgayTao(entity.getNgayTao());
        return dto;
    }
    
    // --- API for Student: Take Exam ---
    
    @Transactional
    public BaiLamDTO startAttemptByAuth(Integer examId, String username, String sessionToken) {
        HocSinh hs = hocSinhRepository.findByUserUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        return startAttempt(examId, hs.getId(), sessionToken);
    }

    @Transactional
    public BaiLamDTO startAttempt(Integer examId, Integer hocSinhId, String sessionToken) {
        // Check if exam is active
        BaiKiemTra exam = baiKiemTraRepository.findById(examId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài kiểm tra"));
        LocalDateTime now = LocalDateTime.now();
        if (exam.getThoiGianBatDau() != null && now.isBefore(exam.getThoiGianBatDau())) {
            throw new RuntimeException("Bài kiểm tra chưa bắt đầu");
        }
        if (exam.getThoiGianKetThuc() != null && now.isAfter(exam.getThoiGianKetThuc())) {
            throw new RuntimeException("Bài kiểm tra đã kết thúc");
        }
        
        // Check if already started or max attempts reached
        List<BaiLam> existings = baiLamRepository.findByBaiKiemTraIdAndHocSinhId(examId, hocSinhId);
        
        // Find if there is any attempt currently IN PROGRESS
        BaiLam inProgress = existings.stream()
                .filter(b -> "DANG_LAM".equals(b.getTrangThai()))
                .findFirst()
                .orElse(null);
                
        if (inProgress != null) {
            inProgress.setSessionToken(sessionToken);
            baiLamRepository.save(inProgress);
            return mapBaiLamToDTO(inProgress);
        }
        
        // Count submitted or violated attempts
        long completedAttempts = existings.stream()
                .filter(b -> "DA_NOP".equals(b.getTrangThai()) || "VI_PHAM_QUY_CHE".equals(b.getTrangThai()))
                .count();
                
        int maxAttempts = exam.getSoLanLamBai() != null ? exam.getSoLanLamBai() : 1;
        if (completedAttempts >= maxAttempts) {
            throw new RuntimeException("Bạn đã vượt quá số lần làm bài cho phép (" + maxAttempts + " lần)");
        }
        
        BaiLam attempt = new BaiLam();
        attempt.setBaiKiemTra(exam);
        attempt.setHocSinh(hocSinhRepository.findById(hocSinhId).orElseThrow());
        attempt.setThoiGianBatDau(now);
        attempt.setTrangThai("DANG_LAM");
        attempt.setSessionToken(sessionToken);
        BaiLam saved = baiLamRepository.save(attempt);
        
        return mapBaiLamToDTO(saved);
    }
    
    public boolean checkSession(Integer attemptId, String sessionToken) {
        BaiLam attempt = baiLamRepository.findById(attemptId).orElse(null);
        if (attempt == null || sessionToken == null) return false;
        return sessionToken.equals(attempt.getSessionToken());
    }
    
    @Transactional
    public BaiLamDTO submitAttempt(Integer attemptId, List<ChiTietBaiLamDTO> answers, boolean isAntiCheat) {
        BaiLam attempt = baiLamRepository.findById(attemptId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài làm"));
        if (!"DANG_LAM".equals(attempt.getTrangThai())) {
            throw new RuntimeException("Bài thi này đã nộp rồi");
        }
        
        double diemTracNghiem = 0.0;
        
        for (ChiTietBaiLamDTO ans : answers) {
            ChiTietBaiLam chiTiet = new ChiTietBaiLam();
            chiTiet.setBaiLam(attempt);
            CauHoi cauHoi = cauHoiRepository.findById(ans.getCauHoiId()).orElse(null);
            if (cauHoi == null) continue;
            
            chiTiet.setCauHoi(cauHoi);
            
            if ("TRAC_NGHIEM".equals(cauHoi.getLoaiCauHoi()) && ans.getDapAnId() != null) {
                DapAn dapAn = dapAnRepository.findById(ans.getDapAnId()).orElse(null);
                chiTiet.setDapAn(dapAn);
                if (dapAn != null && Boolean.TRUE.equals(dapAn.getLaDapAnDung())) {
                    chiTiet.setDiemDatDuoc(cauHoi.getDiem());
                    diemTracNghiem += cauHoi.getDiem();
                } else {
                    chiTiet.setDiemDatDuoc(0.0);
                }
            } else if ("TU_LUAN".equals(cauHoi.getLoaiCauHoi())) {
                chiTiet.setCauTraLoiTuLuan(ans.getCauTraLoiTuLuan());
                chiTiet.setDiemDatDuoc(0.0); // Teacher will grade later
            }
            
            chiTietBaiLamRepository.save(chiTiet);
        }
        
        attempt.setThoiGianNop(LocalDateTime.now());
        attempt.setDiemTracNghiem(diemTracNghiem);
        attempt.setTrangThai(isAntiCheat ? "VI_PHAM_QUY_CHE" : "DA_NOP");
        
        BaiLam saved = baiLamRepository.save(attempt);
        return mapBaiLamToDTO(saved);
    }
    
    private BaiLamDTO mapBaiLamToDTO(BaiLam entity) {
        BaiLamDTO dto = new BaiLamDTO();
        dto.setId(entity.getId());
        if (entity.getBaiKiemTra() != null) {
            dto.setBaiKiemTraId(entity.getBaiKiemTra().getId());
        }
        if (entity.getHocSinh() != null) {
            dto.setHocSinhId(entity.getHocSinh().getId());
            dto.setTenHocSinh(entity.getHocSinh().getHoTen());
        } else {
            dto.setTenHocSinh("Không xác định");
        }
        dto.setThoiGianBatDau(entity.getThoiGianBatDau());
        dto.setThoiGianNop(entity.getThoiGianNop());
        dto.setTrangThai(entity.getTrangThai());
        dto.setDiemTracNghiem(entity.getDiemTracNghiem() != null ? entity.getDiemTracNghiem() : 0.0);
        dto.setDiemTuLuan(entity.getDiemTuLuan());
        return dto;
    }
}

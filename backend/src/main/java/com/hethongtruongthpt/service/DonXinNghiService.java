package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.ChuNhiem;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.repository.ChuNhiemRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.entity.DonXinNghi;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.dto.donxinnghi.DonXinNghiRequest;
import com.hethongtruongthpt.dto.donxinnghi.DonXinNghiResponse;
import com.hethongtruongthpt.dto.donxinnghi.DuyetNghiRequest;
import com.hethongtruongthpt.entity.DiemDanh;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.repository.DonXinNghiRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.PhuHuynhRepository;
import com.hethongtruongthpt.repository.DiemDanhRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.repository.NamHocRepository;
import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hethongtruongthpt.entity.PhuHuynhHocSinh;
import com.hethongtruongthpt.repository.PhuHuynhHocSinhRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DonXinNghiService {
    private static final Logger log = LoggerFactory.getLogger(DonXinNghiService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final DonXinNghiRepository donXinNghiRepository;
    private final HocSinhRepository hocSinhRepository;
    private final PhuHuynhRepository phuHuynhRepository;
    private final PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;
    private final DiemDanhRepository diemDanhRepository;
    private final UserRepository userRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final NamHocRepository namHocRepository;
    private final LeaveNotificationService leaveNotificationService;
    private final ChuNhiemRepository chuNhiemRepository;
    private final LopHocRepository lopHocRepository;

    public DonXinNghiService(DonXinNghiRepository donXinNghiRepository,
                             HocSinhRepository hocSinhRepository,
                             PhuHuynhRepository phuHuynhRepository,
                             PhuHuynhHocSinhRepository phuHuynhHocSinhRepository,
                             DiemDanhRepository diemDanhRepository,
                             UserRepository userRepository,
                             GiaoVienRepository giaoVienRepository,
                             NamHocRepository namHocRepository,
                             LeaveNotificationService leaveNotificationService,
                             ChuNhiemRepository chuNhiemRepository,
                             LopHocRepository lopHocRepository) {
        this.donXinNghiRepository = donXinNghiRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.phuHuynhRepository = phuHuynhRepository;
        this.phuHuynhHocSinhRepository = phuHuynhHocSinhRepository;
        this.diemDanhRepository = diemDanhRepository;
        this.userRepository = userRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.namHocRepository = namHocRepository;
        this.leaveNotificationService = leaveNotificationService;
        this.chuNhiemRepository = chuNhiemRepository;
        this.lopHocRepository = lopHocRepository;
    }

    public List<DonXinNghiResponse> getByHocSinhId(Integer hocSinhId) {
        return donXinNghiRepository.findByHocSinhIdOrderByCreatedAtDesc(hocSinhId)
                .stream().map(DonXinNghiResponse::fromEntity).collect(Collectors.toList());
    }

    public List<DonXinNghiResponse> getByPhuHuynhId(Integer phuHuynhId) {
        return donXinNghiRepository.findByPhuHuynhIdOrderByCreatedAtDesc(phuHuynhId)
                .stream().map(DonXinNghiResponse::fromEntity).collect(Collectors.toList());
    }

    public List<DonXinNghiResponse> getByLopId(Integer lopId) {
        return donXinNghiRepository.findByHocSinhLopIdOrderByCreatedAtDesc(lopId)
                .stream().map(DonXinNghiResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public DonXinNghiResponse createRequest(Integer phuHuynhId, Integer hocSinhId, DonXinNghiRequest request) {
        HocSinh hocSinh = hocSinhRepository.findByIdWithLop(hocSinhId)
                .orElseGet(() -> hocSinhRepository.findById(hocSinhId)
                        .orElseThrow(() -> new ApiException("Không tìm thấy học sinh")));

        PhuHuynh phuHuynh = null;
        if (phuHuynhId != null) {
            phuHuynh = phuHuynhRepository.findById(phuHuynhId)
                    .orElseThrow(() -> new ApiException("Không tìm thấy phụ huynh"));
        }

        if (request.getNgayBatDau().isBefore(LocalDate.now())) {
            throw new ApiException("Không thể xin nghỉ cho các ngày trong quá khứ");
        }

        if (request.getNgayBatDau().isAfter(request.getNgayKetThuc())) {
            throw new ApiException("Ngày bắt đầu không thể sau ngày kết thúc");
        }

        List<NamHoc> activeYears = namHocRepository.findByTrangThai("DANG_MO");
        if (activeYears.isEmpty()) {
            throw new ApiException("Hệ thống chưa cấu hình năm học, không thể tạo đơn xin nghỉ.");
        }
        NamHoc activeYear = activeYears.get(0);
        LocalDate start = request.getNgayBatDau();
        LocalDate end = request.getNgayKetThuc();

        // Chỉ validate trong phạm vi học kỳ khi năm học đã cấu hình đủ các mốc ngày
        boolean hkConfigured = activeYear.getNgayBatDauHk1() != null
                && activeYear.getNgayKetThucHk1() != null
                && activeYear.getNgayBatDauHk2() != null
                && activeYear.getNgayKetThucHk2() != null;

        if (hkConfigured) {
            boolean inHk1 = (!start.isBefore(activeYear.getNgayBatDauHk1()) && !end.isAfter(activeYear.getNgayKetThucHk1()));
            boolean inHk2 = (!start.isBefore(activeYear.getNgayBatDauHk2()) && !end.isAfter(activeYear.getNgayKetThucHk2()));

            if (!inHk1 && !inHk2) {
                throw new ApiException("Thời gian xin nghỉ phải nằm trong học kỳ 1 (" + activeYear.getNgayBatDauHk1() + " - " + activeYear.getNgayKetThucHk1() + ") hoặc học kỳ 2 (" + activeYear.getNgayBatDauHk2() + " - " + activeYear.getNgayKetThucHk2() + ").");
            }
        }

        DonXinNghi don = new DonXinNghi();
        don.setHocSinh(hocSinh);
        don.setPhuHuynh(phuHuynh);
        don.setNgayBatDau(request.getNgayBatDau());
        don.setNgayKetThuc(request.getNgayKetThuc());
        don.setLyDo(request.getLyDo());
        don.setTrangThai("PENDING");

        DonXinNghi saved = donXinNghiRepository.save(don);

        // Gửi thông báo cho Giáo viên chủ nhiệm của lớp
        try {
            User gvUser = null;
            Integer lopId = hocSinh.getLop() != null ? hocSinh.getLop().getId() : null;

            if (hocSinh.getLop() != null && hocSinh.getLop().getGvcn() != null) {
                GiaoVien gvcn = hocSinh.getLop().getGvcn();
                if (gvcn.getUser() != null) {
                    gvUser = gvcn.getUser();
                } else if (gvcn.getId() != null) {
                    gvUser = giaoVienRepository.findById(gvcn.getId()).map(GiaoVien::getUser).orElse(null);
                }
            }

            if (gvUser == null && lopId != null) {
                LopHoc lop = lopHocRepository.findById(lopId).orElse(null);
                if (lop != null && lop.getGvcn() != null) {
                    gvUser = lop.getGvcn().getUser();
                    if (gvUser == null && lop.getGvcn().getId() != null) {
                        gvUser = giaoVienRepository.findById(lop.getGvcn().getId()).map(GiaoVien::getUser).orElse(null);
                    }
                }
            }

            if (gvUser == null && lopId != null) {
                List<ChuNhiem> chuNhiemList = chuNhiemRepository.findById_LopId(lopId);
                if (!chuNhiemList.isEmpty()) {
                    Integer gvId = chuNhiemList.get(0).getId().getGiaoVienId();
                    gvUser = giaoVienRepository.findById(gvId).map(GiaoVien::getUser).orElse(null);
                }
            }

            if (gvUser != null) {
                String senderName = phuHuynh != null ? phuHuynh.getHoTen() : "Phụ huynh";
                String tenLop = hocSinh.getLop() != null && hocSinh.getLop().getTenLop() != null ? hocSinh.getLop().getTenLop() : "";
                String title = "Đơn xin nghỉ học: " + hocSinh.getHoTen();
                String dateRange = saved.getNgayBatDau().equals(saved.getNgayKetThuc())
                        ? "ngày " + saved.getNgayBatDau().format(DATE_FORMATTER)
                        : "từ ngày " + saved.getNgayBatDau().format(DATE_FORMATTER)
                        + " đến ngày " + saved.getNgayKetThuc().format(DATE_FORMATTER);
                String message = senderName + " đã gửi đơn xin nghỉ " + dateRange + " cho học sinh " + hocSinh.getHoTen()
                        + (tenLop.isEmpty() ? "" : " (Lớp " + tenLop + ")") + ". Lý do: " + saved.getLyDo();

                leaveNotificationService.sendToUser(gvUser, title, message, "STUDENT_LEAVE_REQUEST", saved.getId());
            } else {
                log.warn("Không tìm thấy tài khoản GVCN cho học sinh ID: {}, lớp ID: {}", hocSinhId, lopId);
            }
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo đơn xin nghỉ cho GVCN: {}", e.getMessage(), e);
        }

        return DonXinNghiResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteRequest(Integer donId, Integer userId, boolean isPhuHuynh) {
        DonXinNghi don = donXinNghiRepository.findById(donId)
                .orElseThrow(() -> new ApiException("Không tìm thấy đơn xin nghỉ"));

        if (!don.getTrangThai().equals("PENDING")) {
            throw new ApiException("Chỉ có thể xóa đơn khi đang ở trạng thái chờ duyệt");
        }

        if (isPhuHuynh) {
            if (don.getPhuHuynh() == null || !don.getPhuHuynh().getId().equals(userId)) {
                throw new ApiException("Bạn không có quyền xóa đơn này");
            }
        } else {
            if (!don.getHocSinh().getId().equals(userId)) {
                throw new ApiException("Bạn không có quyền xóa đơn này");
            }
        }

        donXinNghiRepository.delete(don);
    }

    @Transactional
    public DonXinNghiResponse duyetDon(Integer donId, DuyetNghiRequest request, String approverUsername) {
        DonXinNghi don = donXinNghiRepository.findById(donId)
                .orElseThrow(() -> new ApiException("Không tìm thấy đơn xin nghỉ"));

        if (!request.getTrangThai().equals("APPROVED") && !request.getTrangThai().equals("REJECTED")) {
            throw new ApiException("Trạng thái duyệt không hợp lệ");
        }

        don.setTrangThai(request.getTrangThai());
        don.setPhanHoiGv(request.getPhanHoi());

        DonXinNghi saved = donXinNghiRepository.save(don);

        if ("APPROVED".equals(request.getTrangThai()) && don.getHocSinh().getLop() != null) {
            User user = userRepository.findByUsername(approverUsername).orElse(null);
            GiaoVien gv = null;
            if (user != null) {
                gv = giaoVienRepository.findByUserId(user.getId()).orElse(null);
            }

            if (gv != null) {
                LocalDate date = don.getNgayBatDau();
                while (!date.isAfter(don.getNgayKetThuc())) {
                    // Tránh duplicate nếu đã tồn tại điểm danh cho ngày này
                    if (diemDanhRepository.findByNgayAndLopHocId(date, don.getHocSinh().getLop().getId()).stream().noneMatch(d -> d.getHocSinh().getId().equals(don.getHocSinh().getId()))) {
                        DiemDanh diemDanh = new DiemDanh();
                        diemDanh.setNgay(date);
                        diemDanh.setLopHoc(don.getHocSinh().getLop());
                        diemDanh.setHocSinh(don.getHocSinh());
                        diemDanh.setLoaiVang("CO_PHEP");
                        diemDanh.setGhiChu("Đã duyệt đơn xin nghỉ");
                        diemDanh.setGiaoVien(gv);
                        diemDanhRepository.save(diemDanh);
                    }
                    date = date.plusDays(1);
                }
            }
        }

        // Gửi thông báo kết quả duyệt đơn cho phụ huynh / học sinh
        try {
            String statusText = "APPROVED".equals(request.getTrangThai()) ? "chấp thuận" : "từ chối";
            String statusBadge = "APPROVED".equals(request.getTrangThai()) ? "ĐÃ DUYỆT" : "TỪ CHỐI";
            String title = "Đơn xin nghỉ (" + statusBadge + "): " + don.getHocSinh().getHoTen();
            String dateRange = don.getNgayBatDau().equals(don.getNgayKetThuc())
                    ? "ngày " + don.getNgayBatDau().format(DATE_FORMATTER)
                    : "từ ngày " + don.getNgayBatDau().format(DATE_FORMATTER)
                    + " đến ngày " + don.getNgayKetThuc().format(DATE_FORMATTER);
            String message = "Giáo viên chủ nhiệm đã " + statusText + " đơn xin nghỉ " + dateRange + " của học sinh " + don.getHocSinh().getHoTen()
                    + (request.getPhanHoi() != null && !request.getPhanHoi().isBlank() ? ". Phản hồi: " + request.getPhanHoi() : "");

            // 1. Gửi cho phụ huynh tạo đơn hoặc phụ huynh của học sinh
            User phUser = null;
            if (don.getPhuHuynh() != null) {
                if (don.getPhuHuynh().getUser() != null) {
                    phUser = don.getPhuHuynh().getUser();
                } else if (don.getPhuHuynh().getId() != null) {
                    phUser = phuHuynhRepository.findById(don.getPhuHuynh().getId()).map(PhuHuynh::getUser).orElse(null);
                }
            }

            if (phUser != null) {
                leaveNotificationService.sendToUser(phUser, title, message, "STUDENT_LEAVE_RESULT", don.getId());
            } else if (don.getHocSinh() != null && don.getHocSinh().getId() != null) {
                List<PhuHuynhHocSinh> links = phuHuynhHocSinhRepository.findByHocSinhId(don.getHocSinh().getId());
                for (PhuHuynhHocSinh link : links) {
                    if (link.getPhuHuynh() != null && link.getPhuHuynh().getUser() != null) {
                        leaveNotificationService.sendToUser(link.getPhuHuynh().getUser(), title, message, "STUDENT_LEAVE_RESULT", don.getId());
                    }
                }
            }

            // 2. Gửi cho học sinh
            User hsUser = null;
            if (don.getHocSinh() != null) {
                if (don.getHocSinh().getUser() != null) {
                    hsUser = don.getHocSinh().getUser();
                } else if (don.getHocSinh().getId() != null) {
                    hsUser = hocSinhRepository.findById(don.getHocSinh().getId()).map(HocSinh::getUser).orElse(null);
                }
            }
            if (hsUser != null && (phUser == null || !hsUser.getId().equals(phUser.getId()))) {
                leaveNotificationService.sendToUser(hsUser, title, message, "STUDENT_LEAVE_RESULT", don.getId());
            }
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo kết quả duyệt đơn: {}", e.getMessage(), e);
        }

        return DonXinNghiResponse.fromEntity(saved);
    }
}

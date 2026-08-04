package com.hethongtruongthpt.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DonXinNghiService {
    private final DonXinNghiRepository donXinNghiRepository;
    private final HocSinhRepository hocSinhRepository;
    private final PhuHuynhRepository phuHuynhRepository;
    private final DiemDanhRepository diemDanhRepository;
    private final UserRepository userRepository;
    private final GiaoVienRepository giaoVienRepository;
    private final NamHocRepository namHocRepository;

    public DonXinNghiService(DonXinNghiRepository donXinNghiRepository,
                             HocSinhRepository hocSinhRepository,
                             PhuHuynhRepository phuHuynhRepository,
                             DiemDanhRepository diemDanhRepository,
                             UserRepository userRepository,
                             GiaoVienRepository giaoVienRepository,
                             NamHocRepository namHocRepository) {
        this.donXinNghiRepository = donXinNghiRepository;
        this.hocSinhRepository = hocSinhRepository;
        this.phuHuynhRepository = phuHuynhRepository;
        this.diemDanhRepository = diemDanhRepository;
        this.userRepository = userRepository;
        this.giaoVienRepository = giaoVienRepository;
        this.namHocRepository = namHocRepository;
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
        HocSinh hocSinh = hocSinhRepository.findById(hocSinhId)
                .orElseThrow(() -> new ApiException("Không tìm thấy học sinh"));

        PhuHuynh phuHuynh = null;
        if (phuHuynhId != null) {
            phuHuynh = phuHuynhRepository.findById(phuHuynhId)
                    .orElseThrow(() -> new ApiException("Không tìm thấy phụ huynh"));
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

        boolean inHk1 = (!start.isBefore(activeYear.getNgayBatDauHk1()) && !end.isAfter(activeYear.getNgayKetThucHk1()));
        boolean inHk2 = (!start.isBefore(activeYear.getNgayBatDauHk2()) && !end.isAfter(activeYear.getNgayKetThucHk2()));

        if (!inHk1 && !inHk2) {
            throw new ApiException("Thời gian xin nghỉ phải nằm gọn trong học kỳ 1 hoặc học kỳ 2. Không được xin nghỉ vào dịp hè hoặc ngoài thời gian học.");
        }

        DonXinNghi don = new DonXinNghi();
        don.setHocSinh(hocSinh);
        don.setPhuHuynh(phuHuynh);
        don.setNgayBatDau(request.getNgayBatDau());
        don.setNgayKetThuc(request.getNgayKetThuc());
        don.setLyDo(request.getLyDo());
        don.setTrangThai("PENDING");

        DonXinNghi saved = donXinNghiRepository.save(don);
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

        return DonXinNghiResponse.fromEntity(saved);
    }
}

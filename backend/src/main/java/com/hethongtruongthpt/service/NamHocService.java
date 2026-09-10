package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NamHocService {
    private final NamHocRepository namHocRepository;
    private final HocKyRepository hocKyRepository;
    private final HanhKiemRepository hanhKiemRepository;
    private final HocBaRepository hocBaRepository;
    private final LopHocRepository lopHocRepository;
    private final DiemRepository diemRepository;
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    private final PhanCongDayRepository phanCongDayRepository;
    private final LichThiRepository lichThiRepository;
    private final LichSuHocTapRepository lichSuHocTapRepository;

    public NamHocService(NamHocRepository namHocRepository,
                          HocKyRepository hocKyRepository,
                          HanhKiemRepository hanhKiemRepository,
                          HocBaRepository hocBaRepository,
                          LopHocRepository lopHocRepository,
                          DiemRepository diemRepository,
                          ThoiKhoaBieuRepository thoiKhoaBieuRepository,
                          PhanCongDayRepository phanCongDayRepository,
                          LichThiRepository lichThiRepository,
                          LichSuHocTapRepository lichSuHocTapRepository) {
        this.namHocRepository = namHocRepository;
        this.hocKyRepository = hocKyRepository;
        this.hanhKiemRepository = hanhKiemRepository;
        this.hocBaRepository = hocBaRepository;
        this.lopHocRepository = lopHocRepository;
        this.diemRepository = diemRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.phanCongDayRepository = phanCongDayRepository;
        this.lichThiRepository = lichThiRepository;
        this.lichSuHocTapRepository = lichSuHocTapRepository;
    }

    public List<NamHoc> getAll() {
        return namHocRepository.findAll();
    }

    public Page<NamHoc> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("tenNamHoc").descending());
        return namHocRepository.findAll(pageable);
    }

    public NamHoc getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return namHocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy năm học"));
    }

    public NamHoc create(NamHoc namHoc) {
        namHoc.setId(null); // Để MySQL tự tăng ID
        if (namHoc.getTenNamHoc() != null) {
            namHoc.setTenNamHoc(namHoc.getTenNamHoc().replaceAll("\\s+", ""));
        }
        return namHocRepository.save(namHoc);
    }

    public NamHoc update(Integer id, NamHoc namHoc) {
        getById(id);
        namHoc.setId(id);
        if (namHoc.getTenNamHoc() != null) {
            namHoc.setTenNamHoc(namHoc.getTenNamHoc().replaceAll("\\s+", ""));
        }
        return namHocRepository.save(namHoc);
    }

    @Transactional
    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        NamHoc namHoc = getById(id);

        if ("DANG_MO".equalsIgnoreCase(namHoc.getTrangThai())) {
            throw new ApiException("Không thể xóa năm học đang là năm học hiện hành.");
        }

        String tenNamHoc = namHoc.getTenNamHoc();
        String compactYear = tenNamHoc != null ? tenNamHoc.replaceAll("\\s+", "") : "";
        String spacedYear = compactYear.replace("-", " - ");

        // Kiểm tra xem năm học có dữ liệu thực tế phát sinh (lớp học, điểm, thời khóa biểu, phân công, lịch thi, lịch sử học tập)
        boolean hasLop = (lopHocRepository != null) && (lopHocRepository.existsByNamHoc(compactYear) || lopHocRepository.existsByNamHoc(spacedYear));
        boolean hasDiem = (diemRepository != null) && (diemRepository.existsByNamHoc(compactYear) || diemRepository.existsByNamHoc(spacedYear));
        boolean hasTkb = (thoiKhoaBieuRepository != null) && (thoiKhoaBieuRepository.existsByNamHoc(compactYear) || thoiKhoaBieuRepository.existsByNamHoc(spacedYear));
        boolean hasPhanCong = (phanCongDayRepository != null) && (phanCongDayRepository.existsByNamHoc(compactYear) || phanCongDayRepository.existsByNamHoc(spacedYear));
        boolean hasLichThi = (lichThiRepository != null) && (lichThiRepository.existsByNamHoc(compactYear) || lichThiRepository.existsByNamHoc(spacedYear));
        boolean hasLichSu = (lichSuHocTapRepository != null) && (lichSuHocTapRepository.existsByNamHoc(compactYear) || lichSuHocTapRepository.existsByNamHoc(spacedYear));

        if (hasLop || hasDiem || hasTkb || hasPhanCong || hasLichThi || hasLichSu) {
            throw new ApiException("Năm học " + tenNamHoc + " đã có dữ liệu nên không thể xóa được.");
        }

        // Xóa các dữ liệu phụ thuộc (học kỳ được tự sinh, hoặc dữ liệu mồ côi nếu có) trước khi xóa năm học
        if (hanhKiemRepository != null && hanhKiemRepository.existsByNamHocId(id)) {
            hanhKiemRepository.deleteByNamHocId(id);
        }
        if (hocBaRepository != null && hocBaRepository.existsByNamHocId(id)) {
            hocBaRepository.deleteByNamHocId(id);
        }
        if (hocKyRepository != null && hocKyRepository.existsByNamHocId(id)) {
            hocKyRepository.deleteByNamHocId(id);
        }

        namHocRepository.deleteById(id);
    }
}

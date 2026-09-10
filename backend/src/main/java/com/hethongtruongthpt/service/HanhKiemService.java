package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HanhKiemRepository;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LichSuHocTapRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class HanhKiemService {
    private final HanhKiemRepository hanhKiemRepository;
    private final LichSuHocTapRepository lichSuHocTapRepository;
    private final HocSinhRepository hocSinhRepository;

    public HanhKiemService(HanhKiemRepository hanhKiemRepository,
                          LichSuHocTapRepository lichSuHocTapRepository,
                          HocSinhRepository hocSinhRepository) {
        this.hanhKiemRepository = hanhKiemRepository;
        this.lichSuHocTapRepository = lichSuHocTapRepository;
        this.hocSinhRepository = hocSinhRepository;
    }

    public List<HanhKiem> getAll() {
        return hanhKiemRepository.findAll();
    }

    public HanhKiem getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return hanhKiemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hạnh kiểm"));
    }

    public List<HanhKiem> getByHocSinhId(Integer hocSinhId) {
        return hanhKiemRepository.findByHocSinhId(hocSinhId);
    }

    public List<HanhKiem> getByGiaoVienId(Integer giaoVienId) {
        return hanhKiemRepository.findByGiaoVienId(giaoVienId);
    }

    public List<HanhKiem> getByHocSinhAndNamHoc(Integer hocSinhId, Integer namHocId) {
        return hanhKiemRepository.findByHocSinhIdAndNamHocId(hocSinhId, namHocId);
    }

    public List<HanhKiem> getByLopAndNamHoc(Integer lopId, Integer namHocId) {
        List<HocSinh> current = hocSinhRepository.findByLopId(lopId);
        List<com.hethongtruongthpt.entity.LichSuHocTap> histories = lichSuHocTapRepository.findByLopHocId(lopId);

        Set<Integer> sIds = new HashSet<>();
        if (current != null) {
            for (HocSinh hs : current) {
                if (hs != null && hs.getId() != null) sIds.add(hs.getId());
            }
        }
        if (histories != null) {
            for (com.hethongtruongthpt.entity.LichSuHocTap ls : histories) {
                if (ls != null && ls.getHocSinh() != null && ls.getHocSinh().getId() != null) {
                    sIds.add(ls.getHocSinh().getId());
                }
            }
        }

        if (sIds.isEmpty()) {
            return new ArrayList<>();
        }
        return hanhKiemRepository.findByHocSinhIdInAndNamHocId(new ArrayList<>(sIds), namHocId);
    }

    public List<HanhKiem> getByLop(Integer lopId) {
        List<HocSinh> current = hocSinhRepository.findByLopId(lopId);
        List<com.hethongtruongthpt.entity.LichSuHocTap> histories = lichSuHocTapRepository.findByLopHocId(lopId);

        Set<Integer> sIds = new HashSet<>();
        if (current != null) {
            for (HocSinh hs : current) {
                if (hs != null && hs.getId() != null) sIds.add(hs.getId());
            }
        }
        if (histories != null) {
            for (com.hethongtruongthpt.entity.LichSuHocTap ls : histories) {
                if (ls != null && ls.getHocSinh() != null && ls.getHocSinh().getId() != null) {
                    sIds.add(ls.getHocSinh().getId());
                }
            }
        }

        if (sIds.isEmpty()) {
            return new ArrayList<>();
        }
        return hanhKiemRepository.findByHocSinhIdIn(new ArrayList<>(sIds));
    }

    public HanhKiem create(HanhKiem hanhKiem) {
        if (hanhKiem == null) throw new IllegalArgumentException("Hạnh kiểm không được để trống");
        // Upsert: tìm bản ghi trùng (học sinh + năm học + học kỳ) → cập nhật thay vì tạo mới
        HanhKiem existing = findExisting(hanhKiem);
        if (existing != null) {
            boolean isAdmin = isCurrentUserAdmin();
            if ("APPROVED".equals(existing.getStatus()) && !isAdmin) {
                throw new com.hethongtruongthpt.exception.ApiException("Đánh giá hạnh kiểm đã được duyệt và khóa, không thể sửa đổi.");
            }
            existing.setXepLoai(hanhKiem.getXepLoai());
            existing.setNhanXet(hanhKiem.getNhanXet());
            existing.setNgayDanhGia(hanhKiem.getNgayDanhGia());
            existing.setGiaoVien(hanhKiem.getGiaoVien());
            existing.setStatus(hanhKiem.getStatus());
            return hanhKiemRepository.save(existing);
        }
        return hanhKiemRepository.save(hanhKiem);
    }

    public HanhKiem update(Integer id, HanhKiem hanhKiem) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        HanhKiem existing = getById(id);
        boolean isAdmin = isCurrentUserAdmin();
        if ("APPROVED".equals(existing.getStatus()) && !isAdmin) {
            throw new com.hethongtruongthpt.exception.ApiException("Đánh giá hạnh kiểm đã được duyệt và khóa, không thể sửa đổi.");
        }
        hanhKiem.setId(id);
        return hanhKiemRepository.save(hanhKiem);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        HanhKiem existing = getById(id);
        boolean isAdmin = isCurrentUserAdmin();
        if ("APPROVED".equals(existing.getStatus()) && !isAdmin) {
            throw new com.hethongtruongthpt.exception.ApiException("Đánh giá hạnh kiểm đã được duyệt và khóa, không thể xóa.");
        }
        hanhKiemRepository.deleteById(id);
    }

    @Transactional
    public List<HanhKiem> saveAll(List<HanhKiem> hanhKiemList) {
        boolean isAdmin = isCurrentUserAdmin();
        List<HanhKiem> results = new ArrayList<>();
        for (HanhKiem hk : hanhKiemList) {
            // Nếu có id → cập nhật bản ghi hiện có
            if (hk.getId() != null) {
                HanhKiem existing = getById(hk.getId());
                if ("APPROVED".equals(existing.getStatus()) && !isAdmin) {
                    throw new com.hethongtruongthpt.exception.ApiException("Đánh giá hạnh kiểm đã được duyệt và khóa, không thể sửa đổi.");
                }
                existing.setXepLoai(hk.getXepLoai());
                existing.setNhanXet(hk.getNhanXet());
                existing.setNgayDanhGia(hk.getNgayDanhGia());
                existing.setGiaoVien(hk.getGiaoVien());
                existing.setStatus(hk.getStatus());
                results.add(hanhKiemRepository.save(existing));
            } else {
                // Không có id → tìm bản ghi trùng (upsert)
                HanhKiem existing = findExisting(hk);
                if (existing != null) {
                    if ("APPROVED".equals(existing.getStatus()) && !isAdmin) {
                        throw new com.hethongtruongthpt.exception.ApiException("Đánh giá hạnh kiểm đã được duyệt và khóa, không thể sửa đổi.");
                    }
                    existing.setXepLoai(hk.getXepLoai());
                    existing.setNhanXet(hk.getNhanXet());
                    existing.setNgayDanhGia(hk.getNgayDanhGia());
                    existing.setGiaoVien(hk.getGiaoVien());
                    existing.setStatus(hk.getStatus());
                    results.add(hanhKiemRepository.save(existing));
                } else {
                    results.add(hanhKiemRepository.save(hk));
                }
            }
        }
        return results;
    }

    private boolean isCurrentUserAdmin() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    /**
     * Tìm bản ghi hạnh kiểm đã tồn tại theo (học sinh + năm học + học kỳ).
     * Trả về null nếu không tìm thấy.
     */
    private HanhKiem findExisting(HanhKiem hk) {
        if (hk.getHocSinh() == null || hk.getHocSinh().getId() == null
                || hk.getNamHoc() == null || hk.getNamHoc().getId() == null
                || hk.getHocKy() == null) {
            return null;
        }
        return hanhKiemRepository
                .findByHocSinhIdAndNamHocIdAndHocKy(
                        hk.getHocSinh().getId(),
                        hk.getNamHoc().getId(),
                        hk.getHocKy())
                .orElse(null);
    }
}

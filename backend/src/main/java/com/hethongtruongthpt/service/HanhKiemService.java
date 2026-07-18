package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HanhKiem;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HanhKiemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class HanhKiemService {
    private final HanhKiemRepository hanhKiemRepository;

    public HanhKiemService(HanhKiemRepository hanhKiemRepository) {
        this.hanhKiemRepository = hanhKiemRepository;
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
        return hanhKiemRepository.findByHocSinhLopIdAndNamHocId(lopId, namHocId);
    }

    public List<HanhKiem> getByLop(Integer lopId) {
        return hanhKiemRepository.findByHocSinhLopId(lopId);
    }

    public HanhKiem create(HanhKiem hanhKiem) {
        if (hanhKiem == null) throw new IllegalArgumentException("Hạnh kiểm không được để trống");
        // Upsert: tìm bản ghi trùng (học sinh + năm học + học kỳ) → cập nhật thay vì tạo mới
        HanhKiem existing = findExisting(hanhKiem);
        if (existing != null) {
            boolean isAdmin = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
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
        boolean isAdmin = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities()
            .stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if ("APPROVED".equals(existing.getStatus()) && !isAdmin) {
            throw new com.hethongtruongthpt.exception.ApiException("Đánh giá hạnh kiểm đã được duyệt và khóa, không thể sửa đổi.");
        }
        hanhKiem.setId(id);
        return hanhKiemRepository.save(hanhKiem);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        HanhKiem existing = getById(id);
        boolean isAdmin = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities()
            .stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if ("APPROVED".equals(existing.getStatus()) && !isAdmin) {
            throw new com.hethongtruongthpt.exception.ApiException("Đánh giá hạnh kiểm đã được duyệt và khóa, không thể xóa.");
        }
        hanhKiemRepository.deleteById(id);
    }

    @Transactional
    public List<HanhKiem> saveAll(List<HanhKiem> hanhKiemList) {
        boolean isAdmin = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities()
            .stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
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

package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.LichThi;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.LichThiRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class LichThiService {
    private final LichThiRepository lichThiRepository;

    public LichThiService(LichThiRepository lichThiRepository) {
        this.lichThiRepository = lichThiRepository;
    }

    public List<LichThi> getAll() {
        return lichThiRepository.findAll();
    }

    public Page<LichThi> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("ngayThi").descending());
        return lichThiRepository.findAll(pageable);
    }

    public List<LichThi> getByLopId(Integer lopId) {
        return lichThiRepository.findByLopId(lopId);
    }

    public List<LichThi> getByNamHocAndHocKy(String namHoc, Integer hocKy) {
        return lichThiRepository.findByNamHocAndHocKy(namHoc, hocKy);
    }

    public LichThi getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return lichThiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch thi"));
    }

    @Transactional
    public LichThi create(LichThi lichThi) {
        if (lichThi == null) throw new ApiException("Lịch thi không được để trống");
        validateLichThi(lichThi);
        checkDuplicate(lichThi, null);
        checkRoomConflict(lichThi, null);
        return lichThiRepository.save(lichThi);
    }

    @Transactional
    public LichThi update(Integer id, LichThi lichThi) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        getById(id);
        validateLichThi(lichThi);
        checkDuplicate(lichThi, id);
        checkRoomConflict(lichThi, id);
        lichThi.setId(id);
        return lichThiRepository.save(lichThi);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        lichThiRepository.deleteById(id);
    }

    /**
     * Kiểm tra trùng lịch thi: cùng lớp, cùng môn, cùng loại kiểm tra, cùng học kỳ năm học
     */
    private void checkDuplicate(LichThi lichThi, Integer excludeId) {
        if (lichThi.getLop() == null || lichThi.getMonHoc() == null ||
            lichThi.getLoaiKiemTra() == null || lichThi.getHocKy() == null || lichThi.getNamHoc() == null) {
            return;
        }

        Optional<LichThi> existing = lichThiRepository.findByLopIdAndMonHocIdAndLoaiKiemTraAndHocKyAndNamHoc(
                lichThi.getLop().getId(),
                lichThi.getMonHoc().getId(),
                lichThi.getLoaiKiemTra(),
                lichThi.getHocKy(),
                lichThi.getNamHoc()
        );

        if (existing.isPresent() && (excludeId == null || !existing.get().getId().equals(excludeId))) {
            throw new ApiException(String.format(
                "Trùng lịch thi: Lớp %s đã có lịch %s môn %s học kỳ %d năm học %s",
                lichThi.getLop().getTenLop(),
                lichThi.getLoaiKiemTra(),
                lichThi.getMonHoc().getTenMon(),
                lichThi.getHocKy(),
                lichThi.getNamHoc()
            ));
        }
    }

    /**
     * Kiểm tra trùng phòng thi: cùng ngày, cùng giờ, cùng phòng
     */
    private void checkRoomConflict(LichThi lichThi, Integer excludeId) {
        if (lichThi.getNgayThi() == null || lichThi.getGioBatDau() == null ||
            lichThi.getPhongThi() == null || lichThi.getPhongThi().isBlank() ||
            lichThi.getThoiGianLamBai() == null) {
            return;
        }

        LocalTime gioKetThuc = lichThi.getGioBatDau().plusMinutes(lichThi.getThoiGianLamBai());
        LocalTime gioBatDauCheck = lichThi.getGioBatDau().minusMinutes(lichThi.getThoiGianLamBai());

        List<LichThi> conflicts = lichThiRepository.findConflictingRoom(
                lichThi.getNgayThi(),
                lichThi.getPhongThi(),
                gioBatDauCheck,
                gioKetThuc,
                lichThi.getGioBatDau()
        );

        for (LichThi conflict : conflicts) {
            if (excludeId != null && conflict.getId().equals(excludeId)) continue;

            // Kiểm tra xem có thực sự trùng giờ không
            LocalTime conflictEnd = conflict.getGioBatDau().plusMinutes(conflict.getThoiGianLamBai());
            boolean overlap = lichThi.getGioBatDau().isBefore(conflictEnd) &&
                             conflict.getGioBatDau().isBefore(gioKetThuc);

            if (overlap) {
                throw new ApiException(String.format(
                    "Trùng phòng thi: Phòng %s đã được sử dụng từ %s đến %s ngày %s",
                    lichThi.getPhongThi(),
                    conflict.getGioBatDau(),
                    conflictEnd,
                    lichThi.getNgayThi()
                ));
            }
        }
    }

    private void validateLichThi(LichThi lichThi) {
        if (lichThi.getLop() == null) throw new ApiException("Thiếu thông tin lớp");
        if (lichThi.getMonHoc() == null) throw new ApiException("Thiếu thông tin môn học");
        if (lichThi.getNgayThi() == null) throw new ApiException("Thiếu ngày thi");
        if (lichThi.getGioBatDau() == null) throw new ApiException("Thiếu giờ bắt đầu");
        if (lichThi.getThoiGianLamBai() == null || lichThi.getThoiGianLamBai() <= 0) {
            throw new ApiException("Thời gian làm bài phải lớn hơn 0");
        }
        if (lichThi.getHocKy() == null) throw new ApiException("Thiếu học kỳ");
        if (lichThi.getNamHoc() == null || lichThi.getNamHoc().isBlank()) throw new ApiException("Thiếu năm học");

        // Kiểm tra giám thị 1 và giám thị 2 không được trùng nhau
        if (lichThi.getGiamThi1() != null && lichThi.getGiamThi2() != null
                && lichThi.getGiamThi1().getId() != null
                && lichThi.getGiamThi1().getId().equals(lichThi.getGiamThi2().getId())) {
            throw new ApiException("Giám thị 1 và Giám thị 2 không được trùng nhau");
        }
    }
}

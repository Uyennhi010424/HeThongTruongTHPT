package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.NamHoc;
import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.NamHocRepository;
import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import com.hethongtruongthpt.util.SchoolWeekUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ThoiKhoaBieuCrudService {

    private final ThoiKhoaBieuRepository tkbRepo;
    private final NamHocRepository namHocRepo;
    private final com.hethongtruongthpt.repository.LichThiRepository lichThiRepo;

    public ThoiKhoaBieuCrudService(ThoiKhoaBieuRepository tkbRepo, NamHocRepository namHocRepo, com.hethongtruongthpt.repository.LichThiRepository lichThiRepo) {
        this.tkbRepo = tkbRepo;
        this.namHocRepo = namHocRepo;
        this.lichThiRepo = lichThiRepo;
    }

    public boolean isExamWeek(String namHoc, Integer tuan) {
        if (namHoc == null || tuan == null) return false;
        NamHoc year = namHocRepo.findByTenNamHoc(namHoc).orElse(null);
        if (year != null) {
            java.time.LocalDate schoolStart = year.getNgayBatDauHk1();
            if (schoolStart == null) {
                int startYear = Integer.parseInt(namHoc.split("-")[0]);
                schoolStart = java.time.LocalDate.of(startYear, 9, 5);
            }
            int dow = schoolStart.getDayOfWeek().getValue();
            java.time.LocalDate monday = schoolStart.minusDays(dow == 7 ? 6 : dow - 1);
            java.time.LocalDate weekMonday = monday.plusDays((tuan - 1) * 7);
            List<com.hethongtruongthpt.entity.LichThi> exams = lichThiRepo.findByNgayThiBetween(weekMonday, weekMonday.plusDays(6));
            if (exams != null && !exams.isEmpty()) {
                return true;
            }
        }
        return false;
    }

    public void validateTuanInHocKy(String namHoc, Integer hocKy, Integer tuan) {
        if (tuan == null || tuan < 1) throw new ApiException("Thiếu số tuần");
        NamHoc year = namHocRepo.findByTenNamHoc(namHoc)
                .orElseThrow(() -> new ApiException("Không tìm thấy năm học"));
        if (!SchoolWeekUtils.isWeekInSemester(year, hocKy, tuan)) {
            throw new ApiException("Không thể tạo thời khóa biểu không nằm trong học kì");
        }
    }

    @Transactional(readOnly = true)
    public List<ThoiKhoaBieu> getAll() {
        return tkbRepo.findAll();
    }

    @Transactional(readOnly = true)
    public List<ThoiKhoaBieu> getByFilter(Integer lopId, String namHoc, Integer hocKy, Integer tuan) {
        if (tuan == null) {
            if (lopId != null && namHoc != null && hocKy != null)
                return tkbRepo.findByLopIdAndHocKyAndNamHoc(lopId, hocKy, namHoc);
            else if (namHoc != null && hocKy != null)
                return tkbRepo.findByNamHocAndHocKy(namHoc, hocKy);
            else if (lopId != null)
                return tkbRepo.findByLopId(lopId);
            else
                return getAll();
        }

        Integer mappedTuan = (tuan % 2 != 0) ? 1 : 2;

        List<ThoiKhoaBieu> allSlots;
        if (lopId != null && namHoc != null && hocKy != null)
            allSlots = tkbRepo.findByLopIdAndHocKyAndNamHocAndTuan(lopId, hocKy, namHoc, tuan);
        else if (lopId != null && namHoc != null)
            allSlots = tkbRepo.findByLopIdAndNamHocAndTuan(lopId, namHoc, tuan);
        else if (lopId != null)
            allSlots = tkbRepo.findByLopIdAndTuan(lopId, tuan);
        else if (namHoc != null && hocKy != null)
            allSlots = tkbRepo.findByNamHocAndHocKyAndTuan(namHoc, hocKy, tuan);
        else
            allSlots = tkbRepo.findAll();

        if (allSlots == null) allSlots = new java.util.ArrayList<>();

        List<ThoiKhoaBieu> teacherSlots = allSlots.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsLocked()))
                .collect(java.util.stream.Collectors.toList());

        List<ThoiKhoaBieu> systemSlots = allSlots.stream()
                .filter(t -> !Boolean.TRUE.equals(t.getIsLocked()))
                .collect(java.util.stream.Collectors.toList());

        boolean isExamWeek = isExamWeek(namHoc, tuan);

        // Nếu systemSlots trống (ví dụ tuần > 2 chưa sinh TKB tự động), fallback lấy từ tuần mẫu (mappedTuan 1 hoặc 2)
        // Tuy nhiên, nếu là tuần thi thì KHÔNG ĐƯỢC fallback để hiện TKB trống
        if (systemSlots.isEmpty() && !tuan.equals(mappedTuan) && !isExamWeek) {
            List<ThoiKhoaBieu> fallbackSlots;
            if (lopId != null && namHoc != null && hocKy != null)
                fallbackSlots = tkbRepo.findByLopIdAndHocKyAndNamHocAndTuan(lopId, hocKy, namHoc, mappedTuan);
            else if (lopId != null && namHoc != null)
                fallbackSlots = tkbRepo.findByLopIdAndNamHocAndTuan(lopId, namHoc, mappedTuan);
            else if (lopId != null)
                fallbackSlots = tkbRepo.findByLopIdAndTuan(lopId, mappedTuan);
            else if (namHoc != null && hocKy != null)
                fallbackSlots = tkbRepo.findByNamHocAndHocKyAndTuan(namHoc, hocKy, mappedTuan);
            else
                fallbackSlots = new java.util.ArrayList<>();

            systemSlots = fallbackSlots.stream()
                    .filter(t -> !Boolean.TRUE.equals(t.getIsLocked()))
                    .collect(java.util.stream.Collectors.toList());
        }

        List<ThoiKhoaBieu> all = new java.util.ArrayList<>();
        all.addAll(systemSlots);
        all.addAll(teacherSlots);

        for (ThoiKhoaBieu tkb : all) {
            tkb.setTuan(tuan);
        }
        return all;
    }

    @Transactional(readOnly = true)
    public ThoiKhoaBieu getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return tkbRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
    }

    public ThoiKhoaBieu create(ThoiKhoaBieu entity) {
        if (entity == null) throw new IllegalArgumentException("Thời khóa biểu không được để trống");
        if (entity.getTuan() != null) {
            entity.setTuan(entity.getTuan() % 2 != 0 ? 1 : 2);
        }
        return tkbRepo.save(entity);
    }

    public ThoiKhoaBieu update(Integer id, ThoiKhoaBieu updatedEntity) {
        getById(id);
        updatedEntity.setId(id);
        if (updatedEntity.getTuan() != null) {
            updatedEntity.setTuan(updatedEntity.getTuan() % 2 != 0 ? 1 : 2);
        }
        return tkbRepo.save(updatedEntity);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        tkbRepo.deleteById(id);
    }

    public long deleteByNamHocAndHocKy(String namHoc, Integer hocKy) {
        if (namHoc == null || namHoc.isBlank()) {
            throw new ApiException("namHoc là bắt buộc để xóa TKB");
        }
        List<ThoiKhoaBieu> list;
        if (hocKy != null && hocKy > 0) {
            list = tkbRepo.findByNamHocAndHocKy(namHoc, hocKy);
        } else {
            list = tkbRepo.findAll().stream()
                    .filter(t -> namHoc.equals(t.getNamHoc()))
                    .toList();
        }
        long count = list.size();
        if (count > 0) tkbRepo.deleteAll(list);
        return count;
    }

    @Transactional
    public ThoiKhoaBieu moveEntry(Integer id, Integer thu, Integer tietBatDau) {
        if (id == null || thu == null || tietBatDau == null)
            throw new ApiException("Thiếu thông tin: id, thu, tietBatDau");
        if (thu < 2 || thu > 7) throw new ApiException("Thứ phải từ 2-7");
        if (tietBatDau < 1 || tietBatDau > 10) throw new ApiException("Tiết phải từ 1-10");

        ThoiKhoaBieu entry = getById(id);
        Integer lopId = entry.getLop().getId();
        int soTiet = entry.getSoTiet() != null ? entry.getSoTiet() : 1;
        if (tietBatDau + soTiet - 1 > 10) {
            throw new ApiException("Tiết vượt quá phạm vi (1-10)");
        }

        // Fetch all TKB items for this class in this specific week
        List<ThoiKhoaBieu> existingList = tkbRepo.findByLopIdAndHocKyAndNamHocAndTuan(
            lopId, entry.getHocKy(), entry.getNamHoc(), entry.getTuan()
        );

        int newStart = tietBatDau;
        int newEnd = tietBatDau + soTiet - 1;

        for (ThoiKhoaBieu e : existingList) {
            if (e.getId().equals(id)) continue;
            if (e.getThu() != null && e.getThu().equals(thu)) {
                int eStart = e.getTietBatDau() != null ? e.getTietBatDau() : 1;
                int eSoTiet = e.getSoTiet() != null ? e.getSoTiet() : 1;
                int eEnd = eStart + eSoTiet - 1;

                if (Math.max(eStart, newStart) <= Math.min(eEnd, newEnd)) {
                    throw new ApiException("Mục này chồng lấn với " + e.getMonHoc().getTenMon() + " (Thứ " + thu + " Tiết " + eStart + "-" + eEnd + ")");
                }
            }
        }

        entry.setThu(thu);
        entry.setTietBatDau(tietBatDau);
        return tkbRepo.save(entry);
    }

    @Transactional
    public Map<String, ThoiKhoaBieu> swapEntries(Integer id1, Integer id2) {
        if (id1 == null || id2 == null) throw new ApiException("Thiếu ID");
        if (id1.equals(id2)) throw new ApiException("Không thể hoán đổi cùng mục");

        ThoiKhoaBieu entry1 = getById(id1);
        ThoiKhoaBieu entry2 = getById(id2);

        Integer thu1 = entry1.getThu(), tiet1 = entry1.getTietBatDau();
        Integer thu2 = entry2.getThu(), tiet2 = entry2.getTietBatDau();

        entry1.setThu(thu2); entry1.setTietBatDau(tiet2);
        entry2.setThu(thu1); entry2.setTietBatDau(tiet1);

        tkbRepo.save(entry1); tkbRepo.save(entry2);

        Map<String, ThoiKhoaBieu> result = new HashMap<>();
        result.put("entry1", entry1);
        result.put("entry2", entry2);
        return result;
    }
}


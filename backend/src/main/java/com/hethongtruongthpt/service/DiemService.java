package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.Diem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DiemService {

    private final DiemCrudService diemCrudService;
    private final DiemCalculationService diemCalculationService;

    public DiemService(DiemCrudService diemCrudService, DiemCalculationService diemCalculationService) {
        this.diemCrudService = diemCrudService;
        this.diemCalculationService = diemCalculationService;
    }

    public List<Diem> getAll() {
        return diemCrudService.getAll();
    }

    public List<Diem> getByHocKyAndNamHoc(Integer hocKy, String namHoc) {
        return diemCrudService.getByHocKyAndNamHoc(hocKy, namHoc);
    }

    public List<Diem> getByHocSinhLopIdAndHocKyAndNamHoc(Integer lopId, Integer hocKy, String namHoc) {
        return diemCrudService.getByHocSinhLopIdAndHocKyAndNamHoc(lopId, hocKy, namHoc);
    }

    public List<Diem> getByNamHoc(String namHoc) {
        return diemCrudService.getByNamHoc(namHoc);
    }

    public List<Diem> getByHocSinhId(Integer hocSinhId) {
        return diemCrudService.getByHocSinhId(hocSinhId);
    }

    @Transactional
    @CacheEvict(value = "dashboardStats", allEntries = true)
    public long deleteByNamHocAndHocKy(String namHoc, Integer hocKy) {
        return diemCrudService.deleteByNamHocAndHocKy(namHoc, hocKy);
    }

    public List<Map<String, Object>> getSummaryByNamHoc(String namHoc) {
        return diemCalculationService.getSummaryByNamHoc(namHoc);
    }

    public List<Map<String, Object>> getSummaryByNamHocAndLopId(String namHoc, Integer lopId) {
        return diemCalculationService.getSummaryByNamHocAndLopId(namHoc, lopId);
    }

    public com.hethongtruongthpt.dto.ClassScoreboardDTO getClassScoreboard(String namHoc, Integer hocKy, Integer lopId) {
        return diemCalculationService.getClassScoreboard(namHoc, hocKy, lopId);
    }

    public List<Map<String, Object>> getSummaryByNamHocAndHocKy(String namHoc, Integer hocKy) {
        return diemCalculationService.getSummaryByNamHocAndHocKy(namHoc, hocKy);
    }

    public List<com.hethongtruongthpt.dto.DiemProgressDTO> getProgressSummary(String namHoc, Integer hocKy) {
        return diemCalculationService.getProgressSummary(namHoc, hocKy);
    }

    public List<Map<String, Object>> getClassProgressSummary(String namHoc, Integer hocKy, Integer lopId) {
        return diemCrudService.getClassProgressSummary(namHoc, hocKy, lopId);
    }

    public List<Map<String, Object>> getSummaryAll() {
        return diemCalculationService.getSummaryAll();
    }

    public List<Map<String, Object>> getTeacherReportStats(String namHoc, Integer giaoVienId) {
        return diemCalculationService.getTeacherReportStats(namHoc, giaoVienId);
    }

    public List<Map<String, Object>> getAvgByGrade(String namHoc) {
        return diemCalculationService.getAvgByGrade(namHoc);
    }

    public Map<String, Object> getDistribution(String namHoc, Integer hocKy, Integer khoi) {
        return diemCalculationService.getDistribution(namHoc, hocKy, khoi);
    }

    public List<Diem> getByGiaoVienNhapIdAndHocKyAndNamHoc(Integer giaoVienNhapId, Integer hocKy, String namHoc) {
        return diemCrudService.getByGiaoVienNhapIdAndHocKyAndNamHoc(giaoVienNhapId, hocKy, namHoc);
    }

    public List<Diem> getByGiaoVienNhapIdAndNamHoc(Integer giaoVienNhapId, String namHoc) {
        return diemCrudService.getByGiaoVienNhapIdAndNamHoc(giaoVienNhapId, namHoc);
    }

    public Diem getById(Integer id) {
        return diemCrudService.getById(id);
    }

    @Transactional
    @CacheEvict(value = "dashboardStats", allEntries = true)
    public Diem create(Diem diem) {
        return diemCrudService.create(diem);
    }

    @Transactional
    @CacheEvict(value = "dashboardStats", allEntries = true)
    public Diem update(Integer id, Diem diem) {
        return diemCrudService.update(id, diem);
    }

    @Transactional
    @CacheEvict(value = "dashboardStats", allEntries = true)
    public void delete(Integer id) {
        diemCrudService.delete(id);
    }

    @Transactional
    @CacheEvict(value = "dashboardStats", allEntries = true)
    public List<Diem> saveAll(List<Diem> diemList) {
        return diemCrudService.saveAll(diemList);
    }
}

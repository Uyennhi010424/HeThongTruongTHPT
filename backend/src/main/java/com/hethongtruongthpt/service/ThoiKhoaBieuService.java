package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ThoiKhoaBieuService {

    private final ThoiKhoaBieuCrudService crudService;
    private final ThoiKhoaBieuGeneratorService generatorService;

    public ThoiKhoaBieuService(ThoiKhoaBieuCrudService crudService, ThoiKhoaBieuGeneratorService generatorService) {
        this.crudService = crudService;
        this.generatorService = generatorService;
    }

    @Transactional(readOnly = true)
    public List<ThoiKhoaBieu> getAll() {
        return crudService.getAll();
    }

    @Transactional(readOnly = true)
    public List<ThoiKhoaBieu> getByFilter(Integer lopId, String namHoc, Integer hocKy, Integer tuan) {
        return crudService.getByFilter(lopId, namHoc, hocKy, tuan);
    }

    @Transactional(readOnly = true)
    public ThoiKhoaBieu getById(Integer id) {
        return crudService.getById(id);
    }

    public boolean isExamWeek(String namHoc, Integer tuan) {
        return crudService.isExamWeek(namHoc, tuan);
    }

    public ThoiKhoaBieu create(ThoiKhoaBieu entity) {
        return crudService.create(entity);
    }

    public ThoiKhoaBieu update(Integer id, ThoiKhoaBieu updatedEntity) {
        return crudService.update(id, updatedEntity);
    }

    public void delete(Integer id) {
        crudService.delete(id);
    }

    public long deleteByNamHocAndHocKy(String namHoc, Integer hocKy) {
        return crudService.deleteByNamHocAndHocKy(namHoc, hocKy);
    }

    @Transactional
    public ThoiKhoaBieu moveEntry(Integer id, Integer thu, Integer tietBatDau) {
        return crudService.moveEntry(id, thu, tietBatDau);
    }

    @Transactional
    public Map<String, ThoiKhoaBieu> swapEntries(Integer id1, Integer id2) {
        return crudService.swapEntries(id1, id2);
    }

    @Transactional
    public ThoiKhoaBieuGeneratorService.GenerateResult generateSchedule(String namHoc, Integer hocKy, Integer soTuan) {
        return generatorService.generateSchedule(namHoc, hocKy, soTuan);
    }

    @Transactional
    public ThoiKhoaBieuGeneratorService.GenerateResult generateSchedule(String namHoc, Integer hocKy) {
        return generatorService.generateSchedule(namHoc, hocKy);
    }

    @Transactional
    public ThoiKhoaBieuGeneratorService.GenerateResult generateScheduleForWeek(String namHoc, Integer hocKy, Integer tuan) {
        return generatorService.generateScheduleForWeek(namHoc, hocKy, tuan);
    }

    @Transactional
    public ThoiKhoaBieuGeneratorService.GenerateResult shuffleSchedule(String namHoc, Integer hocKy, Integer tuan) {
        return generatorService.shuffleSchedule(namHoc, hocKy, tuan);
    }
}
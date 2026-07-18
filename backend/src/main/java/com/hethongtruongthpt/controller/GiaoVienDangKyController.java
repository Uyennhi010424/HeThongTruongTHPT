package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.ThoiKhoaBieu;
import com.hethongtruongthpt.entity.TkbDayThay;
import com.hethongtruongthpt.service.GiaoVienDangKyService;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/giaoviendangky")
@PreAuthorize("hasRole('GIAO_VIEN')")
public class GiaoVienDangKyController {

    private final GiaoVienDangKyService service;

    public GiaoVienDangKyController(GiaoVienDangKyService service) {
        this.service = service;
    }

    @GetMapping("/lich-ban")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLichBan(
            @RequestParam(required = false, defaultValue = "1") Integer tuan) {
        return ResponseEntity.ok(ApiResponse.ok(service.getLichBan(tuan)));
    }

    @PostMapping("/lich-ban")
    public ResponseEntity<ApiResponse<Object>> dangKyLichBan(
            @RequestParam(required = false, defaultValue = "1") Integer tuan,
            @RequestBody List<Map<String, Integer>> slots) {
        service.dangKyLichBan(tuan, slots);
        return ResponseEntity.ok(ApiResponse.ok("Đăng ký lịch bận thành công", null));
    }

    @GetMapping("/thoikhoabieu")
    public ResponseEntity<ApiResponse<List<ThoiKhoaBieu>>> getThoiKhoaBieu(
            @RequestParam String namHoc,
            @RequestParam Integer hocKy,
            @RequestParam Integer tuan) {
        return ResponseEntity.ok(ApiResponse.ok(service.getThoiKhoaBieu(namHoc, hocKy, tuan)));
    }

    @GetMapping("/lop-cua-toi")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyClasses(
            @RequestParam String namHoc,
            @RequestParam Integer hocKy) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyClasses(namHoc, hocKy)));
    }

    @PostMapping("/thoikhoabieu/dangky")
    public ResponseEntity<ApiResponse<ThoiKhoaBieu>> dangKyLichDay(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng ký tiết dạy thành công", service.dangKyLichDay(body)));
    }

    @DeleteMapping("/thoikhoabieu/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteLichDay(@PathVariable Integer id) {
        service.deleteLichDay(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa đăng ký tiết dạy thành công", null));
    }

    @GetMapping("/day-thay/trong")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTkbDayThayTrong(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay,
            @RequestParam String namHoc,
            @RequestParam Integer hocKy,
            @RequestParam Integer tuan) {
        return ResponseEntity.ok(ApiResponse.ok(service.getTkbDayThayTrong(ngay, namHoc, hocKy, tuan)));
    }

    @PostMapping("/day-thay/dangky")
    public ResponseEntity<ApiResponse<TkbDayThay>> dangKyDayThay(
            @RequestParam Integer tkbId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng ký dạy thay thành công", service.dangKyDayThay(tkbId, ngay)));
    }

    @DeleteMapping("/day-thay/{id}")
    public ResponseEntity<ApiResponse<Object>> huyDangKyDayThay(@PathVariable Integer id) {
        service.huyDangKyDayThay(id);
        return ResponseEntity.ok(ApiResponse.ok("Hủy ca dạy thay thành công", null));
    }

    @GetMapping("/day-thay/cua-toi")
    public ResponseEntity<ApiResponse<List<TkbDayThay>>> getLichDayThayCuaToi(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay,
            @RequestParam(required = false) String namHoc) {
        return ResponseEntity.ok(ApiResponse.ok(service.getLichDayThayCuaToi(ngay, namHoc)));
    }

    @PostMapping("/thoikhoabieu/doi-lich")
    public ResponseEntity<ApiResponse<ThoiKhoaBieu>> doiLichDay(
            @RequestParam Integer sourceId,
            @RequestParam(required = false) Integer targetThu,
            @RequestParam(required = false) Integer targetTiet,
            @RequestParam(required = false) Integer targetId) {
        return ResponseEntity.ok(ApiResponse.ok("Đổi lịch dạy thành công", service.doiLichDay(sourceId, targetThu, targetTiet, targetId)));
    }

    @PutMapping("/thoikhoabieu/{id}/note")
    public ResponseEntity<ApiResponse<ThoiKhoaBieu>> updateGhiChu(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String ghiChu = body.get("ghiChu");
        return ResponseEntity.ok(ApiResponse.ok(service.updateGhiChu(id, ghiChu)));
    }
}

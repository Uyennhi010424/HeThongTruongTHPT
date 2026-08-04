package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.dto.baikiemtra.*;
import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.service.BaiKiemTraService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/baikiemtra")
@CrossOrigin("*")
public class BaiKiemTraController {
    
    private final BaiKiemTraService baiKiemTraService;
    
    public BaiKiemTraController(BaiKiemTraService baiKiemTraService) {
        this.baiKiemTraService = baiKiemTraService;
    }
    
    // --- Teacher APIs ---
    
    @GetMapping("/teacher")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<List<BaiKiemTraDTO>>> getExamsByAuth(org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách bài kiểm tra thành công", baiKiemTraService.getExamsByUsername(auth.getName())));
    }

    @GetMapping("/teacher/{giaoVienId:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<List<BaiKiemTraDTO>>> getExamsByTeacher(@PathVariable Integer giaoVienId) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách bài kiểm tra thành công", baiKiemTraService.getExamsByTeacher(giaoVienId)));
    }

    @GetMapping("/teacher/metadata")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<TeacherMetadataDTO>> getTeacherMetadataByAuth(org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy metadata thành công", baiKiemTraService.getTeacherMetadataByUsername(auth.getName())));
    }

    @GetMapping("/teacher/{giaoVienId:\\d+}/metadata")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<TeacherMetadataDTO>> getTeacherMetadata(@PathVariable Integer giaoVienId) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy metadata thành công", baiKiemTraService.getTeacherMetadata(giaoVienId)));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<BaiKiemTraDTO>> createExam(@RequestBody BaiKiemTraDTO dto, org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Tạo bài kiểm tra thành công", baiKiemTraService.createExamByAuth(dto, auth.getName())));
    }
    
    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable Integer id) {
        baiKiemTraService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa bài kiểm tra thành công", null));
    }
    
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<BaiKiemTraDTO>> getExamDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết bài kiểm tra thành công", baiKiemTraService.getExamDetail(id)));
    }
    
    @PostMapping("/{id:\\d+}/cauhoi")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<Void>> addQuestion(@PathVariable Integer id, @RequestBody CauHoiDTO dto) {
        baiKiemTraService.addQuestionToExam(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Thêm câu hỏi thành công", null));
    }

    @PutMapping("/cauhoi/{cauHoiId:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<Void>> editQuestion(@PathVariable Integer cauHoiId, @RequestBody CauHoiDTO dto) {
        baiKiemTraService.editQuestion(cauHoiId, dto);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật câu hỏi thành công", null));
    }

    @DeleteMapping("/cauhoi/{cauHoiId:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable Integer cauHoiId) {
        baiKiemTraService.deleteQuestion(cauHoiId);
        return ResponseEntity.ok(ApiResponse.ok("Xóa câu hỏi thành công", null));
    }
    
    @GetMapping("/teacher/exam/{examId:\\d+}/attempts")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<List<BaiLamDTO>>> getAttemptsForExam(@PathVariable Integer examId) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách bài làm thành công", baiKiemTraService.getAttemptsForExam(examId)));
    }

    @GetMapping("/teacher/attempt/{attemptId:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
    public ResponseEntity<ApiResponse<BaiLamDTO>> getAttemptDetailByAttemptId(@PathVariable Integer attemptId) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết bài làm thành công", baiKiemTraService.getAttemptDetailByAttemptId(attemptId)));
    }
    
    // --- Student APIs ---
    
    @GetMapping("/student")
    @PreAuthorize("hasRole('HOC_SINH')")
    public ResponseEntity<ApiResponse<List<BaiKiemTraDTO>>> getExamsForStudent(org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách bài kiểm tra thành công", baiKiemTraService.getExamsForStudent(auth.getName())));
    }

    @GetMapping("/student/{id:\\d+}")
    @PreAuthorize("hasRole('HOC_SINH')")
    public ResponseEntity<ApiResponse<BaiKiemTraDTO>> getExamDetailForStudent(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết bài kiểm tra thành công", baiKiemTraService.getExamDetailForStudent(id)));
    }

    @GetMapping("/student/{id:\\d+}/result")
    @PreAuthorize("hasRole('HOC_SINH')")
    public ResponseEntity<ApiResponse<BaiLamDTO>> getExamResultForStudent(@PathVariable Integer id, org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Lấy kết quả bài kiểm tra thành công", baiKiemTraService.getExamResultForStudent(id, auth.getName())));
    }

    @PostMapping("/{id:\\d+}/start")
    @PreAuthorize("hasRole('HOC_SINH')")
    public ResponseEntity<ApiResponse<BaiLamDTO>> startAttempt(
            @PathVariable Integer id, 
            @RequestParam(required = false) String sessionToken,
            org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Bắt đầu làm bài thành công", baiKiemTraService.startAttemptByAuth(id, auth.getName(), sessionToken)));
    }
    
    @GetMapping("/attempt/{attemptId:\\d+}/check-session")
    @PreAuthorize("hasRole('HOC_SINH')")
    public ResponseEntity<ApiResponse<Boolean>> checkSession(
            @PathVariable Integer attemptId, 
            @RequestParam String sessionToken) {
        boolean isValid = baiKiemTraService.checkSession(attemptId, sessionToken);
        return ResponseEntity.ok(ApiResponse.ok("Check session", isValid));
    }
    
    @PostMapping("/submit/{attemptId:\\d+}")
    @PreAuthorize("hasRole('HOC_SINH')")
    public ResponseEntity<ApiResponse<BaiLamDTO>> submitAttempt(
            @PathVariable Integer attemptId,
            @RequestBody List<ChiTietBaiLamDTO> answers,
            @RequestParam(defaultValue = "false") boolean isAntiCheat) {
        return ResponseEntity.ok(ApiResponse.ok("Nộp bài thành công", baiKiemTraService.submitAttempt(attemptId, answers, isAntiCheat)));
    }
}

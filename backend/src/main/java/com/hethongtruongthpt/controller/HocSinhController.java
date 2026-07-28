package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.service.HocSinhService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.hethongtruongthpt.dto.hocsinh.HocSinhResponseDTO;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.PhanCongDay;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.PhanCongDayRepository;
import org.springframework.security.access.AccessDeniedException;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.List;

@RestController
@RequestMapping("/api/hocsinh")
public class HocSinhController {
	private static final Logger log = LoggerFactory.getLogger(HocSinhController.class);
	private final HocSinhService hocSinhService;
	private final com.hethongtruongthpt.service.DashboardService dashboardService;
	private final UserRepository userRepository;
	private final GiaoVienRepository giaoVienRepository;
	private final PhanCongDayRepository phanCongDayRepository;

	public HocSinhController(HocSinhService hocSinhService, com.hethongtruongthpt.service.DashboardService dashboardService, UserRepository userRepository, GiaoVienRepository giaoVienRepository, PhanCongDayRepository phanCongDayRepository) {
		this.hocSinhService = hocSinhService;
		this.dashboardService = dashboardService;
		this.userRepository = userRepository;
		this.giaoVienRepository = giaoVienRepository;
		this.phanCongDayRepository = phanCongDayRepository;
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
	@GetMapping
	public ResponseEntity<ApiResponse<?>> getAll(
			@RequestParam(value = "keyword", required = false) String keyword,
			@RequestParam(value = "lopId", required = false) Integer lopId,
			@RequestParam(value = "khoi", required = false) Integer khoi,
			@RequestParam(value = "page", required = false) Integer page,
			@RequestParam(value = "size", required = false) Integer size) {


		// Nếu có phân trang
		if (page != null && size != null) {
			Page<HocSinh> result = hocSinhService.search(
				keyword != null ? keyword : "", lopId, khoi, page, size);
			Map<String, Object> body = new HashMap<>();
			body.put("content", result.getContent().stream().map(HocSinhResponseDTO::fromEntity).collect(Collectors.toList()));
			body.put("totalElements", result.getTotalElements());
			body.put("totalPages", result.getTotalPages());
			body.put("currentPage", result.getNumber());
			body.put("pageSize", result.getSize());
			return ResponseEntity.ok(ApiResponse.ok(body));
		}

		// Nếu có lopId (không phân trang)
		if (lopId != null) {
			List<HocSinhResponseDTO> list = hocSinhService.getByLopId(lopId).stream().map(HocSinhResponseDTO::fromEntity).collect(Collectors.toList());
			return ResponseEntity.ok(ApiResponse.ok(list));
		}

		// Fallback an toàn (thực tế sẽ không bao giờ lọt xuống đây vì đã ép page=0 ở trên)
		List<HocSinhResponseDTO> list = hocSinhService.getAll().stream().map(HocSinhResponseDTO::fromEntity).collect(Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok(list));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@GetMapping("/stats")
	public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
		Map<String, Long> stats = new LinkedHashMap<>();
		long total = hocSinhService.countByTrangThai(1) + hocSinhService.countByTrangThai(0);
		long active = hocSinhService.countByTrangThai(1);
		long paused = hocSinhService.countByTrangThai(0);
		stats.put("total", total);
		stats.put("active", active);
		stats.put("paused", paused);
		return ResponseEntity.ok(ApiResponse.ok(stats));
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/me")
	public ResponseEntity<ApiResponse<HocSinhResponseDTO>> getCurrentStudent() {
		try {
			String username = SecurityContextHolder.getContext().getAuthentication().getName();
			if (username == null || username.equals("anonymousUser")) {
				return ResponseEntity.ok(ApiResponse.ok(null));
			}
			HocSinh hocSinh = hocSinhService.getByUsername(username);
			return ResponseEntity.ok(ApiResponse.ok(HocSinhResponseDTO.fromEntity(hocSinh)));
		} catch (Exception ex) {
			log.warn("Không thể lấy thông tin học sinh hiện tại: {}", ex.getMessage());
			return ResponseEntity.ok(ApiResponse.ok(null));
		}
	}

	@PreAuthorize("hasRole('HOC_SINH')")
	@GetMapping("/me/dashboard")
	public ResponseEntity<ApiResponse<com.hethongtruongthpt.dto.hocsinh.DashboardDataDTO>> getStudentDashboard() {
		try {
			String username = SecurityContextHolder.getContext().getAuthentication().getName();
			if (username == null || username.equals("anonymousUser")) {
				return ResponseEntity.ok(ApiResponse.ok(null));
			}
			return ResponseEntity.ok(ApiResponse.ok(dashboardService.getStudentDashboard(username)));
		} catch (Exception ex) {
			log.error("Lỗi khi lấy dashboard data: ", ex);
			return ResponseEntity.ok(ApiResponse.ok(null));
		}
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<HocSinhResponseDTO>> getById(@PathVariable("id") Integer id) {
		HocSinh hs = hocSinhService.getById(id);
		
		org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isGiaoVien = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GIAO_VIEN"));
		boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
		
		if (isGiaoVien && !isAdmin) {
			String username = auth.getName();
			User user = userRepository.findByUsername(username).orElse(null);
			if (user != null) {
				GiaoVien gv = giaoVienRepository.findByUserId(user.getId()).orElse(null);
				if (gv != null && hs.getLop() != null) {
					Integer lopId = hs.getLop().getId();
					boolean isGvcn = hs.getLop().getGvcn() != null && hs.getLop().getGvcn().getId().equals(gv.getId());
					boolean isGiangDay = phanCongDayRepository.existsByLopIdAndGiaoVienId(lopId, gv.getId());
					if (!isGvcn && !isGiangDay) {
						throw new AccessDeniedException("Bạn không có quyền xem thông tin học sinh không thuộc lớp mình quản lý.");
					}
				}
			}
		}
		
		return ResponseEntity.ok(ApiResponse.ok(HocSinhResponseDTO.fromEntity(hs)));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@PostMapping
	public ResponseEntity<ApiResponse<HocSinhResponseDTO>> create(@Valid @RequestBody HocSinh hocSinh) {
		return ResponseEntity.ok(ApiResponse.ok(HocSinhResponseDTO.fromEntity(hocSinhService.create(hocSinh))));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH')")
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<HocSinhResponseDTO>> update(@PathVariable("id") Integer id, @Valid @RequestBody HocSinh hocSinh) {
		return ResponseEntity.ok(ApiResponse.ok(HocSinhResponseDTO.fromEntity(hocSinhService.update(id, hocSinh))));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN')")
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") Integer id) {
		hocSinhService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Đã ngừng học cho học sinh", null));
	}

	@PreAuthorize("hasAnyRole('ADMIN')")
	@PostMapping("/{id:\\d+}/tot-nghiep")
	public ResponseEntity<ApiResponse<Object>> markGraduated(@PathVariable("id") Integer id) {
		hocSinhService.markGraduated(id);
		return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu tốt nghiệp cho học sinh", null));
	}

	@PreAuthorize("hasAnyRole('ADMIN')")
	@PostMapping("/tot-nghiep-lop12")
	public ResponseEntity<ApiResponse<Object>> markAllGrade12Graduated() {
		int count = hocSinhService.markAllGrade12Graduated();
		return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu tốt nghiệp cho " + count + " học sinh lớp 12", null));
	}
}

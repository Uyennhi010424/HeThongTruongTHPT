package com.hethongtruongthpt.controller;

import com.hethongtruongthpt.common.ApiResponse;
import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.service.NotificationService;
import com.hethongtruongthpt.service.ThongBaoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/thongbao")
@PreAuthorize("hasAnyRole('ADMIN', 'GIAO_VIEN', 'HOC_SINH', 'PHU_HUYNH')")
public class ThongBaoController {
	private final ThongBaoService thongBaoService;
	private final NotificationService notificationService;
	private final UserRepository userRepository;

	public ThongBaoController(ThongBaoService thongBaoService,
							  NotificationService notificationService,
							  UserRepository userRepository) {
		this.thongBaoService = thongBaoService;
		this.notificationService = notificationService;
		this.userRepository = userRepository;
	}

	/** Lấy user hiện tại từ SecurityContext */
	private User getCurrentUser() {
		String username = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByUsername(username).orElse(null);
	}

	@GetMapping
	public ResponseEntity<ApiResponse<?>> getAll(
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size) {
		if (page != null && size != null) {
			Page<ThongBao> result = thongBaoService.getAllPaged(page, size);
			return ResponseEntity.ok(ApiResponse.ok(result));
		}
		return ResponseEntity.ok(ApiResponse.ok(thongBaoService.getAll()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<ThongBao>> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.ok(thongBaoService.getById(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<ThongBao>> create(
			@Valid @RequestBody ThongBao thongBao,
			@RequestParam(defaultValue = "false") boolean sendSms) {
		if (thongBao.getNguoiTao() == null) {
			User currentUser = getCurrentUser();
			if (currentUser != null) {
				thongBao.setNguoiTao(currentUser);
				// Ghi nhận role người tạo
				if (thongBao.getSenderRole() == null) {
					String role = currentUser.getRole() != null ? currentUser.getRole().name() : null;
					thongBao.setSenderRole(role);
				}
			}
		}
		ThongBao saved = notificationService.createThongBaoWithSms(thongBao, sendSms);
		return ResponseEntity.ok(ApiResponse.ok(saved));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<ThongBao>> update(@PathVariable Integer id, @Valid @RequestBody ThongBao thongBao) {
		return ResponseEntity.ok(ApiResponse.ok(thongBaoService.update(id, thongBao)));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) {
		thongBaoService.delete(id);
		return ResponseEntity.ok(ApiResponse.ok("Xóa thành công", null));
	}

	// ─── Reply / Thread endpoints ─────────────────────────────────────

	/**
	 * Phản hồi (reply) một thông báo.
	 * POST /api/thongbao/reply/{parentId}
	 * Body: { tieuDe, noiDung }
	 */
	@PostMapping("/reply/{parentId}")
	public ResponseEntity<ApiResponse<ThongBao>> reply(
			@PathVariable Integer parentId,
			@RequestBody ThongBao reply) {
		User currentUser = getCurrentUser();
		if (currentUser != null) {
			reply.setNguoiTao(currentUser);
			if (reply.getSenderRole() == null) {
				String role = currentUser.getRole() != null ? currentUser.getRole().name() : null;
				reply.setSenderRole(role);
			}
		}
		ThongBao saved = thongBaoService.replyToThongBao(parentId, reply);
		return ResponseEntity.ok(ApiResponse.ok(saved));
	}

	/**
	 * Lấy toàn bộ thread của một thông báo (root + tất cả replies).
	 * GET /api/thongbao/thread/{id}
	 */
	@GetMapping("/thread/{id}")
	public ResponseEntity<ApiResponse<List<ThongBao>>> getThread(@PathVariable Integer id) {
		List<ThongBao> thread = thongBaoService.getThread(id);
		return ResponseEntity.ok(ApiResponse.ok(thread));
	}

	/**
	 * Lấy inbox: thông báo gửi riêng cho user hiện tại.
	 * GET /api/thongbao/inbox
	 */
	@GetMapping("/inbox")
	public ResponseEntity<ApiResponse<List<ThongBao>>> getInbox() {
		User currentUser = getCurrentUser();
		if (currentUser == null) {
			return ResponseEntity.ok(ApiResponse.ok(List.of()));
		}
		List<ThongBao> inbox = thongBaoService.getInbox(currentUser.getId());
		return ResponseEntity.ok(ApiResponse.ok(inbox));
	}

	/**
	 * Lấy các phản hồi đã gửi bởi user hiện tại.
	 * GET /api/thongbao/sent-replies
	 */
	@GetMapping("/sent-replies")
	public ResponseEntity<ApiResponse<List<ThongBao>>> getSentReplies() {
		User currentUser = getCurrentUser();
		if (currentUser == null) {
			return ResponseEntity.ok(ApiResponse.ok(List.of()));
		}
		List<ThongBao> replies = thongBaoService.getMyReplies(currentUser.getId());
		return ResponseEntity.ok(ApiResponse.ok(replies));
	}
}

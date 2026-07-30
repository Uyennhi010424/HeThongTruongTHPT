package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.ThongBao;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ThongBaoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ThongBaoService {
    private final ThongBaoRepository thongBaoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ThongBaoService(ThongBaoRepository thongBaoRepository, SimpMessagingTemplate messagingTemplate) {
        this.thongBaoRepository = thongBaoRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<ThongBao> getAll() {
        return thongBaoRepository.findAll();
    }

    public Page<ThongBao> getAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("ngayDang").descending());
        return thongBaoRepository.findAll(pageable);
    }

    public ThongBao getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        return thongBaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
    }

    public ThongBao create(ThongBao thongBao) {
        if (thongBao == null) throw new IllegalArgumentException("Thông báo không được để trống");
        ThongBao saved = thongBaoRepository.save(thongBao);
        broadcastThongBao(saved);
        return saved;
    }

    public ThongBao update(Integer id, ThongBao thongBao) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        getById(id);
        thongBao.setId(id);
        return thongBaoRepository.save(thongBao);
    }

    public void delete(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        thongBaoRepository.deleteById(id);
    }

    // ─── Reply / Thread methods ───────────────────────────────────────

    /**
     * Tạo reply cho một thông báo gốc.
     * @param parentId ID thông báo gốc
     * @param reply    Nội dung phản hồi (chưa set parentId, isReply)
     */
    @Transactional
    public ThongBao replyToThongBao(Integer parentId, ThongBao reply) {
        // Kiểm tra thông báo cha tồn tại
        ThongBao parent = getById(parentId);

        // Nếu cha đã là reply, lấy parentId của nó để giữ thread phẳng (1 cấp)
        Integer rootId = (parent.getParentId() != null) ? parent.getParentId() : parent.getId();

        reply.setParentId(rootId);
        reply.setIsReply(true);
        if (reply.getLoai() == null || reply.getLoai().isBlank()) {
            reply.setLoai("REPLY");
        }
        ThongBao saved = thongBaoRepository.save(reply);
        broadcastThongBao(saved);
        return saved;
    }

    private void broadcastThongBao(ThongBao thongBao) {
        if (thongBao == null) return;
        
        // Nếu là tin nhắn có gán hocSinhId (thường là ChatBox)
        if (thongBao.getHocSinh() != null) {
            messagingTemplate.convertAndSend("/topic/chat/" + thongBao.getHocSinh().getId(), thongBao);
        }
        
        // Nếu là thông báo chung toàn trường hoặc theo role (không phải gửi riêng cho cá nhân)
        if (thongBao.getRecipientId() == null && ("ALL".equals(thongBao.getLoai()) || "PHU_HUYNH".equals(thongBao.getLoai()) || "GIAO_VIEN".equals(thongBao.getLoai()))) {
            messagingTemplate.convertAndSend("/topic/notifications", thongBao);
        } else if (thongBao.getRecipientId() != null) {
            // Nhắn riêng
            messagingTemplate.convertAndSend("/topic/user/" + thongBao.getRecipientId(), thongBao);
        }
    }

    /**
     * Lấy toàn bộ thread: thông báo gốc + tất cả replies theo thứ tự thời gian.
     * @param thongBaoId ID của bất kỳ thông báo nào trong thread
     */
    public List<ThongBao> getThread(Integer thongBaoId) {
        ThongBao tb = getById(thongBaoId);
        // Tìm root: nếu là reply thì lấy parentId, nếu là root thì lấy id chính nó
        Integer rootId = (tb.getParentId() != null) ? tb.getParentId() : tb.getId();
        return thongBaoRepository.findByIdOrParentIdOrderByNgayDangAsc(rootId, rootId);
    }

    /**
     * Lấy inbox: tất cả thông báo gửi riêng cho userId.
     */
    public List<ThongBao> getInbox(Integer userId) {
        return thongBaoRepository.findByRecipientIdOrderByNgayDangDesc(userId);
    }

    /**
     * Lấy tất cả replies mà userId đã gửi.
     */
    public List<ThongBao> getMyReplies(Integer userId) {
        return thongBaoRepository.findByNguoiTaoIdAndIsReplyTrueOrderByNgayDangDesc(userId);
    }

    /**
     * Lấy toàn bộ hội thoại liên quan đến học sinh: 
     * - Thông báo gốc gửi cho học sinh (hoc_sinh_id)
     * - Các replies trong những thread đó
     * Sắp xếp theo thời gian tăng dần.
     */
    public List<ThongBao> getConversationByHocSinh(Integer hocSinhId) {
        // Lấy tất cả thông báo gốc gửi cho học sinh này
        List<ThongBao> roots = thongBaoRepository.findByHocSinhId(hocSinhId);
        if (roots.isEmpty()) return roots;

        // Lấy tất cả replies của từng root
        java.util.List<ThongBao> all = new java.util.ArrayList<>(roots);
        for (ThongBao root : roots) {
            all.addAll(thongBaoRepository.findByParentIdOrderByNgayDangAsc(root.getId()));
        }

        // Loại trừ trùng lặp và sắp xếp
        java.util.Map<Integer, ThongBao> uniqueMap = new java.util.LinkedHashMap<>();
        for (ThongBao tb : all) uniqueMap.put(tb.getId(), tb);
        return new java.util.ArrayList<>(uniqueMap.values())
            .stream()
            .sorted(java.util.Comparator.comparing(ThongBao::getNgayDang))
            .collect(java.util.stream.Collectors.toList());
    }
}
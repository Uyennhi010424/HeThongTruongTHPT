package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.HocSinh;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.User;
import com.hethongtruongthpt.entity.PhuHuynhHocSinh;
import com.hethongtruongthpt.entity.PhuHuynh;
import com.hethongtruongthpt.enums.RoleEnum;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.HocSinhRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.UserRepository;
import com.hethongtruongthpt.repository.PhuHuynhHocSinhRepository;
import com.hethongtruongthpt.util.DefaultAccountPasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;
import java.time.Year;

import com.hethongtruongthpt.repository.LichSuHocTapRepository;
import com.hethongtruongthpt.entity.LichSuHocTap;
import com.hethongtruongthpt.repository.PhuHuynhRepository;

@Service
@Transactional
public class HocSinhService {
    private static final Logger log = LoggerFactory.getLogger(HocSinhService.class);
    private static final String DEFAULT_ACCOUNT_DOMAIN = "@tdu.edu.vn";

    private final HocSinhRepository hocSinhRepository;
    private final LopHocRepository lopHocRepository;
    private final UserRepository userRepository;
    private final PhuHuynhRepository phuHuynhRepository;
    private final PhuHuynhHocSinhRepository phuHuynhHocSinhRepository;
    private final LichSuHocTapRepository lichSuHocTapRepository;
    private final PasswordEncoder passwordEncoder;
    private final DefaultAccountPasswordPolicy passwordPolicy;
    private final TransactionTemplate transactionTemplate;

    public HocSinhService(
            HocSinhRepository hocSinhRepository,
            LopHocRepository lopHocRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PhuHuynhRepository phuHuynhRepository,
            PhuHuynhHocSinhRepository phuHuynhHocSinhRepository,
            LichSuHocTapRepository lichSuHocTapRepository,
            DefaultAccountPasswordPolicy passwordPolicy,
            TransactionTemplate transactionTemplate) {
        this.hocSinhRepository = hocSinhRepository;
        this.lopHocRepository = lopHocRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.phuHuynhRepository = phuHuynhRepository;
        this.phuHuynhHocSinhRepository = phuHuynhHocSinhRepository;
        this.lichSuHocTapRepository = lichSuHocTapRepository;
        this.passwordPolicy = passwordPolicy;
        this.transactionTemplate = transactionTemplate;
    }

    public List<LichSuHocTap> getLichSuHocTap(Integer hocSinhId) {
        return lichSuHocTapRepository.findByHocSinhIdOrderByNamHocDesc(hocSinhId);
    }

    public HocSinh getByUsername(String username) {
        if (username == null || username.isBlank()) return null;
        String normalized = username.trim().toLowerCase();

        // 1. Try lookup by User.username (most reliable - username is auto-generated)
        var user = userRepository.findByUsername(normalized).orElse(null);
        if (user != null) {
            var byUserId = hocSinhRepository.findByUserId(user.getId()).orElse(null);
            if (byUserId != null) {
                assignParentId(byUserId);
                return byUserId;
            }
        }

        // 2. Fallback: lookup by email field
        return hocSinhRepository.findByEmailIgnoreCase(normalized)
                .map(hs -> { assignParentId(hs); return hs; })
                .orElse(null);
    }

    public List<HocSinh> getAll() {
        List<HocSinh> list = hocSinhRepository.findAllWithLop();
        assignParentIds(list);
        assignNamHocs(list);
        return list;
    }

    public Page<HocSinh> search(String keyword, Integer lopId, Integer khoi, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.ASC, "lop.tenLop").and(Sort.by(Sort.Direction.ASC, "hoTen")));
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : "";
        Page<HocSinh> result;
        try {
            // Nếu nhập đủ 10 số → tìm SĐT chính xác
            boolean isPhoneSearch = kw.matches("^0\\d{9}$");

            if (lopId != null) {
                if (isPhoneSearch) {
                    result = hocSinhRepository.searchByPhoneAndLopId(kw, lopId, pageable);
                } else {
                    result = hocSinhRepository.searchByKeywordAndLopId(kw, lopId, pageable);
                }
            } else if (khoi != null) {
                if (isPhoneSearch) {
                    result = hocSinhRepository.searchByPhoneAndKhoi(kw, khoi, pageable);
                } else {
                    result = hocSinhRepository.searchByKeywordAndKhoi(kw, khoi, pageable);
                }
            } else if (!kw.isEmpty()) {
                if (isPhoneSearch) {
                    result = hocSinhRepository.searchByPhone(kw, pageable);
                } else {
                    result = hocSinhRepository.searchByKeyword(kw, pageable);
                }
            } else {
                result = hocSinhRepository.findAllSortedByLopAndName(pageable);
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tìm kiếm học sinh: " + e.getMessage(), e);
        }
        assignParentIds(result.getContent());
        assignNamHocs(result.getContent());
        return result;
    }

    @Cacheable(value = "hocSinhList", key = "#lopId")
    public List<HocSinh> getByLopId(Integer lopId) {
        List<LichSuHocTap> histories = lichSuHocTapRepository.findByLopHocId(lopId);
        List<HocSinh> list;
        if (histories != null && !histories.isEmpty()) {
            java.util.Map<Integer, HocSinh> studentMap = new java.util.LinkedHashMap<>();
            for (LichSuHocTap ls : histories) {
                if (ls != null && ls.getHocSinh() != null && ls.getHocSinh().getId() != null) {
                    studentMap.putIfAbsent(ls.getHocSinh().getId(), ls.getHocSinh());
                }
            }
            list = new java.util.ArrayList<>(studentMap.values());
        } else {
            list = hocSinhRepository.findByLopIdAndTrangThai(lopId, 1);
            if (list == null) list = new java.util.ArrayList<>();
        }
        assignParentIds(list);
        assignNamHocs(list);
        return list;
    }

    public long countByLopId(Integer lopId) {
        return hocSinhRepository.countByLopId(lopId);
    }

    public long countByTrangThai(Integer trangThai) {
        return hocSinhRepository.countByTrangThai(trangThai);
    }

    public HocSinh getById(Integer id) {
        if (id == null) throw new IllegalArgumentException("ID không được để trống");
        HocSinh hs = hocSinhRepository.findByIdWithLop(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        assignParentId(hs);
        return hs;
    }

    /**
     * Tạo học sinh + user account + link phụ huynh trong 1 transaction REQUIRES_NEW.
     * Nếu bất kỳ bước nào fail → rollback toàn bộ (không orphan User).
     * Retry tối đa 5 lần nếu trùng unique constraint.
     */
    @CacheEvict(value = "hocSinhList", allEntries = true)
    public HocSinh create(HocSinh hocSinh) {
        // Validate trước khi vào transaction
        LopHoc lop = resolveLop(hocSinh);
        if (hocSinh.getTrangThai() == null) hocSinh.setTrangThai(1);
        if (hocSinh.getNamNhapHoc() == null) hocSinh.setNamNhapHoc(Year.now().getValue());
        
        validateStudentRules(hocSinh, lop);

        final LopHoc lopRef = lop;
        final Integer phuHuynhId = hocSinh.getPhuHuynhId();

        // REQUIRES_NEW: transaction mới mỗi lần, rollback không ảnh hưởng outer
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setPropagationBehavior(Propagation.REQUIRES_NEW.value());
        var txManager = transactionTemplate.getTransactionManager();
        if (txManager == null) throw new ApiException("TransactionManager không khả dụng");
        TransactionTemplate requiresNewTx = new TransactionTemplate(txManager, def);

        int maxRetries = 5;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                HocSinh saved = requiresNewTx.execute(status -> {
                    // 1. Tạo user account
                    User user = createStudentUser(hocSinh.getHoTen());

                    // 2. Tạo mã học sinh
                    String maHs = generateMaHocSinh(hocSinh.getNamNhapHoc());

                    // 3. Tạo học sinh
                    HocSinh hs = new HocSinh();
                    hs.setUser(user);
                    hs.setMaHocSinh(maHs);
                    hs.setHoTen(hocSinh.getHoTen());
                    hs.setNgaySinh(hocSinh.getNgaySinh());
                    hs.setGioiTinh(hocSinh.getGioiTinh());
                    hs.setLop(lopRef);
                    hs.setDiaChi(hocSinh.getDiaChi());
                    hs.setNamNhapHoc(hocSinh.getNamNhapHoc());
                    hs.setSdt(hocSinh.getSdt());
                    hs.setEmail(hocSinh.getEmail());
                    hs.setDanToc(hocSinh.getDanToc() != null && !hocSinh.getDanToc().isBlank() ? hocSinh.getDanToc() : "Kinh");
                    hs.setTonGiao(hocSinh.getTonGiao() != null && !hocSinh.getTonGiao().isBlank() ? hocSinh.getTonGiao() : "Không");
                    hs.setMaBhyt(hocSinh.getMaBhyt());
                    hs.setDienChinhSach(hocSinh.getDienChinhSach());
                    hs.setTrangThai(hocSinh.getTrangThai());
                    HocSinh result = hocSinhRepository.save(hs);

                    // 4. Link phụ huynh (nếu có)
                    PhuHuynh linkedPhuHuynh = null;
                    if (phuHuynhId != null) {
                        try {
                            PhuHuynh ph = phuHuynhRepository.findById(phuHuynhId).orElse(null);
                            if (ph != null) {
                                linkedPhuHuynh = ph;
                                PhuHuynhHocSinh link = new PhuHuynhHocSinh();
                                link.setPhuHuynh(ph);
                                link.setHocSinh(result);
                                link.setQuanHe(ph.getQuanHe() != null ? ph.getQuanHe() : "CHA");
                                link.setLaNguoiLienHeChinh(Boolean.TRUE);
                                phuHuynhHocSinhRepository.save(link);
                            }
                        } catch (Exception e) {
                            log.warn("Không thể liên kết phụ huynh: {}", e.getMessage());
                        }
                    }

                    // 5. Fetch lại học sinh trong CÙNG transaction để tránh
                    //    REPEATABLE READ snapshot không thấy dữ liệu vừa save
                    HocSinh fetched = hocSinhRepository.findById(result.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
                    assignParentId(fetched);
                    if (phuHuynhId != null && fetched.getPhuHuynhId() == null) {
                        fetched.setPhuHuynhId(phuHuynhId);
                        if (linkedPhuHuynh != null) {
                            fetched.setPhuHuynh(linkedPhuHuynh);
                        }
                    }
                    return fetched;
                });

                if (saved == null) throw new ApiException("Tạo học sinh thất bại");
                
                // Guarantee parent link outside tx if needed
                if (phuHuynhId != null) {
                    try {
                        List<PhuHuynhHocSinh> existingLinks = phuHuynhHocSinhRepository.findByHocSinhIdIn(List.of(saved.getId()));
                        if (existingLinks.isEmpty()) {
                            PhuHuynh ph = phuHuynhRepository.findById(phuHuynhId).orElse(null);
                            if (ph != null) {
                                PhuHuynhHocSinh link = new PhuHuynhHocSinh();
                                link.setPhuHuynh(ph);
                                link.setHocSinh(saved);
                                link.setQuanHe(ph.getQuanHe() != null ? ph.getQuanHe() : "CHA");
                                link.setLaNguoiLienHeChinh(Boolean.TRUE);
                                phuHuynhHocSinhRepository.save(link);
                                saved.setPhuHuynhId(phuHuynhId);
                                saved.setPhuHuynh(ph);
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Post-tx parent link fallback: {}", e.getMessage());
                    }
                }

                // Auto-sync sĩ số lớp
                refreshSiSo(lopRef.getId());
                return saved;

            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                log.warn("Tạo học sinh bị trùng (lần {}/{}): {}", attempt + 1, maxRetries, e.getMessage());
            }
        }
        throw new ApiException("Không thể tạo học sinh sau " + maxRetries + " lần thử. Có thể dữ liệu bị trùng.");
    }

    @CacheEvict(value = "hocSinhList", allEntries = true)
    public void updateAvatar(Integer id, String anhDaiDien) {
        HocSinh existing = hocSinhRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh với id: " + id));
        existing.setAnhDaiDien(anhDaiDien);
        hocSinhRepository.save(existing);
    }

    @CacheEvict(value = "hocSinhList", allEntries = true)
    public HocSinh update(Integer id, HocSinh hocSinh) {
        HocSinh existing = getById(id);
        Integer oldLopId = existing.getLop() != null ? existing.getLop().getId() : null;

        if (hocSinh.getLop() != null && hocSinh.getLop().getId() != null) {
            existing.setLop(resolveLop(hocSinh));
        }

        if (hocSinh.getHoTen() != null) existing.setHoTen(hocSinh.getHoTen());
        if (hocSinh.getNgaySinh() != null) existing.setNgaySinh(hocSinh.getNgaySinh());
        if (hocSinh.getGioiTinh() != null) existing.setGioiTinh(hocSinh.getGioiTinh());
        if (hocSinh.getDanToc() != null) existing.setDanToc(hocSinh.getDanToc());
        if (hocSinh.getTonGiao() != null) existing.setTonGiao(hocSinh.getTonGiao().isBlank() ? "Không" : hocSinh.getTonGiao().trim());
        if (hocSinh.getSdt() != null) existing.setSdt(hocSinh.getSdt());
        if (hocSinh.getEmail() != null) {
            String newEmail = hocSinh.getEmail().trim();
            if (existing.getEmail() == null || !existing.getEmail().equalsIgnoreCase(newEmail)) {
                var existingUserOpt = userRepository.findByUsername(newEmail);
                if (existingUserOpt.isPresent()) {
                    User existingUser = existingUserOpt.get();
                    if (existing.getUser() == null || !existingUser.getId().equals(existing.getUser().getId())) {
                        if (hocSinh.getHoTen() != null) {
                            newEmail = generateUniqueUsername(hocSinh.getHoTen());
                        } else {
                            throw new ApiException("Email này đã được sử dụng bởi tài khoản khác.");
                        }
                    }
                }
                existing.setEmail(newEmail);
                if (existing.getUser() != null) {
                    User user = existing.getUser();
                    user.setUsername(newEmail);
                    user.setEmail(newEmail);
                    userRepository.save(user);
                } else {
                    User user = new User();
                    user.setUsername(newEmail);
                    user.setEmail(newEmail);
                    user.setPassword(passwordEncoder.encode(passwordPolicy.getStudentDefaultPassword()));
                    user.setRole(RoleEnum.HOC_SINH);
                    user.setIsActive(true);
                    user.setMustChangePassword(true);
                    user = userRepository.save(user);
                    existing.setUser(user);
                }
            }
        }
        if (hocSinh.getDiaChi() != null) existing.setDiaChi(hocSinh.getDiaChi());
        if (hocSinh.getNamNhapHoc() != null) existing.setNamNhapHoc(hocSinh.getNamNhapHoc());
        if (hocSinh.getAnhDaiDien() != null) existing.setAnhDaiDien(hocSinh.getAnhDaiDien());
        
        existing.setMaBhyt(hocSinh.getMaBhyt());
        existing.setDienChinhSach(hocSinh.getDienChinhSach());
        
        validateStudentRules(existing, existing.getLop());
        
        HocSinh saved = hocSinhRepository.save(existing);

        // Auto-sync sĩ số: lớp cũ và lớp mới (nếu khác nhau)
        Integer newLopId = saved.getLop() != null ? saved.getLop().getId() : null;
        if (oldLopId != null) refreshSiSo(oldLopId);
        if (newLopId != null && !newLopId.equals(oldLopId)) refreshSiSo(newLopId);

        // Lưu vết chuyển lớp
        if (oldLopId != null && newLopId != null && !newLopId.equals(oldLopId)) {
            LopHoc oldLop = lopHocRepository.findById(oldLopId).orElse(null);
            if (oldLop != null) {
                LichSuHocTap ls = new LichSuHocTap();
                ls.setHocSinh(saved);
                ls.setLopHoc(oldLop); // Lưu vết lớp cũ
                ls.setNamHoc(oldLop.getNamHoc());
                LopHoc newLop = lopHocRepository.findById(newLopId).orElse(null);
                String newLopName = (newLop != null) ? newLop.getTenLop() : "lớp khác";
                ls.setKetQua("Từ " + oldLop.getTenLop() + " sang " + newLopName);
                lichSuHocTapRepository.save(ls);
            }
        }

        // Cập nhật liên kết phụ huynh nếu có
        Integer phuHuynhId = hocSinh.getPhuHuynhId();
        if (phuHuynhId != null) {
            try {
                PhuHuynh ph = phuHuynhRepository.findById(phuHuynhId).orElse(null);
                if (ph != null) {
                    List<PhuHuynhHocSinh> existingLinks = phuHuynhHocSinhRepository.findByHocSinhIdIn(List.of(saved.getId()));
                    if (existingLinks.isEmpty()) {
                        PhuHuynhHocSinh link = new PhuHuynhHocSinh();
                        link.setPhuHuynh(ph);
                        link.setHocSinh(saved);
                        link.setQuanHe(ph.getQuanHe() != null ? ph.getQuanHe() : "CHA");
                        link.setLaNguoiLienHeChinh(Boolean.TRUE);
                        phuHuynhHocSinhRepository.save(link);
                    } else {
                        PhuHuynhHocSinh link = existingLinks.get(0);
                        link.setPhuHuynh(ph);
                        phuHuynhHocSinhRepository.save(link);
                    }
                }
            } catch (Exception e) {
                log.warn("Không thể cập nhật liên kết phụ huynh: {}", e.getMessage());
            }
        }

        return getById(saved.getId());
    }

    @CacheEvict(value = "hocSinhList", allEntries = true)
    public void delete(Integer id) {
        HocSinh existing = getById(id);
        Integer lopId = existing.getLop() != null ? existing.getLop().getId() : null;
        existing.setTrangThai(0);
        hocSinhRepository.save(existing);
        // Auto-sync sĩ số lớp
        if (lopId != null) refreshSiSo(lopId);
    }

    /**
     * Đánh dấu 1 học sinh đã tốt nghiệp (trangThai = 2).
     */
    @CacheEvict(value = "hocSinhList", allEntries = true)
    public void markGraduated(Integer id) {
        HocSinh existing = getById(id);
        existing.setTrangThai(2); // 2 = đã tốt nghiệp
        hocSinhRepository.save(existing);
    }

    /**
     * Đánh dấu tất cả học sinh lớp 12 đã tốt nghiệp.
     * Trả về số lượng học sinh được đánh dấu.
     */
    @Transactional
    @CacheEvict(value = "hocSinhList", allEntries = true)
    public int markAllGrade12Graduated() {
        List<HocSinh> allStudents = hocSinhRepository.findAll();
        int count = 0;
        for (HocSinh hs : allStudents) {
            if (hs.getLop() != null && hs.getLop().getKhoi() != null
                    && Integer.valueOf(12).equals(hs.getLop().getKhoi())
                    && (hs.getTrangThai() == null || hs.getTrangThai() == 1)) {
                hs.setTrangThai(2);
                hocSinhRepository.save(hs);
                count++;
            }
        }
        return count;
    }

    // ─── Private helpers ───

    private LopHoc resolveLop(HocSinh hocSinh) {
        Integer lopId = hocSinh.getLop() != null ? hocSinh.getLop().getId() : null;
        if (lopId == null) throw new ResourceNotFoundException("Vui lòng chọn lớp học hợp lệ");
        return lopHocRepository.findById(lopId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
    }

    /**
     * Tạo User cho học sinh. Tìm thấy username trùng → dùng lại.
     * Chạy BÊN TRONG transaction REQUIRES_NEW nên nếu fail sẽ rollback cùng HocSinh.
     */
    private User createStudentUser(String fullName) {
        String username = generateUniqueUsername(fullName);
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(passwordPolicy.getStudentDefaultPassword()));
            user.setRole(RoleEnum.HOC_SINH);
            user.setIsActive(true);
            user.setMustChangePassword(true);
            return userRepository.save(user);
        });
    }

    /**
     * Tạo mã học sinh unique. Chạy BÊN TRONG transaction.
     */
    private String generateMaHocSinh(Integer namNhapHoc) {
        int year = namNhapHoc != null ? namNhapHoc : Year.now().getValue();
        String baseCode = "HS" + year;
        for (int suffix = 1; suffix <= 9999; suffix++) {
            String candidate = baseCode + String.format("%03d", suffix);
            if (hocSinhRepository.findByMaHocSinh(candidate).isEmpty()) return candidate;
        }
        throw new ApiException("Không thể tạo mã học sinh duy nhất");
    }

    private String generateUniqueUsername(String fullName) {
        String baseLocalPart = buildLocalPart(fullName);
        for (int suffix = 1; suffix <= 1000; suffix++) {
            String localPart = suffix == 1 ? baseLocalPart : baseLocalPart + suffix;
            String candidate = localPart + DEFAULT_ACCOUNT_DOMAIN;
            if (userRepository.findByUsername(candidate).isEmpty()) return candidate;
        }
        throw new ApiException("Không thể tạo username học sinh duy nhất");
    }

    private String buildLocalPart(String fullName) {
        if (fullName == null || fullName.isBlank()) return "hocsinh";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 0) return "hocsinh";
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < parts.length - 1; i++) {
            String normalized = normalizeAscii(parts[i]);
            if (!normalized.isEmpty()) builder.append(normalized.charAt(0));
        }
        String lastName = normalizeAscii(parts[parts.length - 1]);
        if (!lastName.isEmpty()) builder.append(lastName);
        String result = builder.toString();
        if ("lunhi".equals(result)) {
            return "lunhi-cntt17";
        }
        return result.isEmpty() ? "hocsinh" : result;
    }

    private String normalizeAscii(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase(Locale.ROOT);
    }

    private void assignParentIds(List<HocSinh> list) {
        if (list == null || list.isEmpty()) return;
        try {
            List<Integer> ids = list.stream()
                    .filter(hs -> hs != null && hs.getId() != null)
                    .map(HocSinh::getId).toList();
            if (ids.isEmpty()) return;
            List<PhuHuynhHocSinh> allLinks = phuHuynhHocSinhRepository.findByHocSinhIdIn(ids);
            Map<Integer, PhuHuynhHocSinh> parentMap = allLinks.stream()
                    .filter(link -> link != null && link.getHocSinh() != null && link.getHocSinh().getId() != null)
                    .collect(Collectors.toMap(
                            link -> link.getHocSinh().getId(),
                            link -> link,
                            (existing, incoming) -> {
                                if (Boolean.TRUE.equals(incoming.getLaNguoiLienHeChinh())) return incoming;
                                if (Boolean.TRUE.equals(existing.getLaNguoiLienHeChinh())) return existing;
                                return existing;
                            }));
            for (HocSinh hs : list) {
                if (hs == null) continue;
                PhuHuynhHocSinh link = parentMap.get(hs.getId());
                if (link != null && link.getPhuHuynh() != null) {
                    hs.setPhuHuynhId(link.getPhuHuynh().getId());
                    hs.setPhuHuynh(link.getPhuHuynh());
                }
            }
        } catch (Exception e) {
            log.warn("Không thể gán parentId: {}", e.getMessage());
        }
    }

    private void assignNamHocs(List<HocSinh> list) {
        if (list == null || list.isEmpty()) return;
        try {
            List<Integer> ids = list.stream().filter(Objects::nonNull).map(HocSinh::getId).filter(Objects::nonNull).toList();
            if (ids.isEmpty()) return;
            List<LichSuHocTap> allHistories = lichSuHocTapRepository.findAll();
            Map<Integer, Set<String>> historyMap = new HashMap<>();
            for (LichSuHocTap ls : allHistories) {
                if (ls != null && ls.getHocSinh() != null && ls.getHocSinh().getId() != null && ls.getNamHoc() != null) {
                    historyMap.computeIfAbsent(ls.getHocSinh().getId(), k -> new HashSet<>()).add(ls.getNamHoc());
                }
            }
            for (HocSinh hs : list) {
                if (hs == null) continue;
                Set<String> years = new LinkedHashSet<>();
                if (hs.getLop() != null && hs.getLop().getNamHoc() != null) {
                    years.add(hs.getLop().getNamHoc());
                }
                if (historyMap.containsKey(hs.getId())) {
                    years.addAll(historyMap.get(hs.getId()));
                }
                hs.setNamHocList(new ArrayList<>(years));
            }
        } catch (Exception e) {
            log.warn("Không thể gán namHocList: {}", e.getMessage());
        }
    }

    private void assignParentId(HocSinh hs) {
        if (hs == null) return;
        assignParentIds(List.of(hs));
        assignNamHocs(List.of(hs));
    }

    /**
     * Cap nhat siSo cua lop = so hoc sinh active (trangThai=1) trong lop.
     */
    private void refreshSiSo(Integer lopId) {
        if (lopId == null) return;
        try {
            LopHoc lop = lopHocRepository.findById(lopId).orElse(null);
            if (lop == null) return;
            long count = hocSinhRepository.countByLopIdAndTrangThai(lopId, 1);
            int newSiSo = (int) count;
            if (!Integer.valueOf(newSiSo).equals(lop.getSiSo())) {
                lop.setSiSo(newSiSo);
                lopHocRepository.save(lop);
            }
        } catch (Exception e) {
            log.warn("Không thể cập nhật sĩ số lớp {}: {}", lopId, e.getMessage());
        }
    }

    private void validateStudentRules(HocSinh hocSinh, LopHoc lop) {
        int currentYear = java.time.Year.now().getValue();
        
        if (hocSinh.getNamNhapHoc() != null) {
            if (hocSinh.getNamNhapHoc() > currentYear + 1) {
                throw new ApiException("Năm nhập học không được vượt quá " + (currentYear + 1));
            }
            if (hocSinh.getNamNhapHoc() < 2000) {
                throw new ApiException("Năm nhập học phải từ năm 2000 trở đi");
            }
        }
        
        if (hocSinh.getNgaySinh() != null && lop != null && lop.getKhoi() != null) {
            int age = currentYear - hocSinh.getNgaySinh().getYear();
            int khoi = lop.getKhoi();
            
            boolean validAge = false;
            if (khoi == 10 && (age >= 15 && age <= 18)) validAge = true;
            else if (khoi == 11 && (age >= 16 && age <= 19)) validAge = true;
            else if (khoi == 12 && (age >= 17 && age <= 20)) validAge = true;
            
            if (!validAge) {
                throw new ApiException("Độ tuổi " + age + " không phù hợp với Khối " + khoi + " (Năm sinh: " + hocSinh.getNgaySinh().getYear() + ", Năm hiện tại: " + currentYear + ")");
            }
        }

        // Kiểm tra trùng lặp học sinh (Họ tên + Ngày sinh + Lớp)
        if (hocSinh.getHoTen() != null && !hocSinh.getHoTen().isBlank()
                && hocSinh.getNgaySinh() != null
                && lop != null && lop.getId() != null) {
            String trimmedName = hocSinh.getHoTen().trim();
            List<HocSinh> dupes = hocSinhRepository.findActiveDuplicateInClass(trimmedName, hocSinh.getNgaySinh(), lop.getId());
            for (HocSinh dupe : dupes) {
                if (hocSinh.getId() == null || !hocSinh.getId().equals(dupe.getId())) {
                    String className = (lop.getTenLop() != null && !lop.getTenLop().isBlank()) ? lop.getTenLop() : String.valueOf(lop.getId());
                    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
                    String formattedDate = hocSinh.getNgaySinh().format(formatter);
                    throw new ApiException("Học sinh '" + trimmedName + "' (sinh ngày " + formattedDate + ") đã tồn tại trong lớp " + className + "!");
                }
            }
        }

        // Kiểm tra trùng lặp Mã BHYT nếu có
        if (hocSinh.getMaBhyt() != null && !hocSinh.getMaBhyt().isBlank()) {
            String trimmedBhyt = hocSinh.getMaBhyt().trim();
            List<HocSinh> bhytDupes = hocSinhRepository.findByMaBhytActive(trimmedBhyt);
            for (HocSinh dupe : bhytDupes) {
                if (hocSinh.getId() == null || !hocSinh.getId().equals(dupe.getId())) {
                    throw new ApiException("Mã BHYT '" + trimmedBhyt + "' đã được sử dụng bởi học sinh '" + dupe.getHoTen() + "'!");
                }
            }
        }
    }

    @Transactional
    public HocSinh transferClass(Integer id, Integer newLopId) {
        HocSinh hs = hocSinhRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        Integer oldLopId = hs.getLop() != null ? hs.getLop().getId() : null;
        LopHoc oldLop = hs.getLop();
        LopHoc newLop = lopHocRepository.findById(newLopId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        
        if (hs.getLop() != null && !hs.getLop().getKhoi().equals(newLop.getKhoi())) {
            throw new ApiException("Chỉ được phép chuyển sang lớp thuộc cùng khối " + hs.getLop().getKhoi());
        }
        
        hs.setLop(newLop);
        HocSinh updated = hocSinhRepository.save(hs);
        
        if (oldLopId != null) {
            refreshSiSo(oldLopId);
            
            // Lưu vết chuyển lớp
            if (oldLop != null && !newLopId.equals(oldLopId)) {
                LichSuHocTap ls = new LichSuHocTap();
                ls.setHocSinh(updated);
                ls.setLopHoc(oldLop); // Lưu vết lớp cũ
                ls.setNamHoc(oldLop.getNamHoc());
                ls.setKetQua("Từ " + oldLop.getTenLop() + " sang " + newLop.getTenLop());
                lichSuHocTapRepository.save(ls);
            }
        }
        refreshSiSo(newLopId);
        
        return updated;
    }

    @Transactional
    public HocSinh transferSchool(Integer id, String truongMoi) {
        HocSinh hs = hocSinhRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        Integer oldLopId = hs.getLop() != null ? hs.getLop().getId() : null;
        
        hs.setTrangThai(3);
        hs.setTruongChuyenDen(truongMoi);
        
        if (hs.getUser() != null) {
            hs.getUser().setIsActive(false);
            userRepository.save(hs.getUser());
        }
        
        HocSinh updated = hocSinhRepository.save(hs);
        if (oldLopId != null) {
            refreshSiSo(oldLopId);
            LopHoc oldLop = lopHocRepository.findById(oldLopId).orElse(null);
            if (oldLop != null) {
                LichSuHocTap ls = new LichSuHocTap();
                ls.setHocSinh(updated);
                ls.setLopHoc(oldLop); // Lưu vết lớp cũ
                ls.setNamHoc(oldLop.getNamHoc());
                ls.setKetQua("Chuyển sang " + truongMoi);
                lichSuHocTapRepository.save(ls);
            }
        }
        
        return updated;
    }
}

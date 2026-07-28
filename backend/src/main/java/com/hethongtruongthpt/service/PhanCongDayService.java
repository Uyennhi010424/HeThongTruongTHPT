package com.hethongtruongthpt.service;

import com.hethongtruongthpt.dto.phancong.PhanCongDayDTO;
import com.hethongtruongthpt.entity.ChuNhiem;
import com.hethongtruongthpt.entity.GiaoVien;
import com.hethongtruongthpt.entity.LopHoc;
import com.hethongtruongthpt.entity.MonHoc;
import com.hethongtruongthpt.entity.PhanCongDay;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.exception.ResourceNotFoundException;
import com.hethongtruongthpt.repository.ChuNhiemRepository;
import com.hethongtruongthpt.repository.GiaoVienRepository;
import com.hethongtruongthpt.repository.LopHocRepository;
import com.hethongtruongthpt.repository.MonHocRepository;
import com.hethongtruongthpt.repository.ChiTietToHopRepository;
import com.hethongtruongthpt.repository.DiemRepository;
import com.hethongtruongthpt.repository.PhanCongDayRepository;
import com.hethongtruongthpt.repository.ThoiKhoaBieuRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PhanCongDayService {
    private static final Logger log = LoggerFactory.getLogger(PhanCongDayService.class);
    private final PhanCongDayRepository repository;
    private final GiaoVienRepository giaoVienRepository;
    private final MonHocRepository monHocRepository;
    private final LopHocRepository lopHocRepository;
    private final ChuNhiemRepository chuNhiemRepository;
    private final ThoiKhoaBieuRepository thoiKhoaBieuRepository;
    private final ChiTietToHopRepository chiTietToHopRepository;
    private final DiemRepository diemRepository;

    public PhanCongDayService(PhanCongDayRepository repository,
                             GiaoVienRepository giaoVienRepository,
                             MonHocRepository monHocRepository,
                             LopHocRepository lopHocRepository,
                             ChuNhiemRepository chuNhiemRepository,
                             ThoiKhoaBieuRepository thoiKhoaBieuRepository,
                             ChiTietToHopRepository chiTietToHopRepository,
                             DiemRepository diemRepository) {
        this.repository = repository;
        this.giaoVienRepository = giaoVienRepository;
        this.monHocRepository = monHocRepository;
        this.lopHocRepository = lopHocRepository;
        this.chuNhiemRepository = chuNhiemRepository;
        this.thoiKhoaBieuRepository = thoiKhoaBieuRepository;
        this.chiTietToHopRepository = chiTietToHopRepository;
        this.diemRepository = diemRepository;
    }

    /**
     * Automatically assigns teachers to all active subjects for every class in the given
     * academic year and semester. First syncs homeroom data, then for each subject:
     * (1) assigns homeroom teachers to their own class, and (2) round-robin distributes
     * remaining classes among eligible teachers.
     *
     * @param namHoc the academic year (e.g. "2025-2026")
     * @param hocKy  the semester number (1 or 2)
     * @return list of newly created PhanCongDayDTO assignments
     */
    @Transactional
    public List<PhanCongDayDTO> autoAssignAllSubjects(String namHoc, Integer hocKy) {
        if (namHoc == null || namHoc.isBlank() || hocKy == null) {
            throw new ApiException("namHoc và hocKy là bắt buộc để tự động phân công");
        }

        // Fetch data
        List<MonHoc> monHocs = monHocRepository.findAll().stream()
                .filter(MonHoc::getIsActive).collect(Collectors.toList());
        List<LopHoc> lops = lopHocRepository.findByNamHoc(namHoc);
        List<GiaoVien> teachers = giaoVienRepository.findAll();
        List<PhanCongDay> existingAssignments = repository.findByNamHocAndHocKy(namHoc, hocKy);

        // Sync ChuNhiem -> LopHoc.gvcn
        syncChuNhiemToLopHoc(chuNhiemRepository.findAll(), namHoc, lops);
        lops = lopHocRepository.findByNamHoc(namHoc);

        // Build map: toHopId → Set<monHocId> (tổ hợp môn tự chọn)
        Map<Integer, Set<Integer>> toHopMonMap = buildToHopMonMap();

        // Define mandatory subjects (môn bắt buộc - dạy cho tất cả lớp)
        // Mã môn phải khớp với database
        Set<String> mandatorySubjects = Set.of(
                "TOAN", "VAN", "ANH", "SU", "GDTC", "GDQPAN", "HDTN-HN", "GDDP"
        );

        List<PhanCongDayDTO> created = new ArrayList<>();
        Map<Integer, Set<Integer>> teacherClasses = new HashMap<>();
        Map<Integer, Integer> teacherPeriods = new HashMap<>();

        // Delete all existing assignments for this namHoc + hocKy
        if (!existingAssignments.isEmpty()) {
            repository.deleteAll(existingAssignments);
        }

        // Capacity predicates
        java.util.function.BiPredicate<GiaoVien, LopHoc> canTeach = (teacher, lop) -> {
            if (teacher == null || teacher.getId() == null || lop == null || lop.getId() == null) return false;
            Set<Integer> assignedClasses = teacherClasses.computeIfAbsent(teacher.getId(), ignored -> new HashSet<>());
            return assignedClasses.contains(lop.getId()) || assignedClasses.size() < 15;
        };

        java.util.function.BiConsumer<GiaoVien, LopHoc> markTaught = (teacher, lop) -> {
            if (teacher == null || teacher.getId() == null || lop == null || lop.getId() == null) return;
            teacherClasses.computeIfAbsent(teacher.getId(), ignored -> new HashSet<>()).add(lop.getId());
        };

        // For each subject, determine which classes to assign
        for (MonHoc mon : monHocs) {
            List<GiaoVien> teachersForMon = findEligibleTeachers(mon, teachers);
            if (teachersForMon.isEmpty()) continue;

            String maMon = mon.getMaMon() != null ? mon.getMaMon().toUpperCase() : "";
            boolean isMandatory = mandatorySubjects.contains(maMon);

            // Determine eligible classes for this subject
            List<LopHoc> eligibleLops;
            if (isMandatory) {
                // Môn bắt buộc → tất cả lớp
                eligibleLops = lops;
            } else {
                // Môn tự chọn → chỉ lớp có tổ hợp chứa môn này
                eligibleLops = lops.stream()
                        .filter(lop -> {
                            if (lop.getToHopId() == null) return false;
                            Set<Integer> monIds = toHopMonMap.get(lop.getToHopId());
                            return monIds != null && monIds.contains(mon.getId());
                        })
                        .collect(Collectors.toList());
            }

            if (eligibleLops.isEmpty()) continue;

            Set<Integer> assignedLopIds = new HashSet<>();

            int periodsPerClass = getEstimatedPeriods(mon);

            // First pass: homeroom teachers
            assignHomeroomTeachers(mon, eligibleLops, teachersForMon, assignedLopIds, hocKy, namHoc, created, teacherPeriods, periodsPerClass);

            // Second pass: load-balanced assign
            roundRobinAssign(mon, eligibleLops, teachersForMon, assignedLopIds, canTeach, markTaught, hocKy, namHoc, created, teacherPeriods, periodsPerClass);
        }

        return created;
    }

    private int getEstimatedPeriods(MonHoc subject) {
        if (subject == null || subject.getTenMon() == null) return 2;
        String name = normalize(subject.getTenMon());
        if (name.contains("toan") || name.contains("van")) return 4;
        if (name.contains("anh")) return 3;
        if (name.contains("ly") || name.contains("hoa") || name.contains("sinh") || name.contains("su") || name.contains("dia")) return 2;
        return 2;
    }

    /**
     * Synchronizes ChuNhiem (homeroom assignment) records to LopHoc.gvcn.
     * Fixes old data where gvcn was never set on the LopHoc entity.
     * For each ChuNhiem record, sets the corresponding LopHoc's gvcn to the
     * assigned GiaoVien if it is not already set or does not match.
     *
     * @param chuNhiemList the list of all ChuNhiem records
     * @param namHoc       the academic year (reserved for future filtering)
     * @param allLops      the list of all LopHoc records for the academic year
     */
    private void syncChuNhiemToLopHoc(List<ChuNhiem> chuNhiemList, String namHoc, List<LopHoc> allLops) {
        chuNhiemList.forEach(cn -> {
            Integer gvId = cn.getId().getGiaoVienId();
            Integer lopId = cn.getId().getLopId();
            if (gvId == null || lopId == null) return;
            lopHocRepository.findById(lopId).ifPresent(lop -> {
                if (lop.getGvcn() == null || !lop.getGvcn().getId().equals(gvId)) {
                    giaoVienRepository.findById(gvId).ifPresent(gv -> {
                        lop.setGvcn(gv);
                        lopHocRepository.save(lop);
                    });
                }
            });
        });
    }

    /**
     * Builds a map from teacher ID to the set of class IDs they are already assigned to,
     * based on the existing PhanCongDay records.
     *
     * @param existing the list of existing PhanCongDay assignment records
     * @return a map where each key is a teacher ID and the value is the set of class IDs
     *         that teacher is assigned to
     */
    /**
     * Builds a map from toHopId → Set<monHocId> for all subject combinations.
     */
    private Map<Integer, Set<Integer>> buildToHopMonMap() {
        Map<Integer, Set<Integer>> map = new HashMap<>();
        chiTietToHopRepository.findAll().forEach(ct -> {
            if (ct.getToHopMon() != null && ct.getMonHoc() != null) {
                Integer toHopId = ct.getToHopMon().getId();
                Integer monId = ct.getMonHoc().getId();
                map.computeIfAbsent(toHopId, k -> new HashSet<>()).add(monId);
            }
        });
        return map;
    }

    private Map<Integer, Set<Integer>> buildTeacherClassMap(List<PhanCongDay> existing) {
        Map<Integer, Set<Integer>> teacherClasses = new HashMap<>();
        for (PhanCongDay assignment : existing) {
            if (assignment.getGiaoVien() == null || assignment.getLop() == null) continue;
            Integer teacherId = assignment.getGiaoVien().getId();
            Integer lopId = assignment.getLop().getId();
            teacherClasses.computeIfAbsent(teacherId, ignored -> new HashSet<>()).add(lopId);
        }
        return teacherClasses;
    }

    /**
     * Filters the list of all teachers to find those eligible to teach a given subject.
     * A teacher is eligible if their boMon (specialization) fuzzy-matches the subject name,
     * using normalized diacritic-free comparison in both directions.
     * If no specialist is found, returns all active teachers as fallback.
     *
     * @param subject     the MonHoc subject to find eligible teachers for
     * @param allTeachers the complete list of all GiaoVien teachers
     * @return a list of GiaoVien whose specialization matches the subject name,
     *         or all teachers if no specialist found
     */
    private List<GiaoVien> findEligibleTeachers(MonHoc subject, List<GiaoVien> allTeachers) {
        final String tenMon = subject.getTenMon() != null ? subject.getTenMon().trim() : "";
        final String maMon = subject.getMaMon() != null ? subject.getMaMon().toUpperCase().trim() : "";
        final String monNorm = normalize(tenMon);

        // Mapping mã môn → các tên chuyên môn có thể match
        // Mã môn phải khớp với database
        Map<String, List<String>> subjectToBoMon = Map.ofEntries(
            Map.entry("TOAN", List.of("toan")),
            Map.entry("VAN", List.of("van", "ngu van")),
            Map.entry("ANH", List.of("anh", "tieng anh")),
            Map.entry("SU", List.of("su", "lich su")),
            Map.entry("DIA", List.of("dia", "dia li")),
            Map.entry("LY", List.of("ly", "vat li", "vat ly")),
            Map.entry("HOA", List.of("hoa", "hoa hoc")),
            Map.entry("SINH", List.of("sinh", "sinh hoc")),
            Map.entry("TINHOC", List.of("tin", "tin hoc")),
            Map.entry("CN-CN", List.of("cong nghe", "cn")),
            Map.entry("CN-NN", List.of("cong nghe", "cn")),
            Map.entry("GDKTPL", List.of("ktpl", "gdkt", "kinh te", "phap luat")),
            Map.entry("GDTC", List.of("gdtc", "the chat", "the duc", "giao duc the chat")),
            Map.entry("GDQPAN", List.of("qpan", "quoc phong", "gdqp", "giao duc quoc phong")),
            Map.entry("HDTN-HN", List.of("hdtn", "trai nghiem", "hoat dong trai nghiem")),
            Map.entry("GDDP", List.of("nddp", "dia phuong", "noi dung giao duc dia phuong")),
            Map.entry("AMNHAC", List.of("am nhac")),
            Map.entry("MT", List.of("my thuat", "mi thuat"))
        );

        // Lấy danh sách từ khóa match cho môn này
        List<String> matchKeywords = subjectToBoMon.getOrDefault(maMon, List.of(monNorm));

        List<GiaoVien> specialists = allTeachers.stream()
                .filter(gv -> gv.getBoMon() != null && !gv.getBoMon().isBlank())
                .filter(gv -> {
                    String boMonNorm = normalize(gv.getBoMon());
                    // Match chính xác: chuyên môn chứa từ khóa hoặc ngược lại
                    for (String keyword : matchKeywords) {
                        if (boMonNorm.equals(keyword) || boMonNorm.contains(keyword) || keyword.contains(boMonNorm)) {
                            return true;
                        }
                    }
                    return false;
                })
                .collect(Collectors.toList());

        if (specialists.isEmpty()) {
            log.warn("Không tìm thấy giáo viên chuyên môn cho môn {}", tenMon);
            return Collections.emptyList();
        }
        return specialists;
    }

    /**
     * First pass of the assignment algorithm: assigns homeroom teachers (GVCN) to teach
     * their own class for the given subject, if the teacher is eligible. This ensures
     * each homeroom teacher prioritizes teaching their own class.
     *
     * @param subject          the MonHoc being assigned
     * @param lops             the list of all LopHoc classes for the academic year
     * @param eligibleTeachers the list of teachers eligible to teach this subject
     * @param assignedLopIds   set of class IDs already assigned (will be mutated)
     * @param hocKy            the semester number
     * @param namHoc           the academic year string
     * @param created          the accumulator list for newly created assignment DTOs (will be mutated)
     */
    private void assignHomeroomTeachers(MonHoc subject, List<LopHoc> lops,
                                         List<GiaoVien> eligibleTeachers, Set<Integer> assignedLopIds,
                                         Integer hocKy, String namHoc, List<PhanCongDayDTO> created,
                                         Map<Integer, Integer> teacherPeriods, int periodsPerClass) {
        for (LopHoc lop : lops) {
            if (lop.getGvcn() == null) continue;
            Integer gvcnId = lop.getGvcn().getId();
            GiaoVien homeroomTeacher = eligibleTeachers.stream()
                    .filter(gv -> gv.getId() != null && gv.getId().equals(gvcnId))
                    .findFirst()
                    .orElse(null);

            if (homeroomTeacher != null) {
                createAndSaveAssignment(homeroomTeacher, subject, lop, hocKy, namHoc, created);
                assignedLopIds.add(lop.getId());
                teacherPeriods.put(gvcnId, teacherPeriods.getOrDefault(gvcnId, 0) + periodsPerClass);
            }
        }
    }

    /**
     * Second pass of the assignment algorithm: round-robin assigns remaining (unassigned)
     * classes among the eligible teachers. Iterates through classes and cycles through
     * teachers, skipping those who cannot teach (capacity full or already assigned),
     * until a suitable teacher is found or all candidates are exhausted.
     *
     * @param subject          the MonHoc being assigned
     * @param lops             the list of all LopHoc classes for the academic year
     * @param eligibleTeachers the list of teachers eligible to teach this subject
     * @param assignedLopIds   set of class IDs already assigned in the first pass
     * @param canTeach         predicate that checks if a teacher can teach a class
     * @param markTaught       consumer that marks a teacher as having taught a class
     * @param hocKy            the semester number
     * @param namHoc           the academic year string
     * @param created          the accumulator list for newly created assignment DTOs (will be mutated)
     */
    private void roundRobinAssign(MonHoc subject, List<LopHoc> lops,
                                   List<GiaoVien> eligibleTeachers, Set<Integer> assignedLopIds,
                                   java.util.function.BiPredicate<GiaoVien, LopHoc> canTeach,
                                   java.util.function.BiConsumer<GiaoVien, LopHoc> markTaught,
                                   Integer hocKy, String namHoc, List<PhanCongDayDTO> created,
                                   Map<Integer, Integer> teacherPeriods, int periodsPerClass) {
        for (LopHoc lop : lops) {
            if (assignedLopIds.contains(lop.getId())) continue;

            List<GiaoVien> sortedTeachers = new ArrayList<>(eligibleTeachers);
            Collections.shuffle(sortedTeachers);
            sortedTeachers.sort((t1, t2) -> {
                int p1 = teacherPeriods.getOrDefault(t1.getId(), 0);
                int p2 = teacherPeriods.getOrDefault(t2.getId(), 0);
                return Integer.compare(p1, p2);
            });

            GiaoVien pick = null;
            for (GiaoVien candidate : sortedTeachers) {
                if (canTeach.test(candidate, lop)) {
                    pick = candidate;
                    break;
                }
            }

            if (pick == null) continue;

            if (repository.findByGiaoVienIdAndMonHocIdAndLopIdAndHocKy(pick.getId(), subject.getId(), lop.getId(), hocKy).isEmpty()) {
                try {
                    PhanCongDay entity = new PhanCongDay();
                    entity.setGiaoVien(pick);
                    entity.setMonHoc(subject);
                    entity.setLop(lop);
                    entity.setHocKy(hocKy);
                    entity.setNamHoc(namHoc);
                    PhanCongDay saved = repository.save(entity);
                    created.add(toDto(saved));
                    markTaught.accept(pick, lop);
                    teacherPeriods.put(pick.getId(), teacherPeriods.getOrDefault(pick.getId(), 0) + periodsPerClass);
                } catch (DataIntegrityViolationException ex) {
                    log.warn("Phân công trùng lặp: gv={}, mon={}, lop={}", pick.getId(), subject.getId(), lop.getId());
                }
            }
        }
    }

    /**
     * Creates a new PhanCongDay assignment entity if one does not already exist for the
     * given combination of teacher, subject, class, and semester. Saves the entity and
     * adds the resulting DTO to the created list. Handles DataIntegrityViolationException
     * gracefully (e.g., concurrent duplicate inserts).
     *
     * @param teacher the GiaoVien teacher to assign
     * @param subject the MonHoc subject being taught
     * @param lop     the LopHoc class being assigned
     * @param hocKy   the semester number
     * @param namHoc  the academic year string
     * @param created the accumulator list for newly created assignment DTOs (will be mutated)
     */
    private void createAndSaveAssignment(GiaoVien teacher, MonHoc subject, LopHoc lop,
                                          Integer hocKy, String namHoc, List<PhanCongDayDTO> created) {
        if (repository.findByGiaoVienIdAndMonHocIdAndLopIdAndHocKy(teacher.getId(), subject.getId(), lop.getId(), hocKy).isEmpty()) {
            try {
                PhanCongDay entity = new PhanCongDay();
                entity.setGiaoVien(teacher);
                entity.setMonHoc(subject);
                entity.setLop(lop);
                entity.setHocKy(hocKy);
                entity.setNamHoc(namHoc);
                PhanCongDay saved = repository.save(entity);
                created.add(toDto(saved));
            } catch (DataIntegrityViolationException ex) {
                log.warn("Phân công chủ nhiệm đã tồn tại: gv={}, mon={}, lop={}", teacher.getId(), subject.getId(), lop.getId());
            }
        }
    }

    public List<PhanCongDayDTO> getAll() {
        return repository.findAll().stream()
                .sorted((left, right) -> {
                    int cmp = compareNullableString(right.getNamHoc(), left.getNamHoc());
                    if (cmp != 0) return cmp;

                    cmp = compareNullableInteger(right.getHocKy(), left.getHocKy());
                    if (cmp != 0) return cmp;

                    return compareNullableInteger(right.getId(), left.getId());
                })
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public List<PhanCongDayDTO> getByNamHocAndHocKy(String namHoc, Integer hocKy) {
        if (namHoc == null || namHoc.isBlank() || hocKy == null) {
            return getAll();
        }

        return repository.findByNamHocAndHocKy(namHoc, hocKy).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<PhanCongDayDTO> getByLopId(Integer lopId) {
        if (lopId == null) return getAll();
        return repository.findByLopId(lopId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<PhanCongDayDTO> getByLopIdAndNamHocAndHocKy(Integer lopId, String namHoc, Integer hocKy) {
        if (lopId == null) return getByNamHocAndHocKy(namHoc, hocKy);
        if (namHoc == null || namHoc.isBlank() || hocKy == null) return getByLopId(lopId);
        return repository.findByNamHocAndHocKy(namHoc, hocKy).stream()
                .filter(pc -> pc.getLop() != null && lopId.equals(pc.getLop().getId()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PhanCongDayDTO create(PhanCongDayDTO dto) {
        if (dto == null) throw new ApiException("Dữ liệu phân công không hợp lệ");

        Integer gvId = dto.getGiaoVienId();
        Integer monId = dto.getMonHocId();
        Integer lopId = dto.getLopId();
        Integer hocKy = dto.getHocKy();
        String namHoc = dto.getNamHoc();

        if (gvId == null || monId == null || lopId == null || hocKy == null || namHoc == null || namHoc.isBlank()) {
            throw new ApiException("Thiếu thông tin bắt buộc để tạo phân công");
        }

        GiaoVien gv = giaoVienRepository.findById(gvId)
                .orElseThrow(() -> new ApiException("Giáo viên không tồn tại"));
        MonHoc mon = monHocRepository.findById(monId)
                .orElseThrow(() -> new ApiException("Môn học không tồn tại"));
        LopHoc lop = lopHocRepository.findById(lopId)
                .orElseThrow(() -> new ApiException("Lớp học không tồn tại"));

        MonHoc homeroomSubject = resolveHomeroomSubject(gv, lop);
        if (homeroomSubject != null) {
            mon = homeroomSubject;
        }

        Integer effectiveMonId = mon.getId();

        List<PhanCongDay> currentAssignments = repository.findByGiaoVienIdAndNamHocAndHocKy(gvId, namHoc, hocKy);
        java.util.Set<Integer> assignedClassIds = currentAssignments.stream()
            .map(item -> item.getLop() != null ? item.getLop().getId() : null)
            .filter(java.util.Objects::nonNull)
            .collect(Collectors.toCollection(java.util.HashSet::new));
        if (!assignedClassIds.contains(lopId) && assignedClassIds.size() >= 6) {
            throw new ApiException("Giáo viên này đã được phân công dạy đủ 6 lớp trong học kỳ này");
        }

        var existing = repository.findByGiaoVienIdAndMonHocIdAndLopIdAndHocKy(gvId, effectiveMonId, lopId, hocKy);
        if (existing.isPresent()) {
            return toDto(existing.get());
        }

        PhanCongDay entity = new PhanCongDay();
        entity.setGiaoVien(gv);
        entity.setMonHoc(mon);
        entity.setLop(lop);
        entity.setHocKy(hocKy);
        entity.setNamHoc(namHoc);

        try {
            PhanCongDay saved = repository.save(entity);
            return toDto(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException("Phân công này đã tồn tại");
        }
    }

    @Transactional
    public void deleteById(Integer id) {
        if (id == null) throw new ApiException("Thiếu ID phân công");
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy phân công");
        }
        repository.deleteById(id);
    }

    @Transactional
    public long deleteByNamHocAndHocKy(String namHoc, Integer hocKy) {
        if (namHoc == null || namHoc.isBlank()) {
            throw new ApiException("namHoc là bắt buộc để xóa phân công");
        }

        List<PhanCongDay> assignments;
        if (hocKy != null && hocKy > 0) {
            // Xóa theo năm học + học kỳ cụ thể
            assignments = repository.findByNamHocAndHocKy(namHoc, hocKy);
        } else {
            // Xóa tất cả phân công của năm học
            assignments = repository.findAll().stream()
                    .filter(a -> namHoc.equals(a.getNamHoc()))
                    .collect(Collectors.toList());
        }

        if (assignments.isEmpty()) {
            return 0;
        }

        // Xóa điểm tham chiếu đến phân công trước
        List<Integer> phanCongDayIds = assignments.stream()
                .map(PhanCongDay::getId)
                .collect(Collectors.toList());
        try {
            diemRepository.deleteByPhanCongDayIdIn(phanCongDayIds);
        } catch (Exception e) {
            log.warn("Không thể xóa điểm cho phân công {} HK{}: {}", namHoc, hocKy, e.getMessage());
        }

        // Xóa thời khóa biểu cùng năm học + học kỳ
        try {
            thoiKhoaBieuRepository.deleteByNamHocAndHocKy(namHoc, hocKy);
        } catch (Exception e) {
            log.warn("Không thể xóa TKB cho {} HK{}: {}", namHoc, hocKy, e.getMessage());
        }

        long deleted = assignments.size();
        repository.deleteAll(assignments);
        return deleted;
    }

    private PhanCongDayDTO toDto(PhanCongDay item) {
        PhanCongDayDTO dto = new PhanCongDayDTO();
        dto.setId(item.getId());
        dto.setGiaoVienId(item.getGiaoVien() != null ? item.getGiaoVien().getId() : null);
        dto.setGiaoVienHoTen(item.getGiaoVien() != null ? item.getGiaoVien().getHoTen() : null);
        dto.setMaGiaoVien(item.getGiaoVien() != null ? item.getGiaoVien().getMaGiaoVien() : null);
        dto.setMonHocId(item.getMonHoc() != null ? item.getMonHoc().getId() : null);
        dto.setMonHocTen(item.getMonHoc() != null ? item.getMonHoc().getTenMon() : null);
        dto.setLopId(item.getLop() != null ? item.getLop().getId() : null);
        dto.setTenLop(item.getLop() != null ? item.getLop().getTenLop() : null);
        dto.setHocKy(item.getHocKy());
        dto.setNamHoc(item.getNamHoc());
        return dto;
    }

    private int compareNullableString(String left, String right) {
        if (left == null && right == null) return 0;
        if (left == null) return 1;
        if (right == null) return -1;
        return left.compareTo(right);
    }

    private int compareNullableInteger(Integer left, Integer right) {
        if (left == null && right == null) return 0;
        if (left == null) return 1;
        if (right == null) return -1;
        return left.compareTo(right);
    }

    private String normalize(String s) {
        if (s == null) return "";
        String replaced = s.replace("đ", "d").replace("Đ", "D");
        String tmp = Normalizer.normalize(replaced, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return tmp.toLowerCase().replaceAll("[^a-z0-9]+", " ").trim();
    }

    private MonHoc resolveHomeroomSubject(GiaoVien teacher, LopHoc lop) {
        if (teacher == null || lop == null || lop.getGvcn() == null || teacher.getId() == null || lop.getGvcn().getId() == null) {
            return null;
        }
        if (!teacher.getId().equals(lop.getGvcn().getId())) {
            return null;
        }

        String boMon = teacher.getBoMon();
        if (boMon == null || boMon.isBlank()) {
            return null;
        }

        String teacherSubjects = normalize(boMon);
        if (teacherSubjects.isEmpty()) {
            return null;
        }

        List<MonHoc> activeSubjects = monHocRepository.findAll().stream()
                .filter(MonHoc::getIsActive)
                .collect(Collectors.toList());

        return activeSubjects.stream()
                .filter(subject -> {
                    String subjectName = normalize(subject.getTenMon());
                    return !subjectName.isEmpty() && (teacherSubjects.contains(subjectName) || subjectName.contains(teacherSubjects));
                })
                .findFirst()
                .orElse(null);
    }
}

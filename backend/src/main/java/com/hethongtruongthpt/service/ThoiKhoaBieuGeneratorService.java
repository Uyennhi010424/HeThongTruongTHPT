package com.hethongtruongthpt.service;

import com.hethongtruongthpt.entity.*;
import com.hethongtruongthpt.exception.ApiException;
import com.hethongtruongthpt.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;

@Service
public class ThoiKhoaBieuGeneratorService {

    private static final Logger logger = LoggerFactory.getLogger(ThoiKhoaBieuGeneratorService.class);

    private static final Set<String> HEAVY_SUBJECTS = Set.of("toan", "ngu van");
    private static final Set<String> AFTERNOON_SUBJECTS = Set.of("the duc", "quoc phong", "gdqp", "the chat");

    private static final Map<String, Integer> SUBJECT_PERIODS = new LinkedHashMap<>();
    static {
        SUBJECT_PERIODS.put("toan", 4); SUBJECT_PERIODS.put("ngu van", 4); SUBJECT_PERIODS.put("tieng anh", 3);
        SUBJECT_PERIODS.put("vat li", 2); SUBJECT_PERIODS.put("hoa hoc", 2); SUBJECT_PERIODS.put("sinh hoc", 2);
        SUBJECT_PERIODS.put("lich su", 2); SUBJECT_PERIODS.put("dia li", 2); SUBJECT_PERIODS.put("gdkt", 2);
        SUBJECT_PERIODS.put("tin hoc", 2); SUBJECT_PERIODS.put("cong nghe", 2);
        SUBJECT_PERIODS.put("the duc", 2); SUBJECT_PERIODS.put("am nhac", 1); SUBJECT_PERIODS.put("my thuat", 1);
        SUBJECT_PERIODS.put("gdqp", 2); SUBJECT_PERIODS.put("hdtn", 1); SUBJECT_PERIODS.put("gddp", 1);
    }

    private static final int[] SCHOOL_DAYS = {2, 3, 4, 5, 6, 7};
    private static final long SEED_PLAN_B = 20250002L;

    private final ThoiKhoaBieuRepository tkbRepo;
    private final PhanCongDayRepository pcRepo;
    private final LopHocRepository lopRepo;
    private final MonHocRepository monRepo;
    private final GiaoVienRepository gvRepo;
    private final ChuNhiemRepository cnRepo;
    private final GiaoVienBanRepository gvBanRepo;
    private final ChiTietToHopRepository chiTietToHopRepo;
    private final ThoiKhoaBieuCrudService crudService;

    public ThoiKhoaBieuGeneratorService(ThoiKhoaBieuRepository tkbRepo, PhanCongDayRepository pcRepo,
        LopHocRepository lopRepo, MonHocRepository monRepo,
        GiaoVienRepository gvRepo, ChuNhiemRepository cnRepo,
        GiaoVienBanRepository gvBanRepo, ChiTietToHopRepository chiTietToHopRepo,
        ThoiKhoaBieuCrudService crudService) {
        this.tkbRepo = tkbRepo;
        this.pcRepo = pcRepo;
        this.lopRepo = lopRepo;
        this.monRepo = monRepo;
        this.gvRepo = gvRepo;
        this.cnRepo = cnRepo;
        this.gvBanRepo = gvBanRepo;
        this.chiTietToHopRepo = chiTietToHopRepo;
        this.crudService = crudService;
    }

    @Transactional
    public GenerateResult generateSchedule(String namHoc, Integer hocKy, Integer soTuan) {
        if (namHoc == null || namHoc.isBlank() || hocKy == null) throw new ApiException("Thiếu namHoc/hocKy");
        if (soTuan == null || soTuan < 1) soTuan = 1;
        for (int week = 1; week <= soTuan; week++) crudService.validateTuanInHocKy(namHoc, hocKy, week);
        @SuppressWarnings("null")
        Integer nonNullHocKy = hocKy;
        try {
            var existingTkb = tkbRepo.findByNamHocAndHocKy(namHoc, nonNullHocKy);
            if (existingTkb != null) tkbRepo.deleteAll(existingTkb);

            Map<Integer, Integer> chuNhiemMap = new HashMap<>();
            try {
                for (ChuNhiem cn : cnRepo.findAll())
                    chuNhiemMap.put(cn.getId().getLopId(), cn.getId().getGiaoVienId());
            } catch (Exception ex) {
                logger.warn("Khong the tai du lieu chu nhiem: {}", ex.getMessage());
            }

            List<PhanCongDay> phanCongList = pcRepo.findByNamHocAndHocKy(namHoc, hocKy);
            if (phanCongList == null || phanCongList.isEmpty()) {
                phanCongList = pcRepo.findAll();
            }
            List<LopHoc> lops = lopRepo.findByNamHoc(namHoc);
            if (lops == null || lops.isEmpty()) {
                lops = lopRepo.findAll();
            }

            Map<Integer, String> classRoomMap = new HashMap<>();
            for (LopHoc lop : lops)
                if (lop.getPhongHoc() != null && !lop.getPhongHoc().isBlank())
                    classRoomMap.put(lop.getId(), lop.getPhongHoc());

            Map<Integer, List<PhanCongDay>> byLop = new HashMap<>();
            for (PhanCongDay p : phanCongList) {
                if (p.getLop() == null || p.getGiaoVien() == null || p.getMonHoc() == null) continue;
                String maMon = p.getMonHoc().getMaMon();
                if ("SHDC".equals(maMon) || "SHL".equals(maMon)) continue;
                byLop.computeIfAbsent(p.getLop().getId(), k -> new ArrayList<>()).add(p);
            }

            MonHoc shdcMon = findMon("SHDC", "SHDC");
            MonHoc shlMon  = findMon("SHL",  "Sinh hoạt lớp");
            Map<Integer, GiaoVien> gvAllMap = new HashMap<>();
            for (GiaoVien gv : gvRepo.findAll()) gvAllMap.put(gv.getId(), gv);

            List<ScheduleTask> allTasks = new ArrayList<>();
            for (LopHoc lop : lops) {
                int lopId = lop.getId();
                for (PhanCongDay p : byLop.getOrDefault(lopId, Collections.emptyList())) {
                    String tenMon = p.getMonHoc().getTenMon();
                    int periods = getPeriodCount(tenMon, lop);
                    if (isAfternoonSubject(tenMon)) {
                        for (int i = 0; i < periods; i++)
                            allTasks.add(new ScheduleTask(lop, p, 1, true));
                    } else if (isHeavy(tenMon)) {
                        for (int i = 0; i < periods / 2; i++) allTasks.add(new ScheduleTask(lop, p, 2, false));
                        if (periods % 2 == 1) allTasks.add(new ScheduleTask(lop, p, 1, false));
                    } else {
                        for (int i = 0; i < periods; i++) allTasks.add(new ScheduleTask(lop, p, 1, false));
                    }
                }
            }

            Collections.shuffle(allTasks, new Random(System.nanoTime())); // Break identical schedules for tasks with same weight
            allTasks.sort((a, b) -> {
                if (a.afternoon != b.afternoon) return a.afternoon ? 1 : -1;
                return b.count - a.count;
            });

            List<ThoiKhoaBieu> allCreated = new ArrayList<>();
            List<String> warnings = new ArrayList<>();

            for (int week = 1; week <= soTuan; week++) {
                Random weekRng = new Random(System.nanoTime() + week * 12345L);

                Map<Integer, Set<String>> tSlots  = new HashMap<>();
                Map<Integer, Set<String>> cSlots  = new HashMap<>();
                Map<Integer, Set<String>> nSlots  = new HashMap<>();
                Map<String,  Set<String>> roomSlots = new HashMap<>();
                Map<Integer, Map<Integer, Set<String>>> subjectDayMap = new HashMap<>();
                List<ThoiKhoaBieu> weekCreated = new ArrayList<>();

                for (LopHoc lop : lops) {
                    int lopId = lop.getId();
                    cSlots.put(lopId, new HashSet<>());
                    nSlots.put(lopId, new HashSet<>());
                    subjectDayMap.put(lopId, new HashMap<>());
                    cSlots.get(lopId).add(lopId + ":2:1");
                    cSlots.get(lopId).add(lopId + ":7:5");

                    GiaoVien gvcn = null;
                    Integer giaoVienId = chuNhiemMap.get(lopId);
                    if (giaoVienId != null) gvcn = gvAllMap.get(giaoVienId);
                    if (gvcn == null) gvcn = lop.getGvcn();

                    if (gvcn != null) {
                        int gvcnId = gvcn.getId();
                        tSlots.computeIfAbsent(gvcnId, k -> new HashSet<>());
                        tSlots.get(gvcnId).add(gvcnId + ":2:1");
                        tSlots.get(gvcnId).add(gvcnId + ":7:5");
                        String room = classRoomMap.get(lopId);
                        if (room != null && !room.isBlank()) {
                            roomSlots.computeIfAbsent(room, k -> new HashSet<>()).add("2:1");
                            roomSlots.computeIfAbsent(room, k -> new HashSet<>()).add("7:5");
                        }
                        subjectDayMap.get(lopId).computeIfAbsent(2, k -> new HashSet<>()).add(String.valueOf(shdcMon.getId()));
                        subjectDayMap.get(lopId).computeIfAbsent(7, k -> new HashSet<>()).add(String.valueOf(shlMon.getId()));

                        ThoiKhoaBieu shdc = new ThoiKhoaBieu();
                        shdc.setLop(lop); shdc.setMonHoc(shdcMon); shdc.setGiaoVien(gvcn);
                        shdc.setThu(2); shdc.setTietBatDau(1); shdc.setSoTiet(1);
                        shdc.setNamHoc(namHoc); shdc.setHocKy(hocKy); shdc.setTuan(week);
                        if (room != null && !room.isBlank()) shdc.setPhongHoc(room);
                        weekCreated.add(shdc);

                        ThoiKhoaBieu shl = new ThoiKhoaBieu();
                        shl.setLop(lop); shl.setMonHoc(shlMon); shl.setGiaoVien(gvcn);
                        shl.setThu(7); shl.setTietBatDau(5); shl.setSoTiet(1);
                        shl.setNamHoc(namHoc); shl.setHocKy(hocKy); shl.setTuan(week);
                        if (room != null && !room.isBlank()) shl.setPhongHoc(room);
                        weekCreated.add(shl);
                    }
                }

                Map<Integer, int[]> dayOrderMap = new HashMap<>();
                for (LopHoc lop : lops) {
                    int[] order = SCHOOL_DAYS.clone();
                    for (int i = order.length - 1; i > 0; i--) {
                        int j = weekRng.nextInt(i + 1);
                        int tmp = order[i]; order[i] = order[j]; order[j] = tmp;
                    }
                    dayOrderMap.put(lop.getId(), order);
                }

                for (ScheduleTask task : allTasks) {
                    int lopId        = task.lop.getId();
                    int giaoVienId   = task.assignment.getGiaoVien().getId();
                    int monHocId     = task.assignment.getMonHoc().getId();
                    String tenMon    = task.assignment.getMonHoc().getTenMon();
                    boolean isHeavyS = isHeavy(tenMon);
                    Set<String> classSlots     = cSlots.get(lopId);
                    Set<String> neighborSlots  = nSlots.get(lopId);
                    Set<String> giaoVienSlots  = tSlots.computeIfAbsent(giaoVienId, k -> new HashSet<>());
                    int[] dayOrder = dayOrderMap.getOrDefault(lopId, SCHOOL_DAYS);
                    boolean placed = false;

                    if (task.afternoon) {
                        int maxAfternoonTiet = (task.count >= 2) ? 9 : 10;
                        for (int day : dayOrder) {

                            if (placed) break;
                            if (task.count >= 2 && countSubjectOnDay(neighborSlots, monHocId, day) > 0) continue;
                            if (task.count == 1 && countSubjectOnDay(neighborSlots, monHocId, day) >= 2) continue;
                            int t = getFirstEmptyAfternoonSlot(classSlots, lopId, day, maxAfternoonTiet);
                            if (t == -1) continue;
                            if (task.count >= 2) {
                                if (t + 1 > 10) continue;
                                if (canPlace(lopId, day, t, 2, giaoVienId, cSlots, tSlots, roomSlots, classRoomMap)) {
                                    doPlace(task.lop, task.assignment, day, t, 2, giaoVienId, namHoc, hocKy, week, cSlots, tSlots, roomSlots, classRoomMap, weekCreated);
                                    neighborSlots.add(monHocId + ":" + day + ":" + t);
                                    neighborSlots.add(monHocId + ":" + day + ":" + (t + 1));
                                    subjectDayMap.get(lopId).computeIfAbsent(day, k -> new HashSet<>()).add(String.valueOf(monHocId));
                                    placed = true; break;
                                }
                            } else {
                                if (canPlace(lopId, day, t, 1, giaoVienId, cSlots, tSlots, roomSlots, classRoomMap)) {
                                    doPlace(task.lop, task.assignment, day, t, 1, giaoVienId, namHoc, hocKy, week, cSlots, tSlots, roomSlots, classRoomMap, weekCreated);
                                    neighborSlots.add(monHocId + ":" + day + ":" + t);
                                    subjectDayMap.get(lopId).computeIfAbsent(day, k -> new HashSet<>()).add(String.valueOf(monHocId));
                                    placed = true; break;
                                }
                            }
                        }
                    } else if (task.count == 2) {
                        for (int day : dayOrder) {
                            if (placed) break;
                            if (countSubjectOnDay(neighborSlots, monHocId, day) > 0) continue;
                            int maxTiet = (day == 7) ? 4 : 5;
                            int t = getNextCompactDoubleStart(classSlots, lopId, day, maxTiet);
                            if (t == -1) continue;
                            if (canPlace(lopId, day, t, 2, giaoVienId, cSlots, tSlots, roomSlots, classRoomMap)) {
                                doPlace(task.lop, task.assignment, day, t, 2, giaoVienId, namHoc, hocKy, week, cSlots, tSlots, roomSlots, classRoomMap, weekCreated);
                                neighborSlots.add(monHocId + ":" + day + ":" + t);
                                neighborSlots.add(monHocId + ":" + day + ":" + (t + 1));
                                subjectDayMap.get(lopId).computeIfAbsent(day, k -> new HashSet<>()).add(String.valueOf(monHocId));
                                placed = true; break;
                            }
                        }
                    } else {
                        for (int day : dayOrder) {
                            if (placed) break;
                            if (countSubjectOnDay(neighborSlots, monHocId, day) >= 2) continue;
                            if (!isHeavyS && isSubjectAlreadyOnDay(subjectDayMap, lopId, day, monHocId)) continue;
                            int maxTiet = (day == 7) ? 4 : 5;
                            int t = getFirstEmptySlot(classSlots, lopId, day, maxTiet);
                            if (t == -1) continue;
                            if (taken(giaoVienSlots, giaoVienId, day, t)) continue;
                            if (hasAdjacentSameSubject(neighborSlots, monHocId, day, t)) continue;
                            doPlace(task.lop, task.assignment, day, t, 1, giaoVienId, namHoc, hocKy, week, cSlots, tSlots, roomSlots, classRoomMap, weekCreated);
                            neighborSlots.add(monHocId + ":" + day + ":" + t);
                            subjectDayMap.get(lopId).computeIfAbsent(day, k -> new HashSet<>()).add(String.valueOf(monHocId));
                            placed = true; break;
                        }
                        if (!placed) {
                            for (int day : dayOrder) {
                                if (placed) break;
                                if (countSubjectOnDay(neighborSlots, monHocId, day) >= 2) continue;
                                int maxTiet = (day == 7) ? 4 : 5;
                                int t = getFirstEmptySlot(classSlots, lopId, day, maxTiet);
                                if (t == -1) continue;
                                if (taken(giaoVienSlots, giaoVienId, day, t)) continue;
                                doPlace(task.lop, task.assignment, day, t, 1, giaoVienId, namHoc, hocKy, week, cSlots, tSlots, roomSlots, classRoomMap, weekCreated);
                                neighborSlots.add(monHocId + ":" + day + ":" + t);
                                subjectDayMap.get(lopId).computeIfAbsent(day, k -> new HashSet<>()).add(String.valueOf(monHocId));
                                placed = true; break;
                            }
                        }
                    }

                    if (!placed)
                        logger.debug("Bỏ qua {} cho lớp {} tuần {}", tenMon, task.lop.getTenLop(), week);
                }

                allCreated.addAll(weekCreated);
                logger.info("Da tao TKB tuan {}: {} entries (plan {})", week, weekCreated.size(), (week % 2 == 1) ? "A" : "B");
            }

            List<ThoiKhoaBieu> saved = tkbRepo.saveAll(allCreated);
            return new GenerateResult(saved, warnings, new ArrayList<>());
        } catch (ApiException e) { throw e; }
        catch (Exception e) { throw new ApiException("Loi TKB: " + e.getMessage()); }
    }

    @Transactional
    public GenerateResult generateSchedule(String namHoc, Integer hocKy) {
        return generateSchedule(namHoc, hocKy, 1);
    }

    @Transactional
    public GenerateResult generateScheduleForWeek(String namHoc, Integer hocKy, Integer tuan) {
        if (namHoc == null || namHoc.isBlank() || hocKy == null) throw new ApiException("Thiếu namHoc/hocKy");
        if (tuan == null || tuan < 1) tuan = 1;
        crudService.validateTuanInHocKy(namHoc, hocKy, tuan);
        @SuppressWarnings("null") Integer nonNullHocKy = hocKy;
        @SuppressWarnings("null") Integer nonNullTuan  = tuan;
        try {
            var existingTkb = tkbRepo.findByNamHocAndHocKyAndTuan(namHoc, nonNullHocKy, nonNullTuan);
            List<ThoiKhoaBieu> lockedTkb = new ArrayList<>();
            if (existingTkb != null) {
                List<ThoiKhoaBieu> toDelete = new ArrayList<>();
                for (ThoiKhoaBieu t : existingTkb) {
                    if (t.getIsLocked() != null && t.getIsLocked()) {
                        lockedTkb.add(t);
                    } else {
                        toDelete.add(t);
                    }
                }
                tkbRepo.deleteAll(toDelete);
            }
            tkbRepo.flush();

            Map<Integer, GiaoVien> gvcnMap = new HashMap<>();
            try {
                for (ChuNhiem cn : cnRepo.findAll()) {
                    GiaoVien gv = gvRepo.findById(cn.getId().getGiaoVienId()).orElse(null);
                    if (gv != null) gvcnMap.put(cn.getId().getLopId(), gv);
                }
            } catch (Exception ex) { logger.warn("Khong the tai du lieu chu nhiem: {}", ex.getMessage()); }

            List<PhanCongDay> phanCongList = pcRepo.findByNamHocAndHocKy(namHoc, hocKy);
            List<LopHoc> lops = lopRepo.findByNamHoc(namHoc);

            Map<Integer, String> classRoomMap = new HashMap<>();
            for (LopHoc lop : lops)
                if (lop.getPhongHoc() != null && !lop.getPhongHoc().isBlank())
                    classRoomMap.put(lop.getId(), lop.getPhongHoc());

            Map<String, PhanCongDay> phanCongMap = new HashMap<>();
            for (PhanCongDay p : phanCongList) {
                if (p.getLop() == null || p.getGiaoVien() == null || p.getMonHoc() == null) continue;
                String maMon = p.getMonHoc().getMaMon();
                if ("SHDC".equals(maMon) || "SHL".equals(maMon)) continue;
                phanCongMap.put(p.getLop().getId() + ":" + p.getMonHoc().getId(), p);
            }

            MonHoc shdcMon = findMon("SHDC", "SHDC");
            MonHoc shlMon  = findMon("SHL",  "Sinh hoạt lớp");

            long seed = System.nanoTime() + java.util.concurrent.ThreadLocalRandom.current().nextLong();

            GenerateResult bestResult = null;
            int bestWarnings = Integer.MAX_VALUE;
            for (int attempt = 0; attempt < 50; attempt++) {
                List<LopHoc> shuffledLops = new ArrayList<>(lops);
                Collections.shuffle(shuffledLops, new Random(seed + attempt * 37L));
                GenerateResult result = generateConflictFree(shuffledLops, phanCongMap, namHoc, hocKy, nonNullTuan,
                        classRoomMap, gvcnMap, shdcMon, shlMon, new Random(seed + attempt * 17L), lockedTkb);
                int warningCount = result.getConflicts().size();
                if (warningCount < bestWarnings) {
                    bestWarnings = warningCount;
                    bestResult = result;
                    if (warningCount == 0) break;
                }
            }

            List<ThoiKhoaBieu> saved = tkbRepo.saveAll(bestResult.getCreated());
            return new GenerateResult(saved, bestResult.getWarnings(), bestResult.getConflicts());
        } catch (ApiException e) { throw e; }
        catch (Exception e) { throw new ApiException("Loi TKB: " + e.getMessage()); }
    }

    @Transactional
    public GenerateResult shuffleSchedule(String namHoc, Integer hocKy, Integer tuan) {
        if (namHoc == null || namHoc.isBlank() || hocKy == null || tuan == null)
            throw new ApiException("Thiếu namHoc/hocKy/tuan");
        crudService.validateTuanInHocKy(namHoc, hocKy, tuan);

        int sourceTuan = tuan;
        int targetTuan = tuan;

        List<ThoiKhoaBieu> sourceTkb = tkbRepo.findByNamHocAndHocKyAndTuan(namHoc, hocKy, sourceTuan);
        if (sourceTkb.isEmpty()) {
            throw new ApiException("Không có thời khóa biểu tuần " + tuan + " để xáo trộn");
        }

        Map<String, PhanCongDay> phanCongMap = new HashMap<>();
        Set<Integer> lopIdSet = new HashSet<>();

        for (ThoiKhoaBieu tkb : sourceTkb) {
            String maMon = tkb.getMonHoc().getMaMon();
            if (!"SHDC".equals(maMon) && !"SHL".equals(maMon)) {
                PhanCongDay pc = new PhanCongDay();
                pc.setGiaoVien(tkb.getGiaoVien()); pc.setMonHoc(tkb.getMonHoc());
                pc.setLop(tkb.getLop()); pc.setHocKy(hocKy); pc.setNamHoc(namHoc);
                phanCongMap.put(tkb.getLop().getId() + ":" + tkb.getMonHoc().getId(), pc);
                lopIdSet.add(tkb.getLop().getId());
            }
        }

        List<ThoiKhoaBieu> targetTkb = tkbRepo.findByNamHocAndHocKyAndTuan(namHoc, hocKy, targetTuan);
        List<ThoiKhoaBieu> lockedTkb = new ArrayList<>();
        if (!targetTkb.isEmpty()) {
            List<ThoiKhoaBieu> toDelete = new ArrayList<>();
            for (ThoiKhoaBieu t : targetTkb) {
                if (t.getIsLocked() != null && t.getIsLocked()) {
                    lockedTkb.add(t);
                } else {
                    toDelete.add(t);
                }
            }
            tkbRepo.deleteAll(toDelete);
            tkbRepo.flush();
        }

        List<LopHoc> lops = new ArrayList<>();
        for (Integer lopId : lopIdSet) lopRepo.findById(lopId).ifPresent(lops::add);

        Map<Integer, String> classRoomMap = new HashMap<>();
        for (LopHoc lop : lops)
            if (lop.getPhongHoc() != null && !lop.getPhongHoc().isBlank())
                classRoomMap.put(lop.getId(), lop.getPhongHoc());

        Map<Integer, GiaoVien> gvcnMap = new HashMap<>();
        try {
            for (ChuNhiem cn : cnRepo.findAll()) {
                GiaoVien gv = gvRepo.findById(cn.getId().getGiaoVienId()).orElse(null);
                if (gv != null) gvcnMap.put(cn.getId().getLopId(), gv);
            }
        } catch (Exception ex) { logger.warn("Khong the tai du lieu chu nhiem: {}", ex.getMessage()); }

        MonHoc shdcMon = findMon("SHDC", "SHDC");
        MonHoc shlMon  = findMon("SHL",  "Sinh hoạt lớp");

        long seed = System.currentTimeMillis() + (tuan * 1234L);
        List<LopHoc> shuffledLops = new ArrayList<>(lops);
        Collections.shuffle(shuffledLops, new Random(seed));
        GenerateResult result = generateConflictFree(shuffledLops, phanCongMap, namHoc, hocKy, targetTuan,
                classRoomMap, gvcnMap, shdcMon, shlMon, new Random(seed), lockedTkb);

        List<ThoiKhoaBieu> saved = tkbRepo.saveAll(result.getCreated());
        return new GenerateResult(saved, result.getWarnings(), result.getConflicts());
    }

    private static class SlotInfo {
        final int thu, tiet, lopId;
        final String tenLop;
        SlotInfo(int thu, int tiet, int lopId, String tenLop) {
            this.thu = thu; this.tiet = tiet; this.lopId = lopId; this.tenLop = tenLop;
        }
        @Override public boolean equals(Object o) {
            if (!(o instanceof SlotInfo s)) return false;
            return thu == s.thu && tiet == s.tiet;
        }
        @Override public int hashCode() { return thu * 100 + tiet; }
    }

    private int countSubjectOnDay(Set<String> neighborSlots, int monHocId, int day) {
        int cnt = 0;
        for (int t = 1; t <= 10; t++)
            if (neighborSlots.contains(monHocId + ":" + day + ":" + t)) cnt++;
        return cnt;
    }

    private boolean wouldCreate3Consecutive(Set<String> neighborSlots, int monHocId, int day, int tiet) {
        int before = 0;
        for (int t = tiet - 1; t >= 1; t--) {
            if (neighborSlots.contains(monHocId + ":" + day + ":" + t)) before++; else break;
        }
        int after = 0;
        for (int t = tiet + 1; t <= 10; t++) {
            if (neighborSlots.contains(monHocId + ":" + day + ":" + t)) after++; else break;
        }
        return (before + 1 + after) >= 3;
    }

    private boolean teacherExceedsDailyLimit(Map<Integer, Set<String>> gvSlots, int gvId, int day, int maxPerDay) {
        Set<String> slots = gvSlots.getOrDefault(gvId, Set.of());
        long cnt = slots.stream().filter(s -> s.startsWith(day + ":")).count();
        return cnt >= maxPerDay;
    }

    private void shuffleArray(int[] arr, Random rng) {
        for (int i = arr.length - 1; i > 0; i--) {
            int j = rng.nextInt(i + 1);
            int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }

    private GenerateResult generateConflictFree(List<LopHoc> lops,
                                                  Map<String, PhanCongDay> phanCongMap,
                                                  String namHoc, int hocKy, int tuan,
                                                  Map<Integer, String> classRoomMap,
                                                  Map<Integer, GiaoVien> gvcnMap,
                                                  MonHoc shdcMon, MonHoc shlMon,
                                                  Random rng,
                                                  List<ThoiKhoaBieu> lockedTkb) {
        Map<Integer, Set<String>> gvSlots       = new HashMap<>();
        Map<Integer, Set<String>> classSlots    = new HashMap<>();
        Map<Integer, Set<String>> neighborSlots = new HashMap<>();
        Map<String,  Integer>     classDayLoad  = new HashMap<>();
        Map<String,  Set<Integer>> heavyDayMap  = new HashMap<>();

        List<ThoiKhoaBieu>   result    = new ArrayList<>();
        List<String>         warnings  = new ArrayList<>();
        List<ConflictInfo>   conflicts = new ArrayList<>();

        for (LopHoc lop : lops) {
            classSlots.put(lop.getId(), new HashSet<>());
            neighborSlots.put(lop.getId(), new HashSet<>());
        }

        Map<Integer, Map<String, Integer>> toHopPeriodMap = new HashMap<>();
        try {
            for (ChiTietToHop ct : chiTietToHopRepo.findAll()) {
                if (ct.getToHopMon() != null && ct.getMonHoc() != null) {
                    int thId = ct.getToHopMon().getId();
                    String normMon = normalizeVietnamese(ct.getMonHoc().getTenMon());
                    int soTiet = ct.getSoTiet() != null ? ct.getSoTiet() : 2;
                    toHopPeriodMap.computeIfAbsent(thId, k -> new HashMap<>()).put(normMon, soTiet);
                }
            }
        } catch (Exception ex) {
            logger.warn("Lỗi tải toHopPeriodMap: {}", ex.getMessage());
        }

        Set<String> gvBanSet = new HashSet<>();
        try {
            for (GiaoVienBan gvb : gvBanRepo.findAll()) {
                if (gvb.getGiaoVien() != null) {
                    gvBanSet.add(gvb.getGiaoVien().getId() + ":" + gvb.getThu() + ":" + gvb.getTiet());
                }
            }
        } catch (Exception ex) {
            logger.warn("Lỗi tải gvBanSet: {}", ex.getMessage());
        }

        if (lockedTkb != null) {
            for (ThoiKhoaBieu tkb : lockedTkb) {
                if (tkb.getLop() == null || tkb.getMonHoc() == null) continue;
                int lopId = tkb.getLop().getId();
                int thu = tkb.getThu();
                int start = tkb.getTietBatDau();
                int cnt = tkb.getSoTiet() != null ? tkb.getSoTiet() : 1;
                Integer gvId = tkb.getGiaoVien() != null ? tkb.getGiaoVien().getId() : null;
                int monHocId = tkb.getMonHoc().getId();

                for (int i = 0; i < cnt; i++) {
                    String sk = thu + ":" + (start + i);
                    classSlots.computeIfAbsent(lopId, k -> new HashSet<>()).add(sk);
                    if (gvId != null) {
                        gvSlots.computeIfAbsent(gvId, k -> new HashSet<>()).add(sk);
                    }
                    neighborSlots.computeIfAbsent(lopId, k -> new HashSet<>()).add(monHocId + ":" + thu + ":" + (start + i));
                }
                classDayLoad.merge(lopId + ":" + thu, cnt, Integer::sum);
                
                boolean heavy = isHeavy(tkb.getMonHoc().getTenMon());
                if (heavy) {
                    heavyDayMap.computeIfAbsent(lopId + ":" + thu, k -> new HashSet<>()).add(monHocId);
                }
                result.add(tkb);
            }
        }

        for (LopHoc lop : lops) {
            int lopId = lop.getId();
            GiaoVien gvcn = gvcnMap.get(lopId);
            classSlots.get(lopId).add("2:1");
            classSlots.get(lopId).add("7:5");
            
            GiaoVien gvcnShdc = gvcn;
            if (gvcn != null && gvSlots.computeIfAbsent(gvcn.getId(), k -> new HashSet<>()).contains("2:1")) {
                gvcnShdc = null;
            }
            if (gvcnShdc != null) {
                gvSlots.get(gvcn.getId()).add("2:1");
            }
            
            GiaoVien gvcnShl = gvcn;
            if (gvcn != null && gvSlots.computeIfAbsent(gvcn.getId(), k -> new HashSet<>()).contains("7:5")) {
                gvcnShl = null;
            }
            if (gvcnShl != null) {
                gvSlots.get(gvcn.getId()).add("7:5");
            }
            
            classDayLoad.merge(lopId + ":2", 1, Integer::sum);
            classDayLoad.merge(lopId + ":7", 1, Integer::sum);
            result.add(createTkb(lop, createPhanCong(gvcnShdc, shdcMon),
                    2, 1, 1, namHoc, hocKy, tuan, classRoomMap));
            result.add(createTkb(lop, createPhanCong(gvcnShl, shlMon),
                    7, 5, 1, namHoc, hocKy, tuan, classRoomMap));
        }

        Map<Integer, List<PhanCongDay>> morningByLop   = new HashMap<>();
        Map<Integer, List<PhanCongDay>> afternoonByLop = new HashMap<>();

        for (LopHoc lop : lops) {
            int lopId = lop.getId();
            List<PhanCongDay> allPcs = new ArrayList<>();
            for (var entry : phanCongMap.entrySet()) {
                if (entry.getKey().startsWith(lopId + ":")) {
                    allPcs.add(entry.getValue());
                }
            }

            int totalPeriods = 2;
            for (PhanCongDay pc : allPcs) {
                totalPeriods += getPeriodCount(pc.getMonHoc().getTenMon(), lop, toHopPeriodMap);
            }

            List<PhanCongDay> morning = new ArrayList<>();
            List<PhanCongDay> afternoon = new ArrayList<>();
            for (PhanCongDay pc : allPcs) {
                if (isAfternoonSubject(pc.getMonHoc().getTenMon())) {
                    afternoon.add(pc);
                } else {
                    morning.add(pc);
                }
            }

            Collections.shuffle(morning, rng); // Break identical schedules for subjects with same weight
            morning.sort((a, b) -> {
                int ha = isHeavy(a.getMonHoc().getTenMon()) ? 0 : 1;
                int hb = isHeavy(b.getMonHoc().getTenMon()) ? 0 : 1;
                if (ha != hb) return ha - hb;
                return getPeriodCount(b.getMonHoc().getTenMon(), lop, toHopPeriodMap) - getPeriodCount(a.getMonHoc().getTenMon(), lop, toHopPeriodMap);
            });
            morningByLop.put(lopId, morning);
            afternoonByLop.put(lopId, afternoon);
        }

        Map<String, Integer> classDayTargetLoadMap = new HashMap<>();
        for (LopHoc lop : lops) {
            int lopId = lop.getId();
            List<PhanCongDay> morningPcs = morningByLop.get(lopId);
            int totalMorningPeriods = 0;
            if (morningPcs != null) {
                for (PhanCongDay pc : morningPcs) {
                    totalMorningPeriods += getPeriodCount(pc.getMonHoc().getTenMon(), lop, toHopPeriodMap);
                }
            }
            int totalNeeded = totalMorningPeriods + 2;
            int[] targets = new int[8];
            List<Integer> dayList = new ArrayList<>(Arrays.asList(2, 3, 4, 5, 6, 7));
            Collections.shuffle(dayList, rng);
            int base = totalNeeded / 6;
            int extra = totalNeeded % 6;
            for (int d : dayList) targets[d] = base;
            for (int i = 0; i < extra; i++) targets[dayList.get(i)]++;

            boolean changed = true;
            while (changed) {
                changed = false;
                for (int day = 2; day <= 7; day++) {
                    int maxCap = 5;
                    if (targets[day] > maxCap) {
                        int excess = targets[day] - maxCap;
                        targets[day] = maxCap;
                        for (int e = 0; e < excess; e++) {
                            for (int otherDay : dayList) {
                                int otherMax = 5;
                                if (targets[otherDay] < otherMax) {
                                    targets[otherDay]++;
                                    break;
                                }
                            }
                        }
                        changed = true;
                    }
                }
            }
            for (int day = 2; day <= 7; day++) {
                classDayTargetLoadMap.put(lopId + ":" + day, targets[day]);
            }
        }

        Map<Integer, Integer> periodLeft  = new HashMap<>();
        Map<Integer, Boolean> needDouble  = new HashMap<>();

        for (LopHoc lop : lops) {
            int lopId = lop.getId();
            List<PhanCongDay> pcs = morningByLop.get(lopId);
            for (int i = 0; i < pcs.size(); i++) {
                PhanCongDay pc = pcs.get(i);
                int total = getPeriodCount(pc.getMonHoc().getTenMon(), lop, toHopPeriodMap);
                
                int lockedPeriods = 0;
                if (lockedTkb != null) {
                    for (ThoiKhoaBieu tkb : lockedTkb) {
                        if (tkb.getLop() != null && tkb.getLop().getId().equals(lopId) &&
                            tkb.getMonHoc() != null && tkb.getMonHoc().getId().equals(pc.getMonHoc().getId())) {
                            lockedPeriods += tkb.getSoTiet() != null ? tkb.getSoTiet() : 1;
                        }
                    }
                }
                total = Math.max(0, total - lockedPeriods);

                periodLeft.put(lopId * 10000 + i, total);
                needDouble.put(lopId * 10000 + i, isHeavy(pc.getMonHoc().getTenMon()) && total >= 2);
            }
        }

        record MorningTask(LopHoc lop, int idx) {}
        List<MorningTask> taskList = new ArrayList<>();
        for (LopHoc lop : lops) {
            int lopId = lop.getId();
            List<PhanCongDay> pcs = morningByLop.get(lopId);
            for (int i = 0; i < pcs.size(); i++) taskList.add(new MorningTask(lop, i));
        }
        taskList.sort((a, b) -> {
            PhanCongDay pca = morningByLop.get(a.lop().getId()).get(a.idx());
            PhanCongDay pcb = morningByLop.get(b.lop().getId()).get(b.idx());
            int ha = isHeavy(pca.getMonHoc().getTenMon()) ? 0 : 1;
            int hb = isHeavy(pcb.getMonHoc().getTenMon()) ? 0 : 1;
            if (ha != hb) return ha - hb;
            int ta = getPeriodCount(pca.getMonHoc().getTenMon(), a.lop(), toHopPeriodMap);
            int tb = getPeriodCount(pcb.getMonHoc().getTenMon(), b.lop(), toHopPeriodMap);
            return tb - ta;
        });

        for (int pass = 0; pass < 6; pass++) {
            List<MorningTask> remaining = new ArrayList<>();
            for (MorningTask mt : taskList) {
                if (periodLeft.getOrDefault(mt.lop().getId() * 10000 + mt.idx(), 0) > 0)
                    remaining.add(mt);
            }
            if (remaining.isEmpty()) break;

            for (MorningTask mt : remaining) {
                int lopId     = mt.lop().getId();
                PhanCongDay pc = morningByLop.get(lopId).get(mt.idx());
                int monHocId  = pc.getMonHoc().getId();
                String tenMon = pc.getMonHoc().getTenMon();
                boolean heavy = isHeavy(tenMon);
                Integer gvId  = pc.getGiaoVien() != null ? pc.getGiaoVien().getId() : null;
                int key       = lopId * 10000 + mt.idx();
                int left      = periodLeft.getOrDefault(key, 0);
                if (left <= 0) continue;
                boolean wantDouble = needDouble.getOrDefault(key, false);
                Set<String> clsSlots = classSlots.get(lopId);
                Set<String> nbSlots  = neighborSlots.get(lopId);

                List<Integer> dayOrder = buildMorningDayOrder(lopId, tuan, rng, classDayLoad, heavyDayMap, heavy, classDayTargetLoadMap);

                boolean placed = false;

                if (wantDouble && left >= 2) {
                    for (int day : dayOrder) {
                        if (placed) break;
                        if (isMorningDayFull(lopId, day, classDayLoad, classDayTargetLoadMap)) continue;
                        if (heavy && isHeavyDayBlocked(lopId, day, monHocId, heavyDayMap)) continue;
                        if (countSubjectOnDay(nbSlots, monHocId, day) > 0) continue;
                        if (heavy) {
                            Set<Integer> heavyToday = heavyDayMap.getOrDefault(lopId + ":" + day, Set.of());
                            int maxHeavy = getMaxHeavySubjectsPerDay(mt.lop());
                            if (heavyToday.size() >= maxHeavy && !heavyToday.contains(monHocId)) continue;
                        }
                        if (gvId != null && teacherExceedsDailyLimit(gvSlots, gvId, day, 4)) continue;
                        int maxTiet = (day == 7) ? 4 : 5;
                        int t1 = getNextCompactDoubleStartDaySlots(clsSlots, lopId, day, maxTiet);
                        if (t1 == -1) continue;
                        int t2 = t1 + 1;
                        String sk1 = day + ":" + t1, sk2 = day + ":" + t2;
                        boolean gvOk = true;
                        if (gvId != null) {
                            gvOk = !gvSlots.getOrDefault(gvId, Set.of()).contains(sk1)
                                && !gvSlots.getOrDefault(gvId, Set.of()).contains(sk2)
                                && !isTeacherBusy(gvId, day, t1, gvBanSet)
                                && !isTeacherBusy(gvId, day, t2, gvBanSet);
                        }
                        boolean clsOk = !clsSlots.contains(sk1) && !clsSlots.contains(sk2);
                        boolean r5ok  = pass >= 4 && !isMorningDayFull(lopId, day, classDayLoad, classDayTargetLoadMap)
                                || !wouldCreate3Consecutive(nbSlots, monHocId, day, t1);
                        boolean r5ok2 = pass >= 4 && !isMorningDayFull(lopId, day, classDayLoad, classDayTargetLoadMap)
                                || !wouldCreate3Consecutive(nbSlots, monHocId, day, t2);
                        if (gvOk && clsOk && r5ok && r5ok2) {
                            if (gvId != null) {
                                gvSlots.computeIfAbsent(gvId, k -> new HashSet<>()).add(sk1);
                                gvSlots.get(gvId).add(sk2);
                            }
                            clsSlots.add(sk1); clsSlots.add(sk2);
                            nbSlots.add(monHocId + ":" + day + ":" + t1);
                            nbSlots.add(monHocId + ":" + day + ":" + t2);
                            classDayLoad.merge(lopId + ":" + day, 2, Integer::sum);
                            if (heavy) heavyDayMap.computeIfAbsent(lopId + ":" + day, k -> new HashSet<>()).add(monHocId);
                            result.add(createTkb(mt.lop(), pc, day, t1, 2, namHoc, hocKy, tuan, classRoomMap));
                            periodLeft.put(key, left - 2);
                            if (left - 2 <= 0) needDouble.put(key, false);
                            placed = true; break;
                        }
                    }
                }

                if (!placed && left > 0) {
                    outerSingle:
                    for (int day : dayOrder) {
                        if (isMorningDayFull(lopId, day, classDayLoad, classDayTargetLoadMap)) continue;
                        if (heavy && isHeavyDayBlocked(lopId, day, monHocId, heavyDayMap)) continue;
                        if (countSubjectOnDay(nbSlots, monHocId, day) >= 2) continue;
                        if (!heavy && pass < 2 && countSubjectOnDay(nbSlots, monHocId, day) >= 1) continue;
                        if (heavy) {
                            Set<Integer> heavyToday = heavyDayMap.getOrDefault(lopId + ":" + day, Set.of());
                            int maxHeavy = getMaxHeavySubjectsPerDay(mt.lop());
                            if (heavyToday.size() >= maxHeavy && !heavyToday.contains(monHocId)) continue;
                        }
                        if (gvId != null && pass < 3 && teacherExceedsDailyLimit(gvSlots, gvId, day, 5)) continue;
                        int maxTiet = (day == 7) ? 4 : 5;
                        int t = getNextCompactMorningSlotDaySlots(clsSlots, lopId, day, maxTiet);
                        if (t == -1) continue;
                        String sk = day + ":" + t;
                        boolean gvOk = true;
                        if (gvId != null) {
                            gvOk = !gvSlots.getOrDefault(gvId, Set.of()).contains(sk)
                                && !isTeacherBusy(gvId, day, t, gvBanSet);
                        }
                        boolean clsOk = !clsSlots.contains(sk);
                        boolean r5ok  = (pass >= 4 && !isMorningDayFull(lopId, day, classDayLoad, classDayTargetLoadMap))
                                || !wouldCreate3Consecutive(nbSlots, monHocId, day, t);
                        if (gvOk && clsOk && r5ok) {
                            if (gvId != null) {
                                gvSlots.computeIfAbsent(gvId, k -> new HashSet<>()).add(sk);
                            }
                            clsSlots.add(sk);
                            nbSlots.add(monHocId + ":" + day + ":" + t);
                            classDayLoad.merge(lopId + ":" + day, 1, Integer::sum);
                            if (heavy) heavyDayMap.computeIfAbsent(lopId + ":" + day, k -> new HashSet<>()).add(monHocId);
                            result.add(createTkb(mt.lop(), pc, day, t, 1, namHoc, hocKy, tuan, classRoomMap));
                            periodLeft.put(key, left - 1);
                            if (wantDouble && left - 1 < 2) needDouble.put(key, false);
                            placed = true;
                            break outerSingle;
                        }
                    }
                }
            }
        }

        placeRemainingMorningFallback(lops, morningByLop, periodLeft, classSlots, neighborSlots,
                gvSlots, classDayLoad, heavyDayMap, namHoc, hocKy, tuan, classRoomMap, result, rng, classDayTargetLoadMap, gvBanSet);

        for (LopHoc lop : lops) {
            int lopId = lop.getId();
            Set<String> clsSlots = classSlots.get(lopId);
            Set<String> nbSlots  = neighborSlots.get(lopId);
            List<PhanCongDay> afternoonPcs = afternoonByLop.get(lopId);
            Collections.shuffle(afternoonPcs, rng); // Break identical schedules for subjects with same weight
            afternoonPcs.sort((a, b) -> getPeriodCount(b.getMonHoc().getTenMon(), lop, toHopPeriodMap) - getPeriodCount(a.getMonHoc().getTenMon(), lop, toHopPeriodMap));

            Map<Integer, Integer> afternoonDayUsed = new HashMap<>();
            for (int d = 2; d <= 7; d++) afternoonDayUsed.put(d, 0);

            for (PhanCongDay pc : afternoonPcs) {
                Integer gvId = pc.getGiaoVien() != null ? pc.getGiaoVien().getId() : null;
                int monHocId = pc.getMonHoc().getId();
                int periods  = getPeriodCount(pc.getMonHoc().getTenMon(), lop, toHopPeriodMap);
                
                int lockedPeriods = 0;
                if (lockedTkb != null) {
                    for (ThoiKhoaBieu tkb : lockedTkb) {
                        if (tkb.getLop() != null && tkb.getLop().getId().equals(lopId) &&
                            tkb.getMonHoc() != null && tkb.getMonHoc().getId().equals(monHocId)) {
                            lockedPeriods += tkb.getSoTiet() != null ? tkb.getSoTiet() : 1;
                        }
                    }
                }
                int left     = Math.max(0, periods - lockedPeriods);



                for (int i = 0; i < left; i++) {
                    boolean placed = false;
                    List<Integer> sortedDays = buildFillFirstDayOrder(lopId, rng, classDayLoad, classDayTargetLoadMap);
                    for (int day : sortedDays) {
                        int maxT = 5;
                        if (classDayLoad.getOrDefault(lopId + ":" + day, 0) < maxT) {
                            int t = getNextCompactMorningSlotDaySlots(clsSlots, lopId, day, (day == 7) ? 4 : 5);
                            if (t != -1 && tryPlaceMorningSlot(lop, pc, day, t, 1, gvId, monHocId, false,
                                    namHoc, hocKy, tuan, gvSlots, clsSlots, nbSlots, classDayLoad, heavyDayMap,
                                    classRoomMap, result, classDayTargetLoadMap, gvBanSet, true)) {
                                placed = true;
                                break;
                            }
                        }
                    }
                    if (!placed) {
                        for (int day : sortedDays) {

                            if (gvId != null && teacherExceedsDailyLimit(gvSlots, gvId, day, 5)) continue;
                            int t = getNextCompactAfternoonSlotDaySlots(clsSlots, day, 10);
                            if (t == -1) continue;
                            String sk = day + ":" + t;
                            boolean gvOk = true;
                            if (gvId != null) {
                                gvOk = !gvSlots.getOrDefault(gvId, Set.of()).contains(sk)
                                    && !isTeacherBusy(gvId, day, t, gvBanSet);
                            }
                            boolean clsOk = !clsSlots.contains(sk);
                            boolean r5ok  = !wouldCreate3Consecutive(nbSlots, monHocId, day, t)
                                         && countSubjectOnDay(nbSlots, monHocId, day) < 2;
                            if (gvOk && clsOk && r5ok) {
                                if (gvId != null) {
                                    gvSlots.computeIfAbsent(gvId, k -> new HashSet<>()).add(sk);
                                }
                                clsSlots.add(sk);
                                nbSlots.add(monHocId + ":" + day + ":" + t);
                                afternoonDayUsed.merge(day, 1, Integer::sum);
                                result.add(createTkb(lop, pc, day, t, 1, namHoc, hocKy, tuan, classRoomMap));
                                placed = true; 
                                break;
                            }
                        }
                    }
                    if (!placed) {
                        String gvTen = pc.getGiaoVien() != null ? pc.getGiaoVien().getHoTen() : "N/A";
                        conflicts.add(new ConflictInfo(pc.getMonHoc().getTenMon(), lop.getTenLop(), gvTen,
                                "Không còn slot chiều hợp lệ"));
                    }
                }
            }
        }

        for (LopHoc lop : lops) {
            int lopId = lop.getId();
            List<PhanCongDay> pcs = morningByLop.get(lopId);
            for (int i = 0; i < pcs.size(); i++) {
                int key  = lopId * 10000 + i;
                int left = periodLeft.getOrDefault(key, 0);
                if (left > 0) {
                    PhanCongDay pc = pcs.get(i);
                    String gvTen = pc.getGiaoVien() != null ? pc.getGiaoVien().getHoTen() : "N/A";
                    for (int k = 0; k < left; k++)
                        conflicts.add(new ConflictInfo(pc.getMonHoc().getTenMon(), lop.getTenLop(), gvTen,
                                "Không còn slot hợp lệ sau khi thử tất cả vị trí"));
                    logger.warn("R8-conflict: {} lớp {} GV {} còn {} tiết chưa xếp",
                            pc.getMonHoc().getTenMon(), lop.getTenLop(), gvTen, left);
                }
            }
        }

        return new GenerateResult(result, warnings, conflicts);
    }

    private int getMaxHeavySubjectsPerDay(LopHoc lop) {
        if (lop != null && lop.getTenLop() != null && lop.getTenLop().startsWith("12")) return 3;
        return 2;
    }

    private void placeRemainingMorningFallback(List<LopHoc> lops,
            Map<Integer, List<PhanCongDay>> morningByLop,
            Map<Integer, Integer> periodLeft,
            Map<Integer, Set<String>> classSlots,
            Map<Integer, Set<String>> neighborSlots,
            Map<Integer, Set<String>> gvSlots,
            Map<String, Integer> classDayLoad,
            Map<String, Set<Integer>> heavyDayMap,
            String namHoc, int hocKy, int tuan,
            Map<Integer, String> classRoomMap,
            List<ThoiKhoaBieu> result,
            Random rng,
            Map<String, Integer> classDayTargetLoadMap,
            Set<String> gvBanSet) {
        List<LopHoc> lopOrder = new ArrayList<>(lops);
        Collections.shuffle(lopOrder, rng);
        for (LopHoc lop : lopOrder) {
            int lopId = lop.getId();
            List<PhanCongDay> pcs = morningByLop.get(lopId);
            Set<String> clsSlots = classSlots.get(lopId);
            Set<String> nbSlots = neighborSlots.get(lopId);
            for (int i = 0; i < pcs.size(); i++) {
                int key = lopId * 10000 + i;
                PhanCongDay pc = pcs.get(i);
                int monHocId = pc.getMonHoc().getId();
                Integer gvId = pc.getGiaoVien() != null ? pc.getGiaoVien().getId() : null;
                boolean heavy = isHeavy(pc.getMonHoc().getTenMon());
                while (periodLeft.getOrDefault(key, 0) > 0) {
                    boolean placed = false;
                    List<Integer> dayOrder = buildMorningDayOrder(lopId, tuan, rng, classDayLoad, heavyDayMap, heavy, classDayTargetLoadMap);
                    for (int day : dayOrder) {
                        if (placed) break;
                        int maxMorning = 5;
                        if (classDayLoad.getOrDefault(lopId + ":" + day, 0) >= maxMorning) continue;
                        int t = getNextCompactMorningSlotDaySlots(clsSlots, lopId, day, maxMorning);
                        if (t != -1) {
                            String sk = day + ":" + t;
                            if (gvId != null) {
                                if (gvSlots.getOrDefault(gvId, Set.of()).contains(sk)) continue;
                                if (isTeacherBusy(gvId, day, t, gvBanSet)) continue;
                            }
                            if (countSubjectOnDay(nbSlots, monHocId, day) >= 2) continue;
                            if (gvId != null) {
                                gvSlots.computeIfAbsent(gvId, k -> new HashSet<>()).add(sk);
                            }
                            clsSlots.add(sk);
                            nbSlots.add(monHocId + ":" + day + ":" + t);
                            classDayLoad.merge(lopId + ":" + day, 1, Integer::sum);
                            if (heavy) heavyDayMap.computeIfAbsent(lopId + ":" + day, k -> new HashSet<>()).add(monHocId);
                            result.add(createTkb(lop, pc, day, t, 1, namHoc, hocKy, tuan, classRoomMap));
                            periodLeft.put(key, periodLeft.get(key) - 1);
                            placed = true;
                        }
                    }
                    if (!placed) {
                        for (int day : dayOrder) {

                            if (placed) break;
                            int t = getNextCompactAfternoonSlotDaySlots(clsSlots, day, 10);
                            if (t != -1) {
                                String sk = day + ":" + t;
                                if (gvId != null) {
                                    if (gvSlots.getOrDefault(gvId, Set.of()).contains(sk)) continue;
                                    if (isTeacherBusy(gvId, day, t, gvBanSet)) continue;
                                }
                                if (gvId != null) {
                                    gvSlots.computeIfAbsent(gvId, k -> new HashSet<>()).add(sk);
                                }
                                clsSlots.add(sk);
                                nbSlots.add(monHocId + ":" + day + ":" + t);
                                result.add(createTkb(lop, pc, day, t, 1, namHoc, hocKy, tuan, classRoomMap));
                                periodLeft.put(key, periodLeft.get(key) - 1);
                                placed = true;
                            }
                        }
                    }
                    if (!placed) break;
                }
            }
        }
    }

    private PhanCongDay createPhanCong(GiaoVien gv, MonHoc mon) {
        PhanCongDay pc = new PhanCongDay();
        pc.setGiaoVien(gv); pc.setMonHoc(mon);
        return pc;
    }

    private ThoiKhoaBieu createTkb(LopHoc lop, PhanCongDay pc, int thu, int tiet, int soTiet,
                                    String namHoc, int hocKy, int tuan, Map<Integer, String> classRoomMap) {
        ThoiKhoaBieu tkb = new ThoiKhoaBieu();
        tkb.setLop(lop);
        if (pc != null) { tkb.setMonHoc(pc.getMonHoc()); tkb.setGiaoVien(pc.getGiaoVien()); }
        tkb.setThu(thu); tkb.setTietBatDau(tiet); tkb.setSoTiet(soTiet);
        tkb.setNamHoc(namHoc); tkb.setHocKy(hocKy); tkb.setTuan(tuan);
        String room = classRoomMap.get(lop.getId());
        if (room != null && !room.isBlank()) tkb.setPhongHoc(room);
        return tkb;
    }

    private boolean canPlace(int lopId, int day, int tiet, int count, int giaoVienId,
                              Map<Integer, Set<String>> classSlots, Map<Integer, Set<String>> teacherSlots,
                              Map<String, Set<String>> roomSlots, Map<Integer, String> classRoomMap) {
        Set<String> giaoVienSlots = teacherSlots.computeIfAbsent(giaoVienId, k -> new HashSet<>());
        Set<String> classSlotSet  = classSlots.get(lopId);
        String room = classRoomMap.get(lopId);
        for (int i = 0; i < count; i++) {
            int t = tiet + i;
            if (taken(classSlotSet, lopId, day, t)) return false;
            if (taken(giaoVienSlots, giaoVienId, day, t)) return false;
            if (room != null && !room.isBlank()) {
                Set<String> rSlots = roomSlots.get(room);
                if (rSlots != null && rSlots.contains(day + ":" + t)) return false;
            }
        }
        return true;
    }

    private boolean taken(Set<String> slots, int entityId, int day, int tiet) {
        return slots != null && slots.contains(entityId + ":" + day + ":" + tiet);
    }

    private boolean isReserved(int lopId, int day, int tiet) {
        return (day == 2 && tiet == 1) || (day == 7 && tiet == 5);
    }

    private boolean hasAdjacentSameSubject(Set<String> neighborSlots, int monHocId, int day, int tiet) {
        int before = 0;
        for (int t = tiet - 1; t >= 1; t--) {
            if (isReserved(0, day, t)) break;
            if (neighborSlots.contains(monHocId + ":" + day + ":" + t)) before++; else break;
        }
        int after = 0;
        for (int t = tiet + 1; t <= 5; t++) {
            if (isReserved(0, day, t)) break;
            if (neighborSlots.contains(monHocId + ":" + day + ":" + t)) after++; else break;
        }
        return (before + after + 1) >= 4;
    }

    private boolean isSubjectAlreadyOnDay(Map<Integer, Map<Integer, Set<String>>> subjectDayMap,
                                           int lopId, int day, int monHocId) {
        Map<Integer, Set<String>> dayMap = subjectDayMap.get(lopId);
        if (dayMap == null) return false;
        Set<String> subjects = dayMap.get(day);
        return subjects != null && subjects.contains(String.valueOf(monHocId));
    }

    private boolean isTeacherBusy(Integer gvId, int day, int tiet, Set<String> gvBanSet) {
        if (gvId == null || gvBanSet == null) return false;
        return gvBanSet.contains(gvId + ":" + day + ":" + tiet);
    }

    private boolean isSubjectMaxedOnDay(Set<String> neighborSlots, int monHocId, int day) {
        int count = 0;
        for (int t = 1; t <= 10; t++)
            if (neighborSlots.contains(monHocId + ":" + day + ":" + t)) count++;
        return count >= 2;
    }

    private boolean hasDoublePeriodOnDay(Set<String> neighborSlots, int monHocId, int day) {
        for (int t = 1; t <= 4; t++)
            if (neighborSlots.contains(monHocId + ":" + day + ":" + t)
             && neighborSlots.contains(monHocId + ":" + day + ":" + (t + 1)))
                return true;
        return false;
    }

    private void doPlace(LopHoc lop, PhanCongDay assignment, int day, int tiet, int count,
                          int giaoVienId, String namHoc, int hocKy, int tuan,
                          Map<Integer, Set<String>> classSlots, Map<Integer, Set<String>> teacherSlots,
                          Map<String, Set<String>> roomSlots, Map<Integer, String> classRoomMap,
                          List<ThoiKhoaBieu> output) {
        int lopId = lop.getId();
        ThoiKhoaBieu tkb = new ThoiKhoaBieu();
        tkb.setLop(lop); tkb.setMonHoc(assignment.getMonHoc()); tkb.setGiaoVien(assignment.getGiaoVien());
        tkb.setThu(day); tkb.setTietBatDau(tiet); tkb.setSoTiet(count);
        tkb.setNamHoc(namHoc); tkb.setHocKy(hocKy); tkb.setTuan(tuan);
        String room = classRoomMap.get(lopId);
        if (room != null && !room.isBlank()) tkb.setPhongHoc(room);
        output.add(tkb);
        Set<String> giaoVienSlots = teacherSlots.computeIfAbsent(giaoVienId, k -> new HashSet<>());
        for (int i = 0; i < count; i++) {
            classSlots.get(lopId).add(lopId + ":" + day + ":" + (tiet + i));
            giaoVienSlots.add(giaoVienId + ":" + day + ":" + (tiet + i));
            if (room != null && !room.isBlank())
                roomSlots.computeIfAbsent(room, k -> new HashSet<>()).add(day + ":" + (tiet + i));
        }
    }

    private MonHoc findMon(String maMon, String tenMon) {
        MonHoc mon = monRepo.findByMaMon(maMon).orElse(null);
        if (mon == null) mon = monRepo.findByTenMon(tenMon).orElse(null);
        if (mon == null) {
            mon = new MonHoc();
            mon.setTenMon(tenMon); mon.setMaMon(maMon);
            mon.setNhomDanhGia("NHAN_XET"); mon.setSoDtxHocKy(1);
            mon.setKhoiApDung("10,11,12"); mon.setIsActive(true);
            mon = monRepo.save(mon);
        }
        return mon;
    }

    private int getPeriodCount(String tenMon, LopHoc lop) {
        return getPeriodCount(tenMon, lop, null);
    }

    private int getPeriodCount(String tenMon, LopHoc lop, Map<Integer, Map<String, Integer>> toHopPeriodMap) {
        if (lop != null && lop.getToHopId() != null) {
            String norm = normalizeVietnamese(tenMon);
            if (toHopPeriodMap != null) {
                Map<String, Integer> map = toHopPeriodMap.get(lop.getToHopId());
                if (map != null && map.containsKey(norm)) {
                    return map.get(norm);
                }
            } else {
                try {
                    List<ChiTietToHop> chiTiets = chiTietToHopRepo.findByToHopMonId(lop.getToHopId());
                    for (ChiTietToHop ct : chiTiets) {
                        if (ct.getMonHoc() != null && normalizeVietnamese(ct.getMonHoc().getTenMon()).equals(norm)) {
                            return ct.getSoTiet() != null ? ct.getSoTiet() : 2;
                        }
                    }
                } catch (Exception ex) {
                    logger.warn("Lỗi khi đọc ChiTietToHop: {}", ex.getMessage());
                }
            }
        }

        String normalized = normalizeVietnamese(tenMon);
        boolean isGrade12 = lop != null && lop.getTenLop() != null && lop.getTenLop().startsWith("12");

        if (isGrade12) {
            if (normalized.contains("toan")) return 6;
            if (normalized.contains("ngu van")) return 6;
            if (normalized.contains("tieng anh")) return 4;
        } else {
            if (normalized.contains("toan")) return 5;
            if (normalized.contains("ngu van")) return 5;
            if (normalized.contains("tieng anh")) return 4;
        }
        
        if (normalized.contains("vat li") || normalized.contains("vat ly")
            || normalized.contains("hoa hoc") || normalized.contains("sinh hoc")
            || normalized.contains("lich su") || normalized.contains("dia li") || normalized.contains("dia ly")
            || normalized.contains("gdkt") || normalized.contains("giao duc kinh te") || normalized.contains("kinh te")
            || normalized.contains("tin hoc") || normalized.contains("tin")
            || normalized.contains("cong nghe")) {
            return 2;
        }
        
        if (normalized.contains("the duc") || normalized.contains("giao duc the chat") || normalized.contains("gdtc")) return 2;
        if (normalized.contains("gdqp") || normalized.contains("giao duc quoc phong") || normalized.contains("qpan")) return 2;
        if (normalized.contains("hdtn") || normalized.contains("hoat dong trai nghiem")) return 1;
        if (normalized.contains("am nhac") || normalized.contains("my thuat") || normalized.contains("am") || normalized.contains("mt")) return 1;
        if (normalized.contains("gddp") || normalized.contains("giao duc dia phuong")) return 1;
        
        return 2;
    }

    private boolean isHeavy(String tenMon) {
        return HEAVY_SUBJECTS.stream().anyMatch(normalizeVietnamese(tenMon)::contains);
    }

    private boolean isAfternoonSubject(String tenMon) {
        return AFTERNOON_SUBJECTS.stream().anyMatch(normalizeVietnamese(tenMon)::contains);
    }

    private String normalizeVietnamese(String input) {
        if (input == null) return "";
        return Normalizer.normalize(input, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase()
            .replace('đ', 'd')
            .replaceAll("[^a-z0-9]+", " ")
            .trim();
    }

    public static class GenerateResult {
        private final List<ThoiKhoaBieu> created;
        private final List<String> warnings;
        private final List<ConflictInfo> conflicts;
        public GenerateResult(List<ThoiKhoaBieu> created, List<String> warnings, List<ConflictInfo> conflicts) {
            this.created = created; this.warnings = warnings; this.conflicts = conflicts;
        }
        public List<ThoiKhoaBieu> getCreated()    { return created; }
        public List<String> getWarnings()          { return warnings; }
        public List<ConflictInfo> getConflicts()   { return conflicts; }
    }

    public static class ConflictInfo {
        private final String monHoc, lop, giaoVien, lyDo;
        public ConflictInfo(String monHoc, String lop, String giaoVien, String lyDo) {
            this.monHoc = monHoc; this.lop = lop; this.giaoVien = giaoVien; this.lyDo = lyDo;
        }
        public String getMonHoc()    { return monHoc; }
        public String getLop()       { return lop; }
        public String getGiaoVien()  { return giaoVien; }
        public String getLyDo()      { return lyDo; }
    }

    private static class ScheduleTask {
        final LopHoc lop;
        final PhanCongDay assignment;
        final int count;
        final boolean afternoon;
        ScheduleTask(LopHoc lop, PhanCongDay assignment, int count, boolean afternoon) {
            this.lop = lop; this.assignment = assignment; this.count = count; this.afternoon = afternoon;
        }
    }

    private int effectiveMorningLoad(int lopId, int day, Map<String, Integer> classDayLoad) {
        int load = classDayLoad.getOrDefault(lopId + ":" + day, 0);
        if (day == 2 && load > 0) load = Math.max(0, load - 1);
        return load;
    }

    private boolean isHeavyDayBlocked(int lopId, int day, int monHocId, Map<String, Set<Integer>> heavyDayMap) {
        if (day != 2) return false;
        Set<Integer> heavyToday = heavyDayMap.getOrDefault(lopId + ":2", Set.of());
        return !heavyToday.isEmpty() && !heavyToday.contains(monHocId);
    }

    private List<Integer> buildMorningDayOrder(int lopId, int tuan, Random rng,
            Map<String, Integer> classDayLoad,
            Map<String, Set<Integer>> heavyDayMap,
            boolean placingHeavy,
            Map<String, Integer> classDayTargetLoadMap) {
        int offset = (lopId + tuan) % 5;
        List<Integer> rotated = new ArrayList<>();
        for (int i = 0; i < 5; i++) rotated.add(2 + ((offset + i) % 5));
        rotated.add(7);
        Map<Integer, Integer> rotIndex = new HashMap<>();
        for (int i = 0; i < rotated.size(); i++) rotIndex.put(rotated.get(i), i);

        List<Integer> dayOrder = new ArrayList<>(rotated);
        Collections.shuffle(dayOrder, rng);
        dayOrder.sort((a, b) -> {
            if (placingHeavy) {
                int ha = heavyDayMap.getOrDefault(lopId + ":" + a, Set.of()).size();
                int hb = heavyDayMap.getOrDefault(lopId + ":" + b, Set.of()).size();
                if (ha != hb) return ha - hb;
            }
            int la = effectiveMorningLoad(lopId, a, classDayLoad);
            int lb = effectiveMorningLoad(lopId, b, classDayLoad);
            int cmp = compareDaysFillFirst(lopId, la, lb, a, b, classDayTargetLoadMap);
            if (cmp != 0) return cmp;
            return rotIndex.get(a) - rotIndex.get(b);
        });
        return dayOrder;
    }

    private int compareDaysFillFirst(int lopId, int la, int lb, int a, int b, Map<String, Integer> classDayTargetLoadMap) {
        int ta = classDayTargetLoadMap.getOrDefault(lopId + ":" + a, 5);
        int tb = classDayTargetLoadMap.getOrDefault(lopId + ":" + b, 5);
        boolean aFull = la >= ta;
        boolean bFull = lb >= tb;

        if (aFull != bFull) return aFull ? 1 : -1;
        return Integer.compare(lb, la);
    }

    private List<Integer> buildFillFirstDayOrder(int lopId, Random rng, Map<String, Integer> classDayLoad, Map<String, Integer> classDayTargetLoadMap) {
        return buildMorningDayOrder(lopId, 1, rng, classDayLoad, Map.of(), false, classDayTargetLoadMap);
    }



    private boolean isMorningDayFull(int lopId, int day, Map<String, Integer> classDayLoad, Map<String, Integer> classDayTargetLoadMap) {
        return classDayLoad.getOrDefault(lopId + ":" + day, 0) >= classDayTargetLoadMap.getOrDefault(lopId + ":" + day, 5);
    }

    private boolean tryPlaceMorningSlot(LopHoc lop, PhanCongDay pc, int day, int tiet, int soTiet,
                                        Integer gvId, int monHocId, boolean heavy,
                                        String namHoc, int hocKy, int tuan,
                                        Map<Integer, Set<String>> gvSlots,
                                        Set<String> clsSlots, Set<String> nbSlots,
                                        Map<String, Integer> classDayLoad,
                                        Map<String, Set<Integer>> heavyDayMap,
                                        Map<Integer, String> classRoomMap,
                                        List<ThoiKhoaBieu> result,
                                        Map<String, Integer> classDayTargetLoadMap,
                                        Set<String> gvBanSet, boolean ignoreTargetLoad) {
        int lopId = lop.getId();
        if (!ignoreTargetLoad && isMorningDayFull(lopId, day, classDayLoad, classDayTargetLoadMap)) return false;
        int maxTiet = (day == 7) ? 4 : 5;
        if (tiet + soTiet - 1 > maxTiet) return false;
        if (countSubjectOnDay(nbSlots, monHocId, day) + soTiet > 2) return false;
        if (heavy) {
            Set<Integer> heavyToday = heavyDayMap.getOrDefault(lopId + ":" + day, Set.of());
            if (heavyToday.size() >= getMaxHeavySubjectsPerDay(lop) && !heavyToday.contains(monHocId)) return false;
        }
        for (int i = 0; i < soTiet; i++) {
            String sk = day + ":" + (tiet + i);
            if (clsSlots.contains(sk)) return false;
            if (gvId != null) {
                if (gvSlots.getOrDefault(gvId, Set.of()).contains(sk)) return false;
                if (isTeacherBusy(gvId, day, tiet + i, gvBanSet)) return false;
            }
            if (wouldCreate3Consecutive(nbSlots, monHocId, day, tiet + i)) return false;
        }
        for (int i = 0; i < soTiet; i++) {
            String sk = day + ":" + (tiet + i);
            if (gvId != null) {
                gvSlots.computeIfAbsent(gvId, k -> new HashSet<>()).add(sk);
            }
            clsSlots.add(sk);
            nbSlots.add(monHocId + ":" + day + ":" + (tiet + i));
        }
        classDayLoad.merge(lopId + ":" + day, soTiet, Integer::sum);
        if (heavy) heavyDayMap.computeIfAbsent(lopId + ":" + day, k -> new HashSet<>()).add(monHocId);
        result.add(createTkb(lop, pc, day, tiet, soTiet, namHoc, hocKy, tuan, classRoomMap));
        return true;
    }

    private int getNextCompactMorningSlotDaySlots(Set<String> daySlots, int lopId, int day, int maxTiet) {
        for (int t = 1; t <= maxTiet; t++) {
            if (isReserved(lopId, day, t)) continue;
            if (!daySlots.contains(day + ":" + t)) return t;
        }
        return -1;
    }

    private int getNextCompactDoubleStartDaySlots(Set<String> daySlots, int lopId, int day, int maxTiet) {
        int t = getNextCompactMorningSlotDaySlots(daySlots, lopId, day, maxTiet);
        if (t == -1 || t + 1 > maxTiet) return -1;
        if (isReserved(lopId, day, t + 1) || daySlots.contains(day + ":" + (t + 1))) return -1;
        return t;
    }

    private int getNextCompactAfternoonSlotDaySlots(Set<String> daySlots, int day, int maxTiet) {
        for (int t = 6; t <= maxTiet; t++) {
            if (!daySlots.contains(day + ":" + t)) return t;
        }
        return -1;
    }

    private int getNextCompactAfternoonDoubleStartDaySlots(Set<String> daySlots, int day, int maxTiet) {
        int t = getNextCompactAfternoonSlotDaySlots(daySlots, day, maxTiet);
        if (t == -1 || t + 1 > maxTiet) return -1;
        if (daySlots.contains(day + ":" + (t + 1))) return -1;
        return t;
    }

    private int getFirstEmptySlot(Set<String> classSlots, int lopId, int day, int maxTiet) {
        for (int t = 1; t <= maxTiet; t++) {
            if (!taken(classSlots, lopId, day, t) && !isReserved(lopId, day, t)) {
                return t;
            }
        }
        return -1;
    }

    private int getNextCompactDoubleStart(Set<String> classSlots, int lopId, int day, int maxTiet) {
        int t = getFirstEmptySlot(classSlots, lopId, day, maxTiet);
        if (t == -1 || t + 1 > maxTiet) return -1;
        if (isReserved(lopId, day, t + 1) || taken(classSlots, lopId, day, t + 1)) return -1;
        return t;
    }

    private int getFirstEmptyAfternoonSlot(Set<String> classSlots, int lopId, int day, int maxTiet) {
        int morningMax = (day == 7) ? 4 : 5;
        for (int t = 1; t <= morningMax; t++) {
            if (!taken(classSlots, lopId, day, t) && !isReserved(lopId, day, t)) {
                return t;
            }
        }
        for (int t = 6; t <= maxTiet; t++) {
            if (!taken(classSlots, lopId, day, t)) {
                return t;
            }
        }
        return -1;
    }
}

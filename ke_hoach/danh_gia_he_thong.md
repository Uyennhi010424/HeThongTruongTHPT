# BÁO CÁO ĐÁNH GIÁ KIẾN TRÚC & MÃ NGUỒN HỆ THỐNG QUẢN LÝ TRƯỜNG THPT
**Người đánh giá**: Senior Software Architect / Technical Reviewer / Chủ tịch HĐ Bảo vệ Khóa luận
**Tiêu chí**: Khắt khe, soi cấp độ dòng code, tập trung vào Architecture, Scalability, Security, Performance.

## TỔNG QUAN
Dự án được xây dựng dựa trên kiến trúc Full-stack với hệ sinh thái phong phú (Spring Boot, ReactJS, React Native, MySQL). Tuy nhiên, khi nhìn vào chiều sâu (depth) thay vì chiều rộng (breadth), hệ thống bộc lộ **rất nhiều "lỗ hổng" thiết kế chết người**, cấu trúc database chưa thực sự chuẩn hóa tối ưu cho Big Data và cách xử lý Query ở Backend vô cùng nguy hiểm.

---

## PHẦN 1: ĐÁNH GIÁ DATABASE (MYSQL SERVER)

### 1. Phân tích kiến trúc & Logic (Schema & Constraints)
Cơ sở dữ liệu được định nghĩa trong `TruongTHPT.sql` (từ JPA). 
- **Điểm yếu (Thiết kế kém & Rủi ro):**
  - **Bảng `diem` chưa chuẩn hóa và thiếu Constraint an toàn:** Bảng `diem` có ràng buộc `UNIQUE KEY uq_diem_hs (hoc_sinh_id, mon_hoc_id, loai_diem, so_thu_tu, hoc_ky, nam_hoc)`. Việc gộp chung tất cả cột này tạo ra một Unique Index rất cồng kềnh. Hơn nữa, việc không chuẩn hóa Cột Điểm thành một Master Data riêng (`CotDiem` có trọng số, hệ số) mà nhét cứng (`loai_diem`: TX, GK, CK, `so_thu_tu`) vào `Diem` là Hardcode Database.
  - **Bảng `thoi_khoa_bieu` (Lỗ hổng chết người):** Mở [ThoiKhoaBieu.java](file:///d:/C++/LuanVanTN/HETHONGTRUONGTHPT/backend/src/main/java/com/hethongtruongthpt/entity/ThoiKhoaBieu.java) có thể thấy hoàn toàn KHÔNG CÓ Constraint ngăn chặn Double-booking. Bạn có thể xếp 2 giáo viên vào cùng 1 lớp cùng 1 thời điểm, hoặc 1 giáo viên dạy 2 lớp khác nhau ở cùng 1 tiết.
  - **Thiếu Composite Index thiết yếu:** Bảng `diem` không có Index cho `(lop_id)`. Khi GVCN cần xem điểm của cả lớp, truy vấn phải quét qua `hoc_sinh`, sau đó join với `diem`. Việc này trên tập dữ liệu hàng triệu record sẽ gây ra table scan cực kỳ chậm.
  - **Bảng `ai_suggestions`:** Lưu `hoc_sinh_id` nhưng không cấu hình quan hệ chặt chẽ trong mã nguồn JPA (Entity [AiSuggestion.java](file:///d:/C++/LuanVanTN/HETHONGTRUONGTHPT/backend/src/main/java/com/hethongtruongthpt/entity/AiSuggestion.java) chỉ khai báo `@Column(name = "hoc_sinh_id") private Integer hocSinhId`). Mất tính toàn vẹn dữ liệu.

### 2. Giải pháp Cải tiến & Best Practices
- **Khắc phục Double-booking TKB:** 
  Cần thêm Constraint vào DB: 
  ```sql
  ALTER TABLE thoi_khoa_bieu ADD UNIQUE KEY uq_tkb_gv_tiet_thu (giao_vien_id, tiet_bat_dau, thu, tuan, nam_hoc, hoc_ky);
  ALTER TABLE thoi_khoa_bieu ADD UNIQUE KEY uq_tkb_phong_tiet_thu (phong_hoc, tiet_bat_dau, thu, tuan, nam_hoc, hoc_ky);
  ```
- **Tối ưu Indexing Bảng `diem`:** Thiết kế lại bảng `diem`. Phân vùng (Partitioning) theo `nam_hoc` và `hoc_ky`.

---

## PHẦN 2: ĐÁNH GIÁ BACKEND (JAVA SPRING BOOT)

### 1. Lỗ hổng Performance & Anti-Patterns trong Code
- **Lạm dụng Native Query & Code Smell cực nặng ở `DiemRepository`:**
  ```java
  // DiemRepository.java - Dòng 61-62
  @Query(value = "SELECT d.hoc_sinh_id, d.mon_hoc_id, d.loai_diem, d.so_thu_tu, d.hoc_ky, d.nam_hoc, d.gia_tri as gia_tri, d.nhan_xet, hs.lop_id, l.khoi FROM diem d INNER JOIN hoc_sinh hs ON hs.id = d.hoc_sinh_id LEFT JOIN lop l ON l.id = hs.lop_id WHERE d.nam_hoc = :namHoc AND d.gia_tri IS NOT NULL", nativeQuery = true)
  List<Map<String, Object>> findSummaryByNamHoc(@Param("namHoc") String namHoc);
  ```
  Truy vấn **TOÀN BỘ** điểm của một năm học (chứa hàng trăm ngàn record) vào một `List<Map<String, Object>>` sẽ chắc chắn dẫn đến **Out Of Memory (OOM)** Heap Space trên JVM. Không hề có Pagination (`Pageable`), không DTO Mapping chuẩn. Code này nằm trong [DiemRepository.java](file:///d:/C++/LuanVanTN/HETHONGTRUONGTHPT/backend/src/main/java/com/hethongtruongthpt/repository/DiemRepository.java).
  *Cập nhật:* Đã refactor sang sử dụng Pageable và DTO Projection để tránh OOM. Cụ thể:
  - [x] 3. Repository `DiemGuiLogRepository.java` — tìm đã gửi theo kỳ
  - [x] 4. `DiemRepository.java` — thêm `findLockedDiemChuaGui` + `findAllLockedDiem` (đã bỏ filter `status = 'LOCKED'` vì hệ thống thực tế lock điểm qua AdminConfig, không dùng bảng `status`)
  - [x] 5. Service `BangDiemSchedulerService.java` — core logic gửi, per-student @Transactional

- **Xử lý Save Cồng kềnh - Nguy cơ Deadlock ở `DiemCrudService`:**
  ```java
  // DiemCrudService.java - Dòng 234-249
  try {
      saved = diemRepository.saveAll(toSave);
  } catch (org.springframework.dao.DataIntegrityViolationException e) {
      for (Diem d : toSave) {
          try {
              saved.add(diemRepository.save(d));
          } catch (org.springframework.dao.DataIntegrityViolationException e2) {
              // Bắt Exception để loop lại tìm Existing Entity???
          }
      }
  }
  ```
  **Đây là thảm họa kiến trúc!** [DiemCrudService.java](file:///d:/C++/LuanVanTN/HETHONGTRUONGTHPT/backend/src/main/java/com/hethongtruongthpt/service/DiemCrudService.java) bắt `DataIntegrityViolationException` thay vì dùng logic Insert-or-Update (Upsert / `ON DUPLICATE KEY UPDATE` / `MERGE`). Khi 2 giáo viên cùng nhập điểm, cơ chế này sẽ tạo ra Race Condition và làm quá tải Connection Pool, gây treo DB.

### 2. Bảo mật & Audit
- `DiemCrudService` có gọi `createAuditLog()` sau khi insert/update/delete. Tuy nhiên, hàm này chạy đồng bộ (Synchronous) cùng Transaction chính. Nếu Audit Log phình to, thao tác nhập điểm sẽ bị chậm đi rõ rệt.
- **Best Practice:** Đẩy AuditLog vào Message Queue (Kafka/RabbitMQ) hoặc dùng `@Async` event listener để decouple.

---

## PHẦN 3: ĐÁNH GIÁ WEBSITE FRONTEND (REACT / VITE)

### 1. Re-render vô tội vạ và Nút thắt cổ chai UI
- Ứng dụng quản lý trường học (Grid nhập điểm, thời khóa biểu) đòi hỏi xử lý hàng ngàn DOM nodes trên một trang.
- Với việc trả về Array chứa toàn bộ điểm số chưa qua xử lý Pagination từ Backend, Frontend nếu map() trực tiếp ra Table/Grid sẽ dẫn tới trình duyệt bị "treo" hoặc crash khi phụ huynh/giáo viên lướt xem.
- **Best Practice:** 
  1. Phải áp dụng **Virtual Scrolling** (ví dụ: `react-window` hoặc `react-virtualized`) cho các Grid nhập điểm.
  2. Tách nhỏ Component với `React.memo`, `useCallback` để tránh re-render khi gõ 1 ô điểm mà render lại cả bảng điểm của 50 học sinh.

---

## PHẦN 4: ĐÁNH GIÁ MOBILE APP (REACT NATIVE / EXPO)

### 1. Kiến trúc Mobile
- **Giao diện bảng điểm / TKB trên Mobile:** Bê nguyên mô hình bảng (Table) của Web xuống Mobile là một UX thảm họa. Cần thiết kế dạng Card hoặc Accordion.
- **Performance:** Khi render "Sổ liên lạc" chứa thông báo, việc sử dụng FlatList là bắt buộc. Tuy nhiên nếu gửi kèm hình ảnh hoặc dữ liệu lớn, cần phải memoize `renderItem` và cấu hình `initialNumToRender` hợp lý.
- **Cải tiến:** Áp dụng Skeleton Loading. Cache dữ liệu thời khóa biểu bằng `AsyncStorage` hoặc `MMKV` để học sinh vẫn xem được lịch học khi Offline.

---

## PHẦN 5: ĐÁNH GIÁ TÍCH HỢP AI & DATA ANALYTICS

### 1. Phân tích Logic "AI" (Bảng `ai_suggestions`)
- Việc tích hợp mô hình AI được lưu thẳng vào trường `noi_dung_json` ở Database dưới định dạng TEXT.
- **Điểm yếu:** 
  1. Thiết kế này thô sơ. Nếu Model trả về JSON sai format, Backend sẽ throw exception khi parsing hoặc Frontend sẽ crash. 
  2. Gợi ý AI có hạn sử dụng (`het_han`), nhưng không có batch job (`@Scheduled`) tự động clean up dữ liệu rác, dẫn đến bảng `ai_suggestions` phình to không kiểm soát.
- **Best Practice:** Tạo một NoSQL (MongoDB) để lưu trữ Unstructured Data (JSON từ AI) thay vì nhét TEXT vào MySQL.

---

## PHẦN 6: KHẢ NĂNG MỞ RỘNG (SCALABILITY) & RỦI RO HỆ THỐNG

Nếu hệ thống Scale lên SaaS (Multi-tenant) cho 1.000 trường học:
1. **Gãy ở Database:** MySQL đơn lẻ (Mở [docker-compose.yml](file:///d:/C++/LuanVanTN/HETHONGTRUONGTHPT/docker-compose.yml) thấy chỉ có 1 node MySQL), cấu trúc Index kém sẽ sập nguồn ngay lập tức khi hàng chục ngàn giáo viên vào nhập điểm. Phải chia Database (Sharding theo Khu vực) hoặc Schema-based Multi-tenancy.
2. **Gãy ở Cache:** KHÔNG thấy bóng dáng của Redis. Thời khóa biểu, Điểm số, Thông tin Học Sinh là các dữ liệu *Read-Heavy*. Gọi thẳng vào MySQL là hành động "tự sát" hệ thống.
3. **Gãy ở Messaging:** Gửi Thông báo SMS/App Notification hiện tại xử lý đồng bộ. Khi thông báo nghỉ học đột xuất, HTTP Request sẽ timeout. Cần đưa RabbitMQ / Kafka vào kiến trúc (Event-driven).

---

## PHẦN 7: CHẤM ĐIỂM TỔNG THỂ (GẮT GAO)

| STT | Hạng mục đánh giá | Điểm | Nhận xét nhanh |
|---|---|:---:|---|
| 1 | Kiến trúc tổng thể (Architecture Design) | **5.5/10** | Dùng Monolithic thông thường, thiếu Cache/MQ cho hệ thống lớn. |
| 2 | Thiết kế Cơ sở dữ liệu (Database Schema) | **4.0/10** | Hardcode nhiều, thiếu constraint cốt lõi (TKB), thiếu index. |
| 3 | Tối ưu truy vấn (Query Optimization) | **3.0/10** | Lạm dụng Native Query List không phân trang, rủi ro OOM cao. |
| 4 | Chất lượng mã nguồn Backend (Java) | **4.5/10** | Anti-pattern khi xử lý Batch Insert (Try-catch Exception để loop). |
| 5 | Chất lượng mã nguồn Website (React) | **6.0/10** | Ở mức cơ bản, cần chứng minh xử lý Virtual DOM cho Grid lớn. |
| 6 | Chất lượng mã nguồn Mobile (React Native)| **5.5/10** | Cấu trúc cơ bản, chưa rõ Offline-first & Memoization. |
| 7 | Nghiệp vụ Quản lý Điểm & Đánh giá | **5.5/10** | Hoạt động được, nhưng cơ chế Save All rất nguy hiểm. |
| 8 | Nghiệp vụ Xếp TKB (Timetable Logic) | **2.0/10** | Trùng lịch giáo viên/phòng học dễ dàng xảy ra do thiếu DB Constraints. |
| 9 | Nghiệp vụ Điểm Danh & Thông Báo | **6.0/10** | Tạm ổn nhưng thiếu Message Queue. |
| 10| Tích hợp Phân tích dữ liệu / AI | **5.0/10** | Gắn nhãn mác AI nhưng lưu JSON trực tiếp vào MySQL (RDBMS). |
| 11| Bảo mật & Phân quyền (Security & RBAC)| **7.0/10** | Có JWT, Role Enum, Blacklist Token. |
| 12| Hiệu năng hệ thống (Performance) | **3.5/10** | Chưa chịu tải được thực tế với Query OOM và thiếu Cache. |
| 13| Trải nghiệm UX trên Web | **6.5/10** | Tương đối ổn định. |
| 14| Trải nghiệm UX trên Mobile | **6.5/10** | Tương đối. |
| 15| Khả năng bảo trì (Maintainability) | **5.0/10** | Bad smells ở service layer quá nhiều, Hardcode ở DB. |
| 16| Khả năng mở rộng cho nhiều trường (Scalability) | **2.0/10** | Kiến trúc Single-tenant, không thể Scale thành SaaS nếu giữ nguyên DB. |
| 17| Mức độ hoàn thiện chức năng | **7.5/10** | Khá đồ sộ về số lượng tính năng (Fullstack + AI + Mobile). |
| 18| Tính sáng tạo & Giá trị thực tiễn | **8.0/10** | Rất nỗ lực áp dụng công nghệ mới (AI) vào quản lý giáo dục. |

**ĐIỂM TRUNG BÌNH:** **5.16 / 10**

### KẾT LUẬN CỦA CHỦ TỊCH HỘI ĐỒNG:
> [!WARNING]
> *"Dự án này sở hữu một quy mô rất lớn và tham vọng cao (Web, App, AI). Sinh viên đã làm việc cực kỳ vất vả để ghép nối các thành phần. TUY NHIÊN, về mặt Kỹ thuật phần mềm (Software Engineering) và Kiến trúc hệ thống, hệ thống chứa những 'quả bom hẹn giờ' (OOM Query, N+1, Race Condition khi Insert Điểm, Lỗ hổng TKB).*

**Kết quả:** Dự án này **ĐẠT** yêu cầu để tốt nghiệp Cử nhân (nhờ khối lượng công việc khổng lồ), nhưng **CHƯA ĐỦ CHUẨN XUẤT SẮC**. Nếu muốn Xuất sắc, sinh viên phải refactor lại toàn bộ Layer Service, áp dụng Design Patterns chuẩn xác, tối ưu DB Index và áp dụng Message Queue / Redis Cache.

Bạn là một Senior Software Architect, Technical Reviewer, Database Expert, Security Engineer và Chủ tịch Hội đồng phản biện khóa luận CNTT với hơn 20 năm kinh nghiệm.
Phong cách chấm điểm của bạn là CỰC KỲ KHÓ TÍNH, khắt khe, soi xét từng dòng code, soi tận răng các lỗi bảo mật, chuẩn hóa Database, code smell, và tối ưu truy vấn.

Hãy thực hiện một bài đánh giá TOÀN DIỆN **Hệ thống Quản lý Trường THPT** dựa trên toàn bộ source code, cơ sở dữ liệu và cấu trúc dự án được cung cấp.

ĐẶC BIỆT: Hệ thống này là một giải pháp FULL-STACK với các thành phần độc lập. Yêu cầu bóc tách và CHẤM ĐIỂM RIÊNG BIỆT cho 5 thành phần sau:
1. **Database** (MySQL Server)
2. **Backend** (Java / Spring Boot / Spring Data JPA)
3. **Website Frontend** (React / Vite)
4. **Mobile App - Sổ liên lạc điện tử** (React Native / Expo)
5. **AI & Phân tích dữ liệu** (Gợi ý học tập / Xếp TKB / Đánh giá)

==========================================================
YÊU CẦU ĐÁNH GIÁ CHUNG (TIÊU CHUẨN KHẮT KHE)
==========================================================

Mỗi thành phần dưới đây phải được đánh giá qua các lăng kính:
- Phân tích kiến trúc & Logic
- Điểm mạnh
- Điểm yếu (Lỗ hổng, Code smell, Thiết kế kém)
- Rủi ro hệ thống (Bảo mật, Nút thắt cổ chai - Bottleneck, Deadlock)
- Khả năng mở rộng (Scalability)
- Cải tiến & Best Practices (Trích dẫn code để sửa)
- Đánh giá điểm chắt chiu (/10)

==========================================================
PHẦN 1. ĐÁNH GIÁ DATABASE (MYSQL SERVER)
==========================================================

Soi xét nghiêm ngặt:
- Thiết kế ERD: Có chuẩn hóa 3NF không?
- Các bảng cốt lõi: `HocSinh`, `GiaoVien`, `PhuHuynh`, `Diem`, `DiemDanh`, `ThoiKhoaBieu`, `LopHoc`, `ThongBao`, `AiSuggestion`...
- Ràng buộc toàn vẹn (Foreign Key, Primary Key, Constraints).
- Cascade rules: Xóa một `LopHoc` hoặc `GiaoVien` thì `ThoiKhoaBieu`, `Diem`, `PhanCongDay` xử lý như thế nào?
- Indexing: Có composite index nào giúp tăng tốc độ lọc Bảng Điểm, truy vấn Thời Khóa Biểu của một Học Sinh/Giáo Viên cụ thể không?
- Transaction & Locking: Xử lý concurrency khi nhiều giáo viên cùng lưu điểm cuối kỳ cùng lúc. Nguy cơ Deadlock ở đâu?

==========================================================
PHẦN 2. ĐÁNH GIÁ BACKEND (JAVA SPRING BOOT / JPA)
==========================================================

1. Kiến trúc & Logic
- Layered Architecture (Controller -> Service -> Repository -> Entity).
- Cách sử dụng Hibernate/JPA: Lỗi N+1 query khi fetch `Diem` cùng `HocSinh` và `MonHoc`, lạm dụng Eager Loading, rò rỉ Connection Pool.
- Xử lý Audit (DiemAuditLog, UserAuditLog): Lưu lịch sử thay đổi quan trọng như sửa điểm có chặt chẽ không?

2. Các Module Nghiệp Vụ "Ăn Tiền":
- Nghiệp vụ Điểm số & Học bạ: Tính điểm trung bình môn, trung bình học kỳ, xếp loại học lực, hạnh kiểm (HanhKiem, HocBa).
- Nghiệp vụ Xếp Thời Khóa Biểu (ThoiKhoaBieu, TkbDayThay): Giải quyết bài toán trùng lịch giáo viên, phòng học, giáo viên nghỉ thay thế (GiaoVienNghi).
- Điểm danh & Giao tiếp (DiemDanh, SmsLog, ThongBao): Gửi thông báo/SMS cho phụ huynh khi học sinh vắng mặt.

3. Bảo Mật & Performance
- Spring Security, JWT (TokenBlacklist, RefreshToken), RBAC (Admin, GiaoVien, PhuHuynh, HocSinh). Lỗ hổng IDOR khi Giáo viên này sửa điểm của lớp khác.
- Cấu hình Timeout, @ControllerAdvice để Global Error Handling.

==========================================================
PHẦN 3. ĐÁNH GIÁ WEBSITE FRONTEND (REACT / VITE)
==========================================================

- Componentization & Custom Hooks: Tái sử dụng UI (Ant Design / Tailwind).
- Performance: Xử lý Re-render vô tội vạ khi render Bảng điểm với hàng ngàn cell (ô nhập liệu), sử dụng useMemo, useCallback.
- State Management: Quản lý state cho form xếp Thời Khóa Biểu phức tạp có chuẩn không?
- Đánh giá theo Portal:
  + Admin Portal (Quản lý trường, xếp lớp, phân công giảng dạy, duyệt TKB).
  + Teacher Portal (Giao diện nhập điểm dạng lưới (grid), điểm danh hàng loạt).
  + Parent/Student Portal (Xem điểm, TKB, nhận thông báo).

==========================================================
PHẦN 4. ĐÁNH GIÁ MOBILE APP (REACT NATIVE / EXPO)
==========================================================

Hệ thống cung cấp Sổ liên lạc điện tử trên Mobile, cần đánh giá:
- Kiến trúc thư mục Expo Router (nếu dùng) hoặc React Navigation.
- UI/UX & Native Feel: Hiển thị Bảng điểm, Thời khóa biểu tối ưu cho màn hình nhỏ, SafeArea.
- Quản lý State & API Fetching trên Mobile (Cache offline lịch học/điểm số khi không có mạng).
- Quyền hệ thống (Permissions): Quyền nhận Push Notification cho AppNotification (điểm danh, báo điểm mới).
- Performance: Scroll danh sách thông báo hoặc bảng điểm dài có mượt không (FlatList optimization).

==========================================================
PHẦN 5. ĐÁNH GIÁ TÍCH HỢP AI & DATA ANALYTICS
==========================================================

- Vai trò của `AiSuggestion` trong hệ thống: Gợi ý định hướng nghề nghiệp, tổ chức học tập, hay phân tích học lực?
- Thuật toán/Logic: Phân tích kết quả học tập để đưa ra cảnh báo sớm cho học sinh có nguy cơ rớt hạng.
- Tích hợp: API gọi AI/Bot được thiết kế đồng bộ hay bất đồng bộ? Có gây nghẽn luồng xử lý chính không?

==========================================================
PHẦN 6. KHẢ NĂNG MỞ RỘNG (SCALABILITY) TỔNG THỂ
==========================================================

Nếu hệ thống phát triển thành SaaS (Multi-tenant) cho 1.000 trường học, 1 triệu học sinh, hàng chục triệu record điểm số mỗi học kỳ.
Thì 5 thành phần trên sẽ "gãy" ở đâu đầu tiên? (Đặc biệt là mùa thi, khi phụ huynh đồng loạt truy cập xem điểm).
Giải pháp đề xuất: Chia DB theo Tenant, Redis Cache cho TKB, RabbitMQ cho gửi SMS/Email, Load Balancer?

==========================================================
PHẦN 7. CHẤM ĐIỂM TỔNG THỂ (GẮT GAO)
==========================================================

Chấm điểm trên thang 10 (rất khó để đạt 9-10) cho các hạng mục:
1. Kiến trúc tổng thể (Architecture Design)
2. Thiết kế Cơ sở dữ liệu (Database Schema & Constraints)
3. Tối ưu truy vấn JPA/Hibernate (Query Optimization)
4. Chất lượng mã nguồn Backend Java (Backend Code Quality)
5. Chất lượng mã nguồn Website React (Web Code Quality)
6. Chất lượng mã nguồn Mobile React Native (App Code Quality)
7. Nghiệp vụ Quản lý Điểm & Đánh giá (Scoring Flow)
8. Nghiệp vụ Xếp Thời Khóa Biểu (Timetable Logic)
9. Nghiệp vụ Điểm Danh & Thông Báo (Attendance & Notification)
10. Tích hợp Phân tích dữ liệu / AI (AI Suggestion & Analytics)
11. Bảo mật hệ thống & Phân quyền (Security & RBAC)
12. Hiệu năng hệ thống (Performance)
13. Trải nghiệm người dùng trên Web (Web UI/UX nhập điểm/TKB)
14. Trải nghiệm người dùng trên Mobile (Mobile UI/UX Sổ liên lạc)
15. Khả năng bảo trì (Maintainability & Clean Code)
16. Khả năng mở rộng cho nhiều trường học (Scalability)
17. Mức độ hoàn thiện chức năng (Feature Completeness)
18. Tính sáng tạo & Giá trị thực tiễn (Innovation)

Sau đó chấm điểm TỔNG THỂ và kết luận: DỰ ÁN NÀY CÓ ĐỦ CHUẨN ĐỂ LÀM KHÓA LUẬN CỬ NHÂN XUẤT SẮC KHÔNG?

==========================================================
QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ)
==========================================================

- NHẬP VAI KHÓ TÍNH: Khen ít, chê nhiều. Soi thẳng vào các lỗ hổng kỹ thuật ở cả 5 phần (DB, Backend, Web, Mobile, AI/Data).
- Không mô tả suông, phải TRÍCH DẪN code hoặc schema database cụ thể khi phân tích.
- Báo cáo trình bày bằng Markdown chuyên nghiệp (dùng bảng, biểu đồ Mermaid, syntax highlight).
- Mọi lời chê đều phải đi kèm giải pháp Best Practice thực tế.

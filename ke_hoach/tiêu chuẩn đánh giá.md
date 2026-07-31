# BẢNG ĐÁNH GIÁ CHẤT LƯỢNG DỰ ÁN PHẦN MỀM TOÀN DIỆN
## 10 PHẦN × 10 TIÊU CHÍ — 100 TIÊU CHÍ TỔNG

> **Được thiết kế và thẩm định bởi:**
> 🧠 **Kiến trúc sư Phần mềm — 20 năm kinh nghiệm thực chiến**

**Mục đích:** Bộ tiêu chí này áp dụng được cho **MỌI LOẠI DỰ ÁN PHẦN MỀM** — từ Đồ án Sinh viên đến Hệ thống Doanh nghiệp. Nếu một tiêu chí **không áp dụng** cho dự án đang đánh giá, ghi **N/A** và không tính vào điểm trung bình. Ghi rõ lý do N/A để đảm bảo tính trung thực.

---

## 👤 THÔNG TIN NGƯỜI ĐÁNH GIÁ

| Trường | Nội dung |
|---|---|
| **Họ tên người đánh giá** | |
| **Chức danh / Vị trí** | |
| **Số năm kinh nghiệm thực chiến** | |
| **Lĩnh vực chuyên sâu** | |
| **Ngày thực hiện đánh giá** | |
| **Phiên bản dự án được đánh giá** | |
| **Thời gian dùng để review (giờ)** | |

---

## 📋 PROJECT FACT SHEET — SỐ LIỆU THỰC TẾ DỰ ÁN

*(Người đánh giá BẮT BUỘC điền đầy đủ phần này trước khi chấm điểm. Đây là căn cứ khách quan để đánh giá Quy mô & Độ phức tạp.)*

| Hạng mục thống kê | Con số thực tế | Ghi chú |
|---|:---:|---|
| Tổng số bảng (Tables) trong CSDL | | |
| Tổng số API Endpoints | | |
| Tổng số màn hình / trang | | |
| Số lượng vai trò người dùng (Roles) | | |
| Số lượng module chức năng lớn | | |
| Số lượng tích hợp 3rd-party | | |
| Có Frontend Web? | ✅ / ❌ | |
| Có Mobile App? | ✅ / ❌ | N/A nếu không có |
| Có AI / ML tích hợp? | ✅ / ❌ | N/A nếu không có |
| Có Realtime (WebSocket/SSE)? | ✅ / ❌ | N/A nếu không có |
| Test Coverage ước tính (%) | | N/A nếu không có test |
| Ngôn ngữ lập trình chính | | |
| Database chính | | |
| Deploy platform | | |

---

## 🛠 CHI TIẾT CÁC HẠNG MỤC CHẤM ĐIỂM

> **Thang điểm:** 0–10 cho mỗi tiêu chí con. **N/A** nếu tiêu chí không áp dụng cho dự án này.
> **Trung bình phần** = Tổng điểm / Số tiêu chí có điểm (loại trừ N/A).

---

### PHẦN 1: 💡 Ý TƯỞNG, ĐỘ THỰC TIỄN & QUY MÔ DỰ ÁN

> *Đánh giá dự án giải quyết vấn đề gì, có thực tế không, và quy mô kỹ thuật đạt đến đâu.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 1.1 | **Tính thực tiễn của bài toán:** Vấn đề mà dự án giải quyết có tồn tại trong thực tế không? Có người thực sự cần không, hay chỉ là demo lý thuyết? | | |
| 1.2 | **Phân tích đối tượng người dùng:** Dự án hiểu rõ ai sẽ dùng sản phẩm, nhu cầu của họ là gì? UX có được thiết kế theo đúng đối tượng? | | |
| 1.3 | **Quy mô tính năng:** Số lượng và độ phức tạp của chức năng có xứng tầm với loại dự án này không (đồ án / production)? Không quá ít cũng không phình to vô nghĩa. | | |
| 1.4 | **Quy mô Backend & API:** Số controllers, routes, services — có xứng với scope dự án không? Logic backend có đủ phức tạp và đầy đủ? | | |
| 1.5 | **Quy mô Cơ sở dữ liệu:** Số bảng, domain nghiệp vụ — schema có phản ánh đúng độ phức tạp thực tế của bài toán không? | | |
| 1.6 | **Tính đổi mới & sáng tạo kỹ thuật:** Dự án có áp dụng công nghệ/ý tưởng mới so với các giải pháp cùng loại? Không cần phải đột phá nhưng phải có điểm khác biệt rõ ràng. | | |
| 1.7 | **Hiểu sâu domain nghiệp vụ:** Code và dữ liệu có phản ánh đúng quy trình nghiệp vụ thực tế không? Hay chỉ hiểu bề mặt? | | |
| 1.8 | **Điểm khác biệt kỹ thuật (USP):** Tính năng nào làm dự án này nổi bật so với các giải pháp tương tự? Có thể chỉ ra cụ thể không? | | |
| 1.9 | **Kế hoạch phát triển (Roadmap):** Có tài liệu hoặc định hướng rõ ràng về những gì sẽ làm tiếp theo không? | | |
| 1.10 | **Mức độ hoàn thiện tổng thể:** Các tính năng cam kết có được hoàn thiện đầy đủ không? Không có tính năng bỏ dở giữa chừng? | | |
| **⭐** | **Trung bình Phần 1** | **[....]** | |

---

### PHẦN 2: 🏗️ KIẾN TRÚC HỆ THỐNG & LỰA CHỌN CÔNG NGHỆ

> *Đánh giá tổng thể về cách hệ thống được thiết kế và lý do đằng sau mỗi lựa chọn công nghệ. Gộp từ: Kiến trúc hệ thống + Đánh giá Stack.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 2.1 | **Mô hình kiến trúc tổng thể:** Monolithic, Microservice, Serverless hay Hybrid — lựa chọn có phù hợp với quy mô và độ phức tạp của dự án? Không over-engineer cũng không under-engineer. | | |
| 2.2 | **Phân tách trách nhiệm (Separation of Concerns):** Các lớp Controller, Service, Repository (hoặc tương đương) có được phân tách rõ ràng? Không có "God Class" hay "Fat Controller"? | | |
| 2.3 | **Lựa chọn Ngôn ngữ & Framework:** Ngôn ngữ và framework được chọn có phù hợp với bài toán (hiệu năng, type safety, ecosystem)? Có lý do rõ ràng thay vì chọn vì "biết rồi"? | | |
| 2.4 | **Lựa chọn Database phù hợp:** SQL/NoSQL/Hybrid được chọn dựa trên tính chất dữ liệu (quan hệ chặt, linh hoạt, phân tán)? Database phụ (Redis, Elasticsearch) có được dùng đúng chỗ không? | | |
| 2.5 | **Lựa chọn Giao thức API đúng:** REST, GraphQL, gRPC, WebSocket, SSE — mỗi giao thức có được chọn phù hợp với từng use case (CRUD vs streaming vs realtime)? | | |
| 2.6 | **Tính nhất quán của Stack (Stack Cohesion):** Toàn bộ stack có làm việc tốt với nhau không? Không có công nghệ "loner" nào xung đột hoặc khó tích hợp? | | |
| 2.7 | **Phiên bản Công nghệ & LTS:** Các thư viện, runtime có dùng phiên bản LTS/Stable không? Không dùng EOL (quá cũ) hoặc quá mới (không ổn định)? | | |
| 2.8 | **Khả năng mở rộng kiến trúc:** Kiến trúc có được thiết kế để dễ thêm tính năng mới, tách module, hoặc scale về sau không? | | |
| 2.9 | **Quản lý Cấu hình & Môi trường:** Có tách config ra khỏi code (`.env`)? Có phân biệt môi trường Dev / Test / Prod không? Secrets được bảo vệ? | | |
| 2.10 | **Logging & Khả năng quan sát cơ bản:** Có ghi log lỗi, audit trail quan trọng không? Khi hệ thống có vấn đề có đủ thông tin để debug không? | | |
| **⭐** | **Trung bình Phần 2** | **[....]** | |

---

### PHẦN 3: 🗄️ THIẾT KẾ CƠ SỞ DỮ LIỆU & LƯU TRỮ

> *Đánh giá chất lượng thiết kế schema, chiến lược lưu trữ và khả năng bảo toàn dữ liệu.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 3.1 | **Chuẩn hóa Schema (Normalization):** Schema có được thiết kế đúng chuẩn hóa, tránh data trùng lặp? Có phân domain nghiệp vụ rõ ràng không? | | |
| 3.2 | **Ràng buộc dữ liệu (Constraints):** Có đặt đầy đủ Primary Key, Foreign Key, Unique, Not Null đúng chỗ không? Dữ liệu không hợp lệ có bị chặn ở tầng DB không? | | |
| 3.3 | **Chiến lược Index:** Các trường thường dùng trong WHERE, JOIN, ORDER BY có được đánh index không? Không index thừa làm chậm write. | | |
| 3.4 | **Tránh Dư thừa & Lưu trữ phù hợp:** Dữ liệu lớn (ảnh, file) có được lưu đúng chỗ không? Không lưu binary blob lớn trực tiếp trong DB quan hệ nếu không cần thiết. | | |
| 3.5 | **ACID & Transaction:** Các thao tác quan trọng (thanh toán, đặt chỗ, cập nhật trạng thái) có được wrap trong transaction để đảm bảo nhất quán không? | | |
| 3.6 | **Xử lý Race Condition & Concurrency:** Các tình huống đồng thời (double booking, inventory race) có được xử lý bằng locking hoặc optimistic concurrency không? | | |
| 3.7 | **Soft Delete & Data History:** Dữ liệu quan trọng có được xóa mềm thay vì xóa cứng không? Có lưu lịch sử thay đổi cho các entity quan trọng không? | | |
| 3.8 | **Migration & Schema Version Control:** Có công cụ quản lý migration (Flyway, Liquibase, Sequelize migrate)? Hay chỉ có 1 file SQL dump? | | |
| 3.9 | **Bảo mật Dữ liệu ở tầng DB:** Credentials DB có được bảo vệ? Query có dùng parameterized để chống SQL injection không? | | |
| 3.10 | **Backup & Khôi phục (N/A nếu dự án demo):** Có chiến lược backup định kỳ? Có test khôi phục từ backup được không? | | |
| **⭐** | **Trung bình Phần 3** | **[....]** | |

---

### PHẦN 4: ⚙️ LOGIC NGHIỆP VỤ & XỬ LÝ HỆ THỐNG

> *Đánh giá mức độ chính xác và đầy đủ của logic nghiệp vụ — phần quan trọng nhất thể hiện độ hiểu bài toán.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 4.1 | **Độ chính xác Luồng Chính (Happy Path):** Các luồng nghiệp vụ cốt lõi (đặt hàng, thanh toán, xác nhận...) có hoạt động đúng và đầy đủ không? | | |
| 4.2 | **Xử lý Edge Cases:** Các trường hợp đặc biệt (dữ liệu rỗng, số âm, thời gian quá hạn, user offline...) có được nghĩ đến và xử lý không? | | |
| 4.3 | **Exception Handling:** Lỗi có được bắt và xử lý đúng cách không? Có Global Error Handler không? Lỗi hệ thống không bị lộ ra ngoài? | | |
| 4.4 | **Nhất quán Trạng thái (State Consistency):** Khi có lỗi giữa chừng, hệ thống có về trạng thái an toàn không? State machine của entity (order, booking...) có đúng không? | | |
| 4.5 | **Compensating Transaction:** Khi 1 bước trong chuỗi thao tác thất bại, có cơ chế rollback hoặc bù trừ để tránh dữ liệu inconsistent không? | | |
| 4.6 | **Validation tầng nghiệp vụ:** Input được validate không chỉ về định dạng mà cả về nghiệp vụ (số lượng không vượt kho, ngày đặt không trong quá khứ...)? | | |
| 4.7 | **Xử lý Thời gian & Lịch biểu:** Time zone được xử lý nhất quán không? Các tác vụ có yếu tố thời gian (hết hạn, nhắc nhở) có được xử lý tự động không? | | |
| 4.8 | **Xử lý Bất đồng bộ (Async):** Các tác vụ nặng (gửi email, push notification, gọi AI...) có được xử lý async để không block request chính không? | | |
| 4.9 | **Encapsulation & Phân tầng Logic:** Logic nghiệp vụ có được đóng gói trong Service/UseCase layer riêng, không bị rải vào Controller hay DB query không? | | |
| 4.10 | **Traceability & Audit:** Các thao tác quan trọng có được log để sau này có thể trace nguyên nhân lỗi hoặc kiểm tra hành vi hệ thống? | | |
| **⭐** | **Trung bình Phần 4** | **[....]** | |

---

### PHẦN 5: 🔌 BACKEND CORE, API, REALTIME & TÍCH HỢP

> *Đánh giá chất lượng API, tích hợp bên ngoài và các công nghệ realtime/hiện đại. Gộp từ: Backend API + Realtime & Modern Tech.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 5.1 | **Thiết kế API chuẩn (REST/GraphQL/gRPC):** API có đúng HTTP method, Status Code, response format nhất quán không? Naming convention rõ ràng? | | |
| 5.2 | **API Documentation:** Có Swagger/OpenAPI/Postman Collection để dev khác có thể hiểu và dùng API mà không cần hỏi không? | | |
| 5.3 | **Authentication & Authorization tại API:** Mỗi endpoint có kiểm tra token hợp lệ và quyền truy cập đúng role không? Không có endpoint bị bỏ quên? | | |
| 5.4 | **Tích hợp Bên thứ 3 (3rd-party):** Các dịch vụ ngoài (thanh toán, bản đồ, AI API, OAuth...) có được tích hợp đúng cách, có xử lý lỗi và timeout không? | | |
| 5.5 | **Rate Limiting & Bảo vệ API:** API có được bảo vệ khỏi lạm dụng (rate limiting, brute-force protection)? Middleware có đặt đúng vị trí? | | |
| 5.6 | **Realtime Communication (N/A nếu không có):** WebSocket/SSE có được áp dụng đúng cho use case cần realtime (chat, notification, live update)? Có quản lý reconnect không? | | |
| 5.7 | **Tích hợp AI/ML (N/A nếu không có):** AI được tích hợp có giải quyết vấn đề thực chất không? Có xử lý khi AI timeout/fail không? | | |
| 5.8 | **Push Notification / Email (N/A nếu không có):** Notification có được gửi async không? Có retry khi fail? Nội dung có phù hợp ngữ cảnh? | | |
| 5.9 | **Xử lý File Upload & Media:** Upload file/ảnh có được validate (kích thước, loại file)? Có resize/compress trước khi lưu không? | | |
| 5.10 | **Connection Pool & Resource Management:** DB connection, HTTP client có dùng pool/reuse không? Không tạo mới connection cho mỗi request? | | |
| **⭐** | **Trung bình Phần 5** | **[....]** | |

---

### PHẦN 6: 🔐 BẢO MẬT & AN TOÀN THÔNG TIN

> *Đánh giá toàn diện các lớp bảo mật từ xác thực đến bảo vệ dữ liệu.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 6.1 | **Xác thực người dùng (Authentication):** Cơ chế đăng nhập có đủ mạnh (bcrypt/argon2 cho password, JWT với expiry, OAuth đúng chuẩn)? Session/token có được quản lý chặt chẽ? | | |
| 6.2 | **Phân quyền (Authorization & RBAC):** Quyền truy cập có được kiểm tra đúng theo từng role/resource? Không có leo thang đặc quyền (privilege escalation)? | | |
| 6.3 | **Chống SQL Injection:** Query DB có dùng parameterized/prepared statements hay ORM không? Không nối chuỗi trực tiếp vào SQL? | | |
| 6.4 | **Chống XSS & CSRF:** Input từ user có được sanitize trước khi render không? Với web app có CSRF protection cho state-changing request không? | | |
| 6.5 | **Bảo vệ Password & Sensitive Data:** Password được hash đúng chuẩn (bcrypt/argon2)? Không lưu plaintext? Data nhạy cảm (key API, số thẻ) không bị lưu raw? | | |
| 6.6 | **HTTPS & Transport Security:** Kết nối có được mã hóa TLS không? Header bảo mật (HSTS, X-Frame-Options) có được set không? | | |
| 6.7 | **Quản lý Secrets & Configuration:** API keys, DB password có được lưu trong `.env` riêng, không commit lên git? Có `.env.example` hướng dẫn? | | |
| 6.8 | **Bảo vệ Tài nguyên (Resource Authorization):** Khi lấy dữ liệu theo ID, có kiểm tra user này có quyền xem object đó không (Broken Object Level Authorization)? | | |
| 6.9 | **Brute-force Protection:** Đăng nhập sai nhiều lần có bị giới hạn hoặc lock không? OTP/2FA có nếu cần thiết? | | |
| 6.10 | **Audit Trail (Nhật ký kiểm toán):** Các thao tác quan trọng (đăng nhập, thay đổi dữ liệu nhạy cảm, xóa) có được ghi log với timestamp và user ID không? | | |
| **⭐** | **Trung bình Phần 6** | **[....]** | |

---

### PHẦN 7: ⚡ HIỆU NĂNG, TỐI ƯU & KHẢ NĂNG CHỊU TẢI

> *Đánh giá hiệu năng hệ thống, chiến lược tối ưu và khả năng scale khi tải tăng. Gộp từ: Hiệu năng + Load Testing.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 7.1 | **Tối ưu Truy vấn DB:** Có tránh N+1 query không? Các truy vấn phức tạp có được EXPLAIN/analyze không? Index có được dùng đúng không? | | |
| 7.2 | **Caching Strategy:** Dữ liệu ít thay đổi có được cache lại không (in-memory, Redis)? Cache invalidation có được xử lý đúng không? | | |
| 7.3 | **Phân trang & Giới hạn Payload:** API có pagination không? Không trả về toàn bộ dataset trong 1 response? | | |
| 7.4 | **Tối ưu Media & Asset:** Ảnh/file có được nén/resize trước khi lưu và phục vụ không? Có CDN hoặc giải pháp tương đương không? | | |
| 7.5 | **Frontend Build Optimization:** Bundle có được code-split, lazy load không? Build tool (Vite, Webpack) có được cấu hình production-ready không? | | |
| 7.6 | **Non-blocking I/O:** Server có xử lý I/O bất đồng bộ đúng cách không? Không có blocking operation nào trên main thread? | | |
| 7.7 | **Background Jobs:** Các tác vụ tốn thời gian (gửi mail, xử lý ảnh, sync data) có được chuyển ra background worker/queue không? | | |
| 7.8 | **Load Testing cơ bản (N/A nếu không thực hiện):** Có thực hiện bất kỳ bài test tải nào không (k6, JMeter, Locust)? P95 latency ở mức chấp nhận được? | | |
| 7.9 | **Phát hiện Bottleneck:** Sau khi chạy thực tế hoặc test, có xác định được điểm chậm nhất của hệ thống không? Có profiling không? | | |
| 7.10 | **Ý thức về Horizontal Scale:** Kiến trúc có được thiết kế stateless ở mức cơ bản không? Session/state có bị gắn cứng vào 1 server không? | | |
| **⭐** | **Trung bình Phần 7** | **[....]** | |

---

### PHẦN 8: 🎨 GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)

> *Đánh giá chất lượng thiết kế, tính nhất quán và trải nghiệm thực tế của người dùng cuối.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 8.1 | **Thiết kế Visual & Thẩm mỹ:** Giao diện có được thiết kế chỉn chu, màu sắc/typography nhất quán không? Có dùng Design System không? | | |
| 8.2 | **UX Flow & Navigation:** Luồng thao tác của người dùng có logic, rõ ràng không? Người dùng mới có tìm được tính năng mình cần không? | | |
| 8.3 | **Tính nhất quán (Design Consistency):** Các component (button, form, table...) có dùng style nhất quán xuyên suốt toàn app không? | | |
| 8.4 | **Responsive Design:** Giao diện có hiển thị tốt trên nhiều kích thước màn hình (desktop, tablet, mobile) không? | | |
| 8.5 | **Loading & Skeleton State:** Khi dữ liệu đang load có hiển thị skeleton/spinner không? Tránh layout shift đột ngột? | | |
| 8.6 | **Empty State & Error State:** Khi không có dữ liệu hoặc có lỗi, có thông báo rõ ràng và hướng dẫn người dùng tiếp theo không? | | |
| 8.7 | **Feedback cho Hành động:** Mỗi hành động quan trọng (lưu, xóa, gửi) có feedback ngay cho người dùng (toast, modal, trạng thái button)? | | |
| 8.8 | **Form Validation UX:** Lỗi validation có được hiển thị đúng chỗ, đúng lúc và rõ ràng không? Không để user mò mẫm tại sao submit không được? | | |
| 8.9 | **Tính năng đặc thù nền tảng (N/A nếu không áp dụng):** Với Mobile — có tận dụng GPS, Camera, Push Notification, secure storage đúng chỗ không? Với Web — có keyboard shortcut, drag-drop nếu phù hợp? | | |
| 8.10 | **Hiệu năng Frontend:** Trang load nhanh không? Transition/animation có mượt không? State update có bị lag không? | | |
| **⭐** | **Trung bình Phần 8** | **[....]** | |

---

### PHẦN 9: 🧪 KIỂM THỬ & ĐẢM BẢO CHẤT LƯỢNG (QA)

> *Đánh giá mức độ kiểm thử và đảm bảo chất lượng. N/A rộng rãi cho đồ án sinh viên — nhưng ghi nhận điểm nào có.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 9.1 | **Unit Test:** Có unit test cho các hàm/service quan trọng không? Coverage bao nhiêu %? N/A nếu không có và ghi nhận. | | |
| 9.2 | **Integration Test:** Có test kiểm tra sự kết hợp giữa các module (API + DB, Service + 3rd-party)? | | |
| 9.3 | **API Test (Postman/Insomnia/REST Client):** Các API endpoint quan trọng có được test thủ công có hệ thống không? Có test collection lưu lại không? | | |
| 9.4 | **E2E Test (N/A nếu không có):** Có test tự động mô phỏng luồng thao tác của người dùng thực không (Cypress, Playwright)? | | |
| 9.5 | **Test Edge Cases & Negative Cases:** Việc test có bao gồm input sai, thiếu quyền, dữ liệu biên không? Không chỉ test happy path? | | |
| 9.6 | **Môi trường Test riêng biệt:** Có môi trường test tách biệt khỏi production không? Data test không ảnh hưởng data thật? | | |
| 9.7 | **Kiểm thử Bảo mật cơ bản:** Có tự test các lỗ hổng cơ bản (SQL injection, truy cập trái phép, brute force) không? | | |
| 9.8 | **Regression Testing:** Khi sửa bug hoặc thêm tính năng, có chạy lại test cũ để đảm bảo không phá vỡ gì không? | | |
| 9.9 | **Bug Tracking:** Có hệ thống ghi chép và theo dõi bug (dù đơn giản như file markdown hay Github Issues)? | | |
| 9.10 | **Test Coverage cho nghiệp vụ quan trọng:** Ít nhất các luồng quan trọng nhất (đăng nhập, thanh toán, đặt chỗ...) có được cover bởi test nào đó không? | | |
| **⭐** | **Trung bình Phần 9** | **[....]** | |

---

### PHẦN 10: 🛠️ CHẤT LƯỢNG MÃ NGUỒN, DEVOPS & QUẢN LÝ DỰ ÁN

> *Đánh giá chất lượng code, quy trình phát triển và cách quản lý dự án.*

| STT | Tiêu chí đánh giá chi tiết | Điểm (0-10 / N/A) | Nhận xét bắt buộc |
|---|---|:---:|---|
| 10.1 | **Chất lượng Code (Clean Code):** Code có dễ đọc, đặt tên rõ ràng, function ngắn gọn, không có magic number/string không? Có comment ở những chỗ phức tạp không? | | |
| 10.2 | **Áp dụng Design Pattern:** Có áp dụng các pattern phù hợp (Repository, Factory, Observer, Singleton...) đúng chỗ không? Không over-pattern? | | |
| 10.3 | **Cấu trúc Project:** Thư mục/file có được tổ chức logic, dễ tìm không? Convention đặt tên file nhất quán? | | |
| 10.4 | **Quản lý Git:** Có dùng Git không? Commit message có ý nghĩa không? Có branching strategy không (feature branch, main/dev)? | | |
| 10.5 | **CI/CD Pipeline (N/A nếu không có):** Có tự động build, test, deploy khi push code không? Dù đơn giản (GitHub Actions, GitLab CI)? | | |
| 10.6 | **Linter & Formatter:** Có ESLint, Prettier, Black, hoặc tool format code tương đương không? Code base có nhất quán về style không? | | |
| 10.7 | **Quản lý Dependencies:** Package.json/requirements.txt có được duy trì sạch không? Không có dependency không dùng đến? Có audit vulnerabilities không? | | |
| 10.8 | **Tài liệu Kỹ thuật (Documentation):** README có đầy đủ hướng dẫn cài đặt, cấu hình, chạy không? API documentation có không? Tài liệu kiến trúc? | | |
| 10.9 | **Quản lý Task & Tiến độ:** Có hệ thống theo dõi task (Jira, Trello, Github Project, hoặc file markdown)? Tiến độ có được cập nhật? | | |
| 10.10 | **Code Review & Collaboration (N/A cho dự án cá nhân):** Với team: có quy trình review code trước khi merge không? Mỗi PR có được review kỹ không? | | |
| **⭐** | **Trung bình Phần 10** | **[....]** | |

---

## 📈 TỔNG KẾT & PHÂN LOẠI DỰ ÁN

### 🧮 Bảng Tổng hợp Điểm

| Phần | Tên Hạng mục | Trung bình điểm (/10) |
|:---:|---|:---:|
| P1 | 💡 Ý TƯỞNG, ĐỘ THỰC TIỄN & QUY MÔ DỰ ÁN | |
| P2 | 🏗️ KIẾN TRÚC HỆ THỐNG & LỰA CHỌN CÔNG NGHỆ | |
| P3 | 🗄️ THIẾT KẾ CƠ SỞ DỮ LIỆU & LƯU TRỮ | |
| P4 | ⚙️ LOGIC NGHIỆP VỤ & XỬ LÝ HỆ THỐNG | |
| P5 | 🔌 BACKEND CORE, API, REALTIME & TÍCH HỢP | |
| P6 | 🔐 BẢO MẬT & AN TOÀN THÔNG TIN | |
| P7 | ⚡ HIỆU NĂNG, TỐI ƯU & KHẢ NĂNG CHỊU TẢI | |
| P8 | 🎨 GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX) | |
| P9 | 🧪 KIỂM THỬ & ĐẢM BẢO CHẤT LƯỢNG (QA) | |
| P10 | 🛠️ CHẤT LƯỢNG MÃ NGUỒN, DEVOPS & QUẢN LÝ | |
| 🏆 | **TỔNG ĐIỂM TRUNG BÌNH** | **[....] / 10.0** |

*(Nếu có tiêu chí N/A, tính trung bình trên số tiêu chí thực tế có điểm. Ghi rõ số tiêu chí được tính.)*

### 🏅 Xếp loại Cấp độ Dự án

| Điểm | Xếp loại | Ý nghĩa |
|:---:|---|---|
| **< 4.0** | ❌ **Thảm họa** | Nguy hiểm nếu triển khai thực tế. Cần xây lại từ đầu. |
| **4.0 – 5.4** | 🔴 **Kém** | Chỉ hoạt động bề mặt, không có khả năng bảo trì hay mở rộng. |
| **5.5 – 6.4** | 🟡 **Cơ bản (Pass)** | Đạt mức đồ án sinh viên. Logic chạy được nhưng thiếu chiều sâu kỹ thuật. |
| **6.5 – 7.4** | 🔵 **Khá (Professional)** | Đạt chuẩn đi làm Junior/Mid. Có kiến trúc, UX ổn. |
| **7.5 – 8.9** | 🟢 **Xuất Sắc (High-Quality)** | Chuẩn mực kỹ thuật, bảo mật tốt, tối ưu hóa rõ rệt. |
| **9.0 – 9.4** | 🏆 **Cực Phẩm (Enterprise-Ready)** | CI/CD hoàn chỉnh, xử lý edge case xuất sắc, đạt chuẩn doanh nghiệp. |
| **≥ 9.5** | 🌟 **Đỉnh Cao (World-class)** | Kỹ thuật không tì vết, benchmark hiệu năng cụ thể, tài liệu hoàn hảo. |

---

## 🗣 NHẬN XÉT CHUYÊN SÂU CỦA CHUYÊN GIA

### 🏆 TOP 5 ĐIỂM MẠNH NỔI BẬT (Strengths)

| # | Điểm mạnh | Bằng chứng cụ thể (trích dẫn file/tính năng) |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |

### 🚨 TOP 5 VẤN ĐỀ NGHIÊM TRỌNG CẦN XỬ LÝ (Critical Issues)

| # | Vấn đề | Mức độ rủi ro | Khuyến nghị cụ thể |
|---|---|:---:|---|
| 1 | | 🔴 Cao / 🟡 TB / 🟢 Thấp | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

### 💡 NHẬN XÉT THEO TỪNG HẠNG MỤC

| Phần | Nhận xét chi tiết của chuyên gia |
|---|---|
| **P1 - Ý tưởng & Quy mô** | |
| **P2 - Kiến trúc & Stack** | |
| **P3 - Database** | |
| **P4 - Logic nghiệp vụ** | |
| **P5 - API & Tích hợp** | |
| **P6 - Bảo mật** | |
| **P7 - Hiệu năng & Scale** | |
| **P8 - UI/UX** | |
| **P9 - Testing** | |
| **P10 - Code Quality & DevOps** | |

### 🚀 LỘ TRÌNH NÂNG CẤP ĐỀ XUẤT

| Giai đoạn | Ưu tiên | Công việc cần làm | Thời gian ước tính |
|---|:---:|---|:---:|
| **🔥 Giai đoạn 1 — Hotfix khẩn (Ngay lập tức)** | P0 | | |
| **⚠️ Giai đoạn 2 — Cải thiện trọng yếu (1–4 tuần)** | P1 | | |
| **📈 Giai đoạn 3 — Nâng cấp chất lượng (1–3 tháng)** | P2 | | |
| **🚀 Giai đoạn 4 — Scale-up & Production-ready** | P3 | | |

### 📝 KẾT LUẬN TỔNG THỂ CỦA CHUYÊN GIA

> *[Điền nhận xét tổng quát, quan điểm chuyên nghiệp và lời khuyên cuối cùng cho nhóm/cá nhân phát triển]*

---
*Bảng đánh giá này được thiết kế để sử dụng trực tiếp bởi các kỹ sư phần mềm và kiến trúc sư có kinh nghiệm. Kết quả đánh giá mang tính khách quan khi người review có đủ thời gian đọc code thực tế, không chỉ xem demo.*
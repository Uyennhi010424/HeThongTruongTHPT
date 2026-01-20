với dự án vầy tui định làm theo hướng backend, website và mobile
đọc dự án
"HỆ THỐNG QUẢN LÝ TRƯỜNG THPT
WEB APPLICATION"
Tasks
Công việc
CHỨC NĂNG DÀNH CHO NGƯỜI DÙNG (FRONTEND)
1. Trang dành cho học sinh
1.1. Trang chủ
Hiển thị thông báo mới nhất từ nhà trường
Lịch học trong tuần
Môn học đang học trong học kì 
Thông tin giáo viên chủ nhiệm
Các sự kiện, lịch thi sắp diễn ra
1.2. Trang thời khóa biểu
Hiển thị thời khóa biểu theo tuần
Lọc theo học kỳ, năm học
Xem chi tiết từng tiết học
1.3. Trang bảng điểm
Hiển thị điểm theo môn học 
Tính điểm trung bình học kỳ, cả năm
Phân loại học lực
1.4. Trang hạnh kiểm 
Xem nhận xét hạnh kiểm theo học kỳ
Xem lịch sử vi phạm, khen thưởng (nếu có)
1.5. Trang thông tin cá nhân học sinh
Xem và cập nhật thông tin cá nhân.
Xem thông tin lớp, khóa học
Xem diện chính sách (nếu có)
2. Trang dành cho giáo viên
2.1. Trang chủ giáo viên
Danh sách lớp đang giảng dạy
Thông báo từ Ban giám hiệu
Lịch dạy trong tuần
2.2. Quản lý điểm học sinh (Giáo viên bộ môn)
Nhập điểm theo môn học, lớp học
Sửa điểm (có kiểm soát quyền)
Tự động tính điểm trung bình
2.3 Quản lý hạnh kiểm (Giáo viên chủ nhiệm)
Nhận xét, đánh giá hạnh kiểm học sinh
Ghi nhận vi phạm khen thưởng
2.4 Quản lý học sinh chủ nhiệm 
Xem danh sách học sinh trong lớp 
Theo dõi kết quả học tập và hạnh kiểm
3. Trang dành cho phụ huynh
3.1. Trang chủ phụ huynh
Xem thông tin học tập của con
Thông báo từ nhà trường
3.2. Theo dõi kết quả học tập
Bảng điểm
Hạnh kiểm 
Lịch học, Lịch thi
QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN
4.1 Đăng nhập/ Đăng xuất hệ thống
Đăng nhập bằng username/email & mật khẩu 
Xác thực bằng JWT/ Session
Phân quyền theo vai trò (Admin, Giáo viên, Học sinh, Phụ huynh)
4.2 Quản lý tài khoản người dùng (Admin)
Danh sách người dùng 
Tạo mới/ cập nhật/ khóa tài khoản
Gán vai trò người dùng
CHỨC NĂNG QUẢN TRỊ HỆ THỐNG (ADMIN PANEL)
5. Quản lý danh mục & dữ liệu nền
5.1 Quản lý năm học - học kỳ
Thêm/ sửa/ xóa năm học
Quản lý học kỳ theo năm học
5.2 Quản lý lớp học 
Tạo lớp 
Gán giáo viên chủ nhiệm 
Quản lý sĩ số lớp 
5.3 Quản lý môn học 
Thêm/ sửa/ xóa môn học
Gán giáo viên giảng dạy
Phân loại học lực
6. Quản lý học sinh
6.1 Quản lý hồ sơ học sinh
Thêm/ sửa/ xóa học sinh
Quản lý thông tin cá nhân 
Quản lý diện chính sách
6.2 Phân lớp học sinh
Gán học sinh vào lớp 
Chuyển lớp, tên lớp
7. Quản lý giáo viên
7.1 Quản lý hồ sơ giáo viên
Thêm/ sửa/ xóa giáo viên
Gán vai trò (Giáo viên bộ môn, chủ nhiệm)
7.2 Phân công giảng dạy
Gán giáo viên cho môn học và lớp học 
Quản lý lịch giảng dạy 
8. Quản lý điểm & đánh giá
8.1 Quản lý loại điểm
Khai báo điểm miệng, 15p, 1 tiết, GK, CK
Cấu hình hệ số từng loại điểm 
8.2 Quản lý điểm học sinh
Tiếp nhận dữ liệu điểm 
Kiểm tra & duyệt điểm
Khóa điểm
8.3 Tổng hợp & tính điểm
Tổng hợp điểm theo lớp, khối 
Tính điểm trung bình môn, học kỳ, cả năm 
8.4 Xếp loại học lực 
Xếp loại Giỏi / Khá / Trung bình / Yếu 
8.5 Quản lý & duyệt hạnh kiểm 
Tiếp nhận đánh giá hạnh kiểm từ GVCN
Duyệt và khóa hạnh kiểm cuối kỳ 
9. Quản lý thời khóa biểu & lịch học
9.1 Quản lý thời khóa biểu
Tạo và chỉnh sửa thời khóa biểu
Kiểm tra trùng lịch giáo viên 
Công bố thời khóa biểu 
9.2 Quản lý lịch thi
Tạo lịch thi theo lớp, khối
Thông báo lịch thi cho học sinh
10. Quản lý thông báo & tin tức
10.1 Thông báo nhà trường
Đăng thông báo 
Gửi thông báo theo đối tượng (HS, GV, PH)
CHỨC NĂNG HỆ THỐNG & MỞ RỘNG 
11. Báo cáo & thống kê
Thống kê học sinh theo lớp, năm học 
Thống kê học lực, hạnh kiểm 
Thống kê học sinh diện chính sách 
12. Sao lưu & bảo mật dữ liệu 
Sao lưu dữ liệu định kỳ 
Phân quyền truy cập dữ liệu
Mã hóa mật khẩu người dùng
13. Tích hợp & mở rộng (tùy chọn)
Xuất file Excel / PDF
Chatbox hỗ trợ người dùng (Rule-based)

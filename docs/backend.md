HETHONGTRUONGTHPT
│
├── src/main/java/com/hethongtruongthpt
│   │
│   ├── HethongtruongthptApplication.java
│   │   └─ Class main chạy Spring Boot
│   │
│   ├── config
│   │   ├── SecurityConfig.java
│   │   │   └─ Cấu hình Spring Security, phân quyền API
│   │   │
│   │   ├── JwtAuthenticationFilter.java
│   │   │   └─ Lọc request, kiểm tra JWT
│   │   │
│   │   ├── JwtTokenProvider.java
│   │   │   └─ Sinh, kiểm tra, giải mã JWT
│   │   │
│   │   └── CorsConfig.java
│   │       └─ Cho phép React & Mobile gọi API
│   │
│   ├── common
│   │   ├── ApiResponse.java
│   │   │   └─ Chuẩn response trả về frontend
│   │   │
│   │   ├── Constants.java
│   │   │   └─ Hằng số: ROLE, STATUS, MESSAGE
│   │   │
│   │   └── Utils.java
│   │       └─ Hàm dùng chung (tính điểm, format ngày)
│   │
│   ├── controller
│   │   ├── AuthController.java
│   │   │   └─ Đăng nhập / đăng xuất (JWT)
│   │   │
│   │   ├── UserController.java
│   │   │   └─ Quản lý tài khoản (Admin)
│   │   │
│   │   ├── HocSinhController.java
│   │   │   └─ Quản lý học sinh
│   │   │
│   │   ├── GiaoVienController.java
│   │   │   └─ Quản lý giáo viên
│   │   │
│   │   ├── LopHocController.java
│   │   │   └─ Quản lý lớp học
│   │   │
│   │   ├── MonHocController.java
│   │   │   └─ Quản lý môn học
│   │   │
│   │   ├── DiemController.java
│   │   │   └─ Nhập, sửa, duyệt điểm
│   │   │
│   │   ├── HanhKiemController.java
│   │   │   └─ Đánh giá hạnh kiểm
│   │   │
│   │   ├── ThoiKhoaBieuController.java
│   │   │   └─ Thời khóa biểu
│   │   │
│   │   ├── LichThiController.java
│   │   │   └─ Quản lý lịch thi
│   │   │
│   │   └── ThongBaoController.java
│   │       └─ Thông báo nhà trường
│   │
│   ├── dto
│   │   ├── auth
│   │   │   ├── LoginRequest.java
│   │   │   └─ Dữ liệu đăng nhập
│   │   │
│   │   ├── user
│   │   │   ├── UserDTO.java
│   │   │   └─ Dữ liệu tài khoản
│   │   │
│   │   ├── hocsinh
│   │   │   ├── HocSinhDTO.java
│   │   │   └─ Dữ liệu học sinh
│   │   │
│   │   ├── giaovien
│   │   │   ├── GiaoVienDTO.java
│   │   │   └─ Dữ liệu giáo viên
│   │   │
│   │   ├── diem
│   │   │   ├── NhapDiemDTO.java
│   │   │   └─ Dữ liệu nhập điểm
│   │   │
│   │   └── hanhkiem
│   │       └─ HanhKiemDTO.java
│   │
│   ├── entity
│   │   ├── User.java
│   │   │   └─ Tài khoản đăng nhập
│   │   │
│   │   ├── Role.java
│   │   │   └─ ADMIN, GIAOVIEN, HOCSINH, PHUHUYNH
│   │   │
│   │   ├── HocSinh.java
│   │   │   └─ Thông tin học sinh
│   │   │
│   │   ├── GiaoVien.java
│   │   │   └─ Thông tin giáo viên
│   │   │
│   │   ├── LopHoc.java
│   │   │   └─ Lớp học
│   │   │
│   │   ├── MonHoc.java
│   │   │   └─ Môn học
│   │   │
│   │   ├── Diem.java
│   │   │   └─ Điểm học sinh
│   │   │
│   │   ├── LoaiDiem.java
│   │   │   └─ Miệng, 15p, 1 tiết, GK, CK
│   │   │
│   │   ├── HanhKiem.java
│   │   │   └─ Hạnh kiểm học sinh
│   │   │
│   │   ├── ThoiKhoaBieu.java
│   │   │   └─ Thời khóa biểu
│   │   │
│   │   ├── LichThi.java
│   │   │   └─ Lịch thi
│   │   │
│   │   └── ThongBao.java
│   │       └─ Thông báo
│   │
│   ├── repository
│   │   ├── UserRepository.java
│   │   ├── HocSinhRepository.java
│   │   ├── GiaoVienRepository.java
│   │   ├── LopHocRepository.java
│   │   ├── MonHocRepository.java
│   │   ├── DiemRepository.java
│   │   ├── HanhKiemRepository.java
│   │   ├── ThoiKhoaBieuRepository.java
│   │   ├── LichThiRepository.java
│   │   └── ThongBaoRepository.java
│   │
│   ├── service
│   │   ├── AuthService.java
│   │   ├── UserService.java
│   │   ├── HocSinhService.java
│   │   ├── GiaoVienService.java
│   │   ├── LopHocService.java
│   │   ├── MonHocService.java
│   │   ├── DiemService.java
│   │   ├── HanhKiemService.java
│   │   ├── ThoiKhoaBieuService.java
│   │   ├── LichThiService.java
│   │   └── ThongBaoService.java
│   │
│   ├── exception
│   │   ├── GlobalExceptionHandler.java
│   │   └─ Bắt lỗi toàn hệ thống
│   │
│   └── enums
│       ├── RoleEnum.java
│       ├── HocLucEnum.java
│       └── HanhKiemEnum.java
│
├── src/main/resources
│   ├── application.yml
│   │   └─ Cấu hình DB, JWT, port
│   │
│   └── data.sql (tùy chọn)
│       └─ Dữ liệu mẫu
│
└── pom.xml
    └─ Khai báo dependency

HETHONGTRUONGTHPT_MOBILE
│
├── app
│   └── src/main/java/com/hethongtruongthpt/mobile
│       │
│       ├── ui
│       │   ├── auth
│       │   │   ├── LoginActivity.java
│       │   │   └─ Đăng nhập (HS, PH)
│       │   │
│       │   ├── student
│       │   │   ├── StudentMainActivity.java
│       │   │   ├── HomeFragment.java
│       │   │   │   └─ Thông báo, lịch học, GVCN
│       │   │   │
│       │   │   ├── TimetableFragment.java
│       │   │   │   └─ Thời khóa biểu
│       │   │   │
│       │   │   ├── ScoreFragment.java
│       │   │   │   └─ Bảng điểm
│       │   │   │
│       │   │   ├── ConductFragment.java
│       │   │   │   └─ Hạnh kiểm
│       │   │   │
│       │   │   └── ProfileFragment.java
│       │   │       └─ Thông tin cá nhân
│       │   │
│       │   ├── parent
│       │   │   ├── ParentMainActivity.java
│       │   │   ├── ChildInfoFragment.java
│       │   │   │   └─ Thông tin học sinh
│       │   │   │
│       │   │   ├── ScoreFollowFragment.java
│       │   │   │   └─ Theo dõi bảng điểm
│       │   │   │
│       │   │   ├── TimetableFollowFragment.java
│       │   │   │   └─ Lịch học, lịch thi
│       │   │   │
│       │   │   └── NotificationFragment.java
│       │   │       └─ Thông báo nhà trường
│       │   │
│       │   └── common
│       │       ├── SplashActivity.java
│       │       └─ Màn hình khởi động
│       │
│       ├── adapter
│       │   ├── TimetableAdapter.java
│       │   ├── ScoreAdapter.java
│       │   ├── NotificationAdapter.java
│       │   └─ Adapter cho RecyclerView
│       │
│       ├── model
│       │   ├── auth
│       │   │   ├── LoginRequest.java
│       │   │   └─ Request đăng nhập
│       │   │
│       │   ├── user
│       │   │   ├── User.java
│       │   │   └─ Tài khoản
│       │   │
│       │   ├── student
│       │   │   ├── HocSinh.java
│       │   │   ├── LopHoc.java
│       │   │   └─ Dữ liệu học sinh
│       │   │
│       │   ├── score
│       │   │   ├── Diem.java
│       │   │   └─ Điểm
│       │   │
│       │   ├── timetable
│       │   │   └─ ThoiKhoaBieu.java
│       │   │
│       │   ├── conduct
│       │   │   └─ HanhKiem.java
│       │   │
│       │   └── notification
│       │       └─ ThongBao.java
│       │
│       ├── network
│       │   ├── ApiClient.java
│       │   │   └─ Retrofit instance
│       │   │
│       │   ├── ApiService.java
│       │   │   └─ Khai báo API backend
│       │   │
│       │   ├── AuthInterceptor.java
│       │   │   └─ Gắn JWT vào header
│       │   │
│       │   └── ApiResponse.java
│       │       └─ Chuẩn response từ backend
│       │
│       ├── repository
│       │   ├── AuthRepository.java
│       │   ├── StudentRepository.java
│       │   ├── ParentRepository.java
│       │   └─ Gọi API, xử lý dữ liệu
│       │
│       ├── viewmodel
│       │   ├── AuthViewModel.java
│       │   ├── StudentViewModel.java
│       │   ├── ParentViewModel.java
│       │   └─ ViewModel (MVVM)
│       │
│       ├── utils
│       │   ├── SharedPrefManager.java
│       │   │   └─ Lưu token, user
│       │   │
│       │   ├── DateUtils.java
│       │   │   └─ Format ngày
│       │   │
│       │   └── Constants.java
│       │       └─ BASE_URL, KEY
│       │
│       └── enums
│           ├── RoleEnum.java
│           ├── HocLucEnum.java
│           └── HanhKiemEnum.java
│
├── res
│   ├── layout
│   │   ├── activity_login.xml
│   │   ├── activity_student_main.xml
│   │   ├── activity_parent_main.xml
│   │   ├── fragment_home.xml
│   │   ├── fragment_timetable.xml
│   │   ├── fragment_score.xml
│   │   ├── fragment_conduct.xml
│   │   ├── fragment_profile.xml
│   │   └── ...
│   │
│   ├── menu
│   │   ├── bottom_nav_student.xml
│   │   └── bottom_nav_parent.xml
│   │
│   ├── values
│   │   ├── colors.xml
│   │   ├── styles.xml
│   │   └── strings.xml
│   │
│   └── drawable
│       └── icon, shape
│
├── AndroidManifest.xml
│   └─ Khai báo Activity, permission INTERNET
│
└── build.gradle
    └─ Dependency Retrofit, Gson, Lifecycle

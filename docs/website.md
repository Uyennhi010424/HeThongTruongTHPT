hethongtruongthpt-web
│
├── public
│   └── index.html
│
├── src
│   │
│   ├── api
│   │   ├── axiosClient.js
│   │   │   └─ Cấu hình Axios + JWT
│   │   │
│   │   ├── authApi.js
│   │   │   └─ API đăng nhập
│   │   │
│   │   ├── userApi.js
│   │   ├── hocsinhApi.js
│   │   ├── giaovienApi.js
│   │   ├── lopApi.js
│   │   ├── monhocApi.js
│   │   ├── diemApi.js
│   │   ├── hanhkiemApi.js
│   │   ├── thoikhoabieuApi.js
│   │   ├── lichthiApi.js
│   │   └── thongbaoApi.js
│
│   ├── app
│   │   ├── App.jsx
│   │   │   └─ Router chính
│   │   │
│   │   └── routes.jsx
│   │       └─ Khai báo route + role
│   │
│   ├── assets
│   │   └── images, icons
│   │
│   ├── components
│   │   ├── common
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── PrivateRoute.jsx
│   │   │
│   │   ├── table
│   │   │   └─ Table chung (Antd/MUI)
│   │   │
│   │   └── modal
│   │       └─ Modal thêm/sửa
│   │
│   ├── features
│   │   ├── auth
│   │   │   ├── LoginPage.jsx
│   │   │   └─ Đăng nhập
│   │   │
│   │   ├── admin
│   │   │   ├── dashboard
│   │   │   │   └── AdminDashboard.jsx
│   │   │   │
│   │   │   ├── users
│   │   │   │   ├── UserList.jsx
│   │   │   │   └── UserForm.jsx
│   │   │   │
│   │   │   ├── hocsinh
│   │   │   │   ├── HocSinhList.jsx
│   │   │   │   └── HocSinhForm.jsx
│   │   │   │
│   │   │   ├── giaovien
│   │   │   │   ├── GiaoVienList.jsx
│   │   │   │   └── GiaoVienForm.jsx
│   │   │   │
│   │   │   ├── lop
│   │   │   │   ├── LopList.jsx
│   │   │   │   └── LopForm.jsx
│   │   │   │
│   │   │   ├── monhoc
│   │   │   │   ├── MonHocList.jsx
│   │   │   │   └── MonHocForm.jsx
│   │   │   │
│   │   │   ├── namhoc-hocky
│   │   │   │   ├── NamHocList.jsx
│   │   │   │   └── HocKyList.jsx
│   │   │   │
│   │   │   ├── thongbao
│   │   │   │   └── ThongBaoManager.jsx
│   │   │   │
│   │   │   └── report
│   │   │       └── ReportPage.jsx
│   │   │
│   │   ├── teacher
│   │   │   ├── dashboard
│   │   │   │   └── TeacherDashboard.jsx
│   │   │   │
│   │   │   ├── diem
│   │   │   │   ├── NhapDiem.jsx
│   │   │   │   └── DuyetDiem.jsx
│   │   │   │
│   │   │   ├── hanhkiem
│   │   │   │   └── HanhKiemPage.jsx
│   │   │   │
│   │   │   └── lopchunhiem
│   │   │       └── LopChuNhiem.jsx
│   │   │
│   │   ├── student
│   │   │   ├── HomePage.jsx
│   │   │   ├── TimetablePage.jsx
│   │   │   ├── ScorePage.jsx
│   │   │   ├── ConductPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   └── parent
│   │       ├── HomePage.jsx
│   │       ├── ScoreFollow.jsx
│   │       └── TimetableFollow.jsx
│   │
│   ├── hooks
│   │   └── useAuth.js
│   │
│   ├── layouts
│   │   ├── AdminLayout.jsx
│   │   ├── TeacherLayout.jsx
│   │   ├── StudentLayout.jsx
│   │   └── ParentLayout.jsx
│   │
│   ├── store
│   │   └── authStore.js (Redux/Zustand)
│   │
│   ├── utils
│   │   ├── constants.js
│   │   ├── role.js
│   │   └── helpers.js
│   │
│   ├── styles
│   │   └── global.css
│   │
│   ├── index.js
│   └── main.jsx
│
├── .env
│   └─ REACT_APP_API_URL
│
├── package.json
└── README.md

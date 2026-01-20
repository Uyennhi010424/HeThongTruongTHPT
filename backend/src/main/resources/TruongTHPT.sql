/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     1/20/2026 6:30:02 PM                         */
/*==============================================================*/


drop table if exists AP_DUNG;

drop table if exists AP_DUNG_TRONG;

drop table if exists BAO_GOM;

drop table if exists CHU_NHIEM;

drop table if exists CO;

drop table if exists DANG_TAO;

drop table if exists DANH_GIA;

drop table if exists DANH_GIA_HK;

drop table if exists DAN_TOC;

drop table if exists DAT;

drop table if exists DIEM;

drop table if exists DUOC_BAN_HANH_BOI;

drop table if exists DUOC_DANH_GIA;

drop table if exists GHI_NHAN_TRONG;

drop table if exists GIAO_VIEN;

drop table if exists GOM;

drop table if exists HANH_KIEM;

drop table if exists HOC_BA;

drop table if exists HOC_KY;

drop table if exists HOC_SINH;

drop table if exists KHEN_THUONG;

drop table if exists LICH_THI;

drop table if exists LIEN_KET_TAI_KHOAN;

drop table if exists LOP;

drop table if exists MON_HOC;

drop table if exists NAM_HOC;

drop table if exists NHAM_DEN;

drop table if exists PHAN_CONG_GIANG_DAY;

drop table if exists PHAN_QUYEN;

drop table if exists PHU_HUYNH;

drop table if exists QUOC_TICH;

drop table if exists ROLES;

drop table if exists SO_HUU_TAI_KHOAN;

drop table if exists SU_DUNG_TAI_KHOAN;

drop table if exists THOI_KHOA_BIEU;

drop table if exists THONG_BAO;

drop table if exists TRONG;

drop table if exists USER;

drop table if exists VAN_BAN;

drop table if exists VI_PHAM;

/*==============================================================*/
/* Table: AP_DUNG                                               */
/*==============================================================*/
create table AP_DUNG
(
   ID_DIEM              int not null,
   ID_HOCKY             int not null,
   primary key (ID_DIEM, ID_HOCKY)
);

/*==============================================================*/
/* Table: AP_DUNG_TRONG                                         */
/*==============================================================*/
create table AP_DUNG_TRONG
(
   ID_LOP               int not null,
   ID_NAMHOC            int not null,
   ID_TKB               int not null,
   ID_LICHTHI           int not null,
   primary key (ID_LOP, ID_NAMHOC, ID_TKB, ID_LICHTHI)
);

/*==============================================================*/
/* Table: BAO_GOM                                               */
/*==============================================================*/
create table BAO_GOM
(
   ID_TKB               int not null,
   ID_HOCKY             int not null,
   ID_NAMHOC            int not null,
   ID_LICHTHI           int not null,
   primary key (ID_TKB, ID_HOCKY, ID_NAMHOC, ID_LICHTHI)
);

/*==============================================================*/
/* Table: CHU_NHIEM                                             */
/*==============================================================*/
create table CHU_NHIEM
(
   ID_GIAOVIEN          int not null,
   ID_LOP               int not null,
   primary key (ID_GIAOVIEN, ID_LOP)
);

/*==============================================================*/
/* Table: CO                                                    */
/*==============================================================*/
create table CO
(
   ID_HOCSINH           int not null,
   ID_QUOCTICH          int not null,
   primary key (ID_HOCSINH, ID_QUOCTICH)
);

/*==============================================================*/
/* Table: DANG_TAO                                              */
/*==============================================================*/
create table DANG_TAO
(
   ID_USER              int not null,
   ID_THONGBAO          int not null,
   primary key (ID_USER, ID_THONGBAO)
);

/*==============================================================*/
/* Table: DANH_GIA                                              */
/*==============================================================*/
create table DANH_GIA
(
   ID_MONHOC            int not null,
   ID_DIEM              int not null,
   primary key (ID_MONHOC, ID_DIEM)
);

/*==============================================================*/
/* Table: DANH_GIA_HK                                           */
/*==============================================================*/
create table DANH_GIA_HK
(
   ID_HANHKIEM          int not null,
   ID_GIAOVIEN          int not null,
   ID_VIPHAM            int not null,
   ID_KHENTHUONG        int not null,
   primary key (ID_HANHKIEM, ID_GIAOVIEN, ID_VIPHAM, ID_KHENTHUONG)
);

/*==============================================================*/
/* Table: DAN_TOC                                               */
/*==============================================================*/
create table DAN_TOC
(
   ID_DANTOC            int not null,
   TEN_DANTOC           varchar(50),
   MO_TA                varchar(255),
   primary key (ID_DANTOC)
);

/*==============================================================*/
/* Table: DAT                                                   */
/*==============================================================*/
create table DAT
(
   ID_HOCSINH           int not null,
   ID_DIEM              int not null,
   primary key (ID_HOCSINH, ID_DIEM)
);

/*==============================================================*/
/* Table: DIEM                                                  */
/*==============================================================*/
create table DIEM
(
   ID_DIEM              int not null,
   LOAI_DIEM            varchar(20),
   DIEM_SO              float,
   primary key (ID_DIEM)
);

/*==============================================================*/
/* Table: DUOC_BAN_HANH_BOI                                     */
/*==============================================================*/
create table DUOC_BAN_HANH_BOI
(
   ID_VANBAN            int not null,
   ID_USER              int not null,
   primary key (ID_VANBAN, ID_USER)
);

/*==============================================================*/
/* Table: DUOC_DANH_GIA                                         */
/*==============================================================*/
create table DUOC_DANH_GIA
(
   ID_HANHKIEM          int not null,
   ID_HOCSINH           int not null,
   ID_VIPHAM            int not null,
   ID_KHENTHUONG        int not null,
   primary key (ID_HANHKIEM, ID_HOCSINH, ID_VIPHAM, ID_KHENTHUONG)
);

/*==============================================================*/
/* Table: GHI_NHAN_TRONG                                        */
/*==============================================================*/
create table GHI_NHAN_TRONG
(
   ID_DIEM              int not null,
   ID_NAMHOC            int not null,
   primary key (ID_DIEM, ID_NAMHOC)
);

/*==============================================================*/
/* Table: GIAO_VIEN                                             */
/*==============================================================*/
create table GIAO_VIEN
(
   ID_GIAOVIEN          int not null,
   HO_TEN               varchar(100),
   NGAY_SINH            date,
   GIOI_TINH            bool,
   BO_MON               varchar(100),
   TRINH_DO             varchar(100),
   SO_DIEN_THOAI        varchar(15),
   EMAIL                varchar(100),
   primary key (ID_GIAOVIEN)
);

/*==============================================================*/
/* Table: GOM                                                   */
/*==============================================================*/
create table GOM
(
   ID_TKB               int not null,
   ID_MONHOC            int not null,
   ID_LICHTHI           int not null,
   primary key (ID_TKB, ID_MONHOC, ID_LICHTHI)
);

/*==============================================================*/
/* Table: HANH_KIEM                                             */
/*==============================================================*/
create table HANH_KIEM
(
   ID_HANHKIEM          int not null,
   XEP_LOAI             ENUM('TOT','KHA','TRUNG_BINH','YEU'),
   NHAN_XET             varchar(255),
   NGAY_DANH_GIA        date,
   primary key (ID_HANHKIEM)
);

/*==============================================================*/
/* Table: HOC_BA                                                */
/*==============================================================*/
create table HOC_BA
(
   ID_HOCBA             int not null,
   ID_NAMHOC            int not null,
   HOC_LUC              varchar(20),
   HANH_KIEM            varchar(20),
   GHI_CHU              varchar(255),
   primary key (ID_HOCBA)
);

/*==============================================================*/
/* Table: HOC_KY                                                */
/*==============================================================*/
create table HOC_KY
(
   ID_HOCKY             int not null,
   TEN_HOCKY            varchar(20),
   primary key (ID_HOCKY)
);

/*==============================================================*/
/* Table: HOC_SINH                                              */
/*==============================================================*/
create table HOC_SINH
(
   ID_HOCSINH           int not null,
   ID_LOP               int not null,
   ID_HOCBA             int not null,
   ID_DANTOC            int not null,
   ID_PHUHUYNH          int not null,
   HO_TEN               varchar(100),
   NGAY_SINH            date,
   GIOI_TINH            bool,
   DIA_CHI              varchar(255),
   SO_DIEN_THOAI        varchar(15),
   EMAIL                varchar(100),
   NAM_NHAP_HOC         Year,
   MA_BHYT              varchar(20),
   DIEN_CHINH_SACH      bool,
   TRANG_THAI           int,
   CREATED_AT           datetime,
   UPDATED_AT           datetime,
   primary key (ID_HOCSINH)
);

/*==============================================================*/
/* Table: KHEN_THUONG                                           */
/*==============================================================*/
create table KHEN_THUONG
(
   ID_KHENTHUONG        int not null,
   NOI_DUNG             varchar(255),
   NGAY_KHEN            date,
   primary key (ID_KHENTHUONG)
);

/*==============================================================*/
/* Table: LICH_THI                                              */
/*==============================================================*/
create table LICH_THI
(
   ID_LICHTHI           int not null,
   NGAY_THI             date,
   GIO_BAT_DAU          time,
   THOI_GIAN_THI        int,
   PHONG_THI            varchar(50),
   GHI_CHU              varchar(255),
   primary key (ID_LICHTHI)
);

/*==============================================================*/
/* Table: LIEN_KET_TAI_KHOAN                                    */
/*==============================================================*/
create table LIEN_KET_TAI_KHOAN
(
   ID_PHUHUYNH          int not null,
   ID_USER              int not null,
   primary key (ID_PHUHUYNH, ID_USER)
);

/*==============================================================*/
/* Table: LOP                                                   */
/*==============================================================*/
create table LOP
(
   ID_LOP               int not null,
   TEN_LOP              varchar(20),
   KHOI                 varchar(10),
   primary key (ID_LOP)
);

/*==============================================================*/
/* Table: MON_HOC                                               */
/*==============================================================*/
create table MON_HOC
(
   ID_MONHOC            int not null,
   TEN_MONHOC           varchar(100),
   HE_SO                float,
   primary key (ID_MONHOC)
);

/*==============================================================*/
/* Table: NAM_HOC                                               */
/*==============================================================*/
create table NAM_HOC
(
   ID_NAMHOC            int not null,
   TEN_NAMHOC           varchar(9),
   primary key (ID_NAMHOC)
);

/*==============================================================*/
/* Table: NHAM_DEN                                              */
/*==============================================================*/
create table NHAM_DEN
(
   ID_THONGBAO          int not null,
   ID_ROLES             int not null,
   primary key (ID_THONGBAO, ID_ROLES)
);

/*==============================================================*/
/* Table: PHAN_CONG_GIANG_DAY                                   */
/*==============================================================*/
create table PHAN_CONG_GIANG_DAY
(
   ID_GIAOVIEN          int not null,
   ID_MONHOC            int not null,
   ID_LOP               int not null,
   ID_NAMHOC            int not null,
   ID_TKB               int not null,
   primary key (ID_GIAOVIEN, ID_MONHOC, ID_LOP, ID_NAMHOC, ID_TKB)
);

/*==============================================================*/
/* Table: PHAN_QUYEN                                            */
/*==============================================================*/
create table PHAN_QUYEN
(
   ID_ROLES             int not null,
   ID_USER              int not null,
   primary key (ID_ROLES, ID_USER)
);

/*==============================================================*/
/* Table: PHU_HUYNH                                             */
/*==============================================================*/
create table PHU_HUYNH
(
   ID_PHUHUYNH          int not null,
   HO_TEN               varchar(100),
   SO_DIEN_THOAI        varchar(15),
   EMAIL                varchar(100),
   DIA_CHI              varchar(255),
   NGHE_NGHIEP          varchar(100),
   primary key (ID_PHUHUYNH)
);

/*==============================================================*/
/* Table: QUOC_TICH                                             */
/*==============================================================*/
create table QUOC_TICH
(
   ID_QUOCTICH          int not null,
   TEN_QUOCTICH         varchar(50),
   MO_TA                varchar(255),
   primary key (ID_QUOCTICH)
);

/*==============================================================*/
/* Table: ROLES                                                 */
/*==============================================================*/
create table ROLES
(
   ID_ROLES             int not null,
   ROLE_NAME            varchar(30),
   primary key (ID_ROLES)
);

/*==============================================================*/
/* Table: SO_HUU_TAI_KHOAN                                      */
/*==============================================================*/
create table SO_HUU_TAI_KHOAN
(
   ID_USER              int not null,
   ID_HOCSINH           int not null,
   primary key (ID_USER, ID_HOCSINH)
);

/*==============================================================*/
/* Table: SU_DUNG_TAI_KHOAN                                     */
/*==============================================================*/
create table SU_DUNG_TAI_KHOAN
(
   ID_USER              int not null,
   ID_GIAOVIEN          int not null,
   primary key (ID_USER, ID_GIAOVIEN)
);

/*==============================================================*/
/* Table: THOI_KHOA_BIEU                                        */
/*==============================================================*/
create table THOI_KHOA_BIEU
(
   ID_TKB               int not null,
   THU                  int,
   TIET_BAT_DAU         int,
   SO_TIET              int,
   GHI_CHU              varchar(255),
   primary key (ID_TKB)
);

/*==============================================================*/
/* Table: THONG_BAO                                             */
/*==============================================================*/
create table THONG_BAO
(
   ID_THONGBAO          int not null,
   TIEU_DE              varchar(50),
   NOI_DUNG             varchar(255),
   DOI_TUONG            ENUM('HOC_SINH','GIAO_VIEN','PHU_HUYNH','ALL'),
   NGAY_DANG            datetime,
   TRANG_THAI           int,
   primary key (ID_THONGBAO)
);

/*==============================================================*/
/* Table: TRONG                                                 */
/*==============================================================*/
create table TRONG
(
   ID_HANHKIEM          int not null,
   ID_HOCKY             int not null,
   ID_NAMHOC            int not null,
   primary key (ID_HANHKIEM, ID_HOCKY, ID_NAMHOC)
);

/*==============================================================*/
/* Table: USER                                                  */
/*==============================================================*/
create table USER
(
   ID_USER              int not null,
   USER_NAME            varchar(100),
   PASSWORD             varchar(50),
   EMAIL                varchar(100),
   STATUS               int,
   CREATE_AT            datetime,
   UPDATE_AT            datetime,
   primary key (ID_USER)
);

/*==============================================================*/
/* Table: VAN_BAN                                               */
/*==============================================================*/
create table VAN_BAN
(
   ID_VANBAN            int not null,
   SO_HIEU              varchar(20),
   LOAI_VAN_BAN         varchar(50),
   NGAY_BAN_HANH        date,
   primary key (ID_VANBAN)
);

/*==============================================================*/
/* Table: VI_PHAM                                               */
/*==============================================================*/
create table VI_PHAM
(
   ID_VIPHAM            int not null,
   NOI_DUNG             varchar(255),
   MUC_DO               ENUM('NHE','TRUNG_BINH','NGHIEM_TRONG'),
   NGAY_VI_PHAM         date,
   primary key (ID_VIPHAM)
);

alter table AP_DUNG add constraint FK_AP_DUNG foreign key (ID_HOCKY)
      references HOC_KY (ID_HOCKY) on delete restrict on update restrict;

alter table AP_DUNG add constraint FK_AP_DUNG2 foreign key (ID_DIEM)
      references DIEM (ID_DIEM) on delete restrict on update restrict;

alter table AP_DUNG_TRONG add constraint FK_AP_DUNG_TRONG foreign key (ID_LICHTHI)
      references LICH_THI (ID_LICHTHI) on delete restrict on update restrict;

alter table AP_DUNG_TRONG add constraint FK_AP_DUNG_TRONG2 foreign key (ID_LOP)
      references LOP (ID_LOP) on delete restrict on update restrict;

alter table AP_DUNG_TRONG add constraint FK_AP_DUNG_TRONG3 foreign key (ID_NAMHOC)
      references NAM_HOC (ID_NAMHOC) on delete restrict on update restrict;

alter table AP_DUNG_TRONG add constraint FK_AP_DUNG_TRONG4 foreign key (ID_TKB)
      references THOI_KHOA_BIEU (ID_TKB) on delete restrict on update restrict;

alter table BAO_GOM add constraint FK_BAO_GOM foreign key (ID_LICHTHI)
      references LICH_THI (ID_LICHTHI) on delete restrict on update restrict;

alter table BAO_GOM add constraint FK_BAO_GOM2 foreign key (ID_TKB)
      references THOI_KHOA_BIEU (ID_TKB) on delete restrict on update restrict;

alter table BAO_GOM add constraint FK_BAO_GOM3 foreign key (ID_HOCKY)
      references HOC_KY (ID_HOCKY) on delete restrict on update restrict;

alter table BAO_GOM add constraint FK_BAO_GOM4 foreign key (ID_NAMHOC)
      references NAM_HOC (ID_NAMHOC) on delete restrict on update restrict;

alter table CHU_NHIEM add constraint FK_CHU_NHIEM foreign key (ID_LOP)
      references LOP (ID_LOP) on delete restrict on update restrict;

alter table CHU_NHIEM add constraint FK_CHU_NHIEM2 foreign key (ID_GIAOVIEN)
      references GIAO_VIEN (ID_GIAOVIEN) on delete restrict on update restrict;

alter table CO add constraint FK_CO foreign key (ID_QUOCTICH)
      references QUOC_TICH (ID_QUOCTICH) on delete restrict on update restrict;

alter table CO add constraint FK_CO2 foreign key (ID_HOCSINH)
      references HOC_SINH (ID_HOCSINH) on delete restrict on update restrict;

alter table DANG_TAO add constraint FK_DANG_TAO foreign key (ID_THONGBAO)
      references THONG_BAO (ID_THONGBAO) on delete restrict on update restrict;

alter table DANG_TAO add constraint FK_DANG_TAO2 foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table DANH_GIA add constraint FK_DANH_GIA foreign key (ID_DIEM)
      references DIEM (ID_DIEM) on delete restrict on update restrict;

alter table DANH_GIA add constraint FK_DANH_GIA2 foreign key (ID_MONHOC)
      references MON_HOC (ID_MONHOC) on delete restrict on update restrict;

alter table DANH_GIA_HK add constraint FK_DANH_GIA_HK foreign key (ID_KHENTHUONG)
      references KHEN_THUONG (ID_KHENTHUONG) on delete restrict on update restrict;

alter table DANH_GIA_HK add constraint FK_DANH_GIA_HK2 foreign key (ID_HANHKIEM)
      references HANH_KIEM (ID_HANHKIEM) on delete restrict on update restrict;

alter table DANH_GIA_HK add constraint FK_DANH_GIA_HK3 foreign key (ID_GIAOVIEN)
      references GIAO_VIEN (ID_GIAOVIEN) on delete restrict on update restrict;

alter table DANH_GIA_HK add constraint FK_DANH_GIA_HK4 foreign key (ID_VIPHAM)
      references VI_PHAM (ID_VIPHAM) on delete restrict on update restrict;

alter table DAT add constraint FK_DAT foreign key (ID_DIEM)
      references DIEM (ID_DIEM) on delete restrict on update restrict;

alter table DAT add constraint FK_DAT2 foreign key (ID_HOCSINH)
      references HOC_SINH (ID_HOCSINH) on delete restrict on update restrict;

alter table DUOC_BAN_HANH_BOI add constraint FK_DUOC_BAN_HANH_BOI foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table DUOC_BAN_HANH_BOI add constraint FK_DUOC_BAN_HANH_BOI2 foreign key (ID_VANBAN)
      references VAN_BAN (ID_VANBAN) on delete restrict on update restrict;

alter table DUOC_DANH_GIA add constraint FK_DUOC_DANH_GIA foreign key (ID_KHENTHUONG)
      references KHEN_THUONG (ID_KHENTHUONG) on delete restrict on update restrict;

alter table DUOC_DANH_GIA add constraint FK_DUOC_DANH_GIA2 foreign key (ID_HANHKIEM)
      references HANH_KIEM (ID_HANHKIEM) on delete restrict on update restrict;

alter table DUOC_DANH_GIA add constraint FK_DUOC_DANH_GIA3 foreign key (ID_HOCSINH)
      references HOC_SINH (ID_HOCSINH) on delete restrict on update restrict;

alter table DUOC_DANH_GIA add constraint FK_DUOC_DANH_GIA4 foreign key (ID_VIPHAM)
      references VI_PHAM (ID_VIPHAM) on delete restrict on update restrict;

alter table GHI_NHAN_TRONG add constraint FK_GHI_NHAN_TRONG foreign key (ID_NAMHOC)
      references NAM_HOC (ID_NAMHOC) on delete restrict on update restrict;

alter table GHI_NHAN_TRONG add constraint FK_GHI_NHAN_TRONG2 foreign key (ID_DIEM)
      references DIEM (ID_DIEM) on delete restrict on update restrict;

alter table GOM add constraint FK_GOM foreign key (ID_LICHTHI)
      references LICH_THI (ID_LICHTHI) on delete restrict on update restrict;

alter table GOM add constraint FK_GOM2 foreign key (ID_TKB)
      references THOI_KHOA_BIEU (ID_TKB) on delete restrict on update restrict;

alter table GOM add constraint FK_GOM3 foreign key (ID_MONHOC)
      references MON_HOC (ID_MONHOC) on delete restrict on update restrict;

alter table HOC_BA add constraint FK_TONG_KET foreign key (ID_NAMHOC)
      references NAM_HOC (ID_NAMHOC) on delete restrict on update restrict;

alter table HOC_SINH add constraint FK_GIAM_HO foreign key (ID_PHUHUYNH)
      references PHU_HUYNH (ID_PHUHUYNH) on delete restrict on update restrict;

alter table HOC_SINH add constraint FK_KET_QUA_HOC_TAP foreign key (ID_HOCBA)
      references HOC_BA (ID_HOCBA) on delete restrict on update restrict;

alter table HOC_SINH add constraint FK_QUAN_LY foreign key (ID_LOP)
      references LOP (ID_LOP) on delete restrict on update restrict;

alter table HOC_SINH add constraint FK_THUOC foreign key (ID_DANTOC)
      references DAN_TOC (ID_DANTOC) on delete restrict on update restrict;

alter table LIEN_KET_TAI_KHOAN add constraint FK_LIEN_KET_TAI_KHOAN foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table LIEN_KET_TAI_KHOAN add constraint FK_LIEN_KET_TAI_KHOAN2 foreign key (ID_PHUHUYNH)
      references PHU_HUYNH (ID_PHUHUYNH) on delete restrict on update restrict;

alter table NHAM_DEN add constraint FK_NHAM_DEN foreign key (ID_ROLES)
      references ROLES (ID_ROLES) on delete restrict on update restrict;

alter table NHAM_DEN add constraint FK_NHAM_DEN2 foreign key (ID_THONGBAO)
      references THONG_BAO (ID_THONGBAO) on delete restrict on update restrict;

alter table PHAN_CONG_GIANG_DAY add constraint FK_PHAN_CONG_GIANG_DAY foreign key (ID_TKB)
      references THOI_KHOA_BIEU (ID_TKB) on delete restrict on update restrict;

alter table PHAN_CONG_GIANG_DAY add constraint FK_PHAN_CONG_GIANG_DAY2 foreign key (ID_GIAOVIEN)
      references GIAO_VIEN (ID_GIAOVIEN) on delete restrict on update restrict;

alter table PHAN_CONG_GIANG_DAY add constraint FK_PHAN_CONG_GIANG_DAY3 foreign key (ID_MONHOC)
      references MON_HOC (ID_MONHOC) on delete restrict on update restrict;

alter table PHAN_CONG_GIANG_DAY add constraint FK_PHAN_CONG_GIANG_DAY4 foreign key (ID_LOP)
      references LOP (ID_LOP) on delete restrict on update restrict;

alter table PHAN_CONG_GIANG_DAY add constraint FK_PHAN_CONG_GIANG_DAY5 foreign key (ID_NAMHOC)
      references NAM_HOC (ID_NAMHOC) on delete restrict on update restrict;

alter table PHAN_QUYEN add constraint FK_PHAN_QUYEN foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table PHAN_QUYEN add constraint FK_PHAN_QUYEN2 foreign key (ID_ROLES)
      references ROLES (ID_ROLES) on delete restrict on update restrict;

alter table SO_HUU_TAI_KHOAN add constraint FK_SO_HUU_TAI_KHOAN foreign key (ID_HOCSINH)
      references HOC_SINH (ID_HOCSINH) on delete restrict on update restrict;

alter table SO_HUU_TAI_KHOAN add constraint FK_SO_HUU_TAI_KHOAN2 foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table SU_DUNG_TAI_KHOAN add constraint FK_SU_DUNG_TAI_KHOAN foreign key (ID_GIAOVIEN)
      references GIAO_VIEN (ID_GIAOVIEN) on delete restrict on update restrict;

alter table SU_DUNG_TAI_KHOAN add constraint FK_SU_DUNG_TAI_KHOAN2 foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table TRONG add constraint FK_TRONG foreign key (ID_NAMHOC)
      references NAM_HOC (ID_NAMHOC) on delete restrict on update restrict;

alter table TRONG add constraint FK_TRONG2 foreign key (ID_HANHKIEM)
      references HANH_KIEM (ID_HANHKIEM) on delete restrict on update restrict;

alter table TRONG add constraint FK_TRONG3 foreign key (ID_HOCKY)
      references HOC_KY (ID_HOCKY) on delete restrict on update restrict;


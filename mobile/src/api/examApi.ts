import axiosClient from './axiosClient';

export interface BaiKiemTra {
  id: number;
  tieuDe: string;
  thoiGianLamBai: number;
  thoiGianBatDau: string | null;
  thoiGianKetThuc: string | null;
  lopHocId: number | null;
  tenLopHoc: string | null;
  monHocId: number | null;
  tenMonHoc: string | null;
  giaoVienId: number | null;
  tenGiaoVien: string | null;
  ngayTao: string | null;
  soLanLamBai: number | null;
  trangThaiLamBai: string | null; // CHUA_LAM | DANG_LAM | DA_NOP | HET_LAN_LAM_BAI | CHUA_HET_LAN_LAM_BAI
  diemDatDuoc: number | null;
}

export const getStudentExams = async (): Promise<BaiKiemTra[]> => {
  const response = await axiosClient.get('/baikiemtra/student');
  if (response.data && response.data.data) {
    return response.data.data as BaiKiemTra[];
  }
  return [];
};

export interface ChiTietBaiLam {
  id: number;
  cauHoiId: number;
  noiDungCauHoi: string;
  loaiCauHoi: string; // TRAC_NGHIEM | TU_LUAN
  dapAnDaChon: string | null;
  dapAnDung: string | null;
  cauTraLoiTuLuan: string | null;
  diemDatDuoc: number;
  diemToiDa: number;
}

export interface BaiLamResult {
  id: number;
  baiKiemTraId: number;
  tieuDeBaiKiemTra: string;
  tenHocSinh: string;
  thoiGianBatDau: string;
  thoiGianNop: string;
  tongDiem: number;
  trangThai: string; // NOP_BAI | VI_PHAM_QUY_CHE
  chiTietBaiLams: ChiTietBaiLam[];
}

export const getExamResult = async (examId: number): Promise<BaiLamResult | null> => {
  const response = await axiosClient.get(`/baikiemtra/student/${examId}/result`);
  if (response.data && response.data.data) {
    return response.data.data as BaiLamResult;
  }
  return null;
};

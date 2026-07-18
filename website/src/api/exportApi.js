import axiosClient from './axiosClient';

const exportApi = {
  exportHocSinh: (params) => {
    return axiosClient.get('/export/hocsinh/excel', {
      params,
      responseType: 'blob'
    });
  },
  exportBangDiem: (params) => {
    return axiosClient.get('/export/diem/excel', {
      params,
      responseType: 'blob'
    });
  },
  exportBangDiemPdf: (params) => {
    return axiosClient.get('/export/diem/pdf', {
      params,
      responseType: 'blob'
    });
  }
};

export default exportApi;

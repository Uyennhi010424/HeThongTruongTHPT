import axiosClient from './axiosClient';

const aiApi = {
  goiYHocTap: (hocSinhId, hocKy, namHoc) => {
    return axiosClient.get(`/ai/goi-y/hoc-sinh/${hocSinhId}`, {
      params: { hocKy, namHoc }
    });
  },
  phanTichLop: (lopId, hocKy, namHoc) => {
    return axiosClient.get(`/ai/phan-tich/lop/${lopId}`, {
      params: { hocKy, namHoc }
    });
  },
  getStatus: () => {
    return axiosClient.get('/ai/status');
  }
};

export default aiApi;

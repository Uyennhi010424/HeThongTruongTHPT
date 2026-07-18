import axiosClient from './axiosClient';

export const getStatisticsOverview = (params = {}) =>
  axiosClient.get('/statistics/overview', { params, timeout: 300000 });

export const getStatisticsAcademic = (params = {}) =>
  axiosClient.get('/statistics/academic', { params, timeout: 300000 });

const statisticsApi = {
  getOverview: (namHoc) => {
    return axiosClient.get('/statistics/overview', {
      params: { namHoc }
    });
  },
  getAcademic: (params) => {
    return axiosClient.get('/statistics/academic', { params });
  },
  getAttendance: (params) => {
    return axiosClient.get('/statistics/attendance', { params });
  },
  getConduct: (namHoc, hocKy) => {
    const params = { namHoc };
    if (hocKy && hocKy !== "0") params.hocKy = Number(hocKy);
    return axiosClient.get('/statistics/conduct', { params });
  }
};

export default statisticsApi;

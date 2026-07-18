import axiosClient from './axiosClient';

const backupApi = {
  createBackup: () => {
    return axiosClient.post('/admin/backup/create');
  },
  listBackups: () => {
    return axiosClient.get('/admin/backup/list');
  },
  restoreBackup: (filename) => {
    return axiosClient.post('/admin/backup/restore', null, {
      params: { filename }
    });
  },
  downloadBackup: (filename) => {
    return axiosClient.get('/admin/backup/download', {
      params: { filename },
      responseType: 'blob'
    });
  }
};

export default backupApi;

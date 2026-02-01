// 您的云托管环境ID (请替换为真实ID)
const CLOUD_ENV = 'prod-4gvarcgoa255cecb'; 

const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    // 从 Storage 获取 Token
    const token = wx.getStorageSync('token');
    
    wx.cloud.callContainer({
      config: {
        env: CLOUD_ENV
      },
      path: url,
      method: method,
      header: {
        'X-WX-SERVICE': 'golang-cttc', // 指定服务名称
        'X-Token': token,
        'content-type': 'application/json'
      },
      data: data,
      success: (res) => {
        // wx.cloud.callContainer 返回结构: { data, statusCode, header, ... }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 后端返回: { code: 0, data: ..., errorMsg: "" }
          const result = res.data;
          if (result.code === 0) {
            resolve(result.data);
          } else if (result.code === 401) {
            // Token 失效
            wx.showToast({ title: '登录已过期', icon: 'none' });
            reject(new Error('Unauthorized'));
          } else {
            wx.showToast({ title: result.errorMsg || '请求失败', icon: 'none' });
            reject(new Error(result.errorMsg));
          }
        } else {
          reject(new Error(`HTTP Error: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('Request failed', err);
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject(err);
      }
    });
  });
};

const uploadFile = (filePath) => {
  return new Promise((resolve, reject) => {
    // 生成随机文件名
    const cloudPath = `uploads/${Date.now()}-${Math.floor(Math.random() * 1000)}${filePath.match(/\.[^.]+?$/)[0]}`;
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      config: {
        env: CLOUD_ENV
      },
      success: res => {
        // 返回 fileID (cloud://...)，可直接用于 <image src="cloud://..." />
        resolve(res.fileID);
      },
      fail: err => {
        console.error('Upload failed', err);
        reject(err);
      }
    });
  });
};

module.exports = {
  request,
  uploadFile,
  CLOUD_ENV
};

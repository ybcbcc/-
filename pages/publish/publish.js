const app = getApp();
const { request, uploadFile } = require('../../utils/request.js');

Page({
  data: {
    tempImage: '',
    description: '',
    locationName: '',
    locationAddress: ''
  },

  onLoad(options) {

  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          tempImage: res.tempFilePaths[0]
        });
      }
    });
  },

  // 输入描述
  handleInput(e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 选择定位
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          locationName: res.name,
          locationAddress: res.address
        });
      },
      fail: (err) => {
        console.error('选择位置失败', err);
        // 如果是权限问题，可以提示用户去设置页打开
        if (err.errMsg.indexOf('auth') > -1) {
          wx.showModal({
            title: '提示',
            content: '需要获取您的位置权限，请前往设置打开',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
    });
  },

  // 发布
  submitPublish() {
    if (!this.data.description) {
      wx.showToast({
        title: '请输入商品描述',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '发布中...' });

    // 1. 如果有图片，先上传图片
    const uploadPromise = this.data.tempImage ? 
      uploadFile(this.data.tempImage) : 
      Promise.resolve('');

    uploadPromise
      .then(imageUrl => {
        // 2. 提交帖子数据
        const postData = {
          content: this.data.description,
          imageUrl: imageUrl, // 后端字段: imageUrl (CamelCase from JSON)
          location: this.data.locationName || '' // 后端字段: location
        };

        return request('/api/post/create', 'POST', postData);
      })
      .then(res => {
        wx.hideLoading();
        // res 是后端返回的 post 对象
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/home'
          });
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error(err);
        wx.showToast({ title: '发布失败', icon: 'none' });
      });
  }
})

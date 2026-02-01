const app = getApp();
const { request, uploadFile } = require('../../utils/request.js');

Page({
  data: {
    id: '', // 用于编辑模式
    title: '',
    imageUrl: '',
    description: '',
    prizeName: '',
    prizeValue: '',
    costPerEntry: '',
    maxParticipants: '',
    winProbability: '',
    
    prizeTypes: ['integral', 'membership', 'avatar_frame', 'chat_bubble', 'theme', 'external_vip'],
    prizeTypeIndex: 0,
    
    endDate: '2025-12-31',
    endTime: '23:59'
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      wx.setNavigationBarTitle({ title: '修改活动' });
      this.loadDetail(options.id);
    } else {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.setData({
        endDate: tomorrow.toISOString().split('T')[0]
      });
    }
  },

  loadDetail(id) {
    wx.showLoading({ title: '加载中' });
    request(`/api/lottery/detail?id=${id}`)
      .then(res => {
        wx.hideLoading();
        // Parse endTime
        let endDate = '2025-12-31';
        let endTime = '23:59';
        if (res.endTime) {
            const dt = new Date(res.endTime);
            endDate = dt.toISOString().split('T')[0];
            endTime = dt.toTimeString().substring(0, 5);
        }
        
        // Find prize type index
        const index = this.data.prizeTypes.indexOf(res.prizeType);
        
        this.setData({
            title: res.title,
            imageUrl: res.imageUrl,
            description: res.description,
            prizeName: res.prizeName,
            prizeValue: res.prizeValue,
            costPerEntry: res.costPerEntry,
            maxParticipants: res.maxParticipants,
            winProbability: res.winProbability,
            endDate,
            endTime,
            prizeTypeIndex: index >= 0 ? index : 0
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  bindPrizeTypeChange(e) {
    this.setData({
      prizeTypeIndex: e.detail.value
    });
  },

  bindDateChange(e) {
    this.setData({
      endDate: e.detail.value
    });
  },

  bindTimeChange(e) {
    this.setData({
      endTime: e.detail.value
    });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        
        uploadFile(tempFilePath)
          .then(fileID => {
            wx.hideLoading();
            this.setData({ imageUrl: fileID });
          })
          .catch(err => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          });
      }
    });
  },

  submitPublish() {
    const { id, title, imageUrl, description, prizeName, prizeValue, costPerEntry, maxParticipants, winProbability, endDate, endTime, prizeTypes, prizeTypeIndex } = this.data;

    if (!title || !prizeName || !costPerEntry) {
      wx.showToast({ title: '请填写必要信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: id ? '保存中...' : '发布中...' });

    const postData = {
      id, // Include ID if exists
      title,
      imageUrl,
      description,
      prizeName,
      prizeValue: parseInt(prizeValue) || 0,
      prizeType: prizeTypes[prizeTypeIndex],
      costPerEntry: parseInt(costPerEntry) || 0,
      maxParticipants: parseInt(maxParticipants) || 100,
      winProbability: parseFloat(winProbability) || 0.1,
      endTime: `${endDate} ${endTime}:00`
    };

    const url = id ? '/api/post/update' : '/api/post/create';
    
    request(url, 'POST', postData)
      .then(res => {
        wx.hideLoading();
        wx.showToast({ title: id ? '保存成功' : '发布成功', icon: 'success' });
        setTimeout(() => {
          if (id) {
            wx.navigateBack();
          } else {
            wx.switchTab({ url: '/pages/home/home' });
          }
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error(err);
        wx.showToast({ title: id ? '保存失败' : '发布失败', icon: 'none' });
      });
  }
})

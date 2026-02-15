const app = getApp();
const { request, uploadFile } = require('../../../utils/request.js');

Page({
  data: {
    id: '',
    title: '',
    imageUrl: '',
    description: '',
    prizeName: '',
    prizeValue: '',
    costPerEntry: '',
    maxParticipants: '',
    winProbability: '',
    endDate: '2023-12-31',
    endTime: '23:59',
    prizeTypes: ['integral', 'membership', 'avatar_frame', 'chat_bubble', 'theme', 'external_vip'],
    prizeTypeIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadDetail(options.id);
    } else {
        wx.showToast({ title: '参数错误', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
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
            const adj = new Date(dt.getTime() - 8 * 3600 * 1000);
            const yyyy = adj.getFullYear();
            const mm = ('0' + (adj.getMonth() + 1)).slice(-2);
            const dd = ('0' + adj.getDate()).slice(-2);
            endDate = `${yyyy}-${mm}-${dd}`;
            endTime = `${('0'+adj.getHours()).slice(-2)}:${('0'+adj.getMinutes()).slice(-2)}`;
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

    wx.showLoading({ title: '保存中...' });

    const postData = {
      id,
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

    request('/api/post/update', 'POST', postData)
      .then(res => {
        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
            wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error(err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  }
})

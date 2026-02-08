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
    prizeQuantity: '',
    costPerEntry: '',
    maxParticipants: '',
    drawDuration: '',
    participationDate: '2025-12-31',
    participationTime: '23:59'
  },

  onLoad(options) {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.setData({
      participationDate: tomorrow.toISOString().split('T')[0]
    });
  },

  onShow() {
    // 进入页面时检查登录
    app.ensureLogin();

    // 检查是否有草稿（来自上次 onHide 自动保存的）
    const draft = wx.getStorageSync('publish_draft');
    
    // 如果有草稿，询问是否恢复
    if (draft) {
        wx.showModal({
            title: '提示',
            content: '检测到未完成的草稿，是否恢复？',
            success: (res) => {
                if (res.confirm) {
                    this.setData(draft);
                } else {
                    // 用户选择不恢复，彻底清除
                    wx.removeStorageSync('publish_draft');
                }
            }
        });
    }
  },

  onHide() {
    // 离开页面时，如果内容不为空且未提交，自动保存为草稿
    if (this.hasContent() && !this.data.submitted) {
        // 保存草稿
        const { title, imageUrl, description, prizeName, prizeValue, prizeQuantity, costPerEntry, maxParticipants, participationDate, participationTime, drawDuration } = this.data;
        wx.setStorageSync('publish_draft', {
            title, imageUrl, description, prizeName, prizeValue, prizeQuantity, costPerEntry, maxParticipants, participationDate, participationTime, drawDuration
        });
    }
    
    // 离开时立即清空页面，确保下次进入时是空的
    this.resetForm();
  },

  hasContent() {
      const d = this.data;
      // 只要填写了任意一项主要内容
      return d.title || d.description || d.prizeName || d.imageUrl;
  },

  loadDetail(id) {
    wx.showLoading({ title: '加载中' });
    request(`/api/lottery/detail?id=${id}`)
      .then(res => {
        wx.hideLoading();
        // Parse participationDeadline
        let participationDate = '2025-12-31';
        let participationTime = '23:59';
        if (res.participationDeadline) {
            const dt = new Date(res.participationDeadline);
            participationDate = dt.toISOString().split('T')[0];
            participationTime = dt.toTimeString().substring(0, 5);
        }
        
        this.setData({
            title: res.title,
            imageUrl: res.imageUrl,
            description: res.description,
            prizeName: res.prizeName,
            prizeValue: res.prizeValue,
            prizeQuantity: res.prizeQuantity,
            costPerEntry: res.costPerEntry,
            maxParticipants: res.maxParticipants,
            participationDate,
            participationTime,
            drawDuration: res.drawDuration || ''
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

  bindParticipationDateChange(e) {
    this.setData({
      participationDate: e.detail.value
    });
  },

  bindParticipationTimeChange(e) {
    this.setData({
      participationTime: e.detail.value
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
    app.ensureLogin(() => {
        this.doSubmitPublish();
    });
  },

  doSubmitPublish() {
    const { title, imageUrl, description, prizeName, prizeValue, prizeQuantity, costPerEntry, maxParticipants, participationDate, participationTime, drawDuration } = this.data;

    if (!title || !prizeName || !costPerEntry) {
      wx.showToast({ title: '请填写必要信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });

    const postData = {
      title,
      imageUrl,
      description,
      prizeName,
      prizeValue: parseInt(prizeValue) || 0,
      prizeQuantity: parseInt(prizeQuantity) || 1,
      costPerEntry: parseInt(costPerEntry) || 0,
      maxParticipants: parseInt(maxParticipants) || 100,
      participationDeadline: `${participationDate} ${participationTime}:00`,
      drawDuration: parseInt(drawDuration) || 0
    };

    request('/api/post/create', 'POST', postData)
      .then(res => {
        wx.hideLoading();
        wx.showToast({ title: '发布成功', icon: 'success' });
        
        // 标记已提交，防止 onHide 存草稿
        this.setData({ submitted: true });
        
        // 清除草稿
        wx.removeStorageSync('publish_draft');

        setTimeout(() => {
            // 如果是发布，重置表单并跳到首页
            this.resetForm();
            wx.switchTab({ url: '/pages/home/home' });
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error(err);
        wx.showToast({ title: '发布失败', icon: 'none' });
      });
  },

  resetForm() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      this.setData({
          title: '',
          imageUrl: '',
          description: '',
          prizeName: '',
          prizeValue: '',
          prizeQuantity: '',
          costPerEntry: '',
          maxParticipants: '',
          participationDate: tomorrow.toISOString().split('T')[0],
          participationTime: '23:59',
          drawDuration: '',
          submitted: false
      });
  }
})

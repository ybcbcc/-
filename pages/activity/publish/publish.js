const { request, uploadFile } = require('../../../utils/request.js');

Page({
  data: {
    id: '',
    name: '',
    imageUrl: '',
    content: '',
    startDate: '',
    startTime: '',
    durationMinutes: 0,
    appearanceCount: 0,
    appearanceOptions: [
      { value: -1, label: '每次都出现' },
      { value: -2, label: '每天出现一次' },
      { value: 0, label: '不自动出现' },
      { value: 1, label: '每用户出现一次' },
      { value: 2, label: '每用户出现两次' },
      { value: 3, label: '每用户出现三次' }
    ],
    appearanceIndex: 2
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ id: options.id });
      this.fetchDetail(options.id);
      wx.setNavigationBarTitle({ title: '编辑活动' });
    } else {
      wx.setNavigationBarTitle({ title: '发布活动' });
    }
  },

  fetchDetail(id) {
    request(`/api/activity/detail?id=${id}`)
      .then(res => {
        if (!res) return;
        const dt = new Date(res.startTime);
        const dateStr = `${dt.getFullYear()}-${('0'+(dt.getMonth()+1)).slice(-2)}-${('0'+dt.getDate()).slice(-2)}`;
        const timeStr = `${('0'+dt.getHours()).slice(-2)}:${('0'+dt.getMinutes()).slice(-2)}`;
        const opts = this.data.appearanceOptions;
        const idx = Math.max(0, opts.findIndex(o => o.value === (res.appearanceCount ?? 0)));
        this.setData({
          name: res.name || '',
          imageUrl: res.imageUrl || '',
          content: res.content || '',
          startDate: dateStr,
          startTime: timeStr,
          durationMinutes: res.durationMinutes || 0,
          appearanceCount: res.appearanceCount ?? 0,
          appearanceIndex: idx === -1 ? 2 : idx
        });
      })
      .catch(() => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
  },

  handlePickDate(e) {
    this.setData({ startDate: e.detail.value });
  },
  handlePickTime(e) {
    this.setData({ startTime: e.detail.value });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: async (res) => {
        const path = res.tempFilePaths[0];
        try {
          const fileID = await uploadFile(path);
          this.setData({ imageUrl: fileID });
        } catch (err) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  },
  onAppearancePick(e) {
    const idx = Number(e.detail.value);
    const opt = this.data.appearanceOptions[idx];
    this.setData({ appearanceIndex: idx, appearanceCount: opt.value });
  },

  async submit() {
    const { id, name, imageUrl, content, startDate, startTime, durationMinutes, appearanceCount } = this.data;
    if (!name) {
      wx.showToast({ title: '请填写活动名称', icon: 'none' });
      return;
    }
    const startISO = startDate && startTime ? new Date(`${startDate} ${startTime}:00`).toISOString() : new Date().toISOString();
    const payload = {
      name,
      imageUrl,
      content,
      startTime: startISO,
      durationMinutes: Number(durationMinutes) || 0,
      appearanceCount: Number(appearanceCount) || 0
    };
    try {
      if (id) {
        await request('/api/activity/update', 'POST', { id, ...payload });
      } else {
        await request('/api/activity/create', 'POST', payload);
      }
      wx.showToast({ title: '保存成功', icon: 'none' });
      wx.navigateBack();
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
})

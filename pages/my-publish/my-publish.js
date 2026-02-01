const { request } = require('../../utils/request.js');

Page({
  data: {
    publishList: []
  },

  onLoad(options) {
    // 页面首次加载
  },

  onShow() {
    this.fetchData();
  },

  fetchData() {
    request('/api/user/publish-history')
      .then(res => {
        // 后端返回 []Lottery
        const list = (res || []).map(item => ({
          id: item.id,
          title: item.title,
          time: item.createdAt ? item.createdAt.substring(0, 10) : '',
          extra: item.status === 'active' ? '进行中' : '已结束',
          // Keep raw data
          ...item
        }));

        this.setData({
          publishList: list
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleItemClick(e) {
    const item = e.detail.item || e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/publish/manage/manage?id=${item.id}`
    });
  }
})

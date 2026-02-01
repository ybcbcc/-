const { request } = require('../../utils/request.js');

Page({
  data: {
    publishList: []
  },

  onLoad(options) {
    this.fetchData();
  },

  fetchData() {
    request('/api/user/publish-history')
      .then(res => {
        // 适配后端数据到组件格式
        const list = (res || []).map(item => ({
          id: item.id,
          title: item.content,
          time: item.createdAt ? item.createdAt.substring(0, 19).replace('T', ' ') : '',
          extra: item.status === 1 ? '已发布' : '审核中',
          // 原始数据
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
    const item = e.detail.item;
    // 将对象序列化后传递给详情页 (简单做法，适合数据量不大的情况)
    const postData = encodeURIComponent(JSON.stringify(item));
    
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?postData=${postData}`
    });
  }
})

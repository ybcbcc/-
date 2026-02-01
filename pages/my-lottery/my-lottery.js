const { request } = require('../../utils/request.js');

Page({
  data: {
    lotteryList: []
  },

  onLoad(options) {
    // 移到 onShow
  },

  onShow() {
    this.fetchData();
  },

  fetchData() {
    request('/api/user/lottery-history')
      .then(res => {
        // 转换数据格式适配 info-list
        const list = (res || []).map(item => ({
          id: item.lotteryId, // 用于跳转
          title: item.lotteryTitle || '未知活动',
          desc: `参与时间: ${item.participatedAt ? item.participatedAt.replace('T', ' ').substring(0, 16) : ''}`,
          tags: [
            item.isWinner ? 
              { text: '已中奖', color: '#4caf50', bgColor: '#e8f5e9' } : 
              { text: '未中奖', color: '#999', bgColor: '#eee' }
          ],
          // 如果后端没返回图片，暂时留空，info-list 会处理
          imageUrl: '', 
          originalItem: item
        }));

        this.setData({
          lotteryList: list
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleItemClick(e) {
    const item = e.detail.item || e.currentTarget.dataset.item;
    // 跳转到详情
    wx.navigateTo({
        url: `/pages/lottery/detail?id=${item.id}`
    });
  }
})

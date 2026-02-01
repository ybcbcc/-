const { request } = require('../../utils/request.js');

Page({
  data: {
    lotteryId: null,
    lotteryInfo: {},
    result: null,
    isDrawing: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        lotteryId: options.id
      });
      this.fetchLotteryDetail(options.id);
    }
  },

  fetchLotteryDetail(id) {
    this.setData({
      lotteryInfo: { title: '加载中...' }
    });

    request(`/api/lottery/detail?id=${id}`)
      .then(res => {
        // 格式化时间
        if (res.endTime) {
            res.endTimeFormat = res.endTime.replace('T', ' ').substring(0, 19);
        }
        this.setData({
          lotteryInfo: res
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleDraw() {
    if (this.data.isDrawing) return;
    this.setData({ isDrawing: true });

    request('/api/lottery/draw', 'POST', { lotteryId: this.data.lotteryId })
      .then(res => {
        this.setData({ isDrawing: false });
        if (res.success) {
          const msg = res.isWon ? `恭喜中奖！奖品：${res.prizeName}` : '很遗憾，未中奖';
          this.setData({ result: msg });
          wx.showModal({
            title: res.isWon ? '🎉 中奖啦' : '再接再厉',
            content: msg,
            showCancel: false
          });
          // 刷新详情以更新参与人数（可选）
          this.fetchLotteryDetail(this.data.lotteryId);
        }
      })
      .catch(err => {
        this.setData({ isDrawing: false });
        console.error("Draw error:", err);
        
        let content = '抽奖失败';
        if (err.message && err.message.includes('Already participated')) {
            content = '您已经抽过了';
        } else if (err.message && err.message.includes('Insufficient integral')) {
            content = '您当前积分不足';
        } else if (err.message && err.message.includes('Participants limit reached')) {
            content = '参与人数已满';
        } else if (err.message && err.message.includes('Activity ended')) {
            content = '活动已结束';
        } else {
            content = err.message || '未知错误';
        }
        
        wx.showModal({
            title: '提示',
            content,
            showCancel: false
        });
      });
  }
})

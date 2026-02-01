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

  // 获取详情接口
  fetchLotteryDetail(id) {
    // 设置默认占位，防止UI抖动
    this.setData({
      lotteryInfo: {
        title: '加载中...',
        desc: '正在获取活动详情...'
      }
    });

    request(`/api/lottery/detail?id=${id}`)
      .then(res => {
        this.setData({
          lotteryInfo: res
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  // 抽奖按钮点击
  handleDraw() {
    if (this.data.isDrawing) return;

    this.setData({ isDrawing: true });

    // 调用后端抽奖接口
    // 修正: 参数名改为 camelCase 以匹配后端 Go 结构体 `json:"lotteryId"`
    request('/api/lottery/draw', 'POST', { lotteryId: parseInt(this.data.lotteryId) })
      .then(res => {
        if (res.success) {
          this.setData({
            result: res.prizeName,
            isDrawing: false
          });
          
          wx.showToast({
            title: '抽奖完成',
            icon: 'success'
          });
        } else {
          // 逻辑上不应到这里，因为错误会走 catch (request 内部 reject)
          this.setData({ isDrawing: false });
        }
      })
      .catch(err => {
        this.setData({ isDrawing: false });
        // request.js 已经有了 toast 提示，这里可以不用重复提示，或者处理特定逻辑
        console.error("Draw error:", err);
      });
  }
})

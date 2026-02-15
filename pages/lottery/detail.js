const { request } = require('../../utils/request.js');

// 统一时间解析：后端可能返回不带时区的字符串，这里按北京时间处理
function parseBJMillis(str) {
  if (!str) return 0;
  if (str.includes('T') && (str.includes('Z') || /[+-]\d{2}:\d{2}/.test(str))) {
    return new Date(str).getTime();
  }
  const iso = str.replace(' ', 'T');
  return new Date(iso + '+08:00').getTime();
}

Page({
  data: {
    lotteryId: null,
    lotteryInfo: {},
    result: null,
    isDrawing: false,
    autoCheckedResult: false
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
        // 设备时间诊断日志（北京时间）
        const bjNowStr = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        console.log('[TimeDiag][detail][BJ] now=', bjNowStr, 'start=', res.startTime, 'end=', res.endTime);
        // 格式化时间
        if (res.endTime) {
            res.endTimeFormat = res.endTime.replace('T', ' ').substring(0, 19);
        }
        if (res.startTime) {
            res.startTimeFormat = res.startTime.replace('T', ' ').substring(0, 19);
        }
        const nowMs = Date.now();
        const start = parseBJMillis(res.startTime);
        const deadline = parseBJMillis(res.endTime);
        const adjStart = start ? start - 8 * 3600 * 1000 : 0;
        const adjEnd = deadline ? deadline - 8 * 3600 * 1000 : 0;
        const startBJStr = new Date(start + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        const endBJStr = new Date(deadline + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        console.log('[TimeDiag][detail][BJ] now(ms)=', nowMs, 'start(ms)=', start, 'end(ms)=', deadline, 'adjStart(ms)=', adjStart, 'adjEnd(ms)=', adjEnd, 'startBJ=', startBJStr, 'endBJ=', endBJStr, 'now<adjStart=', adjStart && nowMs < adjStart, 'now>adjEnd=', adjEnd && nowMs > adjEnd);
        let statusText = '';
        if (adjStart && nowMs < adjStart) {
          statusText = '报名未开始';
        } else if (adjEnd && nowMs > adjEnd) {
          statusText = '活动已结束';
        } else if (res.maxParticipants && res.currentParticipants >= res.maxParticipants) {
          statusText = '人数已满';
        } else {
          statusText = '立即报名';
        }
        console.log('[Render][detail] nowMs=', nowMs, 'startMs=', start, 'endMs=', deadline, 'adjStartMs=', adjStart, 'adjEndMs=', adjEnd, 'statusText=', statusText, 'buttonEnabled=', statusText === '立即报名');
        this.setData({
          lotteryInfo: res,
          statusText,
          statusActive: statusText === '立即报名'
        });
        if (statusText === '活动已结束' && !this.data.autoCheckedResult) {
          this.setData({ autoCheckedResult: true });
          this.viewResult();
        }
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  handleDraw() {
    if (this.data.isDrawing) return;
    const info = this.data.lotteryInfo || {};
    const nowMs = Date.now();
    const start = parseBJMillis(info.startTime);
    const deadline = parseBJMillis(info.endTime);
    const adjStart = start ? start - 8 * 3600 * 1000 : 0;
    const adjEnd = deadline ? deadline - 8 * 3600 * 1000 : 0;
    const bjNowStr = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
    const startBJStr = new Date(start + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
    const endBJStr = new Date(deadline + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
    console.log('[TimeDiag][draw][BJ] now=', bjNowStr, 'startBJ=', startBJStr, 'endBJ=', endBJStr, 'start(ms)=', start, 'end(ms)=', deadline, 'adjStart(ms)=', adjStart, 'adjEnd(ms)=', adjEnd, 'now(ms)=', nowMs);
    if (adjStart && nowMs < adjStart) {
      wx.showToast({ title: '报名未开始', icon: 'none' });
      return;
    }
    if (adjEnd && nowMs > adjEnd) {
      this.viewResult();
      return;
    }
    if (info.maxParticipants && info.currentParticipants >= info.maxParticipants) {
      wx.showToast({ title: '人数已满', icon: 'none' });
      return;
    }
    this.setData({ isDrawing: true });
    request('/api/lottery/draw', 'POST', { lotteryId: this.data.lotteryId, clientNow: new Date().toISOString() })
      .then(res => {
        this.setData({ isDrawing: false });
        wx.showToast({ title: '报名成功', icon: 'none' });
        this.fetchLotteryDetail(this.data.lotteryId);
      })
      .catch(err => {
        this.setData({ isDrawing: false });
        console.error("Draw error:", err);
        let content = '抽奖失败';
        if (err.message && err.message.includes('Already participated')) {
            content = '您已经报名过了';
        } else if (err.message && err.message.includes('Insufficient integral')) {
            content = '您当前积分不足';
        } else if (err.message && err.message.includes('Participants limit reached')) {
            content = '参与人数已满';
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
,
  viewResult() {
    request('/api/lottery/draw', 'POST', { lotteryId: this.data.lotteryId, clientNow: new Date().toISOString() })
      .then(res => {
        if (res && typeof res.isWon !== 'undefined') {
          const msg = res.isWon ? `恭喜中奖！奖品：${res.prizeName}` : '很遗憾，未中奖';
          this.setData({ result: msg });
          wx.showModal({
            title: res.isWon ? '🎉 中奖啦' : '再接再厉',
            content: msg,
            showCancel: false
          });
        } else {
          wx.showToast({ title: '您尚未报名', icon: 'none' });
        }
      })
      .catch(err => {
        const msg = err.message && err.message.includes('Not participated') ? '您尚未报名' : (err.message || '查询失败');
        wx.showToast({ title: msg, icon: 'none' });
      });
  }
})

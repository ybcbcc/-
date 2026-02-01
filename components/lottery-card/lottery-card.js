Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },
  methods: {
    onTap() {
      // 触发 click 事件，并将 item 的 id 传递出去
      this.triggerEvent('click', { id: this.properties.item.id });
    }
  }
})

const events = {};

export default {
  on(event, listener) {
    if (!events[event]) {
      events[event] = [];
    }
    events[event].push(listener);
  },

  emit(event, data) {
    if (events[event]) {
      events[event].forEach(listener => listener(data));
    }
  },

  off(event, listener) {
    if (events[event]) {
      events[event] = events[event].filter(l => l !== listener);
    }
  },
};

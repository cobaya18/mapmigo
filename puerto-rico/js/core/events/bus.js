// js/core/events/bus.js
export const bus = {
  on(name, handler) {
    document.addEventListener(name, (event) => {
      handler(event.detail);
    });
  },
  emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  },
};

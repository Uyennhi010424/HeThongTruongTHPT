export const notify = (type, message) => {
  try {
    window.dispatchEvent(new CustomEvent("httt_notify", { detail: { type, message } }));
  } catch (e) {
    // fallback to alert if events unavailable
    // eslint-disable-next-line no-alert
    alert(message);
  }
};

export const notifySuccess = (message) => notify("success", message);
export const notifyError = (message) => notify("error", message);
export const notifyInfo = (message) => notify("info", message);

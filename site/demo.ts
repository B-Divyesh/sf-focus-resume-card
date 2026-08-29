const DEMO_KEY = 'demo:focus-resume-card:sample-card';

type DemoState = { resumed: boolean };

const stateNode = document.querySelector<HTMLElement>('#card-state');
const resultNode = document.querySelector<HTMLElement>('#demo-result');
const resumeButton = document.querySelector<HTMLButtonElement>('#resume-sample');
const resetButton = document.querySelector<HTMLButtonElement>('#reset-demo');
const startForRealLink = document.querySelector<HTMLAnchorElement>('#start-for-real');

function readState(): DemoState {
  try {
    const value = JSON.parse(localStorage.getItem(DEMO_KEY) ?? '{"resumed":false}') as DemoState;
    return { resumed: value.resumed === true };
  } catch {
    return { resumed: false };
  }
}

function render(state: DemoState) {
  if (stateNode) stateNode.textContent = state.resumed ? 'Resumed' : 'Waiting';
  if (resumeButton) resumeButton.disabled = state.resumed;
  if (resultNode) resultNode.textContent = state.resumed ? 'Sample page resumed. In the extension, this opens the saved URL.' : '';
}

function reset() {
  localStorage.removeItem(DEMO_KEY);
  render({ resumed: false });
  if (resultNode) resultNode.textContent = 'Demo reset. The sample card is waiting again.';
}

resumeButton?.addEventListener('click', () => {
  const state = { resumed: true };
  localStorage.setItem(DEMO_KEY, JSON.stringify(state));
  render(state);
});

resetButton?.addEventListener('click', reset);
startForRealLink?.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  localStorage.removeItem(DEMO_KEY);
});
render(readState());

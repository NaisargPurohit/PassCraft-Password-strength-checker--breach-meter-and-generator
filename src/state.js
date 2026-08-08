// simple state store for vanilla js parts

const state = {
  candidatePassword: '',
  isPlaintextVisible: false,
  analysisData: null,
  generatedPassphrase: '',
};

const listeners = new Set();

// subscribe to state changes
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// get current state copy
export function getState() {
  return { ...state };
}

// update state and notify listeners
export function setState(partialState) {
  // console.log("state updating with:", partialState);
  Object.assign(state, partialState);
  // TODO: refactor listeners notify if component count grows
  listeners.forEach(fn => fn(getState()));
}

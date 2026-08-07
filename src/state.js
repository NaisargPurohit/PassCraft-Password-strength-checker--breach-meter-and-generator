/**
 * PassCraft State Management
 * Holds application state and subscriber listeners for reactive UI updates.
 */

const state = {
  candidatePassword: '',
  isPlaintextVisible: false,
  analysisData: null,
  generatedPassphrase: '',
};

const listeners = new Set();

/**
 * Subscribe a callback function to state mutations.
 * @param {Function} listener 
 * @returns {Function} Unsubscribe handle
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get current application state.
 * @returns {Object}
 */
export function getState() {
  return { ...state };
}

/**
 * Mutate application state and notify subscribers.
 * @param {Object} partialState 
 */
export function setState(partialState) {
  Object.assign(state, partialState);
  listeners.forEach(fn => fn(getState()));
}

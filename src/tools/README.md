// Example of a generic type for a hook's return value
type HookResult<T> = [T, (value: T) => void];

// Example hook function signature
function useGenericState<T>(initialValue: T): HookResult<T> {
  // Hook logic goes here
  return [initialValue, (value: T) => { /* state update logic */ }];
}
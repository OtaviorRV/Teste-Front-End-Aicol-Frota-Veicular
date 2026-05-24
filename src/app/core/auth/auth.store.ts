import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, token }) => ({
    isLoggedIn: computed(() => token() !== null),
    userName: computed(() => user()?.name ?? ''),
    userRole: computed(() => user()?.role ?? ''),
  })),
  withMethods((store) => ({
    setAuth(user: AuthUser, token: string): void {
      patchState(store, { user, token });
    },
    clearAuth(): void {
      patchState(store, { user: null, token: null });
    },
    setLoading(loading: boolean): void {
      patchState(store, { loading });
    },
  })),
);

export interface LoginBody {
  email: string;
  mode: 'password' | 'quick';
  password?: string;
  verification_code?: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  password_confirm: string;
  verification_code: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface SendCodeBody {
  email: string;
  mode?: 'register' | 'login';
}

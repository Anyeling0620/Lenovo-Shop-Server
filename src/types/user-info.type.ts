export interface UserInfo {
    userId: string;
    avatar: string;
    nikeName: string;
    memberType: string;
}

export interface AccountInfo {
    account: string;
    memberType: string;
    nickName?: string;
    birthday?: string | null;                 
    sex?: "man" | "woman" | "secret";
    email: string;
    avatarUrl?: string | null;
}

export interface UpdateUserInfoDTO {
  nickname: string;
  sex: 'man' | 'woman' | 'secret';
  birthday: string; 
}

export interface ChangeEmailPayload {
  type: 'code' | 'password';
  old_email?: string;
  old_code?: string;
  new_email: string;
  new_code: string;
  password?: string;
}
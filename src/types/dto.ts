export interface UserResponseDto {
    id: string;
    userName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
}

export interface AuthResponseDto {
    token: string;
    refreshToken: string;
    user: UserResponseDto;
}

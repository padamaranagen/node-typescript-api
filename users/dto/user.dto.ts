export interface UserDto{
    id: string;
    email: string;
    password: string;
    firstname?: string; //optional
    lastname? : string; //optional
    permissionLevel? : string; //optional
}
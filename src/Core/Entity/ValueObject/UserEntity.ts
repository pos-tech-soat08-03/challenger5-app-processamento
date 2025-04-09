import { JsonWebKeyInput } from "crypto";

export class userEntity {

    private readonly userId: string;
    private readonly email: string;
    private readonly firstName: string;
    private readonly lastName: string;
    private readonly authToken: string | undefined;

    constructor (userId: string, email: string, firstName: string, lastName: string, authToken?: string) {
        this.userId = userId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.authToken = authToken;
    }

}
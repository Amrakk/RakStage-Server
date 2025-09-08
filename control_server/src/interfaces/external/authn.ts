import type { ObjectId } from "mongooat";

export type RegistrationData = {
    _id: ObjectId;
    email: string;
    name: string;
};

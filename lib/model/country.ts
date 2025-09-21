import { ClassModel } from "./class-model";

export interface Country extends ClassModel {
    code : string;
    name : string;
    nationality : string;
}
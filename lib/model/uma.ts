import { ClassModel } from "./class-model";

export interface Uma extends ClassModel {
    first_place: number;
    second_place: number;
    third_place: number;
    fourth_place: number | undefined;
    name: string;
}
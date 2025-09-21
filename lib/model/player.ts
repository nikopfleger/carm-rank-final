import { ClassModel } from "./class-model";
import { Country } from "./country";

export interface Player extends ClassModel {
    nickname: string;
    player_id: number;
    fullname: string | undefined;
    country: Country;
    birthday: Date | undefined;
}
import { OnlinePlatform } from "../enum/online-platform";
import { ClassModel } from "./class-model";

export interface Location extends ClassModel {
    address: string | undefined;
    name: string;
    onlinePlatForm: OnlinePlatform | undefined
}
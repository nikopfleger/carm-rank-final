import { OnlinePlatform } from "../enum/online-platform";
import { ClassModel } from "./class-model";
import { Player } from "./player";

export interface Account extends ClassModel {
    accountId: string | undefined;
    onlinePlatform: OnlinePlatform;
    nickname: string;
    player: Player;
}
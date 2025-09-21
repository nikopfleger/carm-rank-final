import { ClassModel } from "./class-model";
import { Player } from "./player";
import { Season } from "./season";
import { Tournament } from "./tournament";

export interface TournamentResult extends ClassModel {
    finalPlacement: number;
    points: number;
    player: Player;
    season: Season;
    tournament: Tournament;
}
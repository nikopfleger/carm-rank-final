import { TournamentType } from "../enum/tournament-type";
import { ClassModel } from "./class-model";
import { Ruleset } from "./ruleset";
import { Season } from "./season";

export interface Tournament extends ClassModel {
    startDate: Date;
    endDate: Date | undefined;
    description: string;
    tournamentType: TournamentType;
    season: Season;
    ruleset: Ruleset;
    location: Location;
}
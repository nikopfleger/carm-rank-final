import { ClassModel } from './class-model';
import { Ruleset } from './ruleset';

export interface Season extends ClassModel {
    startDate: Date;
    endDate: Date | undefined;
    seasonName: string;
    rulesetList: Array<Ruleset>;
}
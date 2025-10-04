export interface ClassModel {
    id: bigint | undefined;
    version: number;
    createdAt: Date;
    createdBy: String;
    createdIp: String;
    deleted: Boolean;
    updatedAt: Date | undefined;
    updatedBy: String | undefined;
    updatedIp: String | undefined;
}